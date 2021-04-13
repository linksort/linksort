package middleware

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/linksort/linksort/errors"
	"github.com/linksort/linksort/model"
	"github.com/linksort/linksort/transport"
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
				transport.Error(w, r, errors.E(op, err,
					http.StatusUnauthorized,
					errors.Str("missing session cookie")))

				return
			}

			if time.Now().After(c.Expires) {
				transport.Error(w, r, errors.E(op, err,
					http.StatusUnauthorized,
					errors.Str("expired session cookie")))

				return
			}

			ctx := r.Context()
			user, err := s.GetUserBySessionID(ctx, c.Value)
			if err != nil {
				transport.Error(w, r, errors.E(op, err,
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
