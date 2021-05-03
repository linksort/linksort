package user

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
	UserController interface {
		CreateUser(context.Context, *CreateUserRequest) (*model.User, error)
		GetUserBySessionID(context.Context, string) (*model.User, error)
		UpdateUser(context.Context, *model.User, *UpdateUserRequest) (*model.User, error)
		DeleteUser(context.Context, *model.User) error
		ForgotPassword(context.Context, *ForgotPasswordRequest) error
		ChangePassword(context.Context, *ChangePasswordRequest) (*model.User, error)
	}
	SessionController interface {
		CreateSession(context.Context, *CreateSessionRequest) (*model.User, error)
		DeleteSession(context.Context, *model.User) error
	}
}

type config struct{ *Config }

func Handler(c *Config) *mux.Router {
	cc := config{Config: c}
	r := mux.NewRouter()

	r.HandleFunc("/api/users", cc.CreateUser).Methods("POST")
	r.HandleFunc("/api/users/forgot-password", cc.ForgotPassword).Methods("POST")
	r.HandleFunc("/api/users/change-password", cc.ChangePassword).Methods("POST")
	r.HandleFunc("/api/users/sessions", cc.CreateSession).Methods("POST")

	s := r.NewRoute().Subrouter()
	s.Use(middleware.WithUser(c.UserController))
	s.HandleFunc("/api/users", cc.GetUser).Methods("GET")
	s.HandleFunc("/api/users", cc.UpdateUser).Methods("PATCH")
	s.HandleFunc("/api/users", cc.DeleteUser).Methods("DELETE")
	s.HandleFunc("/api/users/sessions", cc.DeleteSession).Methods("DELETE")

	return r
}

type CreateUserRequest struct {
	Email     string `json:"email" validate:"required,email"`
	FirstName string `json:"firstName" validate:"required,max=100"`
	LastName  string `json:"lastName" validate:"max=100"`
	Password  string `json:"password" validate:"required,min=6,max=128"`
}

type CreateUserResponse struct {
	User *model.User `json:"user"`
}

func (s *config) CreateUser(w http.ResponseWriter, r *http.Request) {
	op := errors.Op("handler.CreateUser")
	ctx := r.Context()

	req := new(CreateUserRequest)
	if err := payload.ReadValid(req, r); err != nil {
		payload.WriteError(w, r, errors.E(op, err))

		return
	}

	u, err := s.UserController.CreateUser(ctx, req)
	if err != nil {
		payload.WriteError(w, r, errors.E(op, err))

		return
	}

	setSessionCookie(w, u.SessionID)
	payload.Write(w, r, &CreateUserResponse{u}, http.StatusCreated)
}

type ForgotPasswordRequest struct {
	Email string `json:"email" validate:"required,email"`
}

func (s *config) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	op := errors.Op("handler.ForgotPassword")
	ctx := r.Context()

	req := new(ForgotPasswordRequest)
	if err := payload.ReadValid(req, r); err != nil {
		payload.WriteError(w, r, errors.E(op, err))

		return
	}

	err := s.UserController.ForgotPassword(ctx, req)
	if err != nil {
		payload.WriteError(w, r, errors.E(op, err))

		return
	}

	payload.Write(w, r, nil, http.StatusNoContent)
}

type ChangePasswordRequest struct {
	Signature string `json:"signature" validate:"required"`
	Email     string `json:"email" validate:"required,email"`
	Password  string `json:"password" validate:"required,min=6,max=128"`
}

type ChangePasswordResponse struct {
	User *model.User `json:"user"`
}

func (s *config) ChangePassword(w http.ResponseWriter, r *http.Request) {
	op := errors.Op("handler.ChangePassword")
	ctx := r.Context()

	req := new(ChangePasswordRequest)
	if err := payload.ReadValid(req, r); err != nil {
		payload.WriteError(w, r, errors.E(op, err))

		return
	}

	u, err := s.UserController.ChangePassword(ctx, req)
	if err != nil {
		payload.WriteError(w, r, errors.E(op, err))

		return
	}

	payload.Write(w, r, &ChangePasswordResponse{u}, http.StatusOK)
}

type CreateSessionRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6,max=128"`
}

type CreateSessionResponse struct {
	User *model.User `json:"user"`
}

func (s *config) CreateSession(w http.ResponseWriter, r *http.Request) {
	op := errors.Op("handler.CreateSession")
	ctx := r.Context()

	req := new(CreateSessionRequest)
	if err := payload.ReadValid(req, r); err != nil {
		payload.WriteError(w, r, errors.E(op, err))

		return
	}

	u, err := s.SessionController.CreateSession(ctx, req)
	if err != nil {
		payload.WriteError(w, r, errors.E(op, err))

		return
	}

	setSessionCookie(w, u.SessionID)
	payload.Write(w, r, &CreateSessionResponse{u}, http.StatusCreated)
}

type GetUserResponse struct {
	User *model.User `json:"user"`
}

func (s *config) GetUser(w http.ResponseWriter, r *http.Request) {
	u := middleware.UserFromContext(r.Context())
	payload.Write(w, r, &GetUserResponse{u}, http.StatusOK)
}

type UpdateUserRequest struct {
	Email     string `json:"email" validate:"required,email"`
	FirstName string `json:"firstName" validate:"required,max=100"`
	LastName  string `json:"lastName" validate:"max=100"`
}

type UpdateUserResponse struct {
	User *model.User `json:"user"`
}

func (s *config) UpdateUser(w http.ResponseWriter, r *http.Request) {
	op := errors.Op("handler.UpdateUser")
	ctx := r.Context()
	u := middleware.UserFromContext(ctx)

	req := new(UpdateUserRequest)
	if err := payload.ReadValid(req, r); err != nil {
		payload.WriteError(w, r, errors.E(op, err))

		return
	}

	u, err := s.UserController.UpdateUser(ctx, u, req)
	if err != nil {
		payload.WriteError(w, r, errors.E(op, err))

		return
	}

	payload.Write(w, r, &UpdateUserResponse{u}, http.StatusCreated)
}

func (s *config) DeleteUser(w http.ResponseWriter, r *http.Request) {
	op := errors.Op("handler.DeleteUser")
	ctx := r.Context()
	u := middleware.UserFromContext(ctx)

	if err := s.UserController.DeleteUser(ctx, u); err != nil {
		payload.WriteError(w, r, errors.E(op, err))

		return
	}

	unsetSessionCookie(w)
	payload.Write(w, r, nil, http.StatusNoContent)
}

func (s *config) DeleteSession(w http.ResponseWriter, r *http.Request) {
	op := errors.Op("handler.DeleteSession")
	ctx := r.Context()
	u := middleware.UserFromContext(ctx)

	if err := s.SessionController.DeleteSession(ctx, u); err != nil {
		payload.WriteError(w, r, errors.E(op, err))

		return
	}

	unsetSessionCookie(w)
	payload.Write(w, r, nil, http.StatusNoContent)
}

func setSessionCookie(w http.ResponseWriter, sessionID string) {
	http.SetCookie(w, &http.Cookie{
		Domain:   "linksort.com",
		Path:     "/",
		Name:     "session_id",
		Value:    sessionID,
		Expires:  time.Now().Add(time.Duration(24*30) * time.Hour),
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
	})
}

func unsetSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Domain:   "linksort.com",
		Path:     "/",
		Name:     "session_id",
		Value:    "",
		Expires:  time.Now(),
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
	})
}
