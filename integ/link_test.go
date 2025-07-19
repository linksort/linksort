package integ_test

import (
	"context"
	"fmt"
	"net/http"
	"testing"
	"time"

	"github.com/steinfletcher/apitest"
	jsonpath "github.com/steinfletcher/apitest-jsonpath"

	"github.com/linksort/linksort/model"
	"github.com/linksort/linksort/testutil"
)

func TestCreateLink(t *testing.T) {
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
			GivenBody: map[string]string{
				"url":         "https://amazon.com",
				"title":       "Testing",
				"description": "It's only a test.",
				"favicon":     "https://via.placeholder.com/16",
				"site":        "testing.com",
			},
			ExpectStatus: http.StatusCreated,
		},
		{
			Name:           "no url",
			GivenSessionID: existingUser.SessionID,
			GivenBody: map[string]string{
				"title":       "Buy It All Now",
				"description": "It's like Walmart but on the internet.",
				"favicon":     "https://amazon.com/favicon.ico",
				"site":        "Amazon",
			},
			ExpectStatus: http.StatusBadRequest,
			ExpectBody:   `{"url": "This field is required."}`,
		},
		{
			Name:           "not a url",
			GivenSessionID: existingUser.SessionID,
			GivenBody: map[string]string{
				"url": "everything is what it is and not what it isn't",
			},
			ExpectStatus: http.StatusBadRequest,
			ExpectBody:   `{"url": "This is not valid."}`,
		},
		{
			Name:           "extension options page",
			GivenSessionID: existingUser.SessionID,
			GivenBody: map[string]string{
				"url": "safari-web-extension://F7067A94-B046-45FC-9245-644E9CCBB4F0/options.html",
			},
			ExpectStatus: http.StatusBadRequest,
			ExpectBody:   `{"url": "This is not valid."}`,
		},
		{
			Name:           "empty favicon should succeed",
			GivenSessionID: existingUser.SessionID,
			GivenBody: map[string]string{
				"url":         "https://example.com",
				"title":       "Testing",
				"description": "It's only a test.",
				"favicon":     "",
				"site":        "testing.com",
			},
			ExpectStatus: http.StatusCreated,
		},
	}

	for _, tcase := range tests {
		t.Run(tcase.Name, func(t *testing.T) {
			tt := apitest.New(tcase.Name).
				Handler(testutil.Handler()).
				Post("/api/links").
				Header("X-Csrf-Token", testutil.UserCSRF(tcase.GivenSessionID)).
				JSON(tcase.GivenBody).
				Cookie("session_id", tcase.GivenSessionID).
				Expect(t).Status(tcase.ExpectStatus)

			if tcase.ExpectStatus < http.StatusBadRequest {
				// Assert the values returned by the TestClient, not the input values
				tt.Assert(jsonpath.Equal("$.link.url", tcase.GivenBody["url"]))
				tt.Assert(jsonpath.Equal("$.link.title", "Testing"))
				tt.Assert(jsonpath.Equal("$.link.description", "It's only a test."))
				tt.Assert(jsonpath.Equal("$.link.favicon", "https://via.placeholder.com/16"))
				tt.Assert(jsonpath.Equal("$.link.site", "testing.com"))
			} else {
				tt.Body(tcase.ExpectBody)
			}

			tt.End()
		})
	}
}

