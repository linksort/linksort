package handler

import (
	"net/http"

	"github.com/gorilla/mux"

	"github.com/linksort/linksort/controller"
	"github.com/linksort/linksort/handler/middleware"
	"github.com/linksort/linksort/handler/user"
	"github.com/linksort/linksort/log"
	"github.com/linksort/linksort/model"
	"github.com/linksort/linksort/payload"
)

type Config struct {
	UserStore model.UserStore
}

func New(c *Config) http.Handler {
	router := mux.NewRouter()

	router.NotFoundHandler = http.HandlerFunc(notFound)

	router.PathPrefix("/api/users").Handler(user.Handler(&user.Config{
		UserController:    &controller.User{Store: c.UserStore},
		SessionController: &controller.Session{},
	}))

	return middleware.WithPanicHandling(log.WithAccessLogging(router))
}

func notFound(w http.ResponseWriter, r *http.Request) {
	payload.Write(w, r, map[string]string{"message": "Not found"}, http.StatusNotFound)
}
