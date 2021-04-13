package handler

import (
	"net/http"

	"github.com/gorilla/mux"

	"github.com/linksort/linksort/handler/user"
	"github.com/linksort/linksort/payload"
)

type Config struct{}

func New(c *Config) http.Handler {
	router := mux.NewRouter()

	router.NotFoundHandler = http.HandlerFunc(notFound)

	router.PathPrefix("/api/users").Handler(user.Handler(&user.Config{}))

	return router
}

func notFound(w http.ResponseWriter, r *http.Request) {
	payload.Write(w, r, map[string]string{"message": "Not found"}, http.StatusNotFound)
}
