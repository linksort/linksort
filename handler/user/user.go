package user

import (
	"context"
	"net/http"

	"github.com/gorilla/mux"

	"github.com/linksort/linksort/errors"
	"github.com/linksort/linksort/handler/middleware"
	"github.com/linksort/linksort/model"
	"github.com/linksort/linksort/transport"
)

type Config struct {
	UserStore   model.UserStore
	UserDeleter interface {
		DeleteUser(context.Context, *model.User) error
	}
}

func Handler(c *Config) http.Handler {
	cc := config{Config: c}
	r := mux.NewRouter()

	r.HandleFunc("/users", cc.CreateUser).Methods("POST")
	r.HandleFunc("/sessions", cc.CreateSession).Methods("POST")

	s := r.NewRoute().Subrouter()
	s.Use(middleware.WithUser(c.UserStore))
	s.HandleFunc("/users", cc.GetUser).Methods("GET")
	s.HandleFunc("/users", cc.UpdateUser).Methods("PATCH")
	s.HandleFunc("/users", cc.DeleteUser).Methods("DELETE")
	s.HandleFunc("/sessions", cc.DeleteSession).Methods("DELETE")

	return r
}

type config struct{ *Config }

type CreateUserPayload struct {
	Email     string `json:"email" validate:"required,email"`
	FirstName string `json:"firstName" validate:"required"`
	LastName  string `json:"lastName"`
	Password  string `json:"password" validate:"required,min=6"`
}

func (s *config) CreateUser(w http.ResponseWriter, r *http.Request) {
	op := errors.Op("handler.CreateUser")
	ctx := r.Context()

	var payload CreateUserPayload
	if err := transport.ReadValid(&payload, r); err != nil {
		transport.Error(w, r, errors.E(op, err))

		return
	}

	u, err := s.UserStore.CreateUser(ctx, &model.CreateUserInput{
		Email:     payload.Email,
		FirstName: payload.FirstName,
		LastName:  payload.LastName,
		Password:  payload.Password,
	})
	if err != nil {
		transport.Error(w, r, errors.E(op, err))

		return
	}

	setSessionCookie(w, u.SessionID)
	transport.Write(w, r, u, http.StatusCreated)
}

type CreateSessionPayload struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

func (s *config) CreateSession(w http.ResponseWriter, r *http.Request) {
	op := errors.Op("handler.CreateSession")
	ctx := r.Context()

	var payload CreateSessionPayload
	if err := transport.ReadValid(&payload, r); err != nil {
		transport.Error(w, r, errors.E(op, err))

		return
	}

	u, err := s.UserStore.GetUserByEmail(ctx, payload.Email)
	if err != nil {
		transport.Error(w, r, errors.E(op, err))

		return
	}

	if err := u.NewSession(ctx, s.UserStore, payload.Password); err != nil {
		transport.Error(w, r, errors.E(op, err))

		return
	}

	setSessionCookie(w, u.SessionID)
	transport.Write(w, r, u, http.StatusCreated)
}

func (s *config) GetUser(w http.ResponseWriter, r *http.Request) {
	u := middleware.UserFromContext(r.Context())
	transport.Write(w, r, u, http.StatusOK)
}

func (s *config) UpdateUser(w http.ResponseWriter, r *http.Request) {
	op := errors.Op("handler.UpdateUser")
	transport.Error(w, r, errors.E(op, errors.Str("not implemented")))
}

func (s *config) DeleteUser(w http.ResponseWriter, r *http.Request) {
	op := errors.Op("handler.DeleteUser")
	ctx := r.Context()
	u := middleware.UserFromContext(ctx)

	if err := s.UserDeleter.DeleteUser(ctx, u); err != nil {
		transport.Error(w, r, errors.E(op, err))

		return
	}

	unsetSessionCookie(w)
	transport.Write(w, r, nil, http.StatusNoContent)
}

func (s *config) DeleteSession(w http.ResponseWriter, r *http.Request) {
	op := errors.Op("handler.DeleteSession")
	ctx := r.Context()
	u := middleware.UserFromContext(ctx)

	if err := u.DeleteSession(ctx, s.UserStore); err != nil {
		transport.Error(w, r, errors.E(op, err))

		return
	}

	unsetSessionCookie(w)
	transport.Write(w, r, nil, http.StatusNoContent)
}
