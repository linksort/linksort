package assistant

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"

	"github.com/linksort/linksort/agent"
	"github.com/linksort/linksort/handler/folder"
	"github.com/linksort/linksort/handler/link"
	"github.com/linksort/linksort/model"
)

var agenticSystemPrompt string = `## Identity
- Your task is to help users of Linksort, a web application, to organize and learn about their links.
- Provide helpful and insightful information about the contents of the user's links when you can.
- You have a number of tools at your disposal to help you complete your tasks.
- Remember to always be friendly and cordial.

## Current User

Below is some relevent information about the current user.

%s
`

type Assistant struct {
	agent *agent.Agent
}

type Client struct {
	LinkController interface {
		GetLinks(context.Context, *model.User, *link.GetLinksRequest) ([]*model.Link, error)
		GetLink(context.Context, *model.User, string) (*model.Link, error)
		UpdateLink(context.Context, *model.User, *link.UpdateLinkRequest) (*model.Link, *model.User, error)
	}
	FolderController interface {
		CreateFolder(context.Context, *model.User, *folder.CreateFolderRequest) (*model.User, error)
		UpdateFolder(context.Context, *model.User, *folder.UpdateFolderRequest) (*model.User, error)
		DeleteFolder(context.Context, *model.User, string) (*model.User, error)
	}
	BedrockClient interface {
		ConverseStream(
			ctx context.Context,
			params *bedrockruntime.ConverseStreamInput,
			optFns ...func(*bedrockruntime.Options),
		) (*bedrockruntime.ConverseStreamOutput, error)
	}
}

func (c *Client) NewAssistant(u *model.User, conv *model.Conversation, userMsg *model.Message) *Assistant {
	// Convert existing conversation messages to agent messages
	messages := []agent.Message{}

	// First add existing conversation messages if any
	for _, msg := range conv.Messages {
		messages = append(messages, model.MapToAgentMessage(msg))
	}

	// Then add the new user message
	messages = append(messages, model.MapToAgentMessage(userMsg))

	return &Assistant{agent.New(agent.Config{
		System: fmt.Sprintf(agenticSystemPrompt, userSummary(u)),
		Messages: messages,
		Tools: []agent.Tool{
			&GetLinksTool{
				User:           u,
				LinkController: c.LinkController,
			},
			&GetLinkTool{
				User:           u,
				LinkController: c.LinkController,
			},
			&CreateFolderTool{
				User:             u,
				FolderController: c.FolderController,
			},
			&DeleteFolderTool{
				User:             u,
				FolderController: c.FolderController,
			},
			&RenameFolderTool{
				User:             u,
				FolderController: c.FolderController,
			},
			&AddLinkToFolderTool{
				User:           u,
				LinkController: c.LinkController,
			},
			&RemoveLinkFromFolderTool{
				User:           u,
				LinkController: c.LinkController,
			},
		},
		Client: c.BedrockClient,
	})}
}

func (a *Assistant) Act(ctx context.Context) error {
	return a.agent.Act(ctx)
}

func (a *Assistant) Stream() chan any {
	return a.agent.Stream
}

type GetLinksTool struct {
	User           *model.User
	LinkController interface {
		GetLinks(context.Context, *model.User, *link.GetLinksRequest) ([]*model.Link, error)
	}
}

func (t *GetLinksTool) Spec() agent.Spec {
	return agent.Spec{
		Name:        "get_links",
		Description: "Use this tool to query the user's links. This will give you information about many links at a time, but it will not give you all details about each link. If you need more information, use the get_link tool.",
		InputSchema: map[string]any{
			"type": "object",
			"properties": map[string]any{},
		},
	}
}

func (t *GetLinksTool) Use(ctx context.Context, id, input string) agent.ToolUseResponse {
	// typedInput := make(map[string]string)
	// err := json.Unmarshal([]byte(input), &typedInput)
	// if err != nil {
	// 	return agent.ToolUseResponse{
	// 		Status: agent.ToolUseStatusError,
	// 		Text:   err.Error(),
	// 	}
	// }
	//
	req := &link.GetLinksRequest{
		Pagination: &model.Pagination{},
	}

	links, err := t.LinkController.GetLinks(ctx, t.User, req)
	if err != nil {
		return agent.ToolUseResponse{
			Status: agent.ToolUseStatusError,
			Text:   err.Error(),
		}
	}

	response := link.GetLinksResponse{Links: links}
	responseJSON, err := json.MarshalIndent(response, "", "  ")
	if err != nil {
		return agent.ToolUseResponse{
			Status: agent.ToolUseStatusError,
			Text:   err.Error(),
		}
	}

	return agent.ToolUseResponse{
		Status: agent.ToolUseStatusSuccess,
		Text:   string(responseJSON),
	}
}

