package handler

import (
	"context"
	"net/http"
	"strings"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"

	"github.com/linksort/linksort/analyze"
	"github.com/linksort/linksort/controller"
	"github.com/linksort/linksort/db"
	"github.com/linksort/linksort/handler/docs"
	"github.com/linksort/linksort/handler/folder"
	"github.com/linksort/linksort/handler/frontend"
	"github.com/linksort/linksort/handler/link"
	"github.com/linksort/linksort/handler/middleware"
	"github.com/linksort/linksort/handler/oauth"
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
	Email      interface {
		SendForgotPassword(context.Context, *model.User, string) error
	}
	Analyzer interface {
		Do(context.Context, *analyze.Request) (*analyze.Response, error)
	}
	FrontendProxyHostname string
	FrontendProxyPort     string
	IsProd                bool
}

func New(c *Config) http.Handler {
	router := mux.NewRouter()
	router.PathPrefix("/docs").HandlerFunc(docs.Handler()).Methods("GET")

	// Controllers
	userC := &controller.User{
		Store:     c.UserStore,
		LinkStore: c.LinkStore,
		Magic:     c.Magic,
		Email:     c.Email,
	}
	authC := &controller.Auth{Store: c.UserStore}
	linkC := &controller.Link{
		Store:      c.LinkStore,
		Analyzer:   c.Analyzer,
		UserStore:  c.UserStore,
		Transactor: c.Transactor,
	}
	folderC := &controller.Folder{Store: c.UserStore}
	oauthC := &controller.OAuth{Store: c.UserStore}
	sessionC := &controller.Session{Store: c.UserStore}

	// API Routes
	api := router.PathPrefix("/api").Subrouter()
	api.NotFoundHandler = http.HandlerFunc(notFound)

	api.PathPrefix("/users").Handler(wrap(user.Handler(&user.Config{
		AuthController:    authC,
		UserController:    userC,
		SessionController: sessionC,
		CSRF:              c.Magic,
	})))
	api.PathPrefix("/links").Handler(wrap(link.Handler(&link.Config{
		AuthController: authC,
		LinkController: linkC,
		CSRF:           c.Magic,
	})))
	api.PathPrefix("/folders").Handler(wrap(folder.Handler(&folder.Config{
		AuthController:   authC,
		FolderController: folderC,
		CSRF:             c.Magic,
	})))

	router.PathPrefix("/oauth").Handler(oauth.Handler(&oauth.Config{
		AuthController:  authC,
		OAuthController: oauthC,
		CSRF:            c.Magic,
	}))

	// Frontend Routes
	if c.IsProd {
		router.PathPrefix("/").Handler(frontend.Server(&frontend.Config{
			AuthController: authC,
			Magic:          c.Magic,
		}))
	} else {
		router.PathPrefix("/").Handler(frontend.ReverseProxy(&frontend.Config{
			AuthController:        authC,
			Magic:                 c.Magic,
			FrontendProxyHostname: c.FrontendProxyHostname,
			FrontendProxyPort:     c.FrontendProxyPort,
		}))
	}

	return log.WithAccessLogging(middleware.WithPanicHandling(router))
}

func wrap(h *mux.Router) http.Handler {
	h.NotFoundHandler = http.HandlerFunc(notFound)
	h.MethodNotAllowedHandler = http.HandlerFunc(methodNotAllowed)

	return handlers.CORS(
		handlers.AllowedHeaders([]string{"Content-Type", "Authorization"}),
		handlers.AllowedOriginValidator(func(origin string) bool {
			return strings.HasPrefix(origin, "moz-extension://") ||
				strings.HasPrefix(origin, "chrome-extension://") ||
				strings.HasPrefix(origin, "safari-web-extension://")
		}),
	)(h)
}

func notFound(w http.ResponseWriter, r *http.Request) {
	payload.Write(w, r, map[string]string{"message": "Not found"}, http.StatusNotFound)
}

func methodNotAllowed(w http.ResponseWriter, r *http.Request) {
	payload.Write(w, r, map[string]string{"message": "Method not allowed"}, http.StatusMethodNotAllowed)
}
