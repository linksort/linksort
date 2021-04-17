package model

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"

	"github.com/linksort/linksort/errors"
)

type User struct {
	Key            primitive.ObjectID `json:"-" bson:"_id,omitempty"`
	ID             string             `json:"id"`
	Email          string             `json:"email"`
	FirstName      string             `json:"firstName"`
	LastName       string             `json:"lastName"`
	CreatedAt      time.Time          `json:"createdAt"`
	UpdatedAt      time.Time          `json:"updatedAt"`
	SessionID      string             `json:"-" bson:"sessionId,omitempty"`
	PasswordDigest string             `json:"-" bson:"passwordDigest"`
}

type UserStore interface {
	GetUserBySessionID(context.Context, string) (*User, error)
	GetUserByEmail(context.Context, string) (*User, error)
	CreateUser(context.Context, *User) (*User, error)
	UpdateUser(context.Context, *User) (*User, error)
	DeleteUser(context.Context, *User) error
}

func NewPasswordDigest(passwd string) (string, error) {
	op := errors.Op("model.NewPasswordDigest()")

	hash, err := bcrypt.GenerateFromPassword([]byte(passwd), 10)
	if err != nil {
		return "", errors.E(op, err)
	}

	return string(hash), nil
}

func (u *User) CheckPassword(passwd string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.PasswordDigest), []byte(passwd))

	return err == nil
}
