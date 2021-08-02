package controller

import (
	"context"

	handler "github.com/linksort/linksort/handler/link"
	"github.com/linksort/linksort/model"
)

type Link struct {
	Store model.LinkStore
}

func (l *Link) CreateLink(ctx context.Context, u *model.User, req *handler.CreateLinkRequest) (*model.Link, error) {
	return nil, nil
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

func (l *Link) DeleteLink(ctx context.Context, u *model.User, id string) (*model.Link, error) {
	return nil, nil
}
