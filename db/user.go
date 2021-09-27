package db

import (
	"context"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"github.com/linksort/linksort/errors"
	"github.com/linksort/linksort/model"
)

type UserStore struct {
	col    *mongo.Collection
	client *mongo.Client
}

func NewUserStore(c *mongo.Client) *UserStore {
	return &UserStore{col: c.Database("test").Collection("users"), client: c}
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

	usr.Key = res.InsertedID.(primitive.ObjectID)
	usr.ID = usr.Key.Hex()

	handleNullValues(usr)

	return usr, nil
}

func (s *UserStore) GetUserBySessionID(ctx context.Context, sessionID string) (*model.User, error) {
	op := errors.Op("UserStore.GetUserBySessionID()")

	usr := new(model.User)

	err := s.col.FindOne(ctx, bson.M{"sessionId": sessionID}).Decode(usr)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, errors.E(op, err, errors.Str("no documents"), http.StatusNotFound)
		}

		return nil, errors.E(op, err)
	}

	usr.ID = usr.Key.Hex()

	handleNullValues(usr)

	return usr, nil
}

func (s *UserStore) GetUserByEmail(ctx context.Context, email string) (*model.User, error) {
	op := errors.Op("UserStore.GetUserByEmail()")

	usr := new(model.User)

	err := s.col.FindOne(ctx, bson.M{"email": email}).Decode(usr)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, errors.E(op, err, errors.Str("no documents"), http.StatusNotFound)
		}

		return nil, errors.E(op, err)
	}

	usr.ID = usr.Key.Hex()

	handleNullValues(usr)

	return usr, nil
}

func (s *UserStore) UpdateUser(ctx context.Context, u *model.User) (*model.User, error) {
	op := errors.Opf("UserStore.UpdateUser(%q)", u.ID)

	u.UpdatedAt = time.Now()

	res, err := s.col.ReplaceOne(ctx, bson.M{"_id": u.Key}, u)
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

	if res.MatchedCount < 1 {
		return nil, errors.E(op, errors.Str("no document match"))
	}

	handleNullValues(u)

	return u, nil
}

func (s *UserStore) DeleteUser(ctx context.Context, u *model.User) error {
	op := errors.Opf("UserStore.DeleteUser(%q)", u.ID)

	res, err := s.col.DeleteOne(ctx, bson.M{"_id": u.Key})
	if err != nil {
		return errors.E(op, err)
	}

	if res.DeletedCount != 1 {
		return errors.E(op, errors.Str("nothing deleted"))
	}

	return nil
}

func handleNullValues(usr *model.User) {
	if usr.FolderTree == nil {
		usr.FolderTree = &model.Folder{
			Name:     "root",
			ID:       "root",
			Children: make([]*model.Folder, 0),
		}
	}

	if usr.TagTree == nil {
		usr.TagTree = &model.TagNode{
			Name:     "root",
			Path:     "root",
			Count:    0,
			Children: make([]*model.TagNode, 0),
		}
	}
}
