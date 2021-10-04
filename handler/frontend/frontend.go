package frontend

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httputil"
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
	return nil
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
	}
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
