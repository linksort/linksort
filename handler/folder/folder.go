package folder

import (
	"context"
	"net/http"
	"time"

	"github.com/gorilla/mux"

	"github.com/linksort/linksort/errors"
	"github.com/linksort/linksort/handler/middleware"
	"github.com/linksort/linksort/model"
	"github.com/linksort/linksort/payload"
)

type Config struct {
	FolderController interface {
		CreateFolder(context.Context, *model.User, *CreateFolderRequest) (*model.User, error)
		UpdateFolder(context.Context, *model.User, *UpdateFolderRequest) (*model.User, error)
		DeleteFolder(context.Context, *model.User, string) (*model.User, error)
	}
	AuthController interface {
		WithCookie(context.Context, string) (*model.User, error)
		WithToken(context.Context, string) (*model.User, error)
	}
	CSRF interface {
		VerifyUserCSRF(token string, sessionID string, expiry time.Duration) error
	}
}

type config struct{ *Config }

func Handler(c *Config) *mux.Router {
	cc := config{Config: c}
	r := mux.NewRouter()

	r.Use(middleware.WithUser(c.AuthController, c.CSRF))

	r.HandleFunc("/api/folders", cc.CreateFolder).Methods("POST")
	r.HandleFunc("/api/folders/{folderID}", cc.UpdateFolder).Methods("PATCH")
	r.HandleFunc("/api/folders/{folderID}", cc.DeleteFolder).Methods("DELETE")

	return r
}

type CreateFolderRequest struct {
	Name     string `json:"name" validate:"required,max=128"`
	ParentID string `json:"parentId" validate:"omitempty,uuid"`
}

type CreateFolderResponse struct {
	User *model.User `json:"user"`
}

// CreateFolder godoc
//
//	@Summary	CreateFolder
//	@Param	CreateFolderRequest	body		CreateFolderRequest	true	"Only 'name' is required. Use 'parentId' to nest the new folder under a parent folder."
//	@Success	201				{object}	CreateFolderResponse
//	@Failure	400				{object}	payload.Error
//	@Failure	401				{object}	payload.Error
//	@Failure	500				{object}	payload.Error
//	@Security	ApiKeyAuth
//	@Router	/folders			[post]
func (s *config) CreateFolder(w http.ResponseWriter, r *http.Request) {
	op := errors.Op("handler.CreateFolder")
	ctx := r.Context()
	u := middleware.UserFromContext(ctx)

	req := new(CreateFolderRequest)
	if err := payload.ReadValid(req, r); err != nil {
		payload.WriteError(w, r, errors.E(op, err))

		return
	}

	l, err := s.FolderController.CreateFolder(ctx, u, req)
	if err != nil {
		payload.WriteError(w, r, errors.E(op, err))

		return
	}

	payload.Write(w, r, &CreateFolderResponse{l}, http.StatusCreated)
}

type UpdateFolderRequest struct {
	Name     string `json:"name" validate:"required,max=128"`
	ParentID string `json:"parentId" validate:"omitempty,uuid|eq=root"`
	ID       string `json:"-"`
}

type UpdateFolderResponse struct {
	User *model.User `json:"user"`
}

// UpdateFolder godoc
//
//	@Summary	UpdateFolder
//	@Param	id				path		string			true	"FolderID"
//	@Param	UpdateFolderRequest	body		UpdateFolderRequest	true	"Change the folder's name or move the folder under a new parent folder. Set the parentId to 'root' to move the folder to the top level."
//	@Success	200				{object}	UpdateFolderResponse
//	@Failure	400				{object}	payload.Error
//	@Failure	401				{object}	payload.Error
//	@Failure	404				{object}	payload.Error
//	@Failure	500				{object}	payload.Error
//	@Security	ApiKeyAuth
//	@Router	/folders/{id}		[patch]
func (s *config) UpdateFolder(w http.ResponseWriter, r *http.Request) {
	op := errors.Op("handler.UpdateFolder")
	ctx := r.Context()
	u := middleware.UserFromContext(ctx)
	vars := mux.Vars(r)
	id := vars["folderID"]

	req := new(UpdateFolderRequest)
	if err := payload.ReadValid(req, r); err != nil {
		payload.WriteError(w, r, errors.E(op, err))

		return
	}

	req.ID = id

	l, err := s.FolderController.UpdateFolder(ctx, u, req)
	if err != nil {
		payload.WriteError(w, r, errors.E(op, err))

		return
	}

	payload.Write(w, r, &CreateFolderResponse{l}, http.StatusOK)
}

type DeleteFolderResponse struct {
	User *model.User `json:"user"`
}

// DeleteFolder godoc
//
//	@Summary	DeleteFolder
//	@Param	id			path		string	true	"FolderID"
//	@Success	200					{object}	DeleteFolderResponse
//	@Failure	400					{object}	payload.Error
//	@Failure	401					{object}	payload.Error
//	@Failure	404					{object}	payload.Error
//	@Failure	500					{object}	payload.Error
//	@Security	ApiKeyAuth
//	@Router	/folders/{id}			[delete]
func (s *config) DeleteFolder(w http.ResponseWriter, r *http.Request) {
	op := errors.Op("handler.DeleteFolder")
	ctx := r.Context()
	u := middleware.UserFromContext(ctx)
	vars := mux.Vars(r)
	id := vars["folderID"]

	l, err := s.FolderController.DeleteFolder(ctx, u, id)
	if err != nil {
		payload.WriteError(w, r, errors.E(op, err))

		return
	}

	payload.Write(w, r, &DeleteFolderResponse{l}, http.StatusOK)
}
