package integ_test

import (
	"context"
	"fmt"
	"net/http"
	"testing"

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
	lnk2 := testutil.NewLink(t, ctx, usr)
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
			ExpectBody:   `{"message":"The request was invalid"}`,
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
					tt.Assert(jsonpath.Equal(fmt.Sprintf("$.link.%s", k), v))
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
