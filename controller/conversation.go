package controller

import (
	"context"
	"net/http"
	"time"

	"github.com/linksort/linksort/agent"
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
	conversation, err := c.GetConversation(ctx, usr, req.ID, &model.Pagination{Page: 0, Size: 32})
	if err != nil {
		return nil, errors.E(op, err)
	}

	messages := make([]*model.Message, 0)

	// Convert page context to map for assistant
	var pageContextMap map[string]any
	if req.PageContext != nil {
		pageContextMap = map[string]any{
			"route": req.PageContext.Route,
			"query": req.PageContext.Query,
		}
	}

	// Create user message
	textArray := []string{req.Message}
	newMessage := &model.Message{
		ConversationID: req.ID,
		Role:           "user",
		Text:           &textArray,
		CreatedAt:      time.Now(),
		IsToolUse:      false,
		PageContext:    pageContextMap,
	}

	// Append to list of messages
	messages = append(messages, newMessage)

	// Create a new assistant with page context
	asst := c.AssistantClient.NewAssistant(usr, conversation, newMessage, pageContextMap)

	// Create output channel
	outC := make(chan *model.ConverseEvent)

	// Process assistant output in a goroutine
	go func() {
		// Start the assistant
		err := asst.Act(ctx)
		if err != nil {
			log.AlarmWithContext(ctx, errors.Strf("error calling assistant.Act: %v", err))
		}
	}()

	// Stream events to the client in a separate goroutine
	go func() {
		defer close(outC)

		for eventObj := range asst.Stream() {
			switch event := eventObj.(type) {
			case string:
				// Send the text delta to the client
				outC <- &model.ConverseEvent{
					TextDelta: &event,
				}
			case agent.Message:
				msg := model.MapToModelMessage(event)
				msg.CreatedAt = time.Now()
				// Append to our list of messages
				messages = append(messages, msg)

				// If this message is a tool use, send a ToolUseDelta event
				if msg.IsToolUse && msg.ToolUse != nil && len(*msg.ToolUse) > 0 {
					// For each tool use in the message
					for _, toolUse := range *msg.ToolUse {
						// Create a tool use delta event
						toolUseDelta := &model.ToolUseDelta{
							ID:   toolUse.ID,
							Name: toolUse.Name,
							Type: string(toolUse.Type),
						}
						
						// If it's a response, include the status
						if toolUse.Type == agent.ToolUseTypeResponse && toolUse.Response != nil {
							status := string(toolUse.Response.Status)
							toolUseDelta.Status = &status
						}
						
						// Send the event
						outC <- &model.ConverseEvent{
							ToolUseDelta: toolUseDelta,
						}
					}
				}
			default:
				// Unknown event type, log it
				log.AlarmWithContext(ctx, errors.Strf("unknown event type from assistant stream: %T", event))
			}
		}

		_, err = c.ConversationStore.PutMessages(ctx, conversation, messages)
		if err != nil {
			log.AlarmWithContext(ctx, errors.Strf("failed to update assistant message: %v", err))
		}
	}()

	return outC, nil
}
