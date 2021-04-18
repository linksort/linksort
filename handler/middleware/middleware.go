package middleware

import (
	"context"
	"fmt"
	"net/http"
	"runtime/debug"
	"strings"

	"github.com/getsentry/raven-go"

	"github.com/linksort/linksort/errors"
	"github.com/linksort/linksort/model"
	"github.com/linksort/linksort/payload"
)

type contextKey int

const userKey contextKey = iota

// WithUser adds the authenticated user to the context. If the user cannot be
// found, then a 401 unauthorized response is returned.
func WithUser(s interface {
	GetUserBySessionID(context.Context, string) (*model.User, error)
}) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var op errors.Op = "middleware.WithUser"

			c, err := r.Cookie("session_id")
			if err != nil {
				payload.WriteError(w, r, errors.E(op, err,
					http.StatusUnauthorized,
					errors.Str("missing session cookie")))

				return
			}

			ctx := r.Context()
			user, err := s.GetUserBySessionID(ctx, c.Value)
			if err != nil {
				payload.WriteError(w, r, errors.E(op, err,
					http.StatusUnauthorized,
					errors.Str("invalid session cookie")))

				return
			}

			next.ServeHTTP(w, r.WithContext(context.WithValue(ctx, userKey, user)))
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
