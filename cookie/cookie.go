package cookie

import (
	"net/http"
	"time"
)

func SetSession(w http.ResponseWriter, sessionID string) {
	http.SetCookie(w, &http.Cookie{
		Domain:   "linksort.com",
		Path:     "/",
		Name:     "session_id",
		Value:    sessionID,
		Expires:  time.Now().Add(time.Duration(24*30) * time.Hour),
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
	})
}

func UnsetSession(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Domain:   "linksort.com",
		Path:     "/",
		Name:     "session_id",
		Value:    "",
		Expires:  time.Now(),
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
	})
}
