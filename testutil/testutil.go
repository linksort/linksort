package testutil

import (
	"context"
	"log"
	"net/http"
	"sync"
	"testing"

	"github.com/icrowley/fake"

	"github.com/linksort/linksort/controller"
	"github.com/linksort/linksort/db"
	"github.com/linksort/linksort/errors"
	"github.com/linksort/linksort/handler"
	"github.com/linksort/linksort/handler/user"
	"github.com/linksort/linksort/model"
)

// nolint
var (
	_once      sync.Once
	_closer    func() error
	_h         http.Handler
	_userStore model.UserStore
)

func Handler() http.Handler {
	_once.Do(func() {
		op := errors.Op("testutil.Handler")
		ctx := context.Background()

		mongo, closer, err := db.NewMongoClient(ctx, "localhost")
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
		_h = handler.New(&handler.Config{UserStore: _userStore})
	})

	return _h
}

func CleanUp() {
	if err := _closer(); err != nil {
		log.Print(errors.E(errors.Op("testutil.CleanUp"), err))
	}
}

func NewUser(t *testing.T, ctx context.Context) *model.User {
	t.Helper()

	c := controller.User{Store: _userStore}

	u, err := c.CreateUser(ctx, &user.CreateUserRequest{
		Email:     fake.EmailAddress(),
		FirstName: fake.FirstName(),
		LastName:  fake.Language(),
		Password:  fake.Password(8, 20, true, true, true),
	})
	if err != nil {
		t.Error(err)
	}

	return u
}
