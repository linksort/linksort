package controller

import (
	"context"
	"net/http"
	"reflect"
	"time"

	"github.com/linksort/linksort/analyze"
	"github.com/linksort/linksort/db"
	"github.com/linksort/linksort/errors"
	handler "github.com/linksort/linksort/handler/link"
	"github.com/linksort/linksort/log"
	"github.com/linksort/linksort/model"
)

type Link struct {
	Store     model.LinkStore
	UserStore model.UserStore
	Analyzer  interface {
		Do(context.Context, *analyze.Request) (*analyze.Response, error)
		GatherCorpus(context.Context, string) (*analyze.Response, error)
		Summarize(context.Context, string) (string, error)
	}
	Transactor db.Transactor
}

func (l *Link) CreateLink(
	ctx context.Context,
	u *model.User,
	req *handler.CreateLinkRequest,
) (*model.Link, *model.User, error) {
	op := errors.Op("controller.CreateLink")

	dat, err := l.Analyzer.Do(ctx, &analyze.Request{
		URL:         req.URL,
		Title:       req.Title,
		Favicon:     req.Favicon,
		Site:        req.Site,
		Image:       req.Image,
		Description: req.Description,
		Corpus:      req.Corpus,
	})
	if err != nil && !errors.Is(err, analyze.ErrNoClassify) {
		return nil, nil, errors.E(op, err)
	}

	var link *model.Link
	var user *model.User

	// We use a new context here so that this operation isn't cancelled if the
	// request is cancelled.
	err = l.Transactor.DoInTransaction(context.Background(), func(sessCtx context.Context) error {
		innerOp := errors.Opf("%s.innerTxn", op)

		user, err = l.UserStore.GetUserByEmail(sessCtx, u.Email)
		if err != nil {
			return errors.E(innerOp, err)
		}

		link, err = l.Store.CreateLink(sessCtx, &model.Link{
			UserID:       u.ID,
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
			URL:          dat.URL,
			Image:        dat.Image,
			Favicon:      dat.Favicon,
			Title:        dat.Title,
			Site:         dat.Site,
			Description:  dat.Description,
			Corpus:       dat.Corpus,
			TagDetails:   model.ParseTagDetails(dat.Tags),
			TagPaths:     model.ParseTagDetailsToPathList(dat.Tags),
			IsArticle:    dat.IsArticle,
			IsSummarized: !dat.IsArticle,
		})
		if err != nil {
			return errors.E(innerOp, err)
		}

		if err := user.TagTree.UpdateWithNewTagDetails(link.TagDetails); err != nil {
			return errors.E(innerOp, err)
		}

		// Increment links count if it's already populated (> 0)
		if user.LinksCount > 0 {
			user.IncrementLinksCount()
		}

		if _, err = l.UserStore.UpdateUser(sessCtx, user); err != nil {
			return errors.E(innerOp, err)
		}

		return nil
	})
	if err != nil {
		return nil, nil, errors.E(op, err)
	}

	go func() {
		res, err := l.Analyzer.GatherCorpus(context.Background(), link.URL)
		if err != nil {
			log.Printf("async corpus gathering failed for link %s: %v", link.ID, err)
			return
		}

		if res.Corpus != "" {
			link.Corpus = res.Corpus
			link.IsArticle = res.IsArticle
			if _, err := l.Store.UpdateLink(context.Background(), link); err != nil {
				log.Printf("async corpus update failed for link %s: %v", link.ID, err)
			}
		}
	}()

	return link, user, nil
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
		db.GetLinksTag(req.TagPath),
		db.GetLinksUserTag(req.UserTag),
		db.GetLinksFavorites(req.Favorites),
		db.GetLinksAnnotated(req.Annotations))
	if err != nil {
		return nil, errors.E(op, err)
	}

	return links, nil
}

