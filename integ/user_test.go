package integ_test

import (
	"context"
	"net/http"
	"net/url"
	"testing"
	"time"

	"github.com/linksort/linksort/testutil"

	"github.com/steinfletcher/apitest"
	jsonpath "github.com/steinfletcher/apitest-jsonpath"
)

func TestCreateUser(t *testing.T) {
	existingUser, _ := testutil.NewUser(t, context.Background())

	tests := []struct {
		Name         string
		GivenBody    map[string]interface{}
		ExpectStatus int
		ExpectBody   string
	}{
		{
			Name: "success",
			GivenBody: map[string]interface{}{
				"email":     "ruth.marcus@yale.edu",
				"firstName": "Ruth",
				"lastName":  "Marcus",
				"password":  "the comma is a giveaway",
			},
			ExpectStatus: http.StatusCreated,
			ExpectBody:   "",
		},
		{
			Name: "missing name and password",
			GivenBody: map[string]interface{}{
				"email":    "rudolf.carnap@charles.cz",
				"lastName": "Carnap",
				"password": "",
			},
			ExpectStatus: http.StatusBadRequest,
			ExpectBody:   `{"firstName":"This field is required.","password":"This field is required."}`,
		},
		{
			Name: "missing name and password",
			GivenBody: map[string]interface{}{
				"email":    "rudolf.carnap@charles.cz",
				"lastName": "Carnap",
				"password": "auf",
			},
			ExpectStatus: http.StatusBadRequest,
			ExpectBody:   `{"firstName":"This field is required.","password":"This field must be at least 6 characters long."}`,
		},
		{
			Name: "type mismatch",
			GivenBody: map[string]interface{}{
				"email":     "kit.fine@nyu.edu",
				"firstName": true,
				"password":  "Reality is constituted by tensed facts",
			},
			ExpectStatus: http.StatusBadRequest,
			ExpectBody:   `{"message":"The request was invalid"}`,
		},
		{
			Name: "already registered",
			GivenBody: map[string]interface{}{
				"email":     existingUser.Email,
				"firstName": "Ruth",
				"lastName":  "Millikan",
				"password":  "Language and thought are biological categories",
			},
			ExpectStatus: http.StatusBadRequest,
			ExpectBody:   `{"email":"This email has already been registered."}`,
		},
		{
			Name: "invalid email",
			GivenBody: map[string]interface{}{
				"email":     "it's all in my mind",
				"firstName": "George",
				"lastName":  "Berkeley",
				"password":  "Ordinary objects are ideas",
			},
			ExpectStatus: http.StatusBadRequest,
			ExpectBody:   `{"email":"This isn't a valid email."}`,
		},
	}

	for _, tcase := range tests {
		t.Run(tcase.Name, func(t *testing.T) {
			tt := apitest.New(tcase.Name).
				Handler(testutil.Handler()).
				Post("/api/users").
				Header("X-Csrf-Token", testutil.CSRF()).
				JSON(tcase.GivenBody).
				Expect(t).
				Status(tcase.ExpectStatus)

			if tcase.ExpectStatus < http.StatusBadRequest {
				tt.CookiePresent("session_id")
				tt.Assert(jsonpath.Equal("$.user.email", tcase.GivenBody["email"].(string)))
				tt.Assert(jsonpath.Equal("$.user.firstName", tcase.GivenBody["firstName"].(string)))
				tt.Assert(jsonpath.Equal("$.user.lastName", tcase.GivenBody["lastName"].(string)))
			} else {
				tt.CookieNotPresent("session_id")
				tt.Body(tcase.ExpectBody)
			}

			tt.End()
		})
	}
}

