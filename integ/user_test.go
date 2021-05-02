package integ_test

import (
	"context"
	"net/http"
	"testing"

	"github.com/linksort/linksort/testutil"

	"github.com/steinfletcher/apitest"
	jsonpath "github.com/steinfletcher/apitest-jsonpath"
)

func TestCreateUser(t *testing.T) {
	existingUser := testutil.NewUser(t, context.Background())

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
