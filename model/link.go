package model

import (
	"context"
	"encoding/json"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Highlight is a passage of a link's article text that the user marked, with
// an optional note. It is anchored by a text quote (exact + prefix/suffix) in
// the style of the W3C Web Annotation TextQuoteSelector, so it survives
// re-rendering and small markup changes. Start/End are character offsets into
// the article's whitespace-normalized text content and are only a hint.
type Highlight struct {
	ID        string    `json:"id"`
	Exact     string    `json:"exact"`
	Prefix    string    `json:"prefix"`
	Suffix    string    `json:"suffix"`
	Start     int       `json:"start"`
	End       int       `json:"end"`
	Note      string    `json:"note"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// Limits enforced on highlights.
const (
	HighlightMaxPerLink  = 200
	HighlightMaxExactLen = 2000
	HighlightMaxAffixLen = 64
	HighlightMaxNoteLen  = 10000
)

type Link struct {
	Key          primitive.ObjectID `json:"-" bson:"_id,omitempty"`
	ID           string             `json:"id"`
	UserID       string             `json:"userId"`
	CreatedAt    time.Time          `json:"createdAt"`
	UpdatedAt    time.Time          `json:"updatedAt"`
	UserTags     JSONStringArray    `json:"userTags"`
	TagPaths     JSONStringArray    `json:"tagPaths"`
	TagDetails   TagDetailList      `json:"tagDetails"`
	IsFavorite   bool               `json:"isFavorite"`
	FolderID     string             `json:"folderId"`
	Corpus       string             `json:"corpus"`
	URL          string             `json:"url"`
	Title        string             `json:"title"`
	Description  string             `json:"description"`
	Favicon      string             `json:"favicon"`
	Image        string             `json:"image"`
	Site         string             `json:"site"`
	Annotation   string             `json:"annotation"`
	IsAnnotated  bool               `json:"isAnnotated"`
	Highlights   HighlightList      `json:"highlights"`
	Summary      string             `json:"summary"`
	IsSummarized bool               `json:"isSummarized"`
	IsArticle    bool               `json:"isArticle"`
}

// HighlightList marshals as [] rather than null when empty so API clients
// can always iterate it.
type HighlightList []Highlight

func (h HighlightList) MarshalJSON() ([]byte, error) {
	if h == nil {
		return []byte("[]"), nil
	}

	return json.Marshal([]Highlight(h))
}

// HasAnnotations reports whether the link carries a note or any highlights.
func (l *Link) HasAnnotations() bool {
	return len(l.Annotation) > 0 || len(l.Highlights) > 0
}

type GetLinksOption func(map[string]interface{})

type LinkStore interface {
	GetLinksByUser(context.Context, *User, *Pagination, ...GetLinksOption) ([]*Link, error)
	GetAllLinksByUser(context.Context, *User, *Pagination) ([]*Link, error)
	GetLinkByID(context.Context, string) (*Link, error)
	CreateLink(context.Context, *Link) (*Link, error)
	UpdateLink(context.Context, *Link) (*Link, error)
	DeleteLink(context.Context, *Link) error
	DeleteAllLinksByUser(ctx context.Context, u *User) error
}
