package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httputil"
	"strings"

	"github.com/gorilla/mux"

	"github.com/linksort/linksort/controller"
	"github.com/linksort/linksort/email"
	"github.com/linksort/linksort/errors"
	"github.com/linksort/linksort/handler/middleware"
	"github.com/linksort/linksort/handler/user"
	"github.com/linksort/linksort/log"
	"github.com/linksort/linksort/magic"
	"github.com/linksort/linksort/model"
	"github.com/linksort/linksort/payload"
)

type Config struct {
	UserStore model.UserStore
	Magic     *magic.Client
	Email     *email.Client
}

func New(c *Config) http.Handler {
	router := mux.NewRouter()

	// API Routes
	api := router.PathPrefix("/api").Subrouter()
	api.NotFoundHandler = http.HandlerFunc(notFound)

	api.PathPrefix("/users").Handler(user.Handler(&user.Config{
		UserController: &controller.User{
			Store: c.UserStore,
			Magic: c.Magic,
			Email: c.Email,
		},
		SessionController: &controller.Session{Store: c.UserStore},
		CSRFVerifier:      c.Magic,
	}))

	// ReverseProxy to Frontend
	router.PathPrefix("/").Handler(&httputil.ReverseProxy{
		Director: func(r *http.Request) {
			r.URL.Scheme = "http"
			r.URL.Host = "localhost:3000"
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

				var data json.RawMessage
				cookie, err := r.Request.Cookie("session_id")

				if err != nil {
					data = json.RawMessage("{}")
				} else {
					data, err = getUserData(r.Request.Context(), c.UserStore, cookie.Value)
					if err != nil {
						return errors.E(op, err)
					}
				}

				b = bytes.Replace(b, []byte("//SERVER_DATA//"), data, 1)
				b = bytes.Replace(b, []byte("//CSRF//"), c.Magic.CSRF(), 1)
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

func notFound(w http.ResponseWriter, r *http.Request) {
	payload.Write(w, r, map[string]string{"message": "Not found"}, http.StatusNotFound)
}

func getUserData(ctx context.Context, store model.UserStore, sessionID string) (json.RawMessage, error) {
	op := errors.Op("getUserData")

	usr, err := store.GetUserBySessionID(ctx, sessionID)
	if err != nil {
		lserr := new(errors.Error)
		if errors.As(err, &lserr) && lserr.Status() == http.StatusNotFound {
			return json.RawMessage("{}"), nil
		}

		return nil, errors.E(op, err)
	}

	data, err := json.Marshal(struct {
		User *model.User `json:"user"`
	}{usr})
	if err != nil {
		return nil, errors.E(op, err)
	}

	return data, nil
}
