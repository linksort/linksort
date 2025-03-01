package model

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/linksort/linksort/agent"
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
	ConversationID string             `json:"-" bson:"conversationid"`
	SequenceNumber int                `json:"sequenceNumber"`
	CreatedAt      time.Time          `json:"createdAt"`
	Role           string             `json:"role" validate:"required,oneof=user assistant"`
	Text           *string            `json:"text,omitempty"`
	IsToolUse      bool               `json:"isToolUse"`
	ToolUse        *[]agent.ToolUse   `json:"toolUse,omitempty"`
}

type ConverseEvent struct {
	TextDelta    *string       `json:"textDelta,omitempty"`
	ToolUseDelta *ToolUseDelta `json:"toolUseDelta,omitempty"`
}

type ToolUseDelta struct {
	ID     string  `json:"id"`
	Name   string  `json:"name"`
	Type   string  `json:"type"`
	Status *string `json:"status,omitempty"`
}

type ConversationStore interface {
	CreateConversation(context.Context, *Conversation) (*Conversation, error)
	PutMessages(context.Context, *Conversation, []*Message) ([]*Message, error)
	GetConversationByID(context.Context, string, *Pagination) (*Conversation, error)
	GetConversationsByUser(context.Context, *User, *Pagination) ([]*Conversation, error)
}

func MapToModelMessage(msg agent.Message) *Message {
	var role string
	switch msg.Role {
	case agent.RoleUser:
		role = "user"
	case agent.RoleAssistant:
		role = "assistant"
	}

	return &Message{
		Role:      role,
		Text:      msg.Text,
		IsToolUse: msg.IsToolUse,
		ToolUse:   msg.ToolUse,
	}
}

func MapToAgentMessage(msg *Message) agent.Message {
	var role agent.Role
	switch msg.Role {
	case "user":
		role = agent.RoleUser
	case "assistant":
		role = agent.RoleAssistant
	}

	return agent.Message{
		Role:      role,
		Text:      msg.Text,
		IsToolUse: msg.IsToolUse,
		ToolUse:   msg.ToolUse,
	}
}
