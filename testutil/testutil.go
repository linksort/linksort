package testutil

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"testing"

	"github.com/icrowley/fake"

	"github.com/linksort/linksort/controller"
	"github.com/linksort/linksort/db"
	"github.com/linksort/linksort/email"
	"github.com/linksort/linksort/errors"
	"github.com/linksort/linksort/handler"
	"github.com/linksort/linksort/handler/link"
	"github.com/linksort/linksort/handler/user"
	"github.com/linksort/linksort/magic"
	"github.com/linksort/linksort/model"
)

// nolint
var (
	_once      sync.Once
	_closer    func() error
	_h         http.Handler
	_userStore model.UserStore
	_linkStore model.LinkStore
	_magic     = magic.New("test-secret")
	_email     = email.New()
)

func Handler() http.Handler {
	_once.Do(func() {
		op := errors.Op("testutil.Handler")
		ctx := context.Background()

		mongo, closer, err := db.NewMongoClient(ctx, getenv("DB_CONNECTION", "mongodb://localhost"))
		if err != nil {
			log.Fatal(err)
		}

		if err := mongo.Database("test").Drop(ctx); err != nil {
			log.Print(errors.E(op, err))
		}

		if err := db.SetupIndexes(ctx, mongo); err != nil {
			log.Print(errors.E(op, err))
		}

		_closer = closer
		_userStore = db.NewUserStore(mongo)
		_linkStore = db.NewLinkStore(mongo)
		_h = handler.New(&handler.Config{
			UserStore: _userStore,
			LinkStore: _linkStore,
			Magic:     _magic,
			Email:     _email,
		})
	})

	return _h
}

func CleanUp() {
	if err := _closer(); err != nil {
		log.Print(errors.E(errors.Op("testutil.CleanUp"), err))
	}
}

func NewUser(t *testing.T, ctx context.Context) (*model.User, string) {
	t.Helper()

	c := controller.User{Store: _userStore}
	pw := fake.Password(8, 20, true, true, true)

	u, err := c.CreateUser(ctx, &user.CreateUserRequest{
		Email:     strings.ToLower(fake.EmailAddress()),
		FirstName: fake.FirstName(),
		LastName:  fake.Language(),
		Password:  pw,
	})
	if err != nil {
		t.Error(err)
	}

	return u, pw
}

func NewLink(t *testing.T, ctx context.Context, u *model.User) *model.Link {
	t.Helper()

	c := controller.Link{Store: _linkStore}

	l, err := c.CreateLink(ctx, u, &link.CreateLinkRequest{
		URL:         fmt.Sprintf("https://%s", fake.DomainName()),
		Title:       fake.ProductName(),
		Favicon:     fmt.Sprintf("https://%s/favicon.ico", fake.DomainName()),
		Corpus:      fake.Paragraphs(),
		Description: fake.Paragraph(),
		Site:        fake.Company(),
	})
	if err != nil {
		t.Error(err)
	}

	return l
}

func UpdateUser(t *testing.T, ctx context.Context, u *model.User) *model.User {
	t.Helper()

	u, err := _userStore.UpdateUser(ctx, u)
	if err != nil {
		t.Error(err)
	}

	return u
}

func Magic(t *testing.T) *magic.Client {
	t.Helper()

	return _magic
}

func Email(t *testing.T) *email.Client {
	t.Helper()

	return _email
}

func getenv(name, fallback string) string {
	if val, ok := os.LookupEnv(name); ok {
		return val
	}

	return fallback
}

func CSRF() string {
	return string(_magic.CSRF())
}

func UserCSRF(sessionID string) string {
	return string(_magic.UserCSRF(sessionID))
}

func PrintResponse(t *testing.T) func(*http.Response, *http.Request) error {
	t.Helper()

	return func(res *http.Response, req *http.Request) error {
		op := errors.Op("testutil.PrintResponse")

		b, err := ioutil.ReadAll(res.Body)
		if err != nil {
			return errors.E(op, err)
		}

		err = res.Body.Close()
		if err != nil {
			return errors.E(op, err)
		}

		buf := new(bytes.Buffer)

		err = json.Indent(buf, b, "", "  ")
		if err != nil {
			return errors.E(op, err)
		}

		t.Log(buf.String())

		return nil
	}
}
