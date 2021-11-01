package controller

import (
	"context"
	"net/http"

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

	usr, err := o.Store.GetUserByEmail(ctx, req.Email)
	if err != nil {
		return nil, errors.E(
			op,
			err,
			http.StatusBadRequest,
			errors.M{"message": "Invalid credentials given."})
	}

	if !usr.CheckPassword(req.Password) {
		return nil, errors.E(
			op,
			errors.Str("wrong password"),
			http.StatusBadRequest,
			errors.M{"message": "Invalid credentials given."})
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
