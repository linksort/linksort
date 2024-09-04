package link

import (
	"context"
	"html"
	"net/http"
	"net/url"
	"regexp"
	"time"

	"github.com/gorilla/mux"

	"github.com/linksort/linksort/errors"
	"github.com/linksort/linksort/handler/middleware"
	"github.com/linksort/linksort/model"
	"github.com/linksort/linksort/payload"
)

type Config struct {
	LinkController interface {
		CreateLink(context.Context, *model.User, *CreateLinkRequest) (*model.Link, *model.User, error)
		GetLink(context.Context, *model.User, string) (*model.Link, error)
		GetLinks(context.Context, *model.User, *GetLinksRequest) ([]*model.Link, error)
		UpdateLink(context.Context, *model.User, *UpdateLinkRequest) (*model.Link, *model.User, error)
		DeleteLink(context.Context, *model.User, string) (*model.User, error)
		SummarizeLink(context.Context, *model.User, string) (*model.Link, error)
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

	r.HandleFunc("/api/links", cc.CreateLink).Methods("POST")
	r.HandleFunc("/api/links/{linkID}", cc.GetLink).Methods("GET")
	r.HandleFunc("/api/links", cc.GetLinks).Methods("GET")
	r.HandleFunc("/api/links/{linkID}/summarize", cc.SummarizeLink).Methods("POST")
	r.HandleFunc("/api/links/{linkID}", cc.UpdateLink).Methods("PATCH")
	r.HandleFunc("/api/links/{linkID}", cc.DelteLink).Methods("DELETE")

	return r
}

type CreateLinkRequest struct {
	URL         string `json:"url" validate:"required,url,startswith=http,max=2048"`
	Title       string `json:"title" validate:"omitempty,max=512"`
	Favicon     string `json:"favicon" validate:"omitempty,url,max=512"`
	Description string `json:"description" validate:"omitempty,max=2048"`
	Image       string `json:"image" validate:"omitempty,url,max=512"`
	Site        string `json:"site" validate:"omitempty,max=512"`
	Corpus      string `json:"corpus" validate:"omitempty,max=500000"`
}

type CreateLinkResponse struct {
	Link *model.Link `json:"link"`
	User *model.User `json:"user"`
}

// CreateLink godoc
//
//	@Summary		CreateLink
//	@Description	Creates a link. Both the new link and the user are returned so that newly created tags can be seen.
//	@Param		CreateLinkRequest	body		CreateLinkRequest	true	"All fields are optional except 'url'."
//	@Success		201					{object}	CreateLinkResponse
//	@Failure		400					{object}	payload.Error
//	@Failure		401					{object}	payload.Error
//	@Failure		500					{object}	payload.Error
//	@Security		ApiKeyAuth
//	@Router		/links				[post]
func (s *config) CreateLink(w http.ResponseWriter, r *http.Request) {
	op := errors.Op("handler.CreateLink")
	ctx := r.Context()
	u := middleware.UserFromContext(ctx)

	req := new(CreateLinkRequest)
	if err := payload.ReadValid(req, r); err != nil {
		payload.WriteError(w, r, errors.E(op, err))

		return
	}

	req.URL = html.UnescapeString(req.URL)

	l, u, err := s.LinkController.CreateLink(ctx, u, req)
	if err != nil {
		payload.WriteError(w, r, errors.E(op, err))

		return
	}

	payload.Write(w, r, &CreateLinkResponse{l, u}, http.StatusCreated)
}

type GetLinkResponse struct {
	Link *model.Link `json:"link"`
}

// GetLink godoc
//
//	@Summary		GetLink
//	@Description	Gets a link with all fields populated.
//	@Param		id			path		string	true	"LinkID"
//	@Success		200			{object}	GetLinkResponse
//	@Failure		401			{object}	payload.Error
//	@Failure		404			{object}	payload.Error
//	@Failure		500			{object}	payload.Error
//	@Security		ApiKeyAuth
//	@Router		/links/{id}		[get]
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
	Sort        string
	Search      string
	Favorites   string
	Annotations string
	FolderID    string
	TagPath     string
	UserTag     string
	Pagination  *model.Pagination
}

type GetLinksResponse struct {
	Links []*model.Link `json:"links"`
}

// GetLinks godoc
//
//	@Summary		GetLinks
//	@Description	Gets a list of links with filters applied through the available query parameters.
//	@Param		sort		query		string	false	"Sort, descending or ascending"		Enums(1, -1)
//	@Param		search	query		string	false	"Search"
//	@Param		favorite	query		string	false	"Only return favorites"				Enums(0, 1)
//	@Param		annotated	query		string	false	"Only return links with annotations"	Enums(0, 1)
//	@Param		folder	query		string	false	"Only return links from the given folder ID"
//	@Param		tag		query		string	false	"Only return links with the given tag path"
//	@Param		usertag	query		string	false	"Only return links with the given user tag"
//	@Param		page		query		int		false	"Page"
//	@Param		size		query		int		false	"Page size"						maximum(1000)
//	@Success		200		{object}	GetLinksResponse
//	@Failure		400		{object}	payload.Error
//	@Failure		401		{object}	payload.Error
//	@Failure		500		{object}	payload.Error
//	@Security		ApiKeyAuth
//	@Router		/links	[get]
func (s *config) GetLinks(w http.ResponseWriter, r *http.Request) {
	op := errors.Op("handler.GetLinks")
	ctx := r.Context()
	u := middleware.UserFromContext(ctx)
	q := r.URL.Query()

	tagPath, err := url.PathUnescape(q.Get("tag"))
	if err != nil {
		payload.WriteError(w, r, errors.E(op, err, http.StatusBadRequest, errors.M{
			"message": "Malformed tagPath",
		}))

		return
	}

	userTag, err := url.PathUnescape(q.Get("usertag"))
	if err != nil {
		payload.WriteError(w, r, errors.E(op, err, http.StatusBadRequest, errors.M{
			"message": "Malformed usertag",
		}))

		return
	}

	l, err := s.LinkController.GetLinks(ctx, u, &GetLinksRequest{
		Sort:        q.Get("sort"),
		Search:      q.Get("search"),
		Favorites:   q.Get("favorite"),
		Annotations: q.Get("annotated"),
		FolderID:    q.Get("folder"),
		TagPath:     tagPath,
		UserTag:     userTag,
		Pagination:  model.GetPagination(r),
	})
	if err != nil {
		payload.WriteError(w, r, errors.E(op, err))

		return
	}

	payload.Write(w, r, &GetLinksResponse{l}, http.StatusOK)
}

