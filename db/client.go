package db

import (
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/linksort/linksort/errors"
)

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

	_, err = client.Database("test").
		Collection("links").
		Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys: bson.D{
				primitive.E{Key: "userid", Value: 1},
				primitive.E{Key: "url", Value: 1},
			},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{
				primitive.E{Key: "corpus", Value: "text"},
				primitive.E{Key: "title", Value: "text"},
				primitive.E{Key: "description", Value: "text"},
				primitive.E{Key: "site", Value: "text"},
			},
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

	_, err = client.Database("test").
		Collection("conversations").
		Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys: bson.D{
				primitive.E{Key: "userid", Value: 1},
			},
		},
	})

	return errors.Wrap(op, err)
}
