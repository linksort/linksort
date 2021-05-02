package controller

import (
	"context"
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
	op := errors.Opf("controller.CreateUser(%s)", req.Email)

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
	op := errors.Opf("controller.GetUserBySessionID(%s)", sessionID)

	usr, err := u.Store.GetUserBySessionID(ctx, sessionID)
	if err != nil {
		return nil, errors.E(op, err)
	}

	return usr, nil
}

func (u *User) UpdateUser(context.Context, *model.User, *handler.UpdateUserRequest) (*model.User, error) {
	return nil, nil
}

func (u *User) DeleteUser(context.Context, *model.User) error {
	return nil
}

func (u *User) ForgotPassword(context.Context, *handler.ForgotPasswordRequest) error {
	return nil
}

func (u *User) ChangePassword(context.Context, *handler.ChangePasswordRequest) (*model.User, error) {
	return nil, nil
}
