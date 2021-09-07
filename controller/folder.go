package controller

import (
	"context"
	"net/http"

	"github.com/linksort/linksort/errors"
	handler "github.com/linksort/linksort/handler/folder"
	"github.com/linksort/linksort/model"
)

type Folder struct {
	Store model.UserStore
}

func (f *Folder) CreateFolder(
	ctx context.Context,
	usr *model.User,
	req *handler.CreateFolderRequest,
) (*model.User, error) {
	op := errors.Op("controller.CreateFolder")

	parentID := "root"
	if req.ParentID != "" {
		parentID = req.ParentID
	}

	parent := usr.FolderTree.DFS(parentID)
	if parent == nil {
		return nil, errors.E(op,
			errors.Strf("folder %q not found", req.ParentID),
			errors.M{"message": "The given parent folder was not found."},
			http.StatusBadRequest)
	}

	model.NewFolder(req.Name, parent)

	usr, err := f.Store.UpdateUser(ctx, usr)
	if err != nil {
		return nil, errors.E(op, err)
	}

	return usr, nil
}

func (f *Folder) UpdateFolder(
	ctx context.Context,
	usr *model.User,
	req *handler.UpdateFolderRequest,
) (*model.User, error) {
	return nil, nil
}

func (f *Folder) DeleteFolder(
	ctx context.Context,
	usr *model.User,
	folderID string,
) (*model.User, error) {
	return nil, nil
}
