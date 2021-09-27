package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httputil"
	"strings"

	"github.com/gorilla/mux"
	"github.com/linksort/analyze"

	"github.com/linksort/linksort/controller"
	"github.com/linksort/linksort/email"
	"github.com/linksort/linksort/errors"
	"github.com/linksort/linksort/handler/folder"
	"github.com/linksort/linksort/handler/link"
	"github.com/linksort/linksort/handler/middleware"
	"github.com/linksort/linksort/handler/user"
	"github.com/linksort/linksort/log"
	"github.com/linksort/linksort/magic"
	"github.com/linksort/linksort/model"
	"github.com/linksort/linksort/payload"
)

type Config struct {
	UserStore model.UserStore
	LinkStore model.LinkStore
	Magic     *magic.Client
	Email     *email.Client
	Analyzer  interface {
		Do(context.Context, *analyze.Request) (*analyze.Response, error)
	}
	FrontendProxyHostname string
	FrontendProxyPort     string
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
			Store:     c.LinkStore,
			Analyzer:  c.Analyzer,
			UserStore: c.UserStore,
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

	// ReverseProxy to Frontend
	router.PathPrefix("/").Handler(&httputil.ReverseProxy{
		Director: func(r *http.Request) {
			r.URL.Scheme = "http"
			r.URL.Host = fmt.Sprintf("%s:%s", c.FrontendProxyHostname, c.FrontendProxyPort)
			delete(r.Header, "Accept-Encoding")
		},
		ModifyResponse: func(r *http.Response) error {
			if r.Request.URL.Path != "/sockjs-node" &&
				strings.HasPrefix(r.Header.Get("Content-Type"), "text/html") {
				op := errors.Op("ReverseProxy.ModifyResponse")

				b, err := io.ReadAll(r.Body)
				if err != nil {
					return errors.E(op, err)
				}

				if err := r.Body.Close(); err != nil {
					return errors.E(op, err)
				}

				d, err := getUserData(r.Request.Context(), c.UserStore, c.Magic, r.Request)
				if err != nil {
					return errors.E(op, err)
				}

				b = bytes.Replace(b, []byte("//SERVER_DATA//"), d.userData, 1)
				b = bytes.Replace(b, []byte("//CSRF//"), d.csrf, 1)
				r.Body = io.NopCloser(bytes.NewReader(b))
				r.ContentLength = int64(len(b))
				r.StatusCode = http.StatusOK
				r.Header.Add("Cache-Control", "no-cache")
				r.Header.Del("ETag")
				r.Header.Del("X-Powered-By")
			}

			return nil
		},
	})

	return middleware.WithPanicHandling(log.WithAccessLogging(router))
}

type getUserDataResponse struct {
	userData json.RawMessage
	csrf     []byte
}

func getUserData(
	ctx context.Context,
	store model.UserStore,
	magic *magic.Client,
	r *http.Request,
) (*getUserDataResponse, error) {
	op := errors.Op("getUserData")

	cookie, err := r.Cookie("session_id")
	if err != nil {
		if errors.As(err, &http.ErrNoCookie) {
			return &getUserDataResponse{
				userData: json.RawMessage("{}"),
				csrf:     magic.CSRF(),
			}, nil
		}

		return nil, errors.E(op, err)
	}

	usr, err := store.GetUserBySessionID(ctx, cookie.Value)
	if err != nil {
		lserr := new(errors.Error)
		if errors.As(err, &lserr) && lserr.Status() == http.StatusNotFound {
			return &getUserDataResponse{
				userData: json.RawMessage("{}"),
				csrf:     magic.CSRF(),
			}, nil
		}

		return nil, errors.E(op, err)
	}

	encodedUser, err := json.Marshal(struct {
		User *model.User `json:"user"`
	}{usr})
	if err != nil {
		return nil, errors.E(op, err)
	}

	return &getUserDataResponse{
		userData: encodedUser,
		csrf:     magic.UserCSRF(usr.SessionID),
	}, nil
}

func notFound(w http.ResponseWriter, r *http.Request) {
	payload.Write(w, r, map[string]string{"message": "Not found"}, http.StatusNotFound)
}

func methodNotAllowed(w http.ResponseWriter, r *http.Request) {
	payload.Write(w, r, map[string]string{"message": "Method not allowed"}, http.StatusMethodNotAllowed)
}

func wrap(h *mux.Router) *mux.Router {
	h.NotFoundHandler = http.HandlerFunc(notFound)
	h.MethodNotAllowedHandler = http.HandlerFunc(methodNotAllowed)

	return h
}
