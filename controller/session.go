package controller

import (
	"context"

	"github.com/linksort/linksort/errors"
	handler "github.com/linksort/linksort/handler/user"
	"github.com/linksort/linksort/model"
)

type Session struct {
	Store model.UserStore
}

func (s *Session) CreateSession(ctx context.Context, req *handler.CreateSessionRequest) (*model.User, error) {
	op := errors.Opf("controller.CreateSession(%q)", req.Email)
	auth := Auth{s.Store}

	usr, err := auth.WithCredentials(ctx, req.Email, req.Password)
	if err != nil {
		return nil, errors.E(op, err)
	}

	if usr.IsSessionExpired() {
		usr.RefreshSession()

		usr, err = s.Store.UpdateUser(ctx, usr)
		if err != nil {
			return nil, errors.E(op, err)
		}
	}

	return usr, nil
}

func (s *Session) DeleteSession(ctx context.Context, usr *model.User) error {
	op := errors.Opf("controller.DeleteSession(%q)", usr.Email)

	usr.RefreshSession()

	_, err := s.Store.UpdateUser(ctx, usr)
	if err != nil {
		return errors.E(op, err)
	}

	return nil
}
