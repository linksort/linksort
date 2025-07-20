package model

import (
	"context"
	"encoding/json"
	"strings"
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
	Text           *[]string          `json:"-"` // Will be handled by custom MarshalJSON
	IsToolUse      bool               `json:"isToolUse"`
	ToolUse        *[]agent.ToolUse   `json:"toolUse,omitempty"`
	PageContext    map[string]any     `json:"pageContext,omitempty" bson:"pageContext,omitempty"`
}

// MarshalJSON provides custom JSON marshaling for Message to maintain frontend compatibility
func (m *Message) MarshalJSON() ([]byte, error) {
	// Create a copy of the message with all fields except Text
	type MessageAlias Message
	alias := (*MessageAlias)(m)
	
	// Create an anonymous struct with the same fields plus a computed text field
	return json.Marshal(&struct {
		*MessageAlias
		Text *string `json:"text,omitempty"`
	}{
		MessageAlias: alias,
		Text:         m.GetTextAsString(),
	})
}

// GetTextAsString converts the text array to a single string for frontend compatibility
func (m *Message) GetTextAsString() *string {
	if m.Text == nil || len(*m.Text) == 0 {
		return nil
	}
	
	// Join all text entries with newlines
	result := strings.Join(*m.Text, "\n")
	return &result
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
		// PageContext will be set separately when called from assistant.go
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

	// For user messages, render page context as additional text entries
	text := msg.Text
	if msg.PageContext != nil && msg.Role == "user" && msg.Text != nil {
		// Create a new text array with original text plus page context
		textEntries := make([]string, len(*msg.Text))
		copy(textEntries, *msg.Text)
		
		// Add page context as additional text entry
		contextText := "Current page context:"
		if route, ok := msg.PageContext["route"].(string); ok && route != "" {
			contextText += "\n- Current page: " + route
			
			// Extract link ID from route if present
			if len(route) > 7 && route[:7] == "/links/" {
				linkID := route[7:]
				contextText += "\n- Current link ID: " + linkID
			}
		}
		
		if query, ok := msg.PageContext["query"].(map[string]string); ok && len(query) > 0 {
			contextText += "\n- Page filters/parameters:"
			for key, value := range query {
				if value != "" {
					contextText += "\n  - " + key + ": " + value
				}
			}
		}
		
		textEntries = append(textEntries, contextText)
		text = &textEntries
	}

	return agent.Message{
		Role:      role,
		Text:      text,
		IsToolUse: msg.IsToolUse,
		ToolUse:   msg.ToolUse,
	}
}
