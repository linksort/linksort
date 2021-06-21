package integ

import (
	"context"
	"net/http"
	"testing"

	"github.com/linksort/linksort/testutil"
	"github.com/steinfletcher/apitest"
	jsonpath "github.com/steinfletcher/apitest-jsonpath"
)

func TestCreateSession(t *testing.T) {
	ctx := context.Background()
	usr, pw := testutil.NewUser(t, ctx)

	tests := []struct {
		Name         string
		GivenBody    map[string]string
		ExpectStatus int
		ExpectBody   string
	}{
		{
			Name:         "success",
			GivenBody:    map[string]string{"email": usr.Email, "password": pw},
			ExpectStatus: http.StatusCreated,
		},
		{
			Name:         "wrong password",
			GivenBody:    map[string]string{"email": usr.Email, "password": "1234567890"},
			ExpectStatus: http.StatusBadRequest,
			ExpectBody:   `{"message":"Invalid credentials given."}`,
		},
		{
			Name:         "wrong email",
			GivenBody:    map[string]string{"email": "martha_nussbaum@law.uchicago.edu", "password": "1234567890"},
			ExpectStatus: http.StatusBadRequest,
			ExpectBody:   `{"message":"Invalid credentials given."}`,
		},

		{
			Name:         "password too short",
			GivenBody:    map[string]string{"email": usr.Email, "password": "idk"},
			ExpectStatus: http.StatusBadRequest,
			ExpectBody:   `{"password":"This field must be at least 6 characters long."}`,
		},
		{
			Name:         "missing email",
			GivenBody:    map[string]string{"password": "1234567890"},
			ExpectStatus: http.StatusBadRequest,
			ExpectBody:   `{"email":"This field is required."}`,
		},
		{
			Name:         "missing password",
			GivenBody:    map[string]string{"email": usr.Email},
			ExpectStatus: http.StatusBadRequest,
			ExpectBody:   `{"password":"This field is required."}`,
		},
	}

	for _, tcase := range tests {
		t.Run(tcase.Name, func(t *testing.T) {
			tt := apitest.New(tcase.Name).
				Handler(testutil.Handler()).
				Post("/api/users/sessions").
				Header("X-Csrf-Token", testutil.CSRF()).
				JSON(tcase.GivenBody).
				Expect(t).Status(tcase.ExpectStatus)

			if tcase.ExpectStatus < http.StatusBadRequest {
				tt.CookiePresent("session_id")
				tt.Assert(jsonpath.Equal("$.user.id", usr.ID))
				tt.Assert(jsonpath.Equal("$.user.email", usr.Email))
				tt.Assert(jsonpath.Equal("$.user.firstName", usr.FirstName))
				tt.Assert(jsonpath.Equal("$.user.lastName", usr.LastName))
			} else {
				tt.CookieNotPresent("session_id")
				tt.Body(tcase.ExpectBody)
			}

			tt.End()
		})
	}
}

func TestDeleteSession(t *testing.T) {
	ctx := context.Background()
	usr, _ := testutil.NewUser(t, ctx)

	tests := []struct {
		Name           string
		GivenSessionID string
		ExpectStatus   int
		ExpectBody     string
	}{
		{
			Name:           "success",
			GivenSessionID: usr.SessionID,
			ExpectStatus:   http.StatusNoContent,
		},
		{
			Name:           "bad session",
			GivenSessionID: "abcdefghijklmnopqustuvxxyz",
			ExpectStatus:   http.StatusUnauthorized,
			ExpectBody:     `{"message":"Unauthorized"}`,
		},
	}

	for _, tcase := range tests {
		t.Run(tcase.Name, func(t *testing.T) {
			tt := apitest.New(tcase.Name).
				Handler(testutil.Handler()).
				Delete("/api/users/sessions").
				Header("X-Csrf-Token", testutil.CSRF()).
				Cookie("session_id", tcase.GivenSessionID).
				Expect(t).Status(tcase.ExpectStatus)

			if tcase.ExpectStatus < http.StatusBadRequest {
				tt.CookiePresent("session_id")
			} else {
				tt.CookiePresent("session_id")
				tt.Body(tcase.ExpectBody)
			}

			tt.End()
		})
	}
}
