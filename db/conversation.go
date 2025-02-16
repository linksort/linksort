package db

import (
	"context"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/linksort/linksort/errors"
	"github.com/linksort/linksort/model"
)

type ConversationStore struct {
	client  *mongo.Client
	convCol *mongo.Collection
	messCol *mongo.Collection
	txn     *TxnClient
}

func NewConversationStore(client *mongo.Client) *ConversationStore {
	return &ConversationStore{
		convCol: client.Database("test").Collection("conversations"),
		messCol: client.Database("test").Collection("messages"),
		client:  client,
		txn:     NewTxnClient(client),
	}
}

func (s *ConversationStore) CreateConversation(ctx context.Context, conv *model.Conversation) (*model.Conversation, error) {
	op := errors.Op("ConversationStore.CreateConversation")

	res, err := s.convCol.InsertOne(ctx, conv)
	if err != nil {
		var e mongo.WriteException
		if errors.As(err, &e) {
			for _, we := range e.WriteErrors {
				if we.Code == 11000 {
					return nil, errors.E(
						op,
						errors.M{"url": "This conversation already exists."},
						errors.Str("duplicate conversation ID"),
						http.StatusBadRequest)
				}
			}
		}

		return nil, errors.E(op, err)
	}

	conv.Key = res.InsertedID.(primitive.ObjectID)
	conv.ID = conv.Key.Hex()

	return conv, nil
}

func (s *ConversationStore) GetConversationByID(ctx context.Context, id string, p *model.Pagination) (*model.Conversation, error) {
	op := errors.Opf("ConversationStore.GetConversationByID(id=%s)", id)

	docID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, errors.E(op, err, http.StatusNotFound)
	}

	conv := new(model.Conversation)
	if err := s.convCol.FindOne(ctx, bson.M{"_id": docID}).Decode(conv); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, errors.E(op, err, errors.Str("no documents"), http.StatusNotFound)
		}
		return nil, errors.E(op, err)
	}

	conv.ID = id
	conv.Key = docID

	cur, err := s.messCol.Find(ctx, bson.M{"conversationid": id}, options.Find().
		SetSort(bson.D{{Key: "sequencenumber", Value: 1}}).
		SetLimit(int64(p.Limit())).
		SetSkip(int64(p.Offset())))
	if err != nil {
		return nil, errors.E(op, err)
	}

	messages := make([]*model.Message, 0, cur.RemainingBatchLength())
	if err := cur.All(ctx, &messages); err != nil {
		return nil, errors.E(op, err)
	}
	for i := range messages {
		messages[i].ID = messages[i].Key.Hex()
	}
	conv.Messages = messages

	return conv, nil
}

func (s *ConversationStore) PutMessages(ctx context.Context, conv *model.Conversation, msgs []*model.Message) ([]*model.Message, error) {
	op := errors.Op("ConversationStore.PutMessages")

	if len(msgs) != 2 {
		return nil, errors.E(op, errors.Str("messages must be in pairs"))
	}

	err := s.txn.DoInTransaction(ctx, func(sessCtx context.Context) error {
		innerOp := errors.Opf("%s.innerTxn", op)

		freshConv := new(model.Conversation)
		if err := s.convCol.FindOne(sessCtx, bson.M{"_id": conv.Key}).Decode(freshConv); err != nil {
			return errors.E(innerOp, err)
		}

		freshConv.UpdatedAt = time.Now()
		freshConv.Length = freshConv.Length + 2

		documents := make([]interface{}, len(msgs))
		for i, msg := range msgs {
			msg.ConversationID = freshConv.ID
			msg.SequenceNumber = freshConv.Length - i
			msg.Key = primitive.NewObjectID()
			msg.ID = msg.Key.Hex()
			documents[i] = msg
		}

		_, err := s.messCol.InsertMany(sessCtx, documents)
		if err != nil {
			return errors.E(innerOp, err)
		}

		_, err = s.convCol.UpdateOne(sessCtx, bson.M{"_id": conv.Key}, bson.M{"$set": bson.M{
			"updatedat": freshConv.UpdatedAt,
			"length":    freshConv.Length,
		}})
		if err != nil {
			return errors.E(innerOp, err)
		}

		return nil
	})
	if err != nil {
		return nil, errors.E(op, err)
	}

	return msgs, nil
}

func (s *ConversationStore) GetConversationsByUser(ctx context.Context, usr *model.User, p *model.Pagination) ([]*model.Conversation, error) {
	op := errors.Op("ConversationStore.GetConversationsByUser")

	opts := options.Find()
	if p != nil {
		opts.SetLimit(int64(p.Limit()))
		opts.SetSkip(int64(p.Offset()))
	}
	// Sort by most recently created first
	opts.SetSort(bson.D{{Key: "createdat", Value: -1}})

	cursor, err := s.convCol.Find(ctx, bson.M{"userid": usr.ID}, opts)
	if err != nil {
		return nil, errors.E(op, err)
	}
	defer cursor.Close(ctx)

	convs := make([]*model.Conversation, 0, cursor.RemainingBatchLength())
	if err := cursor.All(ctx, &convs); err != nil {
		return nil, errors.E(op, err)
	}

	// Set the ID field for each conversation
	for _, conv := range convs {
		conv.ID = conv.Key.Hex()
	}

	return convs, nil
}
