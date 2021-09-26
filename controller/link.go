package controller

import (
	"context"
	"net/http"
	"reflect"
	"time"

	"github.com/linksort/analyze"

	"github.com/linksort/linksort/db"
	"github.com/linksort/linksort/errors"
	handler "github.com/linksort/linksort/handler/link"
	"github.com/linksort/linksort/model"
)

type Link struct {
	Store    model.LinkStore
	Analyzer interface {
		Do(context.Context, *analyze.Request) (*analyze.Response, error)
	}
}

func (l *Link) CreateLink(ctx context.Context, u *model.User, req *handler.CreateLinkRequest) (*model.Link, error) {
	op := errors.Op("controller.CreateLink")

	dat, err := l.Analyzer.Do(ctx, &analyze.Request{
		URL: req.URL,
	})
	if err != nil {
		return nil, errors.E(op, err)
	}

	link, err := l.Store.CreateLink(ctx, &model.Link{
		UserID:      u.ID,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		URL:         dat.URL,
		Image:       dat.Image,
		Favicon:     dat.Favicon,
		Title:       dat.Title,
		Site:        dat.Site,
		Description: dat.Description,
		Corpus:      dat.Corpus,
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
		db.GetLinksSort(req.Sort),
		db.GetLinksFolder(req.FolderID),
		db.GetLinksFavorites(req.Favorites))
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
		switch rv.Type().Field(i).Name {
		case "ID":
			// skip
		case "IsFavorite":
			if isNil := rv.Field(i).IsNil(); !isNil {
				uv.FieldByName(rt.Field(i).Name).
					Set(reflect.ValueOf(rv.Field(i).Elem().Bool()))
			}
		case "FolderID":
			if isNil := rv.Field(i).IsNil(); !isNil {
				folderID := rv.Field(i).Elem().String()

				if !doesFolderExist(u, folderID) {
					return nil, errors.E(op,
						errors.Str("folder does not exist"),
						errors.M{"folderId": "This folder does not exist."},
						http.StatusBadRequest)
				}

				uv.FieldByName(rt.Field(i).Name).
					Set(reflect.ValueOf(folderID))
			}
		default:
			if ss := rv.Field(i).String(); ss != "" {
				uv.FieldByName(rt.Field(i).Name).
					Set(reflect.ValueOf(ss))
			}
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

func doesFolderExist(u *model.User, folderID string) bool {
	if folderID == "root" {
		return true
	}

	found := u.FolderTree.BFS(folderID)

	return found != nil
}
