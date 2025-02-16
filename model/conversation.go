package model

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Conversation struct {
	Key       primitive.ObjectID `json:"-" bson:"_id,omitempty"`
	ID        string             `json:"id"`
	UserID    string             `json:"userId"`
	CreatedAt time.Time          `json:"createdAt"`
	UpdatedAt time.Time          `json:"updatedAt"`
	Messages  []*Message         `json:"messages" bson:"-"`
	Length    int                `json:"length"`
}

type Message struct {
	Key            primitive.ObjectID `json:"-" bson:"_id,omitempty"`
	ID             string             `json:"id"`
	ConversationID string             `json:"-"`
	SequenceNumber int                `json:"sequenceNumber"`
	CreatedAt      time.Time          `json:"createdAt"`
	Role           string             `json:"role" validate:"required,oneof=user assistant"`
	Text           string             `json:"text"`
}

type ConverseEvent struct {
	TextDelta string `json:"textDelta"`
}

type ConversationStore interface {
	CreateConversation(context.Context, *Conversation) (*Conversation, error)
	PutMessages(context.Context, *Conversation, []*Message) ([]*Message, error)
	GetConversationByID(context.Context, string, *Pagination) (*Conversation, error)
	GetConversationsByUser(context.Context, *User, *Pagination) ([]*Conversation, error)
}
