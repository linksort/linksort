package integ_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/steinfletcher/apitest"
	jsonpath "github.com/steinfletcher/apitest-jsonpath"

	"github.com/linksort/linksort/model"
	"github.com/linksort/linksort/testutil"
)

func startLinkReview(t *testing.T, sessionID string) *http.Response {
	t.Helper()

	req := httptest.NewRequest(http.MethodPost, "/api/conversations/review", strings.NewReader("{}"))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Csrf-Token", testutil.UserCSRF(sessionID))
	req.AddCookie(&http.Cookie{Name: "session_id", Value: sessionID})

	recorder := httptest.NewRecorder()
	testutil.Handler().ServeHTTP(recorder, req)

	return recorder.Result()
}

func decodeReviewResponse(t *testing.T, res *http.Response) (conversation map[string]any, newLinkCount float64) {
	t.Helper()

	body := make(map[string]any)
	if err := json.NewDecoder(res.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}

	conv, ok := body["conversation"].(map[string]any)
	if !ok {
		t.Fatalf("expected conversation in response, got %v", body)
	}

	count, _ := body["newLinkCount"].(float64)

	return conv, count
}

func converse(t *testing.T, sessionID, conversationID, body string) *httptest.ResponseRecorder {
	t.Helper()

	req := httptest.NewRequest(
		http.MethodPut,
		"/api/conversations/"+conversationID+"/converse",
		strings.NewReader(body),
	)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Csrf-Token", testutil.UserCSRF(sessionID))
	req.AddCookie(&http.Cookie{Name: "session_id", Value: sessionID})

	recorder := httptest.NewRecorder()
	testutil.Handler().ServeHTTP(recorder, req)

	return recorder
}

func TestStartLinkReview(t *testing.T) {
	ctx := context.Background()

	t.Run("unauthorized", func(t *testing.T) {
		apitest.New().
			Handler(testutil.Handler()).
			Post("/api/conversations/review").
			Header("X-Csrf-Token", testutil.UserCSRF("invalid-session-id")).
			JSON(map[string]string{}).
			Cookie("session_id", "invalid-session-id").
			Expect(t).
			Status(http.StatusUnauthorized).
			End()
	})

	t.Run("not enough new links", func(t *testing.T) {
		usr, _ := testutil.NewUser(t, ctx)
		testutil.NewLink(t, ctx, usr)
		testutil.NewLink(t, ctx, usr)

		res := startLinkReview(t, usr.SessionID)
		if res.StatusCode != http.StatusNoContent {
			t.Fatalf("expected 204, got %d", res.StatusCode)
		}

		fresh := testutil.GetUser(t, ctx, usr.Email)
		if !fresh.LastLinkReviewAt.IsZero() {
			t.Errorf("expected lastLinkReviewAt to be unchanged, got %v", fresh.LastLinkReviewAt)
		}
	})

	t.Run("eligible and throttled", func(t *testing.T) {
		usr, _ := testutil.NewUser(t, ctx)
		for i := 0; i < 3; i++ {
			testutil.NewLink(t, ctx, usr)
		}

		res := startLinkReview(t, usr.SessionID)
		if res.StatusCode != http.StatusCreated {
			t.Fatalf("expected 201, got %d", res.StatusCode)
		}

		conv, count := decodeReviewResponse(t, res)
		if conv["kind"] != model.ConversationKindLinkReview {
			t.Errorf("expected kind link_review, got %v", conv["kind"])
		}
		if count != 3 {
			t.Errorf("expected newLinkCount 3, got %v", count)
		}

		fresh := testutil.GetUser(t, ctx, usr.Email)
		if fresh.LastLinkReviewAt.IsZero() {
			t.Error("expected lastLinkReviewAt to be stamped")
		}

		// A second call right after must be throttled.
		res = startLinkReview(t, usr.SessionID)
		if res.StatusCode != http.StatusNoContent {
			t.Fatalf("expected 204 on second call, got %d", res.StatusCode)
		}

		// Reset the stamp to >4h ago and add new links: eligible again.
		fresh.LastLinkReviewAt = time.Now().Add(-5 * time.Hour)
		fresh = testutil.UpdateUser(t, ctx, fresh)
		for i := 0; i < 3; i++ {
			testutil.NewLink(t, ctx, fresh)
		}

		res = startLinkReview(t, usr.SessionID)
		if res.StatusCode != http.StatusCreated {
			t.Fatalf("expected 201 after resetting stamp, got %d", res.StatusCode)
		}
	})

	t.Run("recent review throttles even with new links", func(t *testing.T) {
		usr, _ := testutil.NewUser(t, ctx)
		usr.LastLinkReviewAt = time.Now().Add(-1 * time.Hour)
		usr = testutil.UpdateUser(t, ctx, usr)
		for i := 0; i < 5; i++ {
			testutil.NewLink(t, ctx, usr)
		}

		res := startLinkReview(t, usr.SessionID)
		if res.StatusCode != http.StatusNoContent {
			t.Fatalf("expected 204, got %d", res.StatusCode)
		}
	})
}

