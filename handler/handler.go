package handler

import (
	"bytes"
	"io"
	"net/http"
	"net/http/httputil"
	"strings"
	"time"

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
	}))

	// ReverseProxy to Frontend
	router.PathPrefix("/").Handler(&httputil.ReverseProxy{
		FlushInterval: time.Duration(0),
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

				b = bytes.Replace(b, []byte("//SERVER_DATA//"), []byte("{}"), 1)
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
