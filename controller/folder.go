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

	parent := usr.FolderTree.BFS(parentID)
	if parent == nil {
		return nil, errors.E(op,
			errors.Strf("folder %q not found", req.ParentID),
			errors.M{"message": "The given parent folder was not found."},
			http.StatusBadRequest)
	}

	// Check if we're creating a top-level folder (parent is root)
	if parentID == "root" {
		topLevelCount := usr.FolderTree.CountTopLevelFolders()
		if topLevelCount >= 100 {
			return nil, errors.E(op,
				errors.Str("top-level folder limit exceeded"),
				errors.M{"message": "You have reached the maximum of 100 top-level folders."},
				http.StatusBadRequest)
		}
	}

	// Check depth limit - the new folder will be at depth + 1 of its parent
	// Root is at depth 0, so folders can be at depth 1-10 (10 levels)
	parentDepth := usr.FolderTree.GetDepth(parentID)
	if parentDepth >= 10 {
		return nil, errors.E(op,
			errors.Str("folder depth limit exceeded"),
			errors.M{"message": "You have reached the maximum folder depth of 10 levels."},
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
		// Check if moving to root would exceed the top-level folder limit
		if req.ParentID == "root" {
			// Count current top-level folders, excluding the one being moved if it's already at root
			currentParentDepth := usr.FolderTree.GetDepth(req.ID)
			topLevelCount := usr.FolderTree.CountTopLevelFolders()

			// If folder is not currently at root (depth != 1), this move would add a new top-level folder
			if currentParentDepth != 1 && topLevelCount >= 100 {
				return nil, errors.E(op,
					errors.Str("top-level folder limit exceeded"),
					errors.M{"message": "You have reached the maximum of 100 top-level folders."},
					http.StatusBadRequest)
			}
		}

		// Check depth limit for the move
		newParentDepth := usr.FolderTree.GetDepth(req.ParentID)
		subtreeDepth := folder.GetMaxDepthOfSubtree()

		// The deepest folder in the moved subtree will be at: newParentDepth + 1 + subtreeDepth
		if newParentDepth+1+subtreeDepth > 10 {
			return nil, errors.E(op,
				errors.Str("folder depth limit exceeded"),
				errors.M{"message": "Moving this folder would exceed the maximum folder depth of 10 levels."},
				http.StatusBadRequest)
		}

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