func TestConverseLinkReviewTrigger(t *testing.T) {
	ctx := context.Background()

	t.Run("trigger streams and persists synthetic message", func(t *testing.T) {
		usr, _ := testutil.NewUser(t, ctx)
		link := testutil.NewLink(t, ctx, usr)
		testutil.NewLink(t, ctx, usr)
		testutil.NewLink(t, ctx, usr)

		res := startLinkReview(t, usr.SessionID)
		if res.StatusCode != http.StatusCreated {
			t.Fatalf("expected 201, got %d", res.StatusCode)
		}
		conv, _ := decodeReviewResponse(t, res)
		convID := conv["id"].(string)

		recorder := converse(t, usr.SessionID, convID, `{"trigger":"link_review"}`)
		if recorder.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", recorder.Code, recorder.Body.String())
		}

		// The stream must contain at least one parseable event.
		var event model.ConverseEvent
		if err := json.Unmarshal([]byte(strings.Split(recorder.Body.String(), "\n")[0]), &event); err != nil {
			t.Fatalf("failed to parse event: %v", err)
		}
		if event.TextDelta == nil && event.ToolUseDelta == nil {
			t.Error("expected textDelta or toolUseDelta in first event")
		}

		// The conversation must contain the synthetic trigger message followed
		// by the assistant reply, in order, with kind present.
		apitest.New().
			Handler(testutil.Handler()).
			Get("/api/conversations/"+convID).
			Cookie("session_id", usr.SessionID).
			Expect(t).
			Status(http.StatusOK).
			Assert(jsonpath.Len("$.conversation.messages", 2)).
			Assert(jsonpath.Equal("$.conversation.messages[0].kind", model.MessageKindLinkReviewTrigger)).
			Assert(jsonpath.Equal("$.conversation.messages[0].role", "user")).
			Assert(jsonpath.Contains("$.conversation.messages[0].text", link.Title)).
			Assert(jsonpath.Equal("$.conversation.messages[1].role", "assistant")).
			End()

		// Triggering again on a conversation that already has messages → 400.
		recorder = converse(t, usr.SessionID, convID, `{"trigger":"link_review"}`)
		if recorder.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 on second trigger, got %d", recorder.Code)
		}
	})

	t.Run("trigger on non-review conversation", func(t *testing.T) {
		usr, _ := testutil.NewUser(t, ctx)
		conv, err := testutil.NewConversation(t, ctx, usr)
		if err != nil {
			t.Fatal(err)
		}

		recorder := converse(t, usr.SessionID, conv.ID, `{"trigger":"link_review"}`)
		if recorder.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d: %s", recorder.Code, recorder.Body.String())
		}
	})

	t.Run("empty message without trigger", func(t *testing.T) {
		usr, _ := testutil.NewUser(t, ctx)
		conv, err := testutil.NewConversation(t, ctx, usr)
		if err != nil {
			t.Fatal(err)
		}

		recorder := converse(t, usr.SessionID, conv.ID, `{"message":""}`)
		if recorder.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})
}

func TestLinkReviewConfirmFlow(t *testing.T) {
	ctx := context.Background()
	usr, _ := testutil.NewUser(t, ctx)
	link := testutil.NewLink(t, ctx, usr)
	testutil.NewLink(t, ctx, usr)
	testutil.NewLink(t, ctx, usr)

	res := startLinkReview(t, usr.SessionID)
	if res.StatusCode != http.StatusCreated {
		t.Fatalf("expected 201, got %d", res.StatusCode)
	}
	conv, _ := decodeReviewResponse(t, res)
	convID := conv["id"].(string)

	// Script the review reply with a choices block.
	testutil.Bedrock().SetScript(testutil.MockTurn{
		Text: "Welcome back! Want me to create a \"Couch Options\" folder?\n\n```choices\nYes, do it\nNo thanks\n```",
	})
	defer testutil.Bedrock().Reset()

	recorder := converse(t, usr.SessionID, convID, `{"trigger":"link_review"}`)
	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", recorder.Code, recorder.Body.String())
	}

	// Script the "Yes" turn: the model creates a folder, moves a link into it,
	// and then confirms.
	testutil.Bedrock().SetScript(
		testutil.MockTurn{
			ToolCalls: []testutil.MockToolCall{{
				ID:    "tu-1",
				Name:  "create_folder",
				Input: `{"name":"Couch Options"}`,
			}},
		},
		testutil.MockTurn{
			ToolCalls: []testutil.MockToolCall{{
				ID:    "tu-2",
				Name:  "get_links",
				Input: `{}`,
			}},
		},
		testutil.MockTurn{Text: "Done! I created the folder."},
	)

	recorder = converse(t, usr.SessionID, convID, `{"message":"Yes, do it"}`)
	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", recorder.Code, recorder.Body.String())
	}

	// The folder must now exist in the user's folder tree.
	fresh := testutil.GetUser(t, ctx, usr.Email)
	folder := fresh.FolderTree.FindByName("Couch Options")
	if folder == nil {
		t.Fatal("expected folder 'Couch Options' to be created")
	}

	// Move a link into the new folder via a second scripted round to prove the
	// whole organize loop works end to end.
	testutil.Bedrock().SetScript(
		testutil.MockTurn{
			ToolCalls: []testutil.MockToolCall{{
				ID:    "tu-3",
				Name:  "add_link_to_folder",
				Input: `{"linkId":"` + link.ID + `","folderId":"` + folder.ID + `"}`,
			}},
		},
		testutil.MockTurn{Text: "Moved it."},
	)

	recorder = converse(t, usr.SessionID, convID, `{"message":"Move the first one in"}`)
	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", recorder.Code, recorder.Body.String())
	}

	apitest.New().
		Handler(testutil.Handler()).
		Get("/api/links/"+link.ID).
		Cookie("session_id", usr.SessionID).
		Expect(t).
		Status(http.StatusOK).
		Assert(jsonpath.Equal("$.link.folderId", folder.ID)).
		End()
}
