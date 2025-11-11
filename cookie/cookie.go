package cookie

import (
	"net/http"
	"time"
)

func NewSessionCookie(host, sessionID string) *http.Cookie {
	return &http.Cookie{
		Domain:   host,
		Path:     "/",
		Name:     "session_id",
		Value:    sessionID,
		Expires:  time.Now().Add(time.Duration(24*90) * time.Hour),
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	}
}

func SetSession(r *http.Request, w http.ResponseWriter, sessionID string) {
	http.SetCookie(w, NewSessionCookie(r.Host, sessionID))
}

func UnsetSession(r *http.Request, w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Domain:   r.Host,
		Path:     "/",
		Name:     "session_id",
		Value:    "",
		Expires:  time.Now().Add(-time.Duration(24 * time.Hour)),
		MaxAge:   0,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})
}