type UpdateLinkRequest struct {
	ID          string    `json:"-"`
	Title       *string   `json:"title" validate:"omitempty,max=512"`
	URL         *string   `json:"url" validate:"omitempty,url,max=2048"`
	Favicon     *string   `json:"favicon" validate:"omitempty,url,max=512"`
	IsFavorite  *bool     `json:"isFavorite"`
	FolderID    *string   `json:"folderId" validate:"omitempty,uuid|eq=root"`
	Description *string   `json:"description" validate:"omitempty,max=2048"`
	Image       *string   `json:"image" validate:"omitempty,len=0|url,max=512"`
	Site        *string   `json:"site" validate:"omitempty,max=512"`
	Annotation  *string   `json:"annotation"`
	UserTags    *[]string `json:"userTags" validate:"omitempty,dive,max=64"`
}

type UpdateLinkResponse struct {
	Link *model.Link `json:"link"`
	User *model.User `json:"user"`
}

// UpdateLink godoc
//
//	@Summary	UpdateLink
//	@Param	id			path		string		true	"LinkID"
//	@Param	UpdateLinkRequest	body		UpdateLinkRequest	true	"All fields are optional."
//	@Success	200					{object}	UpdateLinkResponse
//	@Failure	400					{object}	payload.Error
//	@Failure	401					{object}	payload.Error
//	@Failure	404					{object}	payload.Error
//	@Failure	500					{object}	payload.Error
//	@Security		ApiKeyAuth
//	@Router	/links/{id}				[patch]
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

	if req.UserTags != nil {
		for _, t := range *req.UserTags {
			if !tagRegex.MatchString(t) {
				payload.WriteError(w, r, errors.E(
					op,
					errors.Str("invalid tag"),
					http.StatusBadRequest,
					errors.M{"message": "Invalid tag."},
				))

				return
			}
		}
	}

	l, u, err := s.LinkController.UpdateLink(ctx, u, req)
	if err != nil {
		payload.WriteError(w, r, errors.E(op, err))

		return
	}

	payload.Write(w, r, &UpdateLinkResponse{l, u}, http.StatusOK)
}

type DeleteLinkResponse struct {
	User *model.User `json:"user"`
}

// DeleteLink godoc
//
//	@Summary	DeleteLink
//	@Param	id			path		string	true	"LinkID"
//	@Success	200					{object}	DeleteLinkResponse
//	@Failure	400					{object}	payload.Error
//	@Failure	401					{object}	payload.Error
//	@Failure	404					{object}	payload.Error
//	@Failure	500					{object}	payload.Error
//	@Security		ApiKeyAuth
//	@Router	/links/{id}				[delete]
func (s *config) DelteLink(w http.ResponseWriter, r *http.Request) {
	op := errors.Op("handler.DeleteLink")
	ctx := r.Context()
	u := middleware.UserFromContext(ctx)
	vars := mux.Vars(r)
	id := vars["linkID"]

	user, err := s.LinkController.DeleteLink(ctx, u, id)
	if err != nil {
		payload.WriteError(w, r, errors.E(op, err))

		return
	}

	payload.Write(w, r, &DeleteLinkResponse{user}, http.StatusOK)
}

type SummarizeLinkResponse struct {
	Link *model.Link `json:"link"`
}

// SummarizeLink godoc
//
//	@Summary		SummarizeLink
//	@Description	Generates a summary of the given link's corpus and returns the updated link.
//	@Param		id			path		string	true	"LinkID"
//	@Success		200			{object}	SummarizeLinkResponse
//	@Failure		401			{object}	payload.Error
//	@Failure		404			{object}	payload.Error
//	@Failure		500			{object}	payload.Error
//	@Security		ApiKeyAuth
//	@Router		/links/{id}/summarize	[get]
func (s *config) SummarizeLink(w http.ResponseWriter, r *http.Request) {
	op := errors.Op("handler.SummarizeLink")
	ctx := r.Context()
	u := middleware.UserFromContext(ctx)
	vars := mux.Vars(r)
	id := vars["linkID"]

	link, err := s.LinkController.SummarizeLink(ctx, u, id)
	if err != nil {
		payload.WriteError(w, r, errors.E(op, err))
		return
	}

	payload.Write(w, r, &SummarizeLinkResponse{Link: link}, http.StatusOK)
}

// Define a regex to check if the tag is valid.
// It must be lowercase and only have dashes as separators.
var tagRegex = regexp.MustCompile(`^[a-z0-9]+(-[a-z0-9]+)*$`)
