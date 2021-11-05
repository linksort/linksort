package controller

import (
	"context"
	"net/http"
	"time"

	"github.com/linksort/linksort/db"
	"github.com/linksort/linksort/errors"
	"github.com/linksort/linksort/model"
)

var ErrNoToken = errors.Str("no token")

type Auth struct {
	Store interface {
		GetUserBySessionID(context.Context, string) (*model.User, error)
		GetUserByToken(context.Context, string) (*model.User, error)
		GetUserByEmail(context.Context, string) (*model.User, error)
	}
}

func (a *Auth) WithCookie(ctx context.Context, sessionID string) (*model.User, error) {
	op := errors.Op("auth.WithCookie()")

	user, err := a.Store.GetUserBySessionID(ctx, sessionID)
	if err != nil {
		if errors.Is(err, db.ErrNoDocuments) {
			return nil, errors.E(
				op,
				err,
				http.StatusUnauthorized,
				errors.M{"message": "Unauthorized"})
		}

		return nil, errors.E(op, err)
	}

	if time.Now().After(user.SessionExpiry) {
		return nil, errors.E(
			op,
			errors.Str("session expired"),
			http.StatusUnauthorized,
			errors.M{"message": "Unauthorized"})
	}

	return user, nil
}

func (a *Auth) WithToken(ctx context.Context, token string) (*model.User, error) {
	op := errors.Op("auth.WithToken()")

	user, err := a.Store.GetUserByToken(ctx, token)
	if err != nil {
		if errors.Is(err, db.ErrNoDocuments) {
			return nil, errors.E(
				op,
				err,
				http.StatusUnauthorized,
				errors.M{"message": "Unauthorized"})
		}

		return nil, errors.E(op, err)
	}

	return user, nil
}

func (a *Auth) WithCredentials(ctx context.Context, email, password string) (*model.User, error) {
	op := errors.Op("auth.WithCredentials()")

	usr, err := a.Store.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, db.ErrNoDocuments) {
			return nil, errors.E(
				op,
				err,
				http.StatusBadRequest,
				errors.M{"message": "Invalid credentials given."})
		}

		return nil, errors.E(op, err)
	}

	if !usr.CheckPassword(password) {
		return nil, errors.E(
			op,
			errors.Str("wrong password"),
			http.StatusBadRequest,
			errors.M{"message": "Invalid credentials given."})
	}

	return usr, nil
}
