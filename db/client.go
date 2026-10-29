package db

import (
	"context"
	"fmt"
	"reflect"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/linksort/linksort/errors"
	"github.com/linksort/linksort/log"
)

// LinkTextIndexName is the name of the single text index on the links
// collection. Naming it lets SetupIndexes find and replace it when the
// field/weight spec changes.
const LinkTextIndexName = "links_text"

// LinkTextIndexWeights is the field set and relative weights of the links
// text index. MongoDB allows one text index per collection, so every
// searchable field lives here. Fields the user wrote themselves (title,
// note, highlight notes) outrank the extracted article body so a word in a
// note surfaces its link before an incidental mention deep in a corpus.
// Changing this map causes SetupIndexes to drop and rebuild the index at
// startup. A separate effort is researching search quality; keep this
// minimal until then.
var LinkTextIndexWeights = map[string]int32{
	"title":            10,
	"annotation":       6,
	"highlights.note":  6,
	"highlights.exact": 4,
	"description":      3,
	"site":             3,
	"corpus":           1,
}

func NewMongoClient(
	ctx context.Context,
	uri string,
) (*mongo.Client, error) {
	op := errors.Op("db.NewMongoClient()")

	client, err := mongo.NewClient(options.Client().
		ApplyURI(uri))
	if err != nil {
		return nil, errors.E(op, err)
	}

	if err := client.Connect(ctx); err != nil {
		return nil, errors.E(op, err)
	}

	if err := SetupIndexes(ctx, client); err != nil {
		return nil, errors.E(op, err)
	}

	return client, nil
}

func SetupIndexes(ctx context.Context, client *mongo.Client) error {
	op := errors.Op("db.SetupIndexes()")

	_, err := client.Database("test").
		Collection("users").
		Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{primitive.E{Key: "email", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{primitive.E{Key: "sessionId", Value: 1}},
			Options: options.Index().
				SetUnique(true).
				SetSparse(true),
		},
		{
			Keys: bson.D{primitive.E{Key: "token", Value: 1}},
			Options: options.Index().
				SetUnique(true).
				SetSparse(true),
		},
	})
	if err != nil {
		return errors.Wrap(op, err)
	}

	links := client.Database("test").Collection("links")

	_, err = links.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys: bson.D{
				primitive.E{Key: "userid", Value: 1},
				primitive.E{Key: "url", Value: 1},
			},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{primitive.E{Key: "isfavorite", Value: 1}},
		},
		{
			Keys: bson.D{primitive.E{Key: "tagpaths", Value: 1}},
		},
		{
			Keys: bson.D{primitive.E{Key: "isannotated", Value: 1}},
		},
	})
	if err != nil {
		return errors.Wrap(op, err)
	}

	if err := setupLinkTextIndex(ctx, links); err != nil {
		return errors.Wrap(op, err)
	}

	_, err = client.Database("test").
		Collection("conversations").
		Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys: bson.D{
				primitive.E{Key: "userid", Value: 1},
			},
		},
	})

	_, err = client.Database("test").
		Collection("messages").
		Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys: bson.D{
				primitive.E{Key: "conversationid", Value: 1},
			},
		},
	})

	return errors.Wrap(op, err)
}

// setupLinkTextIndex makes the links text index match LinkTextIndexWeights.
// A collection can only have one text index and CreateIndexes fails when an
// existing text index has a different spec, so this lists the indexes, finds
// the text index (the one carrying textIndexVersion), and drops it first when
// its weights differ. It is idempotent: a second call with the same spec is a
// no-op.
func setupLinkTextIndex(ctx context.Context, col *mongo.Collection) error {
	op := errors.Op("db.setupLinkTextIndex()")

	existingName, existingWeights, err := findTextIndex(ctx, col)
	if err != nil {
		return errors.E(op, err)
	}

	if existingName != "" {
		if reflect.DeepEqual(existingWeights, LinkTextIndexWeights) {
			return nil
		}

		log.Printf("links text index %q has weights %v; rebuilding with %v",
			existingName, existingWeights, LinkTextIndexWeights)

		if _, err := col.Indexes().DropOne(ctx, existingName); err != nil {
			return errors.E(op, err)
		}
	} else {
		log.Printf("links text index missing; creating %q", LinkTextIndexName)
	}

	keys := bson.D{}
	weights := bson.D{}
	for field, weight := range LinkTextIndexWeights {
		keys = append(keys, primitive.E{Key: field, Value: "text"})
		weights = append(weights, primitive.E{Key: field, Value: weight})
	}

	_, err = col.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: keys,
		Options: options.Index().
			SetName(LinkTextIndexName).
			SetWeights(weights),
	})
	if err != nil {
		return errors.E(op, err)
	}

	log.Printf("links text index %q created", LinkTextIndexName)

	return nil
}

// findTextIndex returns the name and weights of the collection's text index,
// or an empty name when there is none.
func findTextIndex(ctx context.Context, col *mongo.Collection) (string, map[string]int32, error) {
	op := errors.Op("db.findTextIndex()")

	cur, err := col.Indexes().List(ctx)
	if err != nil {
		return "", nil, errors.E(op, err)
	}

	var specs []bson.M
	if err := cur.All(ctx, &specs); err != nil {
		return "", nil, errors.E(op, err)
	}

	for _, spec := range specs {
		if _, ok := spec["textIndexVersion"]; !ok {
			continue
		}

		name, _ := spec["name"].(string)

		weights, err := decodeWeights(spec["weights"])
		if err != nil {
			return "", nil, errors.E(op, err)
		}

		return name, weights, nil
	}

	return "", nil, nil
}

func decodeWeights(v interface{}) (map[string]int32, error) {
	out := make(map[string]int32)

	switch w := v.(type) {
	case bson.D:
		for _, e := range w {
			out[e.Key] = toInt32(e.Value)
		}
	case bson.M:
		for k, val := range w {
			out[k] = toInt32(val)
		}
	case nil:
		// no weights recorded
	default:
		return nil, fmt.Errorf("unexpected weights type %T", v)
	}

	return out, nil
}

func toInt32(v interface{}) int32 {
	switch n := v.(type) {
	case int32:
		return n
	case int64:
		return int32(n)
	case int:
		return int32(n)
	case float64:
		return int32(n)
	default:
		return 0
	}
}
