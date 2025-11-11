package frontend

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/linksort/linksort/errors"
	"github.com/linksort/linksort/magic"
	"github.com/linksort/linksort/model"
)

type mockAuthController struct {
	tokenUser   *model.User
	tokenError  error
	cookieUser  *model.User
	cookieError error
}

func (m *mockAuthController) WithToken(ctx context.Context, token string) (*model.User, error) {
	return m.tokenUser, m.tokenError
}

func (m *mockAuthController) WithCookie(ctx context.Context, sessionID string) (*model.User, error) {
	return m.cookieUser, m.cookieError
}

func TestGetUserDataWithBearerToken(t *testing.T) {
	t.Run("valid bearer token returns user data with session ID", func(t *testing.T) {
		usr := &model.User{
			ID:        "test123",
			Email:     "test@example.com",
			FirstName: "Test",
			SessionID: "user_session",
			Token:     "valid_token",
		}

		c := &Config{
			Magic: magic.New("test-secret"),
			AuthController: &mockAuthController{
				tokenUser: usr,
			},
		}

		req := httptest.NewRequest("GET", "/", nil)
		req.Header.Set("Authorization", "Bearer valid_token")

		resp, found, err := c.getUserData(req)
		if err != nil {
			t.Fatalf("Unexpected error: %v", err)
		}

		if !found {
			t.Error("Expected user to be found")
		}

		if resp.sessionID != "user_session" {
			t.Errorf("Expected sessionID to be 'user_session', got %s", resp.sessionID)
		}

		if !strings.Contains(string(resp.userData), "test123") {
			t.Error("Expected user data to contain user ID")
		}
	})

	t.Run("invalid bearer token returns error", func(t *testing.T) {
		c := &Config{
			Magic: magic.New("test-secret"),
			AuthController: &mockAuthController{
				tokenUser:  nil,
				tokenError: http.ErrNotSupported, // Invalid token
			},
		}

		req := httptest.NewRequest("GET", "/", nil)
		req.Header.Set("Authorization", "Bearer invalid_token")

		_, _, err := c.getUserData(req)
		if err == nil {
			t.Fatal("Expected error for invalid bearer token")
		}

		// Verify it's a bad request error
		lserr := new(errors.Error)
		if !errors.As(err, &lserr) {
			t.Fatal("Expected error to be of type *errors.Error")
		}

		if lserr.Status() != http.StatusBadRequest {
			t.Errorf("Expected status 400, got %d", lserr.Status())
		}
	})

	t.Run("bearer token takes precedence over cookie", func(t *testing.T) {
		tokenUser := &model.User{
			ID:        "token_user",
			Email:     "token@example.com",
			SessionID: "token_session",
			Token:     "valid_token",
		}

		cookieUser := &model.User{
			ID:        "cookie_user",
			Email:     "cookie@example.com",
			SessionID: "cookie_session",
		}

		c := &Config{
			Magic: magic.New("test-secret"),
			AuthController: &mockAuthController{
				tokenUser:  tokenUser,
				cookieUser: cookieUser,
			},
		}

		req := httptest.NewRequest("GET", "/", nil)
		req.Header.Set("Authorization", "Bearer valid_token")
		req.AddCookie(&http.Cookie{
			Name:  "session_id",
			Value: "cookie_session",
		})

		resp, found, err := c.getUserData(req)
		if err != nil {
			t.Fatalf("Unexpected error: %v", err)
		}

		if !found {
			t.Error("Expected user to be found")
		}

		if !strings.Contains(string(resp.userData), "token_user") {
			t.Error("Expected user data to contain token user ID, not cookie user ID")
		}
	})

	t.Run("no bearer token and no cookie returns empty data", func(t *testing.T) {
		c := &Config{
			Magic:          magic.New("test-secret"),
			AuthController: &mockAuthController{},
		}

		req := httptest.NewRequest("GET", "/", nil)

		resp, found, err := c.getUserData(req)
		if err != nil {
			t.Fatalf("Unexpected error: %v", err)
		}

		if found {
			t.Error("Expected user not to be found")
		}

		if string(resp.userData) != "{}" {
			t.Errorf("Expected empty user data, got %s", string(resp.userData))
		}

		if resp.sessionID != "" {
			t.Error("Expected sessionID to be empty")
		}
	})
}