func (l *Link) UpdateLink(
	ctx context.Context,
	u *model.User,
	req *handler.UpdateLinkRequest,
) (*model.Link, *model.User, error) {
	op := errors.Opf("controller.UpdateLink(%q)", req.ID)

	var link *model.Link
	var user *model.User
	var err error

	err = l.Transactor.DoInTransaction(ctx, func(sessCtx context.Context) error {
		innerOp := errors.Opf("%s.innerTxn", op)

		link, err = l.GetLink(sessCtx, u, req.ID)
		if err != nil {
			return errors.E(innerOp, err)
		}

		user, err = l.UserStore.GetUserByEmail(sessCtx, u.Email)
		if err != nil {
			return errors.E(innerOp, err)
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
						return errors.E(innerOp,
							errors.Str("folder does not exist"),
							errors.M{"folderId": "This folder does not exist."},
							http.StatusBadRequest)
					}

					uv.FieldByName(rt.Field(i).Name).
						Set(reflect.ValueOf(folderID))
				}
			case "UserTags":
				if isNil := rv.Field(i).IsNil(); !isNil {
					reqLinkUserTags := rv.Field(i).Elem().Interface().([]string)
					existingLinkUserTags := link.UserTags

					model.ReconcileUserTags(user, existingLinkUserTags, reqLinkUserTags)

					uv.FieldByName(rt.Field(i).Name).
						Set(reflect.ValueOf(reqLinkUserTags))

				}
			default:
				if isNil := rv.Field(i).IsNil(); !isNil {
					image := rv.Field(i).Elem().String()

					uv.FieldByName(rt.Field(i).Name).
						Set(reflect.ValueOf(image))
				}
			}
		}

		link, err = l.Store.UpdateLink(sessCtx, link)
		if err != nil {
			return errors.E(innerOp, err)
		}

		if user != nil {
			user, err = l.UserStore.UpdateUser(sessCtx, user)
			if err != nil {
				return errors.E(innerOp, err)
			}
		}

		return nil
	})
	if err != nil {
		return nil, nil, errors.E(op, err)
	}

	return link, user, nil
}

func (l *Link) DeleteLink(ctx context.Context, u *model.User, id string) (*model.User, error) {
	op := errors.Opf("controller.DeleteLink(%q)", id)

	var link *model.Link
	var user *model.User
	var err error

	err = l.Transactor.DoInTransaction(ctx, func(sessCtx context.Context) error {
		innerOp := errors.Opf("%s.innerTxn", op)

		user, err = l.UserStore.GetUserByEmail(sessCtx, u.Email)
		if err != nil {
			return errors.E(innerOp, err)
		}

		link, err = l.GetLink(sessCtx, u, id)
		if err != nil {
			return errors.E(op, err)
		}

		if err = user.TagTree.UpdateWithDeletedTagDetails(link.TagDetails); err != nil {
			return errors.E(innerOp, err)
		}

		user.UserTags.UpdateWithRemovedTags(link.UserTags)

		err = l.Store.DeleteLink(sessCtx, link)
		if err != nil {
			return errors.E(op, err)
		}

		if _, err = l.UserStore.UpdateUser(sessCtx, user); err != nil {
			return errors.E(innerOp, err)
		}

		return nil
	})
	if err != nil {
		return nil, errors.E(op, err)
	}

	return user, nil
}

func (l *Link) SummarizeLink(ctx context.Context, u *model.User, id string) (*model.Link, error) {
	op := errors.Opf("controller.SummarizeLink(%q)", id)

	link, err := l.GetLink(ctx, u, id)
	if err != nil {
		return nil, errors.E(op, err)
	}

	if link.IsSummarized {
		// Link already has a summary.
		return link, nil
	}

	link.IsSummarized = true

	if link.IsArticle && link.Corpus != "" {
		link.Summary, err = l.Analyzer.Summarize(ctx, link.Corpus)
		if err != nil {
			return nil, errors.E(op, err)
		}
	}

	updatedLink, err := l.Store.UpdateLink(ctx, link)
	if err != nil {
		return nil, errors.E(op, errors.Str("failed to update link with summary"), err)
	}

	return updatedLink, nil
}

func doesFolderExist(u *model.User, folderID string) bool {
	if folderID == "root" {
		return true
	}

	found := u.FolderTree.BFS(folderID)

	return found != nil
}