func TestGetLink(t *testing.T) {
	ctx := context.Background()
	usr, _ := testutil.NewUser(t, ctx)
	lnk1 := testutil.NewLink(t, ctx, usr)

	tests := []struct {
		Name           string
		GivenSessionID string
		GivenLinkID    string
		ExpectStatus   int
		ExpectBody     string
	}{
		{
			Name:           "success",
			GivenSessionID: usr.SessionID,
			GivenLinkID:    lnk1.ID,
			ExpectStatus:   http.StatusOK,
		},
		{
			Name:           "bad id",
			GivenSessionID: usr.SessionID,
			GivenLinkID:    "something-random",
			ExpectStatus:   http.StatusNotFound,
		},
		{
			Name:           "bad session",
			GivenSessionID: "hello",
			GivenLinkID:    lnk1.ID,
			ExpectStatus:   http.StatusUnauthorized,
			ExpectBody:     `{"message": "Unauthorized"}`,
		},
	}

	for _, tcase := range tests {
		t.Run(tcase.Name, func(t *testing.T) {
			tt := apitest.New(tcase.Name).
				Handler(testutil.Handler()).
				Get(fmt.Sprintf("/api/links/%s", tcase.GivenLinkID)).
				Cookie("session_id", tcase.GivenSessionID).
				Expect(t).
				Status(tcase.ExpectStatus)

			if tcase.ExpectStatus < http.StatusBadRequest {
				tt.Assert(jsonpath.Equal("$.link.id", tcase.GivenLinkID))
				tt.Assert(jsonpath.Equal("$.link.title", lnk1.Title))
				tt.Assert(jsonpath.Equal("$.link.description", lnk1.Description))
				tt.Assert(jsonpath.Equal("$.link.favicon", lnk1.Favicon))
				tt.Assert(jsonpath.Equal("$.link.site", lnk1.Site))
			} else {
				tt.Body(tcase.ExpectBody)
			}

			tt.End()
		})
	}
}

func TestGetLinks(t *testing.T) {
	ctx := context.Background()
	usr, _ := testutil.NewUser(t, ctx)
	lnk1 := testutil.NewLink(t, ctx, usr)
	time.Sleep(time.Millisecond * 5)
	lnk2 := testutil.NewLink(t, ctx, usr)
	time.Sleep(time.Millisecond * 5)
	lnk3 := testutil.NewLink(t, ctx, usr)

	tests := []struct {
		Name           string
		GivenSessionID string
		ExpectStatus   int
		ExpectBody     string
	}{
		{
			Name:           "success",
			GivenSessionID: usr.SessionID,
			ExpectStatus:   http.StatusOK,
		},
		{
			Name:           "bad session",
			GivenSessionID: "hello",
			ExpectStatus:   http.StatusUnauthorized,
			ExpectBody:     `{"message": "Unauthorized"}`,
		},
	}

	for _, tcase := range tests {
		t.Run(tcase.Name, func(t *testing.T) {
			tt := apitest.New(tcase.Name).
				Handler(testutil.Handler()).
				Get("/api/links").
				Cookie("session_id", tcase.GivenSessionID).
				Expect(t).
				Status(tcase.ExpectStatus)

			if tcase.ExpectStatus < http.StatusBadRequest {
				for i, lnk := range []*model.Link{lnk3, lnk2, lnk1} {
					tt.Assert(jsonpath.Equal(fmt.Sprintf("$.links[%d].id", i), lnk.ID))
					tt.Assert(jsonpath.Equal(fmt.Sprintf("$.links[%d].title", i), lnk.Title))
					tt.Assert(jsonpath.Equal(fmt.Sprintf("$.links[%d].description", i), lnk.Description))
					tt.Assert(jsonpath.Equal(fmt.Sprintf("$.links[%d].favicon", i), lnk.Favicon))
					tt.Assert(jsonpath.Equal(fmt.Sprintf("$.links[%d].site", i), lnk.Site))
				}
			} else {
				tt.Body(tcase.ExpectBody)
			}

			tt.End()
		})
	}
}

