package controller

import (
	"context"
	"net/http"
	"reflect"
	"time"

	"github.com/linksort/linksort/db"
	"github.com/linksort/linksort/errors"
	handler "github.com/linksort/linksort/handler/link"
	"github.com/linksort/linksort/model"
	"github.com/linksort/linksort/opengraph"
)

type Link struct {
	Store     model.LinkStore
	OpenGraph *opengraph.Client
}

func (l *Link) CreateLink(ctx context.Context, u *model.User, req *handler.CreateLinkRequest) (*model.Link, error) {
	op := errors.Op("controller.CreateLink")

	og := l.OpenGraph.Extract(ctx, req.URL)

	link, err := l.Store.CreateLink(ctx, &model.Link{
		UserID:      u.ID,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		Corpus:      og.Corpus,
		URL:         og.URL,
		Title:       og.Title,
		Description: og.Description,
		Favicon:     og.Favicon,
		Image:       og.Image,
		Site:        og.Site,
	})
	if err != nil {
		return nil, errors.E(op, err)
	}

	return link, nil
}

func (l *Link) GetLink(ctx context.Context, u *model.User, id string) (*model.Link, error) {
	op := errors.Opf("controller.GetLink(%q)", id)

	link, err := l.Store.GetLinkByID(ctx, id)
	if err != nil {
		return nil, errors.E(op, err)
	}

	if link.UserID != u.ID {
		return nil, errors.E(op, errors.Str("no permission"), http.StatusNotFound)
	}

	return link, nil
}

func (l *Link) GetLinks(ctx context.Context, u *model.User, req *handler.GetLinksRequest) ([]*model.Link, error) {
	op := errors.Op("controller.GetLinks")

	links, err := l.Store.GetLinksByUser(ctx, u, req.Pagination,
		db.GetLinksSearch(req.Search),
		db.GetLinksSort(req.Sort))
	if err != nil {
		return nil, errors.E(op, err)
	}

	return links, nil
}

func (l *Link) UpdateLink(ctx context.Context, u *model.User, req *handler.UpdateLinkRequest) (*model.Link, error) {
	op := errors.Opf("controller.UpdateLink(%q)", req.ID)

	link, err := l.GetLink(ctx, u, req.ID)
	if err != nil {
		return nil, errors.E(op, err)
	}

	uv := reflect.ValueOf(link).Elem()
	rv := reflect.ValueOf(req).Elem()
	rt := rv.Type()

	for i := 0; i < rv.NumField(); i++ {
		if ss := rv.Field(i).String(); ss != "" && rv.Type().Field(i).Name != "ID" {
			uv.FieldByName(rt.Field(i).Name).Set(reflect.ValueOf(ss))
		}
	}

	link, err = l.Store.UpdateLink(ctx, link)
	if err != nil {
		return nil, errors.E(op, err)
	}

	return link, nil
}

func (l *Link) DeleteLink(ctx context.Context, u *model.User, id string) error {
	op := errors.Opf("controller.DeleteLink(%q)", id)

	link, err := l.GetLink(ctx, u, id)
	if err != nil {
		return errors.E(op, err)
	}

	return errors.Wrap(op, l.Store.DeleteLink(ctx, link))
}
