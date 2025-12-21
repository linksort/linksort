package integ_test

import (
	"context"
	"fmt"
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

func TestCreateFolderLimit(t *testing.T) {
	ctx := context.Background()
	usr, _ := testutil.NewUser(t, ctx)

	for i := 0; i < 99; i++ {
		testutil.NewFolder(t, ctx, usr, "")
	}

	apitest.New("folder-limit").
		Handler(testutil.Handler()).
		Post("/api/folders").
		Header("X-Csrf-Token", testutil.UserCSRF(usr.SessionID)).
		JSON(map[string]string{"name": "too-many"}).
		Cookie("session_id", usr.SessionID).
		Expect(t).
		Status(http.StatusBadRequest).
		Body(`{"message": "You have reached the folder limit of 100 folders."}`).
		End()
}

func TestUpdateFolder(t *testing.T) {
	ctx := context.Background()
	usr1, _ := testutil.NewUser(t, ctx)
	folder1 := testutil.NewFolder(t, ctx, usr1, "")
	folder2 := testutil.NewFolder(t, ctx, usr1, "")
	folder3 := testutil.NewFolder(t, ctx, usr1, folder2.ID)

	tests := []struct {
		Name           string
		GivenSessionID string
		GivenFolderID  string
		GivenBody      map[string]string
		ExpectStatus   int
		ExpectBody     string
	}{
		{
			Name:           "rename folder",
			GivenSessionID: usr1.SessionID,
			GivenFolderID:  folder1.ID,
			GivenBody: map[string]string{
				"name": "my-new-name",
			},
			ExpectStatus: http.StatusOK,
		},
		{
			Name:           "move folder",
			GivenSessionID: usr1.SessionID,
			GivenFolderID:  folder3.ID,
			GivenBody: map[string]string{
				"name":     "my-moved-folder",
				"parentId": folder1.ID,
			},
			ExpectStatus: http.StatusOK,
		},
		{
			Name:           "move folder to root",
			GivenSessionID: usr1.SessionID,
			GivenFolderID:  folder3.ID,
			GivenBody: map[string]string{
				"name":     "my-folder-moved-to-root",
				"parentId": "root",
			},
			ExpectStatus: http.StatusOK,
		},
		{
			Name:           "move folder to nowhere",
			GivenSessionID: usr1.SessionID,
			GivenFolderID:  folder3.ID,
			GivenBody: map[string]string{
				"name":     "nothing-name",
				"parentId": "nowhere",
			},
			ExpectStatus: http.StatusBadRequest,
			ExpectBody:   `{"parentId": "This is not valid."}`,
		},
		{
			Name:           "move non-existent folder",
			GivenSessionID: usr1.SessionID,
			GivenFolderID:  "nothing",
			GivenBody: map[string]string{
				"name":     "nothing",
				"parentId": "root",
			},
			ExpectStatus: http.StatusBadRequest,
			ExpectBody:   `{"message": "The given folder was not found."}`,
		},
		{
			Name:           "missing name param",
			GivenSessionID: usr1.SessionID,
			GivenFolderID:  folder2.ID,
			GivenBody: map[string]string{
				"parentId": "root",
			},
			ExpectStatus: http.StatusBadRequest,
			ExpectBody:   `{"name": "This field is required."}`,
		},
	}

	for _, tcase := range tests {
		t.Run(tcase.Name, func(t *testing.T) {
			tt := apitest.New(tcase.Name).
				Handler(testutil.Handler()).
				Patch(fmt.Sprintf("/api/folders/%s", tcase.GivenFolderID)).
				Header("X-Csrf-Token", testutil.UserCSRF(tcase.GivenSessionID)).
				JSON(tcase.GivenBody).
				Cookie("session_id", tcase.GivenSessionID).
				Expect(t).
				Status(tcase.ExpectStatus)

			if tcase.ExpectStatus < http.StatusBadRequest {
				// TODO: Actaully check stuff.
			} else {
				tt.Body(tcase.ExpectBody)
			}

			tt.End()
		})
	}
}

func TestDeleteFolder(t *testing.T) {
	ctx := context.Background()
	usr1, _ := testutil.NewUser(t, ctx)
	folder1 := testutil.NewFolder(t, ctx, usr1, "")
	folder2 := testutil.NewFolder(t, ctx, usr1, "")
	_ = testutil.NewFolder(t, ctx, usr1, folder2.ID)

	tests := []struct {
		Name           string
		GivenSessionID string
		GivenFolderID  string
		GivenBody      map[string]string
		ExpectStatus   int
		ExpectBody     string
	}{
		{
			Name:           "delete folder",
			GivenSessionID: usr1.SessionID,
			GivenFolderID:  folder1.ID,
			ExpectStatus:   http.StatusOK,
		},
		{
			Name:           "delete folder with children",
			GivenSessionID: usr1.SessionID,
			GivenFolderID:  folder2.ID,
			ExpectStatus:   http.StatusOK,
		},
		{
			Name:           "delete root folder",
			GivenSessionID: usr1.SessionID,
			GivenFolderID:  "root",
			ExpectStatus:   http.StatusBadRequest,
		},
		{
			Name:           "bad id",
			GivenSessionID: usr1.SessionID,
			GivenFolderID:  "blurg",
			ExpectStatus:   http.StatusBadRequest,
		},
	}

	for _, tcase := range tests {
		t.Run(tcase.Name, func(t *testing.T) {
			tt := apitest.New(tcase.Name).
				Handler(testutil.Handler()).
				Delete(fmt.Sprintf("/api/folders/%s", tcase.GivenFolderID)).
				Header("X-Csrf-Token", testutil.UserCSRF(tcase.GivenSessionID)).
				Cookie("session_id", tcase.GivenSessionID).
				Expect(t)

			if tcase.ExpectStatus < http.StatusBadRequest {
				// TODO: Actaully check stuff.
			} else {
				tt.Body(tcase.ExpectBody)
			}

			tt.End()
		})
	}
}