func TestGetUser(t *testing.T) {
	ctx := context.Background()

	// success user
	usr1, _ := testutil.NewUser(t, ctx)

	// expired session user
	usr2, _ := testutil.NewUser(t, ctx)
	usr2.SessionExpiry = time.Now().Add(-time.Hour)
	usr2 = testutil.UpdateUser(t, ctx, usr2)

	tests := []struct {
		Name           string
		GivenSessionID string
		ExpectStatus   int
		ExpectBody     string
	}{
		{
			Name:           "success",
			GivenSessionID: usr1.SessionID,
			ExpectStatus:   http.StatusOK,
		},
		{
			Name:           "missing session cookie",
			GivenSessionID: "",
			ExpectStatus:   http.StatusUnauthorized,
			ExpectBody:     `{"message":"Unauthorized"}`,
		},
		{
			Name:           "invalid session cookie",
			GivenSessionID: "abcdefghijklmnopqustuvxxyz",
			ExpectStatus:   http.StatusUnauthorized,
			ExpectBody:     `{"message":"Unauthorized"}`,
		},
		{
			Name:           "expired session cookie",
			GivenSessionID: usr2.SessionID,
			ExpectStatus:   http.StatusUnauthorized,
			ExpectBody:     `{"message":"Unauthorized"}`,
		},
	}

	for _, tcase := range tests {
		t.Run(tcase.Name, func(t *testing.T) {
			ts := apitest.New(tcase.Name).
				Handler(testutil.Handler()).
				Get("/api/users")

			if tcase.GivenSessionID != "" {
				ts.Cookie("session_id", tcase.GivenSessionID)
			}

			tt := ts.Expect(t).Status(tcase.ExpectStatus)

			if tcase.ExpectStatus < http.StatusBadRequest {
				tt.Assert(jsonpath.Equal("$.user.id", usr1.ID))
				tt.Assert(jsonpath.Equal("$.user.email", usr1.Email))
				tt.Assert(jsonpath.Equal("$.user.firstName", usr1.FirstName))
				tt.Assert(jsonpath.Equal("$.user.lastName", usr1.LastName))
			} else {
				tt.Body(tcase.ExpectBody)
			}

			tt.End()
		})
	}
}

func TestUpdateUser(t *testing.T) {
	ctx := context.Background()
	usr1, _ := testutil.NewUser(t, ctx)
	usr2, _ := testutil.NewUser(t, ctx)

	tests := []struct {
		Name           string
		GivenSessionID string
		GivenBody      map[string]string
		ExpectStatus   int
		ExpectBody     string
	}{
		{
			Name:           "success",
			GivenSessionID: usr1.SessionID,
			GivenBody:      map[string]string{"firstName": "Derek", "lastName": "Parfit", "email": usr1.Email},
			ExpectStatus:   http.StatusOK,
		},
		{
			Name:           "duplicate email",
			GivenSessionID: usr1.SessionID,
			GivenBody:      map[string]string{"firstName": "Derek", "lastName": "Parfit", "email": usr2.Email},
			ExpectBody:     `{"email":"This email has already been registered."}`,
			ExpectStatus:   http.StatusBadRequest,
		},
	}

	for _, tcase := range tests {
		t.Run(tcase.Name, func(t *testing.T) {
			tt := apitest.New(tcase.Name).
				Handler(testutil.Handler()).
				Patch("/api/users").
				Header("X-Csrf-Token", testutil.UserCSRF(tcase.GivenSessionID)).
				JSON(tcase.GivenBody).
				Cookie("session_id", tcase.GivenSessionID).
				Expect(t).Status(tcase.ExpectStatus)

			if tcase.ExpectStatus < http.StatusBadRequest {
				tt.Assert(jsonpath.Equal("$.user.id", usr1.ID))
				tt.Assert(jsonpath.Equal("$.user.email", usr1.Email))
				tt.Assert(jsonpath.Equal("$.user.firstName", "Derek"))
				tt.Assert(jsonpath.Equal("$.user.lastName", "Parfit"))
			} else {
				tt.Body(tcase.ExpectBody)
			}

			tt.End()
		})
	}
}

func TestDeleteUser(t *testing.T) {
	ctx := context.Background()
	usr1, _ := testutil.NewUser(t, ctx)

	tests := []struct {
		Name           string
		GivenSessionID string
		GivenBody      map[string]string
		ExpectStatus   int
		ExpectBody     string
	}{
		{
			Name:           "success",
			GivenSessionID: usr1.SessionID,
			ExpectStatus:   http.StatusNoContent,
		},
		{
			Name:           "user no longer exists",
			GivenSessionID: usr1.SessionID,
			ExpectStatus:   http.StatusUnauthorized,
			ExpectBody:     `{"message":"Unauthorized"}`,
		},
	}

	for _, tcase := range tests {
		t.Run(tcase.Name, func(t *testing.T) {
			tt := apitest.New(tcase.Name).
				Handler(testutil.Handler()).
				Delete("/api/users").
				Header("X-Csrf-Token", testutil.UserCSRF(tcase.GivenSessionID)).
				Cookie("session_id", tcase.GivenSessionID).
				Expect(t).Status(tcase.ExpectStatus)

			if tcase.ExpectStatus > http.StatusBadRequest {
				tt.Body(tcase.ExpectBody)
			}

			tt.End()
		})
	}
}

