package middleware

import (
	"context"
	"fmt"
	"net/http"
	"runtime/debug"
	"strings"
	"time"

	"github.com/getsentry/raven-go"

	"github.com/linksort/linksort/cookie"
	"github.com/linksort/linksort/errors"
	"github.com/linksort/linksort/model"
	"github.com/linksort/linksort/payload"
)

type contextKey int

const userKey contextKey = iota

// WithUser adds the authenticated user to the context and validates her CSRF
// token if the incoming request is a write request. If the user cannot be
// found, then a 401 unauthorized response is returned.
func WithUser(s interface {
	GetUserBySessionID(context.Context, string) (*model.User, error)
}, m interface {
	VerifyUserCSRF(string, string, time.Duration) error
}) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var op errors.Op = "middleware.WithUser"

			c, err := r.Cookie("session_id")
			if err != nil {
				payload.WriteError(w, r, errors.E(op, err,
					http.StatusUnauthorized,
					errors.M{"message": "Unauthorized"}))

				return
			}

			ctx := r.Context()
			user, err := s.GetUserBySessionID(ctx, c.Value)
			if err != nil {
				cookie.UnsetSession(w)
				payload.WriteError(w, r, errors.E(op, err,
					http.StatusUnauthorized,
					errors.M{"message": "Unauthorized"}))

				return
			}

			if time.Now().After(user.SessionExpiry) {
				cookie.UnsetSession(w)
				payload.WriteError(w, r, errors.E(op,
					http.StatusUnauthorized,
					errors.M{"message": "Unauthorized"},
					errors.Str("expired session cookie")))

				return
			}

			if isWriteRequest(r.Method) {
				token := r.Header.Get("X-Csrf-Token")

				err = m.VerifyUserCSRF(token, user.SessionID, time.Hour*24*7)
				if err != nil {
					payload.WriteError(w, r, errors.E(op,
						http.StatusForbidden,
						errors.M{"message": "Forbidden"},
						errors.Str("invalid user csrf token")))

					return
				}
			}

			next.ServeHTTP(w, r.WithContext(context.WithValue(ctx, userKey, user)))
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

				err := m.VerifyCSRF(token, time.Hour*24)
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
	return ctx.Value(userKey).(*model.User)
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
						raven.NewException(errors.Str(rvalStr), raven.GetOrNewStacktrace(err, 2, 3, nil)),
						raven.NewHttp(r))
				} else {
					packet = raven.NewPacket(
						rvalStr,
						raven.NewException(errors.Str(rvalStr), raven.NewStacktrace(2, 3, nil)),
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
	return method == http.MethodDelete || method == http.MethodPatch || method == http.MethodPost || method == http.MethodPut
}