func TestUpdateLink(t *testing.T) {
	ctx := context.Background()
	usr, _ := testutil.NewUser(t, ctx)
	lnk1 := testutil.NewLink(t, ctx, usr)
	folder := testutil.NewFolder(t, ctx, usr, "root")

	tests := []struct {
		Name           string
		GivenSessionID string
		GivenBody      map[string]interface{}
		GivenLinkID    string
		ExpectStatus   int
		ExpectBody     string
		ExpectTags     map[string]int
	}{
		{
			Name:           "success",
			GivenSessionID: usr.SessionID,
			GivenLinkID:    lnk1.ID,
			GivenBody: map[string]interface{}{
				"title":       "Buy It All Now",
				"description": "It's like Walmart but on the internet.",
				"site":        "Amazon",
			},
			ExpectStatus: http.StatusOK,
		},
		{
			Name:           "change title",
			GivenSessionID: usr.SessionID,
			GivenLinkID:    lnk1.ID,
			GivenBody: map[string]interface{}{
				"title": "Buy It All Now",
			},
			ExpectStatus: http.StatusOK,
		},
		{
			Name:           "make favorite",
			GivenSessionID: usr.SessionID,
			GivenLinkID:    lnk1.ID,
			GivenBody: map[string]interface{}{
				"isFavorite": true,
			},
			ExpectStatus: http.StatusOK,
		},
		{
			Name:           "move to folder",
			GivenSessionID: usr.SessionID,
			GivenLinkID:    lnk1.ID,
			GivenBody: map[string]interface{}{
				"folderId": folder.ID,
			},
			ExpectStatus: http.StatusOK,
		},
		{
			Name:           "add tags",
			GivenSessionID: usr.SessionID,
			GivenLinkID:    lnk1.ID,
			GivenBody: map[string]interface{}{
				"userTags": []string{"tag1", "tag2"},
			},
			ExpectTags: map[string]int{
				"tag1": 1,
				"tag2": 1,
			},
			ExpectStatus: http.StatusOK,
		},
		{
			Name:           "remove tags",
			GivenSessionID: usr.SessionID,
			GivenLinkID:    lnk1.ID,
			GivenBody: map[string]interface{}{
				"userTags": []string{"tag2"},
			},
			ExpectTags: map[string]int{
				"tag2": 1,
			},
			ExpectStatus: http.StatusOK,
		},
		{
			Name:           "invalid tags",
			GivenSessionID: usr.SessionID,
			GivenLinkID:    lnk1.ID,
			GivenBody: map[string]interface{}{
				"userTags": []string{"$%^&**&&*--", ""},
			},
			ExpectStatus: http.StatusBadRequest,
			ExpectBody:   `{"message": "Invalid tag."}`,
		},
		{
			Name:           "move to non-existent folder",
			GivenSessionID: usr.SessionID,
			GivenLinkID:    lnk1.ID,
			GivenBody: map[string]interface{}{
				"folderId": "joe-biden",
			},
			ExpectStatus: http.StatusBadRequest,
		},
		{
			Name:           "not a url",
			GivenSessionID: usr.SessionID,
			GivenLinkID:    lnk1.ID,
			GivenBody: map[string]interface{}{
				"url": "everything is what it is and not what it isn't",
			},
			ExpectStatus: http.StatusBadRequest,
			ExpectBody:   `{"url": "This is not valid."}`,
		},
		{
			Name:           "empty favicon should succeed",
			GivenSessionID: usr.SessionID,
			GivenLinkID:    lnk1.ID,
			GivenBody: map[string]interface{}{
				"favicon": "",
			},
			ExpectStatus: http.StatusOK,
		},
		{
			Name:           "valid favicon should succeed",
			GivenSessionID: usr.SessionID,
			GivenLinkID:    lnk1.ID,
			GivenBody: map[string]interface{}{
				"favicon": "https://example.com/favicon.ico",
			},
			ExpectStatus: http.StatusOK,
		},
		{
			Name:           "invalid favicon should fail",
			GivenSessionID: usr.SessionID,
			GivenLinkID:    lnk1.ID,
			GivenBody: map[string]interface{}{
				"favicon": "not-a-url",
			},
			ExpectStatus: http.StatusBadRequest,
			ExpectBody:   `{"favicon": "This is not valid."}`,
		},
	}

	for _, tcase := range tests {
		t.Run(tcase.Name, func(t *testing.T) {
			tt := apitest.New(tcase.Name).
				Handler(testutil.Handler()).
				Patch(fmt.Sprintf("/api/links/%s", tcase.GivenLinkID)).
				Header("X-Csrf-Token", testutil.UserCSRF(tcase.GivenSessionID)).
				JSON(tcase.GivenBody).
				Cookie("session_id", tcase.GivenSessionID).
				Expect(t).Status(tcase.ExpectStatus)

			if tcase.ExpectStatus < http.StatusBadRequest {
				tt.Assert(jsonpath.Equal("$.link.id", tcase.GivenLinkID))

				for k, v := range tcase.GivenBody {
					switch ty := v.(type) {
					case []string:
						tt.Assert(jsonpath.Len(fmt.Sprintf("$.link.%s", k), len(ty)))
						for _, tag := range ty {
							tt.Assert(jsonpath.Contains(fmt.Sprintf("$.link.%s", k), tag))
						}

						tt.Assert(jsonpath.Len("$.user.userTags", len(tcase.ExpectTags)))
						for tag := range tcase.ExpectTags {
							tt.Assert(jsonpath.Contains("$.user.userTags", tag))
						}
					default:
						tt.Assert(jsonpath.Equal(fmt.Sprintf("$.link.%s", k), v))
					}
				}
			} else {
				tt.Body(tcase.ExpectBody)
			}

			tt.End()
		})
	}
}

