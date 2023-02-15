package docs

import (
	"net/http"

	"github.com/swaggo/http-swagger"

	_ "github.com/linksort/linksort/docs"
)

func Handler() http.HandlerFunc {
	handler := httpSwagger.Handler(httpSwagger.URL("/docs/doc.json"))
	return func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/docs":
			http.Redirect(w, r, "/docs/", http.StatusTemporaryRedirect)
			return
		case "/docs/":
			http.Redirect(w, r, "/docs/index.html", http.StatusTemporaryRedirect)
			return
		default:
			handler(w, r)
		}
	}
}
