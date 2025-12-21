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

const maxFolderCount = 100

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

	if usr.FolderTree.Count() >= maxFolderCount {
		return nil, errors.E(op,
			errors.Str("folder limit reached"),
			errors.M{"message": "You have reached the folder limit of 100 folders."},
			http.StatusBadRequest)
	}

	parent := usr.FolderTree.BFS(parentID)
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
	op := errors.Op("controller.UpdateFolder")

	folder := usr.FolderTree.BFS(req.ID)
	if folder == nil {
		return nil, errors.E(op,
			errors.Strf("folder not found"),
			errors.M{"message": "The given folder was not found."},
			http.StatusBadRequest)
	}

	folder.Name = req.Name

	if req.ParentID != "" {
		if err := usr.FolderTree.Move(req.ID, req.ParentID, -1); err != nil {
			return nil, errors.E(op, err)
		}
	}

	usr, err := f.Store.UpdateUser(ctx, usr)
	if err != nil {
		return nil, errors.E(op, err)
	}

	return usr, nil
}

func (f *Folder) DeleteFolder(
	ctx context.Context,
	usr *model.User,
	folderID string,
) (*model.User, error) {
	op := errors.Op("controller.UpdateFolder")

	found := usr.FolderTree.Remove(folderID)
	if found == nil {
		return nil, errors.E(op,
			errors.Strf("folder not found"),
			errors.M{"message": "The given folder was not found."},
			http.StatusBadRequest)
	}

	usr, err := f.Store.UpdateUser(ctx, usr)
	if err != nil {
		return nil, errors.E(op, err)
	}

	return usr, nil
}