type GetLinkTool struct {
	User           *model.User
	LinkController interface {
		GetLink(context.Context, *model.User, string) (*model.Link, error)
	}
}

func (t *GetLinkTool) Spec() agent.Spec {
	return agent.Spec{
		Name:        "get_link",
		Description: "Use this tool to retrieve all information about a given link. This includes the full text content of the link and, in many cases, an AI generated summary.",
		InputSchema: map[string]any{
			"type": "object",
			"properties": map[string]any{
				"id": map[string]string{
					"type": "string",
				},
			},
			"required": []string{"id"},
		},
	}
}

func (t *GetLinkTool) Use(ctx context.Context, id, input string) agent.ToolUseResponse {
	typedInput := make(map[string]string)
	err := json.Unmarshal([]byte(input), &typedInput)
	if err != nil {
		return agent.ToolUseResponse{
			Status: agent.ToolUseStatusError,
			Text:   err.Error(),
		}
	}

	id, ok := typedInput["id"]
	if !ok {
		return agent.ToolUseResponse{
			Status: agent.ToolUseStatusError,
			Text:   "'id' was not included in the input and is required.",
		}
	}

	link, err := t.LinkController.GetLink(ctx, t.User, id)
	if err != nil {
		return agent.ToolUseResponse{
			Status: agent.ToolUseStatusError,
			Text:   err.Error(),
		}
	}

	b, err := json.MarshalIndent(link, "", "  ")
	if err != nil {
		return agent.ToolUseResponse{
			Status: agent.ToolUseStatusError,
			Text:   err.Error(),
		}
	}

	return agent.ToolUseResponse{
		Status: agent.ToolUseStatusSuccess,
		Text:   string(b),
	}
}

// CreateFolderTool handles creating a new folder
type CreateFolderTool struct {
	User             *model.User
	FolderController interface {
		CreateFolder(context.Context, *model.User, *folder.CreateFolderRequest) (*model.User, error)
	}
}

func (t *CreateFolderTool) Spec() agent.Spec {
	return agent.Spec{
		Name:        "create_folder",
		Description: "Use this tool to create a new folder for the user.",
		InputSchema: map[string]any{
			"type": "object",
			"properties": map[string]any{
				"name": map[string]any{
					"type":      "string",
					"maxLength": 128,
				},
				"parentId": map[string]any{
					"type":    "string",
					"pattern": "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
				},
			},
			"required": []string{"name"},
		},
	}
}

func (t *CreateFolderTool) Use(ctx context.Context, id, input string) agent.ToolUseResponse {
	payload := make(map[string]any)
	if err := json.Unmarshal([]byte(input), &payload); err != nil {
		return agent.ToolUseResponse{
			Status: agent.ToolUseStatusError,
			Text:   fmt.Sprintf("Failed to parse input: %v", err),
		}
	}

	name, ok := payload["name"].(string)
	if !ok {
		return agent.ToolUseResponse{
			Status: agent.ToolUseStatusError,
			Text:   "name is required and must be a string",
		}
	}

	createReq := &folder.CreateFolderRequest{
		Name: name,
	}

	// Optional parentId
	if parentID, ok := payload["parentId"].(string); ok {
		createReq.ParentID = parentID
	}

	u, err := t.FolderController.CreateFolder(ctx, t.User, createReq)
	if err != nil {
		return agent.ToolUseResponse{
			Status: agent.ToolUseStatusError,
			Text:   fmt.Sprintf("Failed to create folder: %v", err),
		}
	}

	var target *model.Folder
	if createReq.ParentID != "" {
		f := u.FolderTree.BFS(createReq.ParentID)
		target = f.FindByName(name)
	} else {
		target = u.FolderTree.FindByName(name)
	}

	if target == nil {
		return agent.ToolUseResponse{
			Status: agent.ToolUseStatusError,
			Text:   "Failed to create folder",
		}
	}

	return agent.ToolUseResponse{
		Status: agent.ToolUseStatusSuccess,
		Text:   fmt.Sprintf("Successfully created folder '%s'. Its ID is %s", name, target.ID),
	}
}

