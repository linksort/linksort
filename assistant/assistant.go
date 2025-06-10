package assistant

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"

	"github.com/linksort/linksort/agent"
	"github.com/linksort/linksort/handler/folder"
	"github.com/linksort/linksort/handler/link"
	"github.com/linksort/linksort/model"
)

var agenticSystemPrompt string = `## Identity

- Your task is to help users of Linksort, a web application, to organize and learn about their links.
- Provide helpful and insightful information about the contents of the user's links when you can, using the tools at your disposal.
- Only answer questions and commands that are about Linksort and/or the user's links and their contents. If the user asks unrelated question, remind them that your purpose is to help the user use Linksort and its features.
- Remember to always be friendly and cordial.

## Linksort Application Summary

Linksort is an open-source, AI-powered bookmarking application that helps users organize, analyze, and discover insights from their saved links. It combines traditional bookmark management with advanced AI features for content analysis, summarization, and conversational interaction.

The user can always save a new link using the "New Link" button in the header, which is always present.

If the user runs into any issues, they can use the "Give Feedback" button in the header to report the issue.

## Available Pages and Features

### Home Page (/)

Primary bookmarks management interface

Features:

- Link Collection Display: condensed, tall, or tile view of saved links
- Advanced Filtering: Filter by favorites, annotations, folders, tags, or search terms using the controls on the left sidebar
- Folder Management: Hierarchical folder organization with drag-and-drop
- Tag System: Auto-generated AI tags and user-created tags
- Quick Actions: Add links, create folders, add links to folders, favorite links
- Search: Full-text search across link content and metadata

AI Features:
- Automatic content analysis and tagging
- Link summarization
- Content classification

### Link Detail View (/links/:linkId)

Individual link viewing and management

Features:
- Full Link Details: Title, description, content, AI generated summary, metadata
- Reader View: Clean, distraction-free reading experience
- Annotations: Add personal notes and annotations
- Link Management: Edit title, add tags
- Content Analysis: View AI-generated tags and classification
- Summary Generation: AI-powered article summaries

### Link Edit Page (/links/:linkId/update)

Link modification interface

Features:
- Metadata Editing: Update title, description, tags
- Tag Management: Add custom tags, view AI-generated tags
- Favoriting: Set the link as a favorite

### Graph View (/graph)

Visual representation of link relationships

Features:
- Network Visualization: Interactive graph of links and their connections
- Tag Clustering: Visual grouping by categories from the tagTree
- Discovery: Find related content and patterns
- Interactive Navigation: Click to explore connected links

### Account Settings (/account)

User profile and preferences management

Features:
- Profile Management: Update name, email, password
- Data Export: Download user data
- Account Deletion: Remove account and data
- API Access: Information for developers

### Extensions Page (/extensions)

Browser extension information

Features:
- Browser Extension Downloads: Chrome, Firefox, Safari, Brave
- Installation Guides: Links to step-by-step setup instructions

### AI Chat Features (Available on all pages)

Contextual AI Assistant with tools and features for:
- Link Querying: Search and filter links with natural language
- Content Analysis: Get summaries and explanations
- Organization: Create folders, move links, manage tags
- Context Awareness: AI knows which page you're on for contextual commands

Example AI Commands:
- "Explain this article" (when viewing a link)
- "Find my AI research papers"
- "Summarize this link" (when viewing a link)
- "Create a folder for machine learning"
- "Move this to my research folder"
- "Organize my recently saved links into folders"

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
		SummarizeLink(context.Context, *model.User, string) (*model.Link, error)
	}
	FolderController interface {
		CreateFolder(context.Context, *model.User, *folder.CreateFolderRequest) (*model.User, error)
		UpdateFolder(context.Context, *model.User, *folder.UpdateFolderRequest) (*model.User, error)
		DeleteFolder(context.Context, *model.User, string) (*model.User, error)
	}
	BedrockClient agent.ConverseStreamProvider
}

func (c *Client) NewAssistant(u *model.User, conv *model.Conversation, userMsg *model.Message, pageContext map[string]any) *Assistant {
	// Convert existing conversation messages to agent messages
	messages := []agent.Message{}

	// First add existing conversation messages if any
	for _, msg := range conv.Messages {
		messages = append(messages, model.MapToAgentMessage(msg))
	}

	// Then add the new user message
	messages = append(messages, model.MapToAgentMessage(userMsg))

	return &Assistant{agent.New(agent.Config{
		System:   fmt.Sprintf(agenticSystemPrompt, userSummary(u, pageContext)),
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
			&SummarizeLinkTool{
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
		Description: "Use this tool to query and filter the user's links. Supports search, sorting, filtering by favorites/annotations/folders/tags, and pagination. Returns basic link information - use get_link for full details.",
		InputSchema: map[string]any{
			"type": "object",
			"properties": map[string]any{
				"search": map[string]any{
					"type":        "string",
					"description": "Text search across link content",
				},
				"sort": map[string]any{
					"type":        "string",
					"description": "Sort order: '1' for ascending by creation date, '-1' for descending",
					"enum":        []string{"1", "-1"},
				},
				"favorites": map[string]any{
					"type":        "string",
					"description": "Filter favorites: '1' to show only favorites",
					"enum":        []string{"1"},
				},
				"annotations": map[string]any{
					"type":        "string",
					"description": "Filter annotated links: '1' to show only annotated",
					"enum":        []string{"1"},
				},
				"folderId": map[string]any{
					"type":        "string",
					"description": "Filter by folder ID",
				},
				"tagPath": map[string]any{
					"type":        "string",
					"description": "Filter by tag path",
				},
				"userTag": map[string]any{
					"type":        "string",
					"description": "Filter by user tag",
				},
				"page": map[string]any{
					"type":        "integer",
					"description": "Page number (0-based)",
					"minimum":     0,
				},
				"size": map[string]any{
					"type":        "integer",
					"description": "Page size (default 18, max 1000)",
					"minimum":     1,
					"maximum":     1000,
				},
			},
			"required": []string{},
		},
	}
}

func (t *GetLinksTool) Use(ctx context.Context, id, input string) agent.ToolUseResponse {
	// Parse input as generic map to handle mixed types
	typedInput := make(map[string]any)
	err := json.Unmarshal([]byte(input), &typedInput)
	if err != nil && !errors.Is(err, io.EOF) {
		return agent.ToolUseResponse{
			Status: agent.ToolUseStatusError,
			Text:   err.Error(),
		}
	}

	// Build GetLinksRequest from parsed input
	req := &link.GetLinksRequest{
		Pagination: &model.Pagination{},
	}

	// Extract and validate string parameters
	if search, ok := typedInput["search"].(string); ok {
		req.Search = search
	}

	if sort, ok := typedInput["sort"].(string); ok {
		if sort == "1" || sort == "-1" {
			req.Sort = sort
		} else {
			return agent.ToolUseResponse{
				Status: agent.ToolUseStatusError,
				Text:   "sort parameter must be '1' (ascending) or '-1' (descending)",
			}
		}
	}

	if favorites, ok := typedInput["favorites"].(string); ok {
		if favorites == "1" {
			req.Favorites = favorites
		} else {
			return agent.ToolUseResponse{
				Status: agent.ToolUseStatusError,
				Text:   "favorites parameter must be '1' to filter favorites",
			}
		}
	}

	if annotations, ok := typedInput["annotations"].(string); ok {
		if annotations == "1" {
			req.Annotations = annotations
		} else {
			return agent.ToolUseResponse{
				Status: agent.ToolUseStatusError,
				Text:   "annotations parameter must be '1' to filter annotated links",
			}
		}
	}

	if folderId, ok := typedInput["folderId"].(string); ok {
		req.FolderID = folderId
	}
	if tagPath, ok := typedInput["tagPath"].(string); ok {
		req.TagPath = tagPath
	}
	if userTag, ok := typedInput["userTag"].(string); ok {
		req.UserTag = userTag
	}

	// Extract and validate pagination parameters (can be float64 from JSON)
	if pageVal, ok := typedInput["page"]; ok {
		if pageFloat, ok := pageVal.(float64); ok {
			page := int(pageFloat)
			if page < 0 {
				return agent.ToolUseResponse{
					Status: agent.ToolUseStatusError,
					Text:   "page parameter must be >= 0",
				}
			}
			req.Pagination.Page = page
		}
	}
	if sizeVal, ok := typedInput["size"]; ok {
		if sizeFloat, ok := sizeVal.(float64); ok {
			size := int(sizeFloat)
			if size < 1 || size > 1000 {
				return agent.ToolUseResponse{
					Status: agent.ToolUseStatusError,
					Text:   "size parameter must be between 1 and 1000",
				}
			}
			req.Pagination.Size = size
		}
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

// SummarizeLinkTool handles generating AI summaries for links
type SummarizeLinkTool struct {
	User           *model.User
	LinkController interface {
		SummarizeLink(context.Context, *model.User, string) (*model.Link, error)
	}
}

func (t *SummarizeLinkTool) Spec() agent.Spec {
	return agent.Spec{
		Name:        "summarize_link",
		Description: "Use this tool to generate an AI summary for a specific link. Only works on article links that have content. If the link is already summarized, returns the existing summary.",
		InputSchema: map[string]any{
			"type": "object",
			"properties": map[string]any{
				"linkId": map[string]any{
					"type": "string",
				},
			},
			"required": []string{"linkId"},
		},
	}
}

func (t *SummarizeLinkTool) Use(ctx context.Context, id, input string) agent.ToolUseResponse {
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

	link, err := t.LinkController.SummarizeLink(ctx, t.User, linkID)
	if err != nil {
		return agent.ToolUseResponse{
			Status: agent.ToolUseStatusError,
			Text:   fmt.Sprintf("Failed to summarize link: %v", err),
		}
	}

	linkJSON, err := json.MarshalIndent(link, "", "  ")
	if err != nil {
		return agent.ToolUseResponse{
			Status: agent.ToolUseStatusError,
			Text:   fmt.Sprintf("Failed to serialize link: %v", err),
		}
	}

	return agent.ToolUseResponse{
		Status: agent.ToolUseStatusSuccess,
		Text:   string(linkJSON),
	}
}

func userSummary(u *model.User, pageContext map[string]any) string {
	bFolderTree, err := json.MarshalIndent(u.FolderTree, "", "  ")
	if err != nil {
		bFolderTree = []byte("Whoops! We failed to retrieve the user's folders.")
	}
	
	summary := fmt.Sprintf("- The current user's name is %s", u.FirstName)
	
	// Add page context if available
	if pageContext != nil {
		if route, ok := pageContext["route"].(string); ok && route != "" {
			summary += fmt.Sprintf("\n- The user is currently on page: %s", route)
			
			// Extract link ID from route if present
			if route != "/" && len(route) > 1 {
				// For routes like /links/abc123, extract the link ID
				if route[:7] == "/links/" && len(route) > 7 {
					linkID := route[7:]
					summary += fmt.Sprintf("\n- The user is currently viewing link ID: %s", linkID)
				}
			}
		}
		
		if query, ok := pageContext["query"].(map[string]string); ok && len(query) > 0 {
			summary += "\n- Current page filters/parameters:"
			for key, value := range query {
				if value != "" {
					summary += fmt.Sprintf("\n  - %s: %s", key, value)
				}
			}
		}
	}

	summary += fmt.Sprintf("- The user's folder tree is this:\n%s", string(bFolderTree))
	
	return summary
}
