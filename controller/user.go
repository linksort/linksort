package controller

import (
	"context"
	"net/http"
	"reflect"
	"strings"
	"time"

	"github.com/linksort/linksort/errors"
	handler "github.com/linksort/linksort/handler/user"
	"github.com/linksort/linksort/log"
	"github.com/linksort/linksort/model"
	"github.com/linksort/linksort/random"
)

type User struct {
	Store model.UserStore
	Email interface {
		SendForgotPassword(context.Context, *model.User, string) error
	}
	Magic interface {
		Link(action, email, salt string) string
		Verify(email, b64ts, salt, sig string, expiry time.Duration) error
	}
}

func (u *User) CreateUser(ctx context.Context, req *handler.CreateUserRequest) (*model.User, error) {
	op := errors.Opf("controller.CreateUser(%q)", req.Email)

	digest, err := model.NewPasswordDigest(req.Password)
	if err != nil {
		return nil, errors.E(op, err)
	}

	usr, err := u.Store.CreateUser(ctx, &model.User{
		Email:          strings.ToLower(req.Email),
		FirstName:      req.FirstName,
		LastName:       req.LastName,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
		SessionID:      random.Token(),
		SessionExpiry:  time.Now().Add(time.Hour * time.Duration(24*30)),
		PasswordDigest: digest,
		FolderTree: &model.Folder{
			Name:     "root",
			ID:       "root",
			Children: make([]*model.Folder, 0),
		},
		TagTree: &model.TagNode{
			Name:     "root",
			Path:     "root",
			Count:    0,
			Children: make([]*model.TagNode, 0),
		},
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
		switch rv.Type().Field(i).Name {
		case "HasSeenWelcomeTour":
			if isNil := rv.Field(i).IsNil(); !isNil {
				uv.FieldByName(rt.Field(i).Name).
					Set(reflect.ValueOf(rv.Field(i).Elem().Bool()))
			}
		default:
			if ss := rv.Field(i).String(); ss != "" {
				uv.FieldByName(rt.Field(i).Name).Set(reflect.ValueOf(ss))
			}
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

func (u *User) ForgotPassword(ctx context.Context, req *handler.ForgotPasswordRequest) error {
	op := errors.Opf("controller.ForgotPassword(%q)", req.Email)

	usr, err := u.Store.GetUserByEmail(ctx, req.Email)
	if err != nil {
		log.FromContext(ctx).Print(errors.E(op, err))

		return nil
	}

	link := u.Magic.Link("change-password", usr.Email, usr.PasswordDigest)

	err = u.Email.SendForgotPassword(ctx, usr, link)
	if err != nil {
		return errors.E(op, err)
	}

	return nil
}

func (u *User) ChangePassword(ctx context.Context, req *handler.ChangePasswordRequest) (*model.User, error) {
	op := errors.Opf("controller.ChangePassword(%q)", req.Email)

	usr, err := u.Store.GetUserByEmail(ctx, req.Email)
	if err != nil {
		return nil, errors.E(op, err, http.StatusUnauthorized)
	}

	if err := u.Magic.Verify(
		usr.Email,
		req.Timestamp,
		usr.PasswordDigest,
		req.Signature,
		time.Hour,
	); err != nil {
		return nil, errors.E(op, err)
	}

	digest, err := model.NewPasswordDigest(req.Password)
	if err != nil {
		return nil, errors.E(op, err)
	}

	usr.PasswordDigest = digest
	usr.RefreshSession()

	usr, err = u.Store.UpdateUser(ctx, usr)
	if err != nil {
		return nil, errors.E(op, err)
	}

	return usr, nil
}