func TestDeleteLink(t *testing.T) {
	ctx := context.Background()
	usr1, _ := testutil.NewUser(t, ctx)
	usr2, _ := testutil.NewUser(t, ctx)
	lnk1 := testutil.NewLink(t, ctx, usr1)

	tests := []struct {
		Name           string
		GivenSessionID string
		GivenLinkID    string
		ExpectStatus   int
		ExpectBody     string
	}{
		{
			Name:           "not allowed",
			GivenSessionID: usr2.SessionID,
			GivenLinkID:    lnk1.ID,
			ExpectStatus:   http.StatusNotFound,
		},
		{
			Name:           "success",
			GivenSessionID: usr1.SessionID,
			GivenLinkID:    lnk1.ID,
			ExpectStatus:   http.StatusOK,
		},
		{
			Name:           "not found",
			GivenSessionID: usr1.SessionID,
			GivenLinkID:    lnk1.ID,
			ExpectStatus:   http.StatusNotFound,
			ExpectBody:     `{"message":"The requested resource was not found"}`,
		},
	}

	for _, tcase := range tests {
		t.Run(tcase.Name, func(t *testing.T) {
			tt := apitest.New(tcase.Name).
				Handler(testutil.Handler()).
				Delete(fmt.Sprintf("/api/links/%s", tcase.GivenLinkID)).
				Header("X-Csrf-Token", testutil.UserCSRF(tcase.GivenSessionID)).
				Cookie("session_id", tcase.GivenSessionID).
				Expect(t).Status(tcase.ExpectStatus)

			if tcase.ExpectStatus >= http.StatusBadRequest {
				tt.Body(tcase.ExpectBody)
			}

			tt.End()
		})
	}
}

func TestSummarizeLink(t *testing.T) {
	ctx := context.Background()
	usr, _ := testutil.NewUser(t, ctx)
	lnk := testutil.NewLink(t, ctx, usr)

	tests := []struct {
		Name           string
		GivenSessionID string
		GivenLinkID    string
		ExpectStatus   int
		ExpectBody     string
	}{
		{
			Name:           "success",
			GivenSessionID: usr.SessionID,
			GivenLinkID:    lnk.ID,
			ExpectStatus:   http.StatusOK,
		},
		{
			Name:           "not found",
			GivenSessionID: usr.SessionID,
			GivenLinkID:    "non-existent-id",
			ExpectStatus:   http.StatusNotFound,
			ExpectBody:     `{"message":"The requested resource was not found"}`,
		},
		{
			Name:           "unauthorized",
			GivenSessionID: "invalid-session-id",
			GivenLinkID:    lnk.ID,
			ExpectStatus:   http.StatusUnauthorized,
			ExpectBody:     `{"message":"Unauthorized"}`,
		},
	}

	for _, tcase := range tests {
		t.Run(tcase.Name, func(t *testing.T) {
			tt := apitest.New(tcase.Name).
				Handler(testutil.Handler()).
				Post(fmt.Sprintf("/api/links/%s/summarize", tcase.GivenLinkID)).
				Header("X-Csrf-Token", testutil.UserCSRF(tcase.GivenSessionID)).
				Cookie("session_id", tcase.GivenSessionID).
				Expect(t).Status(tcase.ExpectStatus)

			if tcase.ExpectStatus < http.StatusBadRequest {
				tt.Assert(jsonpath.Present("$.link.summary"))
			} else {
				tt.Body(tcase.ExpectBody)
			}

			tt.End()
		})
	}
}
