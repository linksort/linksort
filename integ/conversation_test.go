package integ_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/steinfletcher/apitest"
	jsonpath "github.com/steinfletcher/apitest-jsonpath"

	"github.com/linksort/linksort/model"
	"github.com/linksort/linksort/testutil"
)

func TestCreateConversation(t *testing.T) {
	existingUser, _ := testutil.NewUser(t, context.Background())

	tests := []struct {
		Name           string
		GivenSessionID string
		GivenBody      map[string]string
		ExpectStatus   int
		ExpectBody     string
	}{
		{
			Name:           "success",
			GivenSessionID: existingUser.SessionID,
			GivenBody:      map[string]string{},
			ExpectStatus:   http.StatusCreated,
		},
		{
			Name:           "unauthorized",
			GivenSessionID: "invalid-session-id",
			GivenBody:      map[string]string{},
			ExpectStatus:   http.StatusUnauthorized,
			ExpectBody:     `{"message":"Unauthorized"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.Name, func(t *testing.T) {
			test := apitest.New().
				Handler(testutil.Handler()).
				Post("/api/conversations").
				Header("X-Csrf-Token", testutil.UserCSRF(tt.GivenSessionID)).
				JSON(tt.GivenBody).
				Cookie("session_id", tt.GivenSessionID)

			if tt.ExpectBody != "" {
				test.Expect(t).
					Status(tt.ExpectStatus).
					Body(tt.ExpectBody).
					End()
				return
			}

			test.Expect(t).
				Status(tt.ExpectStatus).
				Assert(jsonpath.Present("$.conversation.id")).
				Assert(jsonpath.Present("$.conversation.createdAt")).
				Assert(jsonpath.Present("$.conversation.updatedAt")).
				Assert(jsonpath.Equal("$.conversation.length", float64(0))).
				Assert(jsonpath.Equal("$.conversation.userId", existingUser.ID)).
				End()
		})
	}
}

func TestGetConversation(t *testing.T) {
	ctx := context.Background()
	existingUser, _ := testutil.NewUser(t, ctx)
	otherUser, _ := testutil.NewUser(t, ctx)

	// Create a test conversation first
	conv, err := testutil.NewConversation(t, ctx, existingUser)
	if err != nil {
		t.Fatal(err)
	}

	tests := []struct {
		Name           string
		GivenSessionID string
		GivenID        string
		ExpectStatus   int
	}{
		{
			Name:           "success",
			GivenSessionID: existingUser.SessionID,
			GivenID:        conv.ID,
			ExpectStatus:   http.StatusOK,
		},
		{
			Name:           "unauthorized",
			GivenSessionID: "invalid-session-id",
			GivenID:        conv.ID,
			ExpectStatus:   http.StatusUnauthorized,
		},
		{
			Name:           "not found",
			GivenSessionID: existingUser.SessionID,
			GivenID:        "nonexistent-id",
			ExpectStatus:   http.StatusNotFound,
		},
		{
			Name:           "conversation ownership",
			GivenSessionID: otherUser.SessionID,
			GivenID:        conv.ID,
			ExpectStatus:   http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.Name, func(t *testing.T) {
			test := apitest.New().
				Handler(testutil.Handler()).
				Get("/api/conversations/"+tt.GivenID).
				Cookie("session_id", tt.GivenSessionID)

			if tt.ExpectStatus == http.StatusOK {
				test.Expect(t).
					Status(tt.ExpectStatus).
					Assert(jsonpath.Equal("$.conversation.userId", existingUser.ID)).
					Assert(jsonpath.Equal("$.conversation.id", tt.GivenID)).
					Assert(jsonpath.Present("$.conversation.createdAt")).
					Assert(jsonpath.Present("$.conversation.updatedAt")).
					Assert(jsonpath.Equal("$.conversation.length", float64(0))).
					End()
				return
			}

			test.Expect(t).
				Status(tt.ExpectStatus).
				End()
		})
	}
}

func TestGetConversations(t *testing.T) {
	ctx := context.Background()
	existingUser, _ := testutil.NewUser(t, ctx)

	// Create a few test conversations
	for i := 0; i < 3; i++ {
		_, err := testutil.NewConversation(t, ctx, existingUser)
		if err != nil {
			t.Fatal(err)
		}
	}

	tests := []struct {
		Name           string
		GivenSessionID string
		ExpectStatus   int
	}{
		{
			Name:           "success",
			GivenSessionID: existingUser.SessionID,
			ExpectStatus:   http.StatusOK,
		},
		{
			Name:           "unauthorized",
			GivenSessionID: "invalid-session-id",
			ExpectStatus:   http.StatusUnauthorized,
		},
	}

	for _, tt := range tests {
		t.Run(tt.Name, func(t *testing.T) {
			test := apitest.New().
				Handler(testutil.Handler()).
				Get("/api/conversations").
				Cookie("session_id", tt.GivenSessionID)

			if tt.ExpectStatus == http.StatusOK {
				test.Expect(t).
					Status(tt.ExpectStatus).
					Assert(jsonpath.Present("$.conversations")).
					Assert(jsonpath.Len("$.conversations", 3)).
					Assert(jsonpath.Present("$.conversations[0].id")).
					Assert(jsonpath.Present("$.conversations[0].createdAt")).
					Assert(jsonpath.Present("$.conversations[0].updatedAt")).
					Assert(jsonpath.Equal("$.conversations[0].length", float64(0))).
					End()
				return
			}

			test.Expect(t).
				Status(tt.ExpectStatus).
				End()
		})
	}
}

func TestConverse(t *testing.T) {
	ctx := context.Background()
	existingUser, _ := testutil.NewUser(t, ctx)
	otherUser, _ := testutil.NewUser(t, ctx)

	// Create a test conversation first
	conv, err := testutil.NewConversation(t, ctx, existingUser)
	if err != nil {
		t.Fatal(err)
	}

	tests := []struct {
		Name           string
		GivenSessionID string
		GivenID        string
		GivenMessage   string
		ExpectStatus   int
		ExpectEvents   bool
	}{
		{
			Name:           "success",
			GivenSessionID: existingUser.SessionID,
			GivenID:        conv.ID,
			GivenMessage:   "Hello, assistant!",
			ExpectStatus:   http.StatusOK,
			ExpectEvents:   true,
		},
		{
			Name:           "unauthorized",
			GivenSessionID: "invalid-session-id",
			GivenID:        conv.ID,
			GivenMessage:   "Hello, assistant!",
			ExpectStatus:   http.StatusUnauthorized,
			ExpectEvents:   false,
		},
		{
			Name:           "not found",
			GivenSessionID: existingUser.SessionID,
			GivenID:        "nonexistent-id",
			GivenMessage:   "Hello, assistant!",
			ExpectStatus:   http.StatusNotFound,
			ExpectEvents:   false,
		},
		{
			Name:           "conversation ownership",
			GivenSessionID: otherUser.SessionID,
			GivenID:        conv.ID,
			GivenMessage:   "Hello, assistant!",
			ExpectStatus:   http.StatusNotFound,
			ExpectEvents:   false,
		},
		{
			Name:           "empty message",
			GivenSessionID: existingUser.SessionID,
			GivenID:        conv.ID,
			GivenMessage:   "",
			ExpectStatus:   http.StatusBadRequest,
			ExpectEvents:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.Name, func(t *testing.T) {
			// Create request body
			reqBody := map[string]string{
				"message": tt.GivenMessage,
			}
			jsonBody, _ := json.Marshal(reqBody)

			// For non-streaming tests, we can use apitest directly
			if !tt.ExpectEvents {
				apitest.New().
					Handler(testutil.Handler()).
					Put("/api/conversations/"+tt.GivenID+"/converse").
					Header("X-Csrf-Token", testutil.UserCSRF(tt.GivenSessionID)).
					Body(string(jsonBody)).
					Cookie("session_id", tt.GivenSessionID).
					Expect(t).
					Status(tt.ExpectStatus).
					End()
				return
			}

			// For streaming tests, we need to use httptest directly
			req := httptest.NewRequest(
				http.MethodPut,
				"/api/conversations/"+tt.GivenID+"/converse",
				strings.NewReader(string(jsonBody)),
			)
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("X-Csrf-Token", testutil.UserCSRF(tt.GivenSessionID))
			req.AddCookie(&http.Cookie{Name: "session_id", Value: tt.GivenSessionID})

			recorder := httptest.NewRecorder()
			testutil.Handler().ServeHTTP(recorder, req)

			resp := recorder.Result()
			defer resp.Body.Close()

			// Check status code
			if recorder.Code != tt.ExpectStatus {
				t.Errorf("Expected status %d, got %d", tt.ExpectStatus, recorder.Code)
				return
			}

			// For streaming responses, verify we get at least one event
			if tt.ExpectEvents {
				responseBody := recorder.Body.String()

				// Check if we received any events
				// We should at least have one event with either textDelta or toolUseDelta
				var event model.ConverseEvent
				err := json.Unmarshal([]byte(strings.Split(responseBody, "\n")[0]), &event)

				if err != nil {
					t.Errorf("Failed to parse event: %v", err)
					return
				}

				// Verify we got either a textDelta or toolUseDelta
				if event.TextDelta == nil && event.ToolUseDelta == nil {
					t.Errorf("Expected either textDelta or toolUseDelta in event, got neither")
				}
			}
		})
	}
}
