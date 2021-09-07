package integ_test

import (
	"context"
	"net/http"
	"testing"

	"github.com/icrowley/fake"
	"github.com/steinfletcher/apitest"
	jsonpath "github.com/steinfletcher/apitest-jsonpath"

	"github.com/linksort/linksort/testutil"
)

func TestCreateFolder(t *testing.T) {
	usr1, _ := testutil.NewUser(t, context.Background())

	tests := []struct {
		Name           string
		GivenSessionID string
		GivenBody      map[string]string
		ExpectStatus   int
		ExpectBody     string
	}{
		{
			Name:           "success",
			GivenSessionID: usr1.SessionID,
			GivenBody: map[string]string{
				"name": "my new folder",
			},
			ExpectStatus: http.StatusCreated,
		},
		{
			Name:           "name too long",
			GivenSessionID: usr1.SessionID,
			GivenBody: map[string]string{
				"name": fake.CharactersN(129),
			},
			ExpectStatus: http.StatusBadRequest,
			ExpectBody:   `{"name":"This field must be less than 128 characters long."}`,
		},
	}

	for _, tcase := range tests {
		t.Run(tcase.Name, func(t *testing.T) {
			tt := apitest.New(tcase.Name).
				Handler(testutil.Handler()).
				Post("/api/folders").
				Header("X-Csrf-Token", testutil.UserCSRF(tcase.GivenSessionID)).
				JSON(tcase.GivenBody).
				Cookie("session_id", tcase.GivenSessionID).
				Expect(t).
				Status(tcase.ExpectStatus)

			if tcase.ExpectStatus < http.StatusBadRequest {
				tt.Assert(jsonpath.Equal(
					"$.user.folderTree.name",
					"root"))
				tt.Assert(jsonpath.Equal(
					"$.user.folderTree.id",
					"root"))
				tt.Assert(jsonpath.Equal(
					"$.user.folderTree.children[0].name",
					tcase.GivenBody["name"]))
			} else {
				tt.Body(tcase.ExpectBody)
			}

			tt.End()
		})
	}
}
