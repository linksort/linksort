package user

import (
	"context"
	"net/http"
	"time"

	"github.com/gorilla/mux"

	"github.com/linksort/linksort/cookie"
	"github.com/linksort/linksort/errors"
	"github.com/linksort/linksort/handler/middleware"
	"github.com/linksort/linksort/log"
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
	CSRF interface {
		CSRF() []byte
		UserCSRF(sessionID string) []byte
		VerifyCSRF(token string, expiry time.Duration) error
		VerifyUserCSRF(token string, sessionID string, expiry time.Duration) error
	}
}

type config struct{ *Config }

func Handler(c *Config) *mux.Router {
	cc := config{Config: c}
	r := mux.NewRouter()

	// Always allow users to sign out
	r.HandleFunc("/api/users/sessions", cc.DeleteSession).Methods("DELETE")

	s := r.NewRoute().Subrouter()
	s.Use(middleware.WithCSRF(c.CSRF))

	s.HandleFunc("/api/users", cc.CreateUser).Methods("POST")
	s.HandleFunc("/api/users/forgot-password", cc.ForgotPassword).Methods("POST")
	s.HandleFunc("/api/users/change-password", cc.ChangePassword).Methods("POST")
	s.HandleFunc("/api/users/sessions", cc.CreateSession).Methods("POST")

	t := r.NewRoute().Subrouter()
	t.Use(middleware.WithUser(c.UserController, c.CSRF))
	t.HandleFunc("/api/users", cc.GetUser).Methods("GET")
	t.HandleFunc("/api/users", cc.UpdateUser).Methods("PATCH")
	t.HandleFunc("/api/users", cc.DeleteUser).Methods("DELETE")

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

	cookie.SetSession(r, w, u.SessionID)
	w.Header().Add("X-Csrf-Token", string(s.CSRF.UserCSRF(u.SessionID)))
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
	Timestamp string `json:"timestamp" validate:"required"`
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

	cookie.SetSession(r, w, u.SessionID)
	w.Header().Add("X-Csrf-Token", string(s.CSRF.UserCSRF(u.SessionID)))
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

	cookie.SetSession(r, w, u.SessionID)
	w.Header().Add("X-Csrf-Token", string(s.CSRF.UserCSRF(u.SessionID)))
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
	Email              string `json:"email" validate:"omitempty,email"`
	FirstName          string `json:"firstName" validate:"omitempty,max=100"`
	LastName           string `json:"lastName" validate:"omitempty,max=100"`
	HasSeenWelcomeTour *bool  `json:"hasSeenWelcomeTour" validate:"omitempty"`
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

	payload.Write(w, r, &UpdateUserResponse{u}, http.StatusOK)
}

func (s *config) DeleteUser(w http.ResponseWriter, r *http.Request) {
	op := errors.Op("handler.DeleteUser")
	ctx := r.Context()
	u := middleware.UserFromContext(ctx)

	if err := s.UserController.DeleteUser(ctx, u); err != nil {
		payload.WriteError(w, r, errors.E(op, err))

		return
	}

	cookie.UnsetSession(r, w)
	w.Header().Add("X-Csrf-Token", string(s.CSRF.CSRF()))
	payload.Write(w, r, nil, http.StatusNoContent)
}

func (s *config) DeleteSession(w http.ResponseWriter, r *http.Request) {
	op := errors.Op("handler.DeleteSession")
	ctx := r.Context()
	logger := log.FromContext(ctx)

	token := r.Header.Get("X-Csrf-Token")
	if len(token) == 0 {
		// Maybe revisit later: We don't need to check the value on sign-out requests
		// because a new session could have been made elsewhere. We do need to check
		// that the header exists, however, because custom headers can't be injected
		// easily in csrf attacks.
		payload.WriteError(w, r, errors.E(op,
			http.StatusForbidden,
			errors.M{"message": "Forbidden"},
			errors.Str("missing csrf header")))

		return
	}

	var (
		err error
		c   *http.Cookie
		u   *model.User
	)

	c, err = r.Cookie("session_id")
	if err == nil {
		u, err = s.UserController.GetUserBySessionID(ctx, c.Value)
		if err == nil {
			err = s.SessionController.DeleteSession(ctx, u)
		}
	}

	if err != nil {
		logger.Print(errors.E(op, err))
	}

	cookie.UnsetSession(r, w)
	w.Header().Add("X-Csrf-Token", string(s.CSRF.CSRF()))
	payload.Write(w, r, nil, http.StatusNoContent)
}
