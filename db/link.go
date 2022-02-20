package db

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/linksort/linksort/errors"
	"github.com/linksort/linksort/model"
)

type LinkStore struct {
	client *mongo.Client
	col    *mongo.Collection
}

func NewLinkStore(client *mongo.Client) *LinkStore {
	return &LinkStore{col: client.Database("test").Collection("links"), client: client}
}

func (s *LinkStore) GetLinkByID(ctx context.Context, id string) (*model.Link, error) {
	op := errors.Opf("LinkStore.GetLinkByID(id=%s)", id)

	docID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, errors.E(op, err, http.StatusNotFound)
	}

	n := new(model.Link)

	err = s.col.FindOne(ctx, bson.M{"_id": docID}).Decode(n)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, errors.E(op, err, errors.Str("no documents"), http.StatusNotFound)
		}

		return nil, errors.E(op, err)
	}

	n.ID = id
	n.Key = docID

	return n, nil
}

func (s *LinkStore) GetLinksByUser(
	ctx context.Context,
	u *model.User,
	p *model.Pagination,
	opts ...model.GetLinksOption,
) ([]*model.Link, error) {
	op := errors.Opf("LinkStore.GetLinksByUser(u=%s)", u.Email)

	m := map[string]interface{}{"userid": u.ID}

	for _, f := range opts {
		f(m)
	}

	projection := bson.D{
		primitive.E{Key: "_id", Value: 1},
		primitive.E{Key: "id", Value: 1},
		primitive.E{Key: "userid", Value: 1},
		primitive.E{Key: "createdat", Value: 1},
		primitive.E{Key: "updatedat", Value: 1},
		primitive.E{Key: "tagpaths", Value: 1},
		primitive.E{Key: "tagdetails", Value: 1},
		primitive.E{Key: "isfavorite", Value: 1},
		primitive.E{Key: "folderid", Value: 1},
		primitive.E{Key: "url", Value: 1},
		primitive.E{Key: "title", Value: 1},
		primitive.E{Key: "description", Value: 1},
		primitive.E{Key: "favicon", Value: 1},
		primitive.E{Key: "image", Value: 1},
		primitive.E{Key: "site", Value: 1},
	}

	var sort bson.M
	if _, ok := m["$text"]; ok {
		// if we're searching...
		sort = bson.M{"score": bson.M{"$meta": "textScore"}}
		projection = append(projection, primitive.E{
			Key: "score",
			Value: primitive.E{
				Key:   "$meta",
				Value: " textScore",
			},
		})
		delete(m, "sort")
	} else if val, ok := m["sort"]; ok {
		sort = bson.M{"createdat": val.(int64)}
		delete(m, "sort")
	} else {
		sort = bson.M{"createdat": -1}
	}

	cur, err := s.col.Find(ctx, bson.M(m), options.Find().
		SetLimit(int64(p.Limit())).
		SetSkip(int64(p.Offset())).
		SetProjection(projection).
		SetSort(sort))
	if err != nil {
		return nil, errors.E(op, err)
	}

	links := make([]*model.Link, cur.RemainingBatchLength())

	err = cur.All(ctx, &links)
	if err != nil {
		return nil, errors.E(op, err)
	}

	for i := range links {
		links[i].ID = links[i].Key.Hex()
	}

	return links, nil
}

func (s *LinkStore) CreateLink(ctx context.Context, l *model.Link) (*model.Link, error) {
	op := errors.Op("LinkStore.CreateLink")

	res, err := s.col.InsertOne(ctx, l)
	if err != nil {
		var e mongo.WriteException
		if errors.As(err, &e) {
			for _, we := range e.WriteErrors {
				if we.Code == 11000 {
					return nil, errors.E(
						op,
						errors.M{"url": "This link has already been saved."},
						errors.Str("duplicate link URL"),
						http.StatusBadRequest)
				}
			}
		}

		return nil, errors.E(op, err)
	}

	l.Key = res.InsertedID.(primitive.ObjectID)
	l.ID = l.Key.Hex()

	return l, nil
}

func (s *LinkStore) UpdateLink(ctx context.Context, l *model.Link) (*model.Link, error) {
	op := errors.Opf("LinkStore.UpdateLink(%q)", l.ID)

	l.UpdatedAt = time.Now()
	l.IsAnnotated = len(l.Annotation) > 0

	res, err := s.col.ReplaceOne(ctx, bson.M{"_id": l.Key}, l)
	if err != nil {
		return nil, errors.E(op, err)
	}

	if res.MatchedCount < 1 {
		return nil, errors.E(op, errors.Str("no document match"))
	}

	return l, nil
}

func (s *LinkStore) DeleteLink(ctx context.Context, l *model.Link) error {
	op := errors.Opf("LinkStore.DeleteLink(%q)", l.ID)

	res, err := s.col.DeleteOne(ctx, bson.M{"_id": l.Key})
	if err != nil {
		return errors.E(op, err)
	}

	if res.DeletedCount != 1 {
		return errors.E(op, errors.Str("nothing deleted"))
	}

	return nil
}

func (s *LinkStore) DeleteAllLinksByUser(ctx context.Context, u *model.User) error {
	op := errors.Opf("LinkStore.DeleteAllLinks(%q)", u.Email)

	_, err := s.col.DeleteMany(ctx, bson.M{"userid": u.ID})
	if err != nil {
		return errors.E(op, err)
	}

	return nil
}

func GetLinksSort(val string) model.GetLinksOption {
	return func(m map[string]interface{}) {
		if len(val) > 0 && (val == "1" || val == "-1") {
			intVal, _ := strconv.ParseInt(val, 10, 0)
			m["sort"] = intVal
		}
	}
}

func GetLinksSearch(val string) model.GetLinksOption {
	return func(m map[string]interface{}) {
		if len(val) > 0 {
			m["$text"] = bson.M{"$search": val}
		}
	}
}

func GetLinksFavorites(val string) model.GetLinksOption {
	return func(m map[string]interface{}) {
		if val == "1" {
			m["isfavorite"] = true
		}
	}
}

func GetLinksFolder(val string) model.GetLinksOption {
	return func(m map[string]interface{}) {
		if len(val) > 0 && val != "root" {
			m["folderid"] = val
		}
	}
}

func GetLinksTag(val string) model.GetLinksOption {
	return func(m map[string]interface{}) {
		if len(val) > 0 && val != "root" {
			m["tagpaths"] = val
		}
	}
}

func GetLinksAnnotated(val string) model.GetLinksOption {
	return func(m map[string]interface{}) {
		if val == "1" {
			m["isannotated"] = true
		}
	}
}
