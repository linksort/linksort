package controller

import (
	"context"
	"time"

	"github.com/linksort/linksort/errors"
	handler "github.com/linksort/linksort/handler/link"
	"github.com/linksort/linksort/model"
)

type Link struct {
	Store model.LinkStore
}

func (l *Link) CreateLink(ctx context.Context, u *model.User, req *handler.CreateLinkRequest) (*model.Link, error) {
	op := errors.Op("controller.CreateLink")

	link, err := l.Store.CreateLink(ctx, &model.Link{
		UserID:      u.ID,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		Corpus:      req.Corpus,
		URL:         req.URL,
		Title:       req.Title,
		Description: req.Description,
		Favicon:     req.Favicon,
		Image:       req.Image,
		Site:        req.Site,
	})
	if err != nil {
		return nil, errors.E(op, err)
	}

	return link, nil
}

func (l *Link) GetLink(ctx context.Context, u *model.User, id string) (*model.Link, error) {
	return nil, nil
}

func (l *Link) GetLinks(ctx context.Context, u *model.User, req *handler.GetLinksRequest) ([]*model.Link, error) {
	return nil, nil
}

func (l *Link) UpdateLink(ctx context.Context, u *model.User, req *handler.UpdateLinkRequest) (*model.Link, error) {
	return nil, nil
}

func (l *Link) DeleteLink(ctx context.Context, u *model.User, id string) error {
	return nil
}
