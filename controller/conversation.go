package controller

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/linksort/linksort/agent"
	"github.com/linksort/linksort/assistant"
	"github.com/linksort/linksort/db"
	"github.com/linksort/linksort/errors"
	handler "github.com/linksort/linksort/handler/conversation"
	"github.com/linksort/linksort/log"
	"github.com/linksort/linksort/model"
)

// Link review constants. A review is eligible when the user has at least
// ReviewMinNewLinks links created after their LastLinkReviewAt stamp and at
// least ReviewMinInterval has passed since the stamp (or it was never set).
// At most ReviewMaxLinks (newest first) are sent to the model.
const (
	ReviewMinNewLinks = 3
	ReviewMinInterval = 4 * time.Hour
	ReviewMaxLinks    = 40
)

type Conversation struct {
	UserStore         model.UserStore
	LinkStore         model.LinkStore
	ConversationStore model.ConversationStore
	Transactor        db.Transactor
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

	for i := range conv.Messages {
		if conv.Messages[i].IsToolUse {
			for j := range *conv.Messages[i].ToolUse {
				if (*conv.Messages[i].ToolUse)[j].Type == agent.ToolUseTypeResponse {
					if len((*conv.Messages[i].ToolUse)[j].Response.Text) > 1024 {
						(*conv.Messages[i].ToolUse)[j].Response.Text = "RESPONSE OMITTED FOR BREVITY"
					}
				}
			}
		}
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

// StartLinkReview checks whether the user is eligible for an automatic review
// of their recently saved links and, if so, creates a new "link_review"
// conversation and stamps the user's LastLinkReviewAt. It returns a nil
// conversation when the user is not eligible.
func (c *Conversation) StartLinkReview(
	ctx context.Context,
	usr *model.User,
) (*model.Conversation, int, error) {
	op := errors.Op("controller.StartLinkReview")

	var conv *model.Conversation
	var newLinkCount int

	err := c.Transactor.DoInTransaction(ctx, func(sessCtx context.Context) error {
		innerOp := errors.Opf("%s.innerTxn", op)

		// Re-fetch the user inside the transaction so concurrent requests
		// see a fresh LastLinkReviewAt stamp.
		user, err := c.UserStore.GetUserByEmail(sessCtx, usr.Email)
		if err != nil {
			return errors.E(innerOp, err)
		}

		if !user.LastLinkReviewAt.IsZero() &&
			time.Since(user.LastLinkReviewAt) < ReviewMinInterval {
			return nil // not eligible
		}

		links, err := c.LinkStore.GetLinksByUser(sessCtx, user,
			&model.Pagination{Page: 0, Size: ReviewMaxLinks},
			db.GetLinksCreatedAfter(user.LastLinkReviewAt))
		if err != nil {
			return errors.E(innerOp, err)
		}

		if len(links) < ReviewMinNewLinks {
			return nil // not eligible
		}

		newLinkCount = len(links)

		conv, err = c.ConversationStore.CreateConversation(sessCtx, &model.Conversation{
			UserID:      user.ID,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
			Messages:    []*model.Message{},
			Length:      0,
			Kind:        model.ConversationKindLinkReview,
			ReviewSince: user.LastLinkReviewAt,
		})
		if err != nil {
			return errors.E(innerOp, err)
		}

		user.LastLinkReviewAt = time.Now()
		if _, err := c.UserStore.UpdateUser(sessCtx, user); err != nil {
			return errors.E(innerOp, err)
		}

		return nil
	})
	if err != nil {
		return nil, 0, errors.E(op, err)
	}

	return conv, newLinkCount, nil
}

func (c *Conversation) Converse(
	ctx context.Context,
	usr *model.User,
	req *handler.ConverseRequest,
) (<-chan *model.ConverseEvent, error) {
	op := errors.Op("controller.Converse")

	// Get the conversation to ensure it exists and belongs to user
	conversation, err := c.GetConversation(ctx, usr, req.ID, &model.Pagination{Page: 0, Size: 16})
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

	var newMessage *model.Message

	if req.Trigger == model.ConversationKindLinkReview {
		// A link review trigger builds a synthetic user message instead of a
		// typed one. It is only valid on a fresh link_review conversation.
		if conversation.Kind != model.ConversationKindLinkReview {
			return nil, errors.E(op,
				errors.Str("trigger on non-review conversation"),
				errors.M{"trigger": "This conversation is not a link review conversation."},
				http.StatusBadRequest)
		}

		if conversation.Length > 0 {
			return nil, errors.E(op,
				errors.Str("trigger on conversation with messages"),
				errors.M{"trigger": "This conversation already has messages."},
				http.StatusBadRequest)
		}

		links, err := c.LinkStore.GetLinksByUser(ctx, usr,
			&model.Pagination{Page: 0, Size: ReviewMaxLinks},
			db.GetLinksCreatedAfter(conversation.ReviewSince))
		if err != nil {
			return nil, errors.E(op, err)
		}

		textArray := []string{buildLinkReviewPrompt(links, conversation.ReviewSince)}
		newMessage = &model.Message{
			ConversationID: req.ID,
			Role:           "user",
			Text:           &textArray,
			CreatedAt:      time.Now(),
			IsToolUse:      false,
			PageContext:    pageContextMap,
			Kind:           model.MessageKindLinkReviewTrigger,
		}
	} else {
		// Create user message
		textArray := []string{req.Message}
		newMessage = &model.Message{
			ConversationID: req.ID,
			Role:           "user",
			Text:           &textArray,
			CreatedAt:      time.Now(),
			IsToolUse:      false,
			PageContext:    pageContextMap,
		}
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

// reviewLink is the compact link representation embedded in the synthetic
// link review trigger message. Corpus is deliberately excluded; the assistant
// can call get_link for details.
type reviewLink struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	URL         string    `json:"url"`
	Site        string    `json:"site,omitempty"`
	Description string    `json:"description,omitempty"`
	TagPaths    []string  `json:"tagPaths,omitempty"`
	UserTags    []string  `json:"userTags,omitempty"`
	FolderID    string    `json:"folderId,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
}

func buildLinkReviewPrompt(links []*model.Link, since time.Time) string {
	reviewLinks := make([]reviewLink, 0, len(links))
	for _, l := range links {
		desc := l.Description
		if len(desc) > 280 {
			desc = desc[:280] + "…"
		}

		reviewLinks = append(reviewLinks, reviewLink{
			ID:          l.ID,
			Title:       l.Title,
			URL:         l.URL,
			Site:        l.Site,
			Description: desc,
			TagPaths:    l.TagPaths,
			UserTags:    l.UserTags,
			FolderID:    l.FolderID,
			CreatedAt:   l.CreatedAt,
		})
	}

	linksJSON, err := json.Marshal(reviewLinks)
	if err != nil {
		linksJSON = []byte("[]")
	}

	var window string
	if since.IsZero() {
		window = fmt.Sprintf("The user has never had a link review before. Below are their %d most recent links.", len(links))
	} else {
		window = fmt.Sprintf("Below are the %d links the user saved since %s.", len(links), since.Format(time.RFC1123))
	}

	capNote := ""
	if len(links) >= ReviewMaxLinks {
		capNote = fmt.Sprintf("\nNote: this list is capped at the %d most recent links; there may be more new links than shown.", ReviewMaxLinks)
	}

	return fmt.Sprintf(`This is an automated link review request. The user just returned to Linksort and has not typed anything. Start the conversation with a short, friendly "welcome back" review of their recently saved links.

%s%s

%s

Instructions:
1. Briefly summarize what was saved (counts and topics) in a few sentences.
2. Look for clusters of related links. If you find any, propose organizing them into folders with concrete folder names, listing which links would go into each. Prefer existing folders from the user's folder tree when one fits; only propose new folders otherwise.
3. Mention other noteworthy things only when they are clear: obvious duplicates, several articles on the same subject, or links that fit an existing folder but aren't in it.
4. Do NOT create folders or move links yet. End your message by asking for confirmation using a choices block.
5. Only reference the links listed above. Never invent links.`, window, capNote, string(linksJSON))
}
