package handler

import (
	"context"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/linksort/analyze"

	"github.com/linksort/linksort/controller"
	"github.com/linksort/linksort/db"
	"github.com/linksort/linksort/email"
	"github.com/linksort/linksort/handler/folder"
	"github.com/linksort/linksort/handler/frontend"
	"github.com/linksort/linksort/handler/link"
	"github.com/linksort/linksort/handler/middleware"
	"github.com/linksort/linksort/handler/user"
	"github.com/linksort/linksort/log"
	"github.com/linksort/linksort/magic"
	"github.com/linksort/linksort/model"
	"github.com/linksort/linksort/payload"
)

type Config struct {
	Transactor db.Transactor
	UserStore  model.UserStore
	LinkStore  model.LinkStore
	Magic      *magic.Client
	Email      *email.Client
	Analyzer   interface {
		Do(context.Context, *analyze.Request) (*analyze.Response, error)
	}
	FrontendProxyHostname string
	FrontendProxyPort     string
	IsProd                string
}

func New(c *Config) http.Handler {
	router := mux.NewRouter()

	// API Routes
	api := router.PathPrefix("/api").Subrouter()
	api.NotFoundHandler = http.HandlerFunc(notFound)

	api.PathPrefix("/users").Handler(wrap(user.Handler(&user.Config{
		UserController: &controller.User{
			Store: c.UserStore,
			Magic: c.Magic,
			Email: c.Email,
		},
		SessionController: &controller.Session{Store: c.UserStore},
		CSRF:              c.Magic,
	})))
	api.PathPrefix("/links").Handler(wrap(link.Handler(&link.Config{
		LinkController: &controller.Link{
			Store:      c.LinkStore,
			Analyzer:   c.Analyzer,
			UserStore:  c.UserStore,
			Transactor: c.Transactor,
		},
		UserController: &controller.User{
			Store: c.UserStore,
			Magic: c.Magic,
			Email: c.Email,
		},
		CSRF: c.Magic,
	})))
	api.PathPrefix("/folders").Handler(wrap(folder.Handler(&folder.Config{
		FolderController: &controller.Folder{
			Store: c.UserStore,
		},
		UserController: &controller.User{
			Store: c.UserStore,
			Magic: c.Magic,
			Email: c.Email,
		},
		CSRF: c.Magic,
	})))

	// Frontend Routes
	if c.IsProd == "1" {
		router.PathPrefix("/").Handler(frontend.Server(&frontend.Config{
			UserStore: c.UserStore,
			Magic:     c.Magic,
		}))
	} else {
		router.PathPrefix("/").Handler(frontend.ReverseProxy(&frontend.Config{
			FrontendProxyHostname: c.FrontendProxyHostname,
			FrontendProxyPort:     c.FrontendProxyPort,
			UserStore:             c.UserStore,
			Magic:                 c.Magic,
		}))
	}

	return log.WithAccessLogging(middleware.WithPanicHandling(router))
}

func wrap(h *mux.Router) *mux.Router {
	h.NotFoundHandler = http.HandlerFunc(notFound)
	h.MethodNotAllowedHandler = http.HandlerFunc(methodNotAllowed)

	return h
}

func notFound(w http.ResponseWriter, r *http.Request) {
	payload.Write(w, r, map[string]string{"message": "Not found"}, http.StatusNotFound)
}

func methodNotAllowed(w http.ResponseWriter, r *http.Request) {
	payload.Write(w, r, map[string]string{"message": "Method not allowed"}, http.StatusMethodNotAllowed)
}
