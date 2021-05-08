package controller

import (
	"context"
	"reflect"
	"time"

	"github.com/linksort/linksort/errors"
	handler "github.com/linksort/linksort/handler/user"
	"github.com/linksort/linksort/model"
	"github.com/linksort/linksort/random"
)

type User struct {
	Store model.UserStore
}

func (u *User) CreateUser(ctx context.Context, req *handler.CreateUserRequest) (*model.User, error) {
	op := errors.Opf("controller.CreateUser(%q)", req.Email)

	digest, err := model.NewPasswordDigest(req.Password)
	if err != nil {
		return nil, errors.E(op, err)
	}

	usr, err := u.Store.CreateUser(ctx, &model.User{
		Email:          req.Email,
		FirstName:      req.FirstName,
		LastName:       req.LastName,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
		SessionID:      random.Token(),
		SessionExpiry:  time.Now().Add(time.Hour * time.Duration(24*30)),
		PasswordDigest: digest,
	})
	if err != nil {
		return nil, errors.E(op, err)
	}

	return usr, nil
}

func (u *User) GetUserBySessionID(ctx context.Context, sessionID string) (*model.User, error) {
	op := errors.Opf("controller.GetUserBySessionID(%q)", sessionID)

	usr, err := u.Store.GetUserBySessionID(ctx, sessionID)
	if err != nil {
		return nil, errors.E(op, err)
	}

	return usr, nil
}

func (u *User) UpdateUser(ctx context.Context, usr *model.User, req *handler.UpdateUserRequest) (*model.User, error) {
	op := errors.Opf("controller.UpdateUser(%q)", usr.Email)

	uv := reflect.ValueOf(usr).Elem()
	rv := reflect.ValueOf(req).Elem()
	rt := rv.Type()

	for i := 0; i < rv.NumField(); i++ {
		if ss := rv.Field(i).String(); ss != "" {
			uv.FieldByName(rt.Field(i).Name).Set(reflect.ValueOf(ss))
		}
	}

	usr, err := u.Store.UpdateUser(ctx, usr)
	if err != nil {
		return nil, errors.E(op, err)
	}

	return usr, nil
}

func (u *User) DeleteUser(ctx context.Context, usr *model.User) error {
	op := errors.Opf("controller.DeleteUser(%q)", usr.Email)

	err := u.Store.DeleteUser(ctx, usr)
	if err != nil {
		return errors.E(op, err)
	}

	return nil
}

func (u *User) ForgotPassword(context.Context, *handler.ForgotPasswordRequest) error {
	return nil
}

func (u *User) ChangePassword(context.Context, *handler.ChangePasswordRequest) (*model.User, error) {
	return nil, nil
}
