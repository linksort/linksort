package controller

import (
	"context"

	"github.com/linksort/linksort/errors"
	handler "github.com/linksort/linksort/handler/oauth"
	"github.com/linksort/linksort/model"
	"github.com/linksort/linksort/random"
)

type OAuth struct {
	Store model.UserStore
}

func (o *OAuth) Authenticate(
	ctx context.Context,
	req *handler.OAuthAuthRequest,
) (*model.User, error) {
	op := errors.Opf("controller.OAuthAuthenticate(%q)", req.Email)
	auth := Auth{o.Store}

	usr, err := auth.WithCredentials(ctx, req.Email, req.Password)
	if err != nil {
		return nil, errors.E(op, err)
	}

	if usr.Token == "" {
		usr.Token = random.Token()

		usr, err = o.Store.UpdateUser(ctx, usr)
		if err != nil {
			return nil, errors.E(op, err)
		}
	}

	return usr, nil
}
