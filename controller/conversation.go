package controller

import (
	"context"
	"net/http"
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
	ll := log.FromContext(ctx)

	_, err := c.GetConversation(ctx, usr, req.ID, &model.Pagination{})
	if err != nil {
		return nil, errors.E(op, err)
	}
	ll.Print("successfully retrieved conversation")

	asst := c.AssistantClient.NewAssistant(usr)
	outC := make(chan *model.ConverseEvent)
	ll.Print("calling Act")
	go func() {
		defer close(outC)
		err := asst.Act(ctx)
		if err != nil {
			ll.Printf("got error calling assistant.Act: %v", err)
		}
	}()
	ll.Print("creating goroutine")
	go func() {
		for event := range asst.Stream() {
			ll.Printf("got string event: %q", event)
			outC <- &model.ConverseEvent{
				TextDelta: event,
			}
		}
	}()

	return outC, nil
}
