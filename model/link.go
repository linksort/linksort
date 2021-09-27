package model

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Link struct {
	Key         primitive.ObjectID `json:"-" bson:"_id,omitempty"`
	ID          string             `json:"id"`
	UserID      string             `json:"userId"`
	CreatedAt   time.Time          `json:"createdAt"`
	UpdatedAt   time.Time          `json:"updatedAt"`
	TagPaths    JSONStringArray    `json:"tagPaths"`
	TagDetails  TagDetailList      `json:"tagDetails"`
	IsFavorite  bool               `json:"isFavorite"`
	FolderID    string             `json:"folderId"`
	Corpus      string             `json:"corpus"`
	URL         string             `json:"url"`
	Title       string             `json:"title"`
	Description string             `json:"description"`
	Favicon     string             `json:"favicon"`
	Image       string             `json:"image"`
	Site        string             `json:"site"`
}

type GetLinksOption func(map[string]interface{})

type LinkStore interface {
	GetLinksByUser(context.Context, *User, *Pagination, ...GetLinksOption) ([]*Link, error)
	GetLinkByID(context.Context, string) (*Link, error)
	CreateLink(context.Context, *Link) (*Link, error)
	UpdateLink(context.Context, *Link) (*Link, error)
	DeleteLink(context.Context, *Link) error
}
