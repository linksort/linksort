package frontend

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httputil"
	"os"
	"strings"

	"github.com/linksort/linksort/errors"
	"github.com/linksort/linksort/magic"
	"github.com/linksort/linksort/model"
)

type Config struct {
	FrontendProxyHostname string
	FrontendProxyPort     string
	UserStore             model.UserStore
	Magic                 *magic.Client
}

func Server(c *Config) http.Handler {
	return withIndexHandler(c.UserStore, c.Magic, http.FileServer(http.Dir("./assets")))
}

func ReverseProxy(c *Config) http.Handler {
	return &httputil.ReverseProxy{
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

				d, _, err := getUserData(r.Request.Context(), c.UserStore, c.Magic, r.Request)
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
	}
}

func withIndexHandler(
	store model.UserStore,
	magic *magic.Client,
	next http.Handler,
) http.Handler {
	dat, err := os.ReadFile("./assets/app.html")
	if err != nil {
		panic(err)
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if isAppRoute := isApplicationRoute(r.URL.Path); isIndexRoute(r.URL.Path) || isAppRoute {
			d, found, err := getUserData(r.Context(), store, magic, r)
			if err != nil {
				panic(err)
			}

			if found || isAppRoute {
				b := make([]byte, len(dat))
				_ = copy(b, dat)
				b = bytes.Replace(b, []byte("//SERVER_DATA//"), d.userData, 1)
				b = bytes.Replace(b, []byte("//CSRF//"), d.csrf, 1)

				w.Header().Add("Cache-Control", "no-cache")
				w.WriteHeader(http.StatusOK)

				_, err = w.Write(b)
				if err != nil {
					panic(err)
				}

				return
			}
		}

		next.ServeHTTP(w, r)
	})
}

var applicationRoutes = map[string]bool{
	"sign-in":                    true,
	"sign-up":                    true,
	"forgot-password":            true,
	"forgot-password-sent-email": true,
	"change-password":            true,
	"links":                      true,
}

func isApplicationRoute(path string) bool {
	_, ok := applicationRoutes[strings.Trim(path, "/")]

	return ok
}

func isIndexRoute(path string) bool {
	p := strings.Trim(path, "/")

	return p == "" || p == "index.html"
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
) (*getUserDataResponse, bool, error) {
	op := errors.Op("getUserData")

	cookie, err := r.Cookie("session_id")
	if err != nil {
		if errors.As(err, &http.ErrNoCookie) {
			return &getUserDataResponse{
				userData: json.RawMessage("{}"),
				csrf:     magic.CSRF(),
			}, false, nil
		}

		return nil, false, errors.E(op, err)
	}

	usr, err := store.GetUserBySessionID(ctx, cookie.Value)
	if err != nil {
		lserr := new(errors.Error)
		if errors.As(err, &lserr) && lserr.Status() == http.StatusNotFound {
			return &getUserDataResponse{
				userData: json.RawMessage("{}"),
				csrf:     magic.CSRF(),
			}, false, nil
		}

		return nil, false, errors.E(op, err)
	}

	encodedUser, err := json.Marshal(struct {
		User *model.User `json:"user"`
	}{usr})
	if err != nil {
		return nil, false, errors.E(op, err)
	}

	return &getUserDataResponse{
		userData: encodedUser,
		csrf:     magic.UserCSRF(usr.SessionID),
	}, true, nil
}
