package conversation

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/gorilla/mux"

	"github.com/linksort/linksort/errors"
	"github.com/linksort/linksort/handler/middleware"
	"github.com/linksort/linksort/log"
	"github.com/linksort/linksort/model"
	"github.com/linksort/linksort/payload"
)

type Config struct {
	ConversationController interface {
		CreateConversation(context.Context, *model.User, *CreateConversationRequest) (*model.Conversation, error)
		GetConversations(context.Context, *model.User, *model.Pagination) ([]*model.Conversation, error)
		GetConversation(context.Context, *model.User, string, *model.Pagination) (*model.Conversation, error)
		Converse(context.Context, *model.User, *ConverseRequest) (<-chan *model.ConverseEvent, error)
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

	r.HandleFunc("/api/conversations", cc.CreateConversation).Methods("POST")
	r.HandleFunc("/api/conversations/{conversationID}/converse", cc.Converse).Methods("PUT")
	r.HandleFunc("/api/conversations", cc.GetConversations).Methods("GET")
	r.HandleFunc("/api/conversations/{conversationID}", cc.GetConversation).Methods("GET")

	return r
}

type CreateConversationRequest struct {
}

type CreateConversationResponse struct {
	Conversation *model.Conversation `json:"conversation"`
}

// CreateConversation godoc
//
//	@Summary	CreateConversation
//	@Param	CreateConversationRequest	body		CreateConversationRequest	true	"Create a new conversation"
//	@Success	201				{object}	CreateConversationResponse
//	@Failure	400				{object}	payload.Error
//	@Failure	401				{object}	payload.Error
//	@Failure	500				{object}	payload.Error
//	@Security	ApiKeyAuth
//	@Router	/conversations			[post]
func (s *config) CreateConversation(w http.ResponseWriter, r *http.Request) {
	op := errors.Op("handler.CreateConversation")
	ctx := r.Context()
	u := middleware.UserFromContext(ctx)

	req := new(CreateConversationRequest)
	if err := payload.ReadValid(req, r); err != nil {
		payload.WriteError(w, r, errors.E(op, err))
		return
	}

	conv, err := s.ConversationController.CreateConversation(ctx, u, req)
	if err != nil {
		payload.WriteError(w, r, errors.E(op, err))
		return
	}

	payload.Write(w, r, &CreateConversationResponse{conv}, http.StatusCreated)
}

type GetConversationResponse struct {
	Conversation *model.Conversation `json:"conversation"`
}

// GetConversation godoc
//
//	@Summary	GetConversation
//	@Param	id	path		string	true	"ConversationID"
//	@Success	200		{object}	GetConversationResponse
//	@Failure	400		{object}	payload.Error
//	@Failure	401		{object}	payload.Error
//	@Failure	404		{object}	payload.Error
//	@Failure	500		{object}	payload.Error
//	@Security	ApiKeyAuth
//	@Router	/conversations/{id}	[get]
func (s *config) GetConversation(w http.ResponseWriter, r *http.Request) {
	op := errors.Op("handler.GetConversation")
	ctx := r.Context()
	u := middleware.UserFromContext(ctx)
	pagination := model.GetPagination(r)

	vars := mux.Vars(r)
	id := vars["conversationID"]

	conv, err := s.ConversationController.GetConversation(ctx, u, id, pagination)
	if err != nil {
		payload.WriteError(w, r, errors.E(op, err))
		return
	}

	payload.Write(w, r, &GetConversationResponse{conv}, http.StatusOK)
}

type GetConversationsResponse struct {
	Conversations []*model.Conversation `json:"conversations"`
}

// GetConversations godoc
//
//	@Summary	GetConversations
//	@Success	200		{object}	GetConversationsResponse
//	@Failure	400		{object}	payload.Error
//	@Failure	401		{object}	payload.Error
//	@Failure	500		{object}	payload.Error
//	@Security	ApiKeyAuth
//	@Router	/conversations	[get]
func (s *config) GetConversations(w http.ResponseWriter, r *http.Request) {
	op := errors.Op("handler.GetConversations")
	ctx := r.Context()
	u := middleware.UserFromContext(ctx)
	pagination := model.GetPagination(r)

	convs, err := s.ConversationController.GetConversations(ctx, u, pagination)
	if err != nil {
		payload.WriteError(w, r, errors.E(op, err))
		return
	}

	payload.Write(w, r, &GetConversationsResponse{convs}, http.StatusOK)
}

type PageContext struct {
	Route string            `json:"route"`
	Query map[string]string `json:"query"`
}

type ConverseRequest struct {
	// The ID of the conversation, will be populated from the URL parameter
	ID string `json:"-"`
	// The message to send in the conversation
	Message string `json:"message" validate:"required"`
	// The page context where the user is sending the message from
	PageContext *PageContext `json:"pageContext,omitempty"`
}

// Converse godoc
//
//	@Summary	Converse in an existing conversation
//	@Param	id			path		string			true	"ConversationID"
//	@Param	ConverseRequest	body		ConverseRequest	true	"Message to send in the conversation"
//	@Success	200			{object}	ConverseResponse
//	@Failure	400			{object}	payload.Error
//	@Failure	401			{object}	payload.Error
//	@Failure	404			{object}	payload.Error
//	@Failure	500			{object}	payload.Error
//	@Security	ApiKeyAuth
//	@Router	/conversations/{id}/converse	[put]
func (s *config) Converse(w http.ResponseWriter, r *http.Request) {
	op := errors.Op("handler.Converse")
	ctx := r.Context()
	u := middleware.UserFromContext(ctx)

	vars := mux.Vars(r)
	id := vars["conversationID"]

	req := new(ConverseRequest)
	if err := payload.ReadValid(req, r); err != nil {
		payload.WriteError(w, r, errors.E(op, err))
		return
	}
	req.ID = id

	// Create a new context that doesn't get canceled in case of disconnects
	ll := log.FromRequest(r)
	newCtx := ll.WithContext(context.Background())
	log.UpdateContext(newCtx, "UserID", u.ID)

	// Get event channel from controller
	events, err := s.ConversationController.Converse(newCtx, u, req)
	if err != nil {
		payload.WriteError(w, r, errors.E(op, err))
		return
	}

	// Create a channel to detect client disconnect
	done := r.Context().Done()
	isDisconnected := false
	isFirstEvent := true

	// Stream events to client
	for {
		select {
		case event, ok := <-events:
			if !ok {
				// Channel closed, end stream
				log.FromRequest(r).Print("channel closed, end stream")
				if isFirstEvent {
					payload.WriteError(w, r, errors.E(op, errors.Str("channel closed before first event")))
				}
				return
			}

			if isDisconnected {
				continue
			}

			if isFirstEvent {
				// Set headers for SSE
				w.Header().Set("Content-Type", "text/event-stream")
				w.Header().Set("Cache-Control", "no-cache")
				w.Header().Set("Connection", "keep-alive")
				w.Header().Set("Transfer-Encoding", "chunked")
				isFirstEvent = false
			}

			// Write event as JSON
			if err := json.NewEncoder(w).Encode(event); err != nil {
				// Client connection error, end stream
				return
			}
			// Flush the response writer to send the chunk immediately
			if f, ok := w.(http.Flusher); ok {
				f.Flush()
			}
		case <-done:
			// Client disconnected
			if !isDisconnected {
				log.FromRequest(r).Print("client disconnected")
				isDisconnected = true
			}
		}
	}
}
