package middleware

import (
	"context"
	"fmt"
	"net/http"
	"runtime/debug"
	"strings"
	"time"

	"github.com/getsentry/raven-go"
	"github.com/rs/zerolog"

	"github.com/linksort/linksort/cookie"
	"github.com/linksort/linksort/errors"
	"github.com/linksort/linksort/model"
	"github.com/linksort/linksort/payload"
)

type contextKey int

const (
	_userKey         contextKey = iota
	_userCsrfTimeout            = time.Hour * 24 * 7
	_csrfTimeout                = time.Hour * 24
)

// WithUser adds the authenticated user to the context and validates her CSRF
// token if the incoming request is a write request. If the user cannot be
// found, then a 401 unauthorized response is returned.
func WithUser(auth interface {
	WithCookie(context.Context, string) (*model.User, error)
	WithToken(context.Context, string) (*model.User, error)
}, m interface {
	VerifyUserCSRF(string, string, time.Duration) error
}) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			op := errors.Op("middleware.WithUser")
			ctx := r.Context()

			// If a token is in the headers, use that to authenticate. Otherwise,
			// default to cookie-based auth.
			if token, found := GetAuthBearerToken(r.Header); found {
				user, err := auth.WithToken(ctx, token)
				if err != nil {
					payload.WriteError(w, r, err)
					return
				}

				next.ServeHTTP(w, r.WithContext(context.WithValue(ctx, _userKey, user)))
				return
			}

			c, err := r.Cookie("session_id")
			if err != nil {
				payload.WriteError(w, r, errors.E(op, err,
					http.StatusUnauthorized,
					errors.M{"message": "Unauthorized"}))
				return
			}

			user, err := auth.WithCookie(ctx, c.Value)
			if err != nil {
				cookie.UnsetSession(r, w)
				payload.WriteError(w, r, errors.E(op, err))
				return
			}

			if isWriteRequest(r.Method) {
				err = m.VerifyUserCSRF(
					r.Header.Get("X-Csrf-Token"), user.SessionID, _userCsrfTimeout)
				if err != nil {
					payload.WriteError(w, r, errors.E(op,
						http.StatusForbidden,
						errors.M{"message": "Forbidden"},
						errors.Str("invalid user csrf token")))
					return
				}
			}

			log := zerolog.Ctx(ctx)
			log.UpdateContext(func(c zerolog.Context) zerolog.Context {
				return c.Str("UserID", user.ID)
			})

			next.ServeHTTP(w, r.WithContext(context.WithValue(ctx, _userKey, user)))
		})
	}
}

// WithCSRF validates the X-Csrf-Token header for anonymous users.
func WithCSRF(m interface {
	VerifyCSRF(string, time.Duration) error
}) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var op errors.Op = "middleware.WithCSRF"

			if isWriteRequest(r.Method) {
				token := r.Header.Get("X-Csrf-Token")

				err := m.VerifyCSRF(token, _csrfTimeout)
				if err != nil {
					payload.WriteError(w, r, errors.E(op,
						http.StatusForbidden,
						errors.M{"message": "Forbidden"},
						errors.Str("invalid csrf token")))

					return
				}
			}

			next.ServeHTTP(w, r)
		})
	}
}

// UserFromContext returns the User object that was added to the context via
// WithUser middleware.
func UserFromContext(ctx context.Context) *model.User {
	got := ctx.Value(_userKey)

	if u, ok := got.(*model.User); ok {
		return u
	}

	return &model.User{ID: "Anonymous"}
}

// GetAuthBearerToken extracts the Authorization Bearer token from request
// headers if present.
func GetAuthBearerToken(h http.Header) (string, bool) {
	if val := h.Get("Authorization"); val != "" && len(val) >= 7 {
		if strings.ToLower(val[:7]) == "bearer " {
			return val[7:], true
		}
	}

	return "", false
}

// WithPanicHandling reports errors to Sentry and returns a 500 error to the user.
func WithPanicHandling(handler http.Handler) http.Handler {
	// This code is coped and slightly altered from
	// github.com/getsentry/raven-go@v0.2.0/http.go
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rval := recover(); rval != nil {
				debug.PrintStack()
				rvalStr := fmt.Sprint(rval)
				var packet *raven.Packet
				if err, ok := rval.(error); ok {
					packet = raven.NewPacket(
						rvalStr,
						raven.NewException(errors.Str(rvalStr),
							raven.GetOrNewStacktrace(err, 2, 3, nil)),
						raven.NewHttp(r))
				} else {
					packet = raven.NewPacket(
						rvalStr,
						raven.NewException(errors.Str(rvalStr),
							raven.NewStacktrace(2, 3, nil)),
						raven.NewHttp(r))
				}
				raven.Capture(packet, nil)
				payload.WriteError(w, r, errors.Str(rvalStr))
			}
		}()

		handler.ServeHTTP(w, r)
	})
}

func isWriteRequest(method string) bool {
	return method == http.MethodDelete ||
		method == http.MethodPatch ||
		method == http.MethodPost ||
		method == http.MethodPut
}
