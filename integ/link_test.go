package integ_test

import (
	"context"
	"net/http"
	"testing"

	"github.com/steinfletcher/apitest"
	jsonpath "github.com/steinfletcher/apitest-jsonpath"

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
				"title":       "Buy It All Now",
				"description": "It's like Walmart but on the internet.",
				"favicon":     "https://amazon.com/favicon.ico",
				"site":        "Amazon",
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
				tt.Assert(jsonpath.Equal("$.link.url", tcase.GivenBody["url"]))
				tt.Assert(jsonpath.Equal("$.link.title", tcase.GivenBody["title"]))
				tt.Assert(jsonpath.Equal("$.link.description", tcase.GivenBody["description"]))
				tt.Assert(jsonpath.Equal("$.link.favicon", tcase.GivenBody["favicon"]))
				tt.Assert(jsonpath.Equal("$.link.site", tcase.GivenBody["site"]))
			} else {
				tt.Body(tcase.ExpectBody)
			}

			tt.End()
		})
	}
}
