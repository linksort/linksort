package oauth

import (
	"context"
	"embed"
	"fmt"
	"html/template"
	"net/http"
	"net/url"
	"time"

	"github.com/gorilla/mux"
	"github.com/linksort/linksort/log"
	"github.com/linksort/linksort/model"
	"github.com/linksort/linksort/payload"
)

//go:embed templates/*.html
var f embed.FS

type Config struct {
	OAuthController interface {
		Authenticate(context.Context, *OAuthAuthRequest) (*model.User, error)
	}
	Auth interface {
		WithCookie(context.Context, string) (*model.User, error)
	}
	CSRF interface {
		CSRF() []byte
		VerifyCSRF(token string, expiry time.Duration) error
	}
}

type config struct {
	*Config
	template *template.Template
}

func Handler(c *Config) *mux.Router {
	cc := config{Config: c}

	cc.template = template.Must(template.ParseFS(f, "templates/oauth.html"))

	r := mux.NewRouter()

	r.HandleFunc("/oauth", cc.OauthForm).Methods("GET")
	r.HandleFunc("/oauth", cc.Oauth).Methods("POST")

	return r
}

type OAuthAuthRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6,max=128"`
}

func (s *config) Oauth(w http.ResponseWriter, r *http.Request) {
	if err := s.CSRF.VerifyCSRF(r.FormValue("csrf"), time.Hour); err != nil {
		s.handleError(w, r, err, "You ran out of time. Please refresh the page and try again.")
		return
	}

	req := &OAuthAuthRequest{
		Email:    r.FormValue("email"),
		Password: r.FormValue("password"),
	}

	if err := payload.Valid(req); err != nil {
		s.handleError(w, r, err, "Invalid credentials given.")
		return
	}

	usr, err := s.OAuthController.Authenticate(r.Context(), req)
	if err != nil {
		s.handleError(w, r, err, "Invalid credentials given.")
		return
	}

	redirectURI := r.URL.Query().Get("redirect_uri")

	http.Redirect(w, r,
		fmt.Sprintf("%s?token=%s", redirectURI, url.QueryEscape(usr.Token)),
		http.StatusFound)
}

func (s *config) OauthForm(w http.ResponseWriter, r *http.Request) {
	redirectURI := r.URL.Query().Get("redirect_uri")

	c, err := r.Cookie("session_id")
	if err == nil {
		if user, err := s.Auth.WithCookie(r.Context(), c.Value); err == nil {
			http.Redirect(w, r,
				fmt.Sprintf("%s?token=%s", redirectURI, url.QueryEscape(user.Token)),
				http.StatusFound)
			return
		}
	}

	err = s.template.Execute(w, map[string]string{
		"RedirectURI": redirectURI,
		"CSRF":        string(s.CSRF.CSRF()),
	})
	if err != nil {
		log.Alarm(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (s *config) handleError(w http.ResponseWriter, r *http.Request, err error, message string) {
	log.FromRequest(r).Print(err)

	renderErr := s.template.Execute(w, map[string]string{
		"IsError":     "1",
		"Error":       message,
		"RedirectURI": r.URL.Query().Get("redirect_uri"),
		"CSRF":        string(s.CSRF.CSRF()),
	})
	if renderErr != nil {
		log.Alarm(renderErr)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
