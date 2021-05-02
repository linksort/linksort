package db

import (
	"context"
	"net/http"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"github.com/linksort/linksort/errors"
	"github.com/linksort/linksort/model"
)

type UserStore struct {
	col *mongo.Collection
}

func NewUserStore(c *mongo.Client) *UserStore {
	return &UserStore{col: c.Database("test").Collection("users")}
}

func (s *UserStore) CreateUser(ctx context.Context, usr *model.User) (*model.User, error) {
	op := errors.Op("UserStore.CreateUser()")

	res, err := s.col.InsertOne(ctx, usr)
	if err != nil {
		var e mongo.WriteException
		if errors.As(err, &e) {
			for _, we := range e.WriteErrors {
				if we.Code == 11000 {
					return nil, errors.E(
						op,
						errors.M{"email": "This email has already been registered."},
						errors.Str("duplicate email"),
						http.StatusBadRequest)
				}
			}
		}

		return nil, errors.E(op, err)
	}

	usr.ID = res.InsertedID.(primitive.ObjectID).Hex()

	return usr, nil
}

func (s *UserStore) GetUserBySessionID(ctx context.Context, sessionID string) (*model.User, error) {
	op := errors.Op("UserStore.GetUserBySessionID()")

	usr := new(model.User)

	err := s.col.FindOne(ctx, bson.M{"sessionId": sessionID}).Decode(usr)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, errors.E(op, err, http.StatusNotFound)
		}

		return nil, errors.E(op, err)
	}

	usr.ID = usr.Key.Hex()

	return usr, nil
}

func (s *UserStore) GetUserByEmail(context.Context, string) (*model.User, error) {
	return nil, nil
}

func (s *UserStore) UpdateUser(context.Context, *model.User) (*model.User, error) {
	return nil, nil
}

func (s *UserStore) DeleteUser(context.Context, *model.User) error {
	return nil
}
