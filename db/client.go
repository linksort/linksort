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
) (*mongo.Client, func() error, error) {
	op := errors.Op("db.NewMongoClient()")

	client, err := mongo.NewClient(options.Client().
		ApplyURI(uri))
	if err != nil {
		return nil, nil, errors.E(op, err)
	}

	if err := client.Connect(ctx); err != nil {
		return nil, nil, errors.E(op, err)
	}

	closer := func() error {
		if err = client.Disconnect(ctx); err != nil {
			return errors.E(op, err)
		}

		return nil
	}

	return client, closer, errors.Wrap(op, err)
}

func SetupIndexes(ctx context.Context, client *mongo.Client) error {
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
	})
	if err != nil {
		return errors.Wrap(errors.Op("db.setupIndexes()"), err)
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
	})

	return errors.Wrap(errors.Op("db.setupIndexes()"), err)
}
