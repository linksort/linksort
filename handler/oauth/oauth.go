package oauth

import (
	"context"
	"fmt"
	"html/template"
	"net/http"
	"net/url"
	"time"

	"github.com/gorilla/mux"
	"github.com/linksort/linksort/model"
	"github.com/linksort/linksort/payload"
)

type Config struct {
	OAuthController interface {
		Authenticate(context.Context, *OAuthAuthRequest) (*model.User, error)
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

	cc.template = template.Must(template.ParseFiles("handler/oauth/templates/oauth.html"))

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
	redirectURI := r.URL.Query().Get("redirect_uri")

	if err := s.CSRF.VerifyCSRF(r.FormValue("csrf"), time.Hour); err != nil {
		s.template.Execute(w, map[string]string{
			"IsError":     "1",
			"Error":       "You ran out of time. Please refresh the page and try again.",
			"RedirectURI": redirectURI,
			"CSRF":        string(s.CSRF.CSRF()),
		})
		return
	}

	req := &OAuthAuthRequest{
		Email:    r.FormValue("email"),
		Password: r.FormValue("password"),
	}

	if err := payload.Valid(req); err != nil {
		s.template.Execute(w, map[string]string{
			"IsError":     "1",
			"Error":       "Invalid credentials given.",
			"RedirectURI": redirectURI,
			"CSRF":        string(s.CSRF.CSRF()),
		})
		return
	}

	usr, err := s.OAuthController.Authenticate(r.Context(), req)
	if err != nil {
		s.template.Execute(w, map[string]string{
			"IsError":     "1",
			"Error":       "Invalid credentials given.",
			"RedirectURI": redirectURI,
			"CSRF":        string(s.CSRF.CSRF()),
		})
	}

	http.Redirect(w, r,
		fmt.Sprintf("%s?token=%s", redirectURI,
			url.QueryEscape(usr.Token)), http.StatusFound)
}

func (s *config) OauthForm(w http.ResponseWriter, r *http.Request) {
	redirectURI := r.URL.Query().Get("redirect_uri")

	err := s.template.Execute(w, map[string]string{
		"RedirectURI": redirectURI,
		"CSRF":        string(s.CSRF.CSRF()),
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
