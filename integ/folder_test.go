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

func TestTopLevelFolderLimit(t *testing.T) {
	ctx := context.Background()
	usr, _ := testutil.NewUser(t, ctx)

	// Create 100 top-level folders
	for i := 0; i < 100; i++ {
		testutil.NewFolder(t, ctx, usr, "")
	}

	// Refresh user to get updated folder tree
	usr, err := testutil.UpdateUser(t, ctx, usr)
	if err != nil {
		t.Fatal(err)
	}

	// Try to create the 101st top-level folder - should fail
	apitest.New("exceed top-level folder limit").
		Handler(testutil.Handler()).
		Post("/api/folders").
		Header("X-Csrf-Token", testutil.UserCSRF(usr.SessionID)).
		JSON(map[string]string{
			"name": "folder 101",
		}).
		Cookie("session_id", usr.SessionID).
		Expect(t).
		Status(http.StatusBadRequest).
		Body(`{"message": "You have reached the maximum of 100 top-level folders."}`).
		End()

	// Create a nested folder - should succeed
	folder := testutil.NewFolder(t, ctx, usr, "")
	if err != nil {
		t.Fatal(err)
	}

	apitest.New("create nested folder when at top-level limit").
		Handler(testutil.Handler()).
		Post("/api/folders").
		Header("X-Csrf-Token", testutil.UserCSRF(usr.SessionID)).
		JSON(map[string]string{
			"name":     "nested folder",
			"parentId": folder.ID,
		}).
		Cookie("session_id", usr.SessionID).
		Expect(t).
		Status(http.StatusCreated).
		End()
}

func TestFolderDepthLimit(t *testing.T) {
	ctx := context.Background()
	usr, _ := testutil.NewUser(t, ctx)

	// Create a chain of 10 nested folders (depths 1-10)
	var parentID string
	for i := 1; i <= 10; i++ {
		folder := testutil.NewFolder(t, ctx, usr, parentID)
		parentID = folder.ID
	}

	// Refresh user to get updated folder tree
	usr, err := testutil.UpdateUser(t, ctx, usr)
	if err != nil {
		t.Fatal(err)
	}

	// Try to create an 11th level folder - should fail
	apitest.New("exceed depth limit").
		Handler(testutil.Handler()).
		Post("/api/folders").
		Header("X-Csrf-Token", testutil.UserCSRF(usr.SessionID)).
		JSON(map[string]string{
			"name":     "too deep",
			"parentId": parentID,
		}).
		Cookie("session_id", usr.SessionID).
		Expect(t).
		Status(http.StatusBadRequest).
		Body(`{"message": "You have reached the maximum folder depth of 10 levels."}`).
		End()
}

func TestMoveFolderDepthLimit(t *testing.T) {
	ctx := context.Background()
	usr, _ := testutil.NewUser(t, ctx)

	// Create a chain of 8 nested folders in one branch
	var branch1ParentID string
	for i := 1; i <= 8; i++ {
		folder := testutil.NewFolder(t, ctx, usr, branch1ParentID)
		branch1ParentID = folder.ID
	}

	// Create a folder with 2 levels of children in another branch
	branch2Folder1 := testutil.NewFolder(t, ctx, usr, "")
	branch2Folder2 := testutil.NewFolder(t, ctx, usr, branch2Folder1.ID)
	branch2Folder3 := testutil.NewFolder(t, ctx, usr, branch2Folder2.ID)

	// Refresh user to get updated folder tree
	usr, err := testutil.UpdateUser(t, ctx, usr)
	if err != nil {
		t.Fatal(err)
	}

	// Try to move branch2Folder1 (which has 2 children below it) under branch1's deepest folder
	// This would create depths: 9 (branch2Folder1), 10 (branch2Folder2), 11 (branch2Folder3) - should fail
	apitest.New("move folder exceeds depth limit").
		Handler(testutil.Handler()).
		Patch(fmt.Sprintf("/api/folders/%s", branch2Folder1.ID)).
		Header("X-Csrf-Token", testutil.UserCSRF(usr.SessionID)).
		JSON(map[string]string{
			"name":     branch2Folder1.Name,
			"parentId": branch1ParentID,
		}).
		Cookie("session_id", usr.SessionID).
		Expect(t).
		Status(http.StatusBadRequest).
		Body(`{"message": "Moving this folder would exceed the maximum folder depth of 10 levels."}`).
		End()

	// Create a shallower parent (depth 7)
	var branch3ParentID string
	for i := 1; i <= 7; i++ {
		folder := testutil.NewFolder(t, ctx, usr, branch3ParentID)
		branch3ParentID = folder.ID
	}

	// Refresh user again
	usr, err = testutil.UpdateUser(t, ctx, usr)
	if err != nil {
		t.Fatal(err)
	}

	// Moving branch2Folder1 under this parent should succeed
	// Depths would be: 8 (branch2Folder1), 9 (branch2Folder2), 10 (branch2Folder3)
	apitest.New("move folder at depth limit succeeds").
		Handler(testutil.Handler()).
		Patch(fmt.Sprintf("/api/folders/%s", branch2Folder1.ID)).
		Header("X-Csrf-Token", testutil.UserCSRF(usr.SessionID)).
		JSON(map[string]string{
			"name":     branch2Folder1.Name,
			"parentId": branch3ParentID,
		}).
		Cookie("session_id", usr.SessionID).
		Expect(t).
		Status(http.StatusOK).
		End()
}

func TestMoveToRootWithTopLevelLimit(t *testing.T) {
	ctx := context.Background()
	usr, _ := testutil.NewUser(t, ctx)

	// Create 99 top-level folders
	for i := 0; i < 99; i++ {
		testutil.NewFolder(t, ctx, usr, "")
	}

	// Create a nested folder structure
	folder1 := testutil.NewFolder(t, ctx, usr, "")
	folder2 := testutil.NewFolder(t, ctx, usr, folder1.ID)

	// Refresh user to get updated folder tree
	usr, err := testutil.UpdateUser(t, ctx, usr)
	if err != nil {
		t.Fatal(err)
	}

	// Moving folder2 to root should succeed (bringing total to 100)
	apitest.New("move to root at limit succeeds").
		Handler(testutil.Handler()).
		Patch(fmt.Sprintf("/api/folders/%s", folder2.ID)).
		Header("X-Csrf-Token", testutil.UserCSRF(usr.SessionID)).
		JSON(map[string]string{
			"name":     folder2.Name,
			"parentId": "root",
		}).
		Cookie("session_id", usr.SessionID).
		Expect(t).
		Status(http.StatusOK).
		End()

	// Create another nested folder
	folder3 := testutil.NewFolder(t, ctx, usr, folder1.ID)

	// Refresh user again
	usr, err = testutil.UpdateUser(t, ctx, usr)
	if err != nil {
		t.Fatal(err)
	}

	// Now we have 100 top-level folders. Moving folder3 to root should fail
	apitest.New("move to root exceeds limit").
		Handler(testutil.Handler()).
		Patch(fmt.Sprintf("/api/folders/%s", folder3.ID)).
		Header("X-Csrf-Token", testutil.UserCSRF(usr.SessionID)).
		JSON(map[string]string{
			"name":     folder3.Name,
			"parentId": "root",
		}).
		Cookie("session_id", usr.SessionID).
		Expect(t).
		Status(http.StatusBadRequest).
		Body(`{"message": "You have reached the maximum of 100 top-level folders."}`).
		End()
}