// DeleteFolderTool handles deleting a folder
type DeleteFolderTool struct {
	User             *model.User
	FolderController interface {
		DeleteFolder(context.Context, *model.User, string) (*model.User, error)
	}
}

func (t *DeleteFolderTool) Spec() agent.Spec {
	return agent.Spec{
		Name:        "delete_folder",
		Description: "Use this tool to delete a folder.",
		InputSchema: map[string]any{
			"type": "object",
			"properties": map[string]any{
				"folderId": map[string]any{
					"type":    "string",
					"pattern": "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
				},
			},
			"required": []string{"folderId"},
		},
	}
}

func (t *DeleteFolderTool) Use(ctx context.Context, id, input string) agent.ToolUseResponse {
	payload := make(map[string]any)
	if err := json.Unmarshal([]byte(input), &payload); err != nil {
		return agent.ToolUseResponse{
			Status: agent.ToolUseStatusError,
			Text:   fmt.Sprintf("Failed to parse input: %v", err),
		}
	}

	folderID, ok := payload["folderId"].(string)
	if !ok {
		return agent.ToolUseResponse{
			Status: agent.ToolUseStatusError,
			Text:   "folderId is required and must be a string",
		}
	}

	_, err := t.FolderController.DeleteFolder(ctx, t.User, folderID)
	if err != nil {
		return agent.ToolUseResponse{
			Status: agent.ToolUseStatusError,
			Text:   fmt.Sprintf("Failed to delete folder: %v", err),
		}
	}

	return agent.ToolUseResponse{
		Status: agent.ToolUseStatusSuccess,
		Text:   "Successfully deleted folder",
	}
}

// RenameFolderTool handles renaming a folder
type RenameFolderTool struct {
	User             *model.User
	FolderController interface {
		UpdateFolder(context.Context, *model.User, *folder.UpdateFolderRequest) (*model.User, error)
	}
}

func (t *RenameFolderTool) Spec() agent.Spec {
	return agent.Spec{
		Name:        "rename_folder",
		Description: "Use this tool to rename a folder.",
		InputSchema: map[string]any{
			"type": "object",
			"properties": map[string]any{
				"folderId": map[string]any{
					"type":    "string",
					"pattern": "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
				},
				"name": map[string]any{
					"type":      "string",
					"maxLength": 128,
				},
			},
			"required": []string{"folderId", "name"},
		},
	}
}

func (t *RenameFolderTool) Use(ctx context.Context, id, input string) agent.ToolUseResponse {
	payload := make(map[string]any)
	if err := json.Unmarshal([]byte(input), &payload); err != nil {
		return agent.ToolUseResponse{
			Status: agent.ToolUseStatusError,
			Text:   fmt.Sprintf("Failed to parse input: %v", err),
		}
	}

	folderID, ok := payload["folderId"].(string)
	if !ok {
		return agent.ToolUseResponse{
			Status: agent.ToolUseStatusError,
			Text:   "folderId is required and must be a string",
		}
	}

	name, ok := payload["name"].(string)
	if !ok {
		return agent.ToolUseResponse{
			Status: agent.ToolUseStatusError,
			Text:   "name is required and must be a string",
		}
	}

	updateReq := &folder.UpdateFolderRequest{
		ID:   folderID,
		Name: name,
	}

	u, err := t.FolderController.UpdateFolder(ctx, t.User, updateReq)
	if err != nil {
		return agent.ToolUseResponse{
			Status: agent.ToolUseStatusError,
			Text:   fmt.Sprintf("Failed to update folder name: %v", err),
		}
	}

	f := u.FolderTree.BFS(folderID)

	return agent.ToolUseResponse{
		Status: agent.ToolUseStatusSuccess,
		Text:   fmt.Sprintf("Successfully renamed folder %s to '%s'", f.ID, name),
	}
}

// AddLinkToFolderTool handles adding a link to a folder
type AddLinkToFolderTool struct {
	User           *model.User
	LinkController interface {
		UpdateLink(context.Context, *model.User, *link.UpdateLinkRequest) (*model.Link, *model.User, error)
	}
}

