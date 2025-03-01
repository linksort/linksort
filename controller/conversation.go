package controller

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/linksort/linksort/assistant"
	"github.com/linksort/linksort/errors"
	handler "github.com/linksort/linksort/handler/conversation"
	"github.com/linksort/linksort/log"
	"github.com/linksort/linksort/model"
)

type Conversation struct {
	UserStore         model.UserStore
	ConversationStore model.ConversationStore
	AssistantClient   *assistant.Client
}

func (c *Conversation) CreateConversation(
	ctx context.Context,
	usr *model.User,
	req *handler.CreateConversationRequest,
) (*model.Conversation, error) {
	op := errors.Op("controller.CreateConversation")

	// Create a new conversation with the user's ID
	conv := &model.Conversation{
		UserID:    usr.ID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Messages:  []*model.Message{},
		Length:    0,
	}

	// Save the conversation to the store
	conv, err := c.ConversationStore.CreateConversation(ctx, conv)
	if err != nil {
		return nil, errors.E(op, err)
	}

	return conv, nil
}

func (c *Conversation) GetConversation(
	ctx context.Context,
	usr *model.User,
	id string,
	p *model.Pagination,
) (*model.Conversation, error) {
	op := errors.Opf("controller.GetConversation(%q)", id)

	// Get the conversation from the store
	conv, err := c.ConversationStore.GetConversationByID(ctx, id, p)
	if err != nil {
		return nil, errors.E(op, err)
	}

	// Verify that the conversation belongs to the requesting user
	if conv.UserID != usr.ID {
		return nil, errors.E(op,
			errors.Str("no permission"),
			http.StatusNotFound,
		)
	}

	return conv, nil
}

func (c *Conversation) GetConversations(
	ctx context.Context,
	usr *model.User,
	pagination *model.Pagination,
) ([]*model.Conversation, error) {
	op := errors.Op("controller.GetConversations")

	// Get all conversations for the user with pagination
	convs, err := c.ConversationStore.GetConversationsByUser(ctx, usr, pagination)
	if err != nil {
		return nil, errors.E(op, err)
	}

	return convs, nil
}

func (c *Conversation) Converse(
	ctx context.Context,
	usr *model.User,
	req *handler.ConverseRequest,
) (<-chan *model.ConverseEvent, error) {
	op := errors.Op("controller.Converse")

	// Get the conversation to ensure it exists and belongs to user
	conversation, err := c.GetConversation(ctx, usr, req.ID, &model.Pagination{})
	if err != nil {
		return nil, errors.E(op, err)
	}

	// Create user message
	userMessage := &model.Message{
		ConversationID: req.ID,
		Role:           "user",
		Text:           req.Message,
		CreatedAt:      time.Now(),
	}

	// Create placeholder for assistant message, will be updated after generation
	assistantMessage := &model.Message{
		ConversationID: req.ID,
		Role:           "assistant",
		Text:           "", // Will be built incrementally as assistant produces content
		CreatedAt:      time.Now(),
	}

	// Create a new assistant
	asst := c.AssistantClient.NewAssistant(usr)

	// Create output channel
	outC := make(chan *model.ConverseEvent)

	var assistantText strings.Builder

	// Process assistant output in a goroutine
	go func() {
		defer close(outC)

		// Start the assistant
		err := asst.Act(ctx)
		if err != nil {
			log.AlarmWithContext(ctx, errors.Strf("error calling assistant.Act: %v", err))
		}

		// After all events, update the assistant message with full text
		assistantMessage.Text = assistantText.String()

		if len(assistantMessage.Text) == 0 {
			assistantMessage.Text = "It seems that, due to a technical issue, I failed to complete my task. I am very sorry."
		}

		// Save both messages
		updateMessages := []*model.Message{
			userMessage,
			assistantMessage,
		}

		_, err = c.ConversationStore.PutMessages(ctx, conversation, updateMessages)
		if err != nil {
			log.AlarmWithContext(ctx, errors.Strf("failed to update assistant message: %v", err))
		}
	}()

	// Stream events to the client in a separate goroutine
	go func() {
		for event := range asst.Stream() {
			// Build the assistant's response text incrementally
			assistantText.WriteString(event)

			// Send the event to the client
			outC <- &model.ConverseEvent{
				TextDelta: event,
			}
		}
	}()

	return outC, nil
}
