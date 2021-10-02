package db

import (
	"context"

	"github.com/linksort/linksort/errors"
	"go.mongodb.org/mongo-driver/mongo"
)

type Transactor interface {
	DoInTransaction(context.Context, func(context.Context) error) error
}

type TxnClient struct {
	client *mongo.Client
}

func NewTxnClient(c *mongo.Client) *TxnClient {
	return &TxnClient{c}
}

func (t *TxnClient) DoInTransaction(
	ctx context.Context,
	callback func(context.Context) error,
) error {
	op := errors.Op("TxnClient.DoInTransaction")

	sess, err := t.client.StartSession()
	if err != nil {
		return errors.E(op, err)
	}
	defer sess.EndSession(ctx)

	_, err = sess.WithTransaction(ctx,
		func(sessCtx mongo.SessionContext) (interface{}, error) {
			innerOp := errors.Op("Txn.DoInTransaction.WithTransaction")

			err := callback(sessCtx)
			if err != nil {
				return nil, errors.E(innerOp, err)
			}

			return nil, nil
		})
	if err != nil {
		return errors.E(op, err)
	}

	return nil
}
