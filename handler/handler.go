package handler

import (
	"net/http"

	"github.com/gorilla/mux"

	"github.com/linksort/linksort/transport"
)

type Config struct{}

func New(c *Config) http.Handler {
	router := mux.NewRouter()

	router.NotFoundHandler = http.HandlerFunc(notFound)

	return router
}

func notFound(w http.ResponseWriter, r *http.Request) {
	transport.Write(w, r, map[string]string{"message": "Not found"}, http.StatusNotFound)
}
