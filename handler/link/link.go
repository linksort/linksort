package link

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
	LinkController interface {
		CreateLink(context.Context, *model.User, *CreateLinkRequest) (*model.Link, error)
		GetLink(context.Context, *model.User, string) (*model.Link, error)
		GetLinks(context.Context, *model.User, *GetLinksRequest) ([]*model.Link, error)
		UpdateLink(context.Context, *model.User, *UpdateLinkRequest) (*model.Link, error)
		DeleteLink(context.Context, *model.User, string) (*model.Link, error)
	}
	UserController interface {
		GetUserBySessionID(context.Context, string) (*model.User, error)
	}
	CSRF interface {
		VerifyUserCSRF(token string, sessionID string, expiry time.Duration) error
	}
}

type config struct{ *Config }

func Handler(c *Config) *mux.Router {
	cc := config{Config: c}
	r := mux.NewRouter()

	r.Use(middleware.WithUser(c.UserController, c.CSRF))

	r.HandleFunc("/api/links", cc.CreateLink).Methods("POST")
	r.HandleFunc("/api/links/{linkID}", cc.GetLink).Methods("GET")
	r.HandleFunc("/api/links", cc.GetLinks).Methods("GET")
	r.HandleFunc("/api/links/{linkID}", cc.UpdateLink).Methods("PATCH")
	r.HandleFunc("/api/links/{linkID}", cc.DelteLink).Methods("DELETE")

	return r
}

type CreateLinkRequest struct {
	URL         string `json:"url" validate:"required,url,max=2048"`
	Title       string `json:"title" validate:"max=512"`
	Favicon     string `json:"favicon" validate:"url,max=512"`
	Description string `json:"description" validate:"max=2048"`
	Image       string `json:"image" validate:"url,max=512"`
	Site        string `json:"site" validate:"max=512"`
	Corpus      string `json:"corpus" validate:"max=100000"`
}

type CreateLinkResponse struct {
	Link *model.Link `json:"link"`
}

func (s *config) CreateLink(w http.ResponseWriter, r *http.Request) {
	op := errors.Op("handler.CreateLink")
	ctx := r.Context()
	u := middleware.UserFromContext(ctx)

	req := new(CreateLinkRequest)
	if err := payload.ReadValid(req, r); err != nil {
		payload.WriteError(w, r, errors.E(op, err))

		return
	}

	l, err := s.LinkController.CreateLink(ctx, u, req)
	if err != nil {
		payload.WriteError(w, r, errors.E(op, err))

		return
	}

	payload.Write(w, r, &CreateLinkResponse{l}, http.StatusCreated)
}

type GetLinkResponse struct {
	Link *model.Link `json:"link"`
}

func (s *config) GetLink(w http.ResponseWriter, r *http.Request) {
	op := errors.Op("handler.GetLink")
	ctx := r.Context()
	u := middleware.UserFromContext(ctx)
	vars := mux.Vars(r)
	id := vars["linkID"]

	l, err := s.LinkController.GetLink(ctx, u, id)
	if err != nil {
		payload.WriteError(w, r, errors.E(op, err))

		return
	}

	payload.Write(w, r, &GetLinkResponse{l}, http.StatusOK)
}

type GetLinksRequest struct {
	Filter     string
	Search     string
	Pagination *model.Pagination
}

type GetLinksResponse struct {
	Links []*model.Link `json:"links"`
}

func (s *config) GetLinks(w http.ResponseWriter, r *http.Request) {
	op := errors.Op("handler.GetLinks")
	ctx := r.Context()
	u := middleware.UserFromContext(ctx)
	q := r.URL.Query()

	l, err := s.LinkController.GetLinks(ctx, u, &GetLinksRequest{
		Filter:     q.Get("filter"),
		Search:     q.Get("search"),
		Pagination: model.GetPagination(r),
	})
	if err != nil {
		payload.WriteError(w, r, errors.E(op, err))

		return
	}

	payload.Write(w, r, &GetLinksResponse{l}, http.StatusOK)
}

type UpdateLinkRequest struct {
	ID          string `json:"-"`
	URL         string `json:"url" validate:"required,url,max=2048"`
	Title       string `json:"title" validate:"max=512"`
	Favicon     string `json:"favicon" validate:"url,max=512"`
	Description string `json:"description" validate:"max=2048"`
	Image       string `json:"image" validate:"url,max=512"`
	Site        string `json:"site" validate:"max=512"`
	Corpus      string `json:"corpus" validate:"max=100000"`
}

type UpdateLinkResponse struct {
	Link *model.Link `json:"link"`
}

func (s *config) UpdateLink(w http.ResponseWriter, r *http.Request) {
	op := errors.Op("handler.UpdateLink")
	ctx := r.Context()
	u := middleware.UserFromContext(ctx)
	vars := mux.Vars(r)
	id := vars["linkID"]

	req := new(UpdateLinkRequest)
	if err := payload.ReadValid(req, r); err != nil {
		payload.WriteError(w, r, errors.E(op, err))

		return
	}

	req.ID = id

	l, err := s.LinkController.UpdateLink(ctx, u, req)
	if err != nil {
		payload.WriteError(w, r, errors.E(op, err))

		return
	}

	payload.Write(w, r, &UpdateLinkResponse{l}, http.StatusOK)
}

type DeleteLinkResponse struct {
	Link *model.Link `json:"link"`
}

func (s *config) DelteLink(w http.ResponseWriter, r *http.Request) {
	op := errors.Op("handler.DeleteLink")
	ctx := r.Context()
	u := middleware.UserFromContext(ctx)
	vars := mux.Vars(r)
	id := vars["linkID"]

	l, err := s.LinkController.DeleteLink(ctx, u, id)
	if err != nil {
		payload.WriteError(w, r, errors.E(op, err))

		return
	}

	payload.Write(w, r, &DeleteLinkResponse{l}, http.StatusOK)
}