func TestForgotPassword(t *testing.T) {
	ctx := context.Background()
	usr1, _ := testutil.NewUser(t, ctx)

	tests := []struct {
		Name         string
		GivenBody    map[string]string
		ExpectStatus int
		ExpectBody   string
	}{
		{
			Name:         "success",
			GivenBody:    map[string]string{"email": usr1.Email},
			ExpectStatus: http.StatusNoContent,
		},
		{
			Name:         "bad payload",
			GivenBody:    map[string]string{"bla": usr1.Email},
			ExpectStatus: http.StatusBadRequest,
			ExpectBody:   `{"email":"This field is required."}`,
		},
	}

	for _, tcase := range tests {
		t.Run(tcase.Name, func(t *testing.T) {
			tt := apitest.New(tcase.Name).
				Handler(testutil.Handler()).
				Post("/api/users/forgot-password").
				Header("X-Csrf-Token", testutil.CSRF()).
				JSON(tcase.GivenBody).
				Expect(t).
				Status(tcase.ExpectStatus)

			if tcase.ExpectStatus > http.StatusBadRequest {
				tt.Body(tcase.ExpectBody)
			}

			tt.End()
		})
	}
}

func TestChangePassword(t *testing.T) {
	ctx := context.Background()
	usr1, _ := testutil.NewUser(t, ctx)
	link := testutil.Magic(t).Link("forgot-password", usr1.Email, usr1.PasswordDigest)

	mlink, err := url.Parse(link)
	if err != nil {
		t.Error(err)
	}

	tests := []struct {
		Name         string
		GivenBody    map[string]string
		ExpectStatus int
		ExpectBody   string
	}{
		{
			Name: "bad signature",
			GivenBody: map[string]string{
				"signature": "abcdefghijklmnopqustuvxxyz",
				"timestamp": mlink.Query().Get("t"),
				"email":     mlink.Query().Get("u"),
				"password":  "newpassword",
			},
			ExpectStatus: http.StatusUnauthorized,
			ExpectBody:   `{"message":"Unauthorized"}`,
		},
		{
			Name: "success",
			GivenBody: map[string]string{
				"signature": mlink.Query().Get("s"),
				"timestamp": mlink.Query().Get("t"),
				"email":     mlink.Query().Get("u"),
				"password":  "newpassword",
			},
			ExpectStatus: http.StatusOK,
		},
		{
			Name: "used payload",
			GivenBody: map[string]string{
				"signature": mlink.Query().Get("s"),
				"timestamp": mlink.Query().Get("t"),
				"email":     mlink.Query().Get("u"),
				"password":  "newpassword",
			},
			ExpectStatus: http.StatusUnauthorized,
			ExpectBody:   `{"message":"Unauthorized"}`,
		},
	}

	for _, tcase := range tests {
		t.Run(tcase.Name, func(t *testing.T) {
			tt := apitest.New(tcase.Name).
				Handler(testutil.Handler()).
				Post("/api/users/change-password").
				Header("X-Csrf-Token", testutil.CSRF()).
				JSON(tcase.GivenBody).
				Expect(t).
				Status(tcase.ExpectStatus)

			if tcase.ExpectStatus > http.StatusBadRequest {
				tt.Body(tcase.ExpectBody)
			}

			tt.End()
		})
	}
}

func TestDownloadUserData(t *testing.T) {
	ctx := context.Background()
	usr1, _ := testutil.NewUser(t, ctx)
	for i := 0; i < 10; i++ {
		testutil.NewLink(t, ctx, usr1)
	}

	tests := []struct {
		Name         string
		GivenSession string
		ExpectStatus int
	}{
		{
			Name:         "success",
			GivenSession: usr1.SessionID,
			ExpectStatus: http.StatusOK,
		},
	}

	for _, tcase := range tests {
		t.Run(tcase.Name, func(t *testing.T) {
			apitest.New(tcase.Name).
				Handler(testutil.Handler()).
				Get("/api/users/download").
				Cookie("session_id", tcase.GivenSession).
				Expect(t).
				Status(tcase.ExpectStatus).
				End()
		})
	}
}