func (t *AddLinkToFolderTool) Spec() agent.Spec {
	return agent.Spec{
		Name:        "add_link_to_folder",
		Description: "Use this tool to add a link to a folder.",
		InputSchema: map[string]any{
			"type": "object",
			"properties": map[string]any{
				"linkId": map[string]any{
					"type":    "string",
					"pattern": "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
				},
				"folderId": map[string]any{
					"type":    "string",
					"pattern": "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
				},
			},
			"required": []string{"linkId", "folderId"},
		},
	}
}

func (t *AddLinkToFolderTool) Use(ctx context.Context, id, input string) agent.ToolUseResponse {
	payload := make(map[string]any)
	if err := json.Unmarshal([]byte(input), &payload); err != nil {
		return agent.ToolUseResponse{
			Status: agent.ToolUseStatusError,
			Text:   fmt.Sprintf("Failed to parse input: %v", err),
		}
	}

	linkID, ok := payload["linkId"].(string)
	if !ok {
		return agent.ToolUseResponse{
			Status: agent.ToolUseStatusError,
			Text:   "linkId is required and must be a string",
		}
	}

	folderID, ok := payload["folderId"].(string)
	if !ok {
		return agent.ToolUseResponse{
			Status: agent.ToolUseStatusError,
			Text:   "folderId is required and must be a string",
		}
	}

	updateReq := &link.UpdateLinkRequest{
		ID:       linkID,
		FolderID: &folderID,
	}

	_, _, err := t.LinkController.UpdateLink(ctx, t.User, updateReq)
	if err != nil {
		return agent.ToolUseResponse{
			Status: agent.ToolUseStatusError,
			Text:   fmt.Sprintf("Failed to update link's folder: %v", err),
		}
	}

	return agent.ToolUseResponse{
		Status: agent.ToolUseStatusSuccess,
		Text:   fmt.Sprintf("Successfully added link %s to folder %s", linkID, folderID),
	}
}

// RemoveLinkFromFolderTool handles removing a link from a folder
type RemoveLinkFromFolderTool struct {
	User           *model.User
	LinkController interface {
		UpdateLink(context.Context, *model.User, *link.UpdateLinkRequest) (*model.Link, *model.User, error)
	}
}

func (t *RemoveLinkFromFolderTool) Spec() agent.Spec {
	return agent.Spec{
		Name:        "remove_link_from_folder",
		Description: "Use this tool to remove a link from its current folder.",
		InputSchema: map[string]any{
			"type": "object",
			"properties": map[string]any{
				"linkId": map[string]any{
					"type":    "string",
					"pattern": "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
				},
			},
			"required": []string{"linkId"},
		},
	}
}

func (t *RemoveLinkFromFolderTool) Use(ctx context.Context, id, input string) agent.ToolUseResponse {
	payload := make(map[string]any)
	if err := json.Unmarshal([]byte(input), &payload); err != nil {
		return agent.ToolUseResponse{
			Status: agent.ToolUseStatusError,
			Text:   fmt.Sprintf("Failed to parse input: %v", err),
		}
	}

	linkID, ok := payload["linkId"].(string)
	if !ok {
		return agent.ToolUseResponse{
			Status: agent.ToolUseStatusError,
			Text:   "linkId is required and must be a string",
		}
	}

	updateReq := &link.UpdateLinkRequest{
		ID:       linkID,
		FolderID: nil,
	}

	_, _, err := t.LinkController.UpdateLink(ctx, t.User, updateReq)
	if err != nil {
		return agent.ToolUseResponse{
			Status: agent.ToolUseStatusError,
			Text:   fmt.Sprintf("Failed to update link's folder: %v", err),
		}
	}

	return agent.ToolUseResponse{
		Status: agent.ToolUseStatusSuccess,
		Text:   fmt.Sprintf("Successfully removed link %s from its folder", linkID),
	}
}

func userSummary(u *model.User) string {
	name := fmt.Sprintf("%s%s", u.FirstName, u.LastName)
	bFolderTree, err := json.MarshalIndent(u.FolderTree, "", "  ")
	if err != nil {
		bFolderTree = []byte("Whoops! We failed to retrieve the user's folders.")
	}
	return fmt.Sprintf("- The current user's name is %s\n- %s's folder tree is this:\n%s", name, name, string(bFolderTree))
}
