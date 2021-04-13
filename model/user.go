package model

import "context"

type User struct {
	Email     string
	SessionID string
}

type UserStore interface {
	GetUserBySessionID(context.Context, string) (*User, error)
	GetUserByEmail(context.Context, string) (*User, error)
	CreateUser(context.Context, *CreateUserInput) (*User, error)
	UpdateUser(context.Context, *User) (*User, error)
	DeleteUser(context.Context, *User) error
}

type CreateUserInput struct {
	Email     string
	FirstName string
	LastName  string
	Password  string
}

func (u *User) CheckPassword(passwd string) error {
	return nil
}

func (u *User) NewSession(ctx context.Context, s UserStore, passwd string) error {
	return nil
}

func (u *User) DeleteSession(ctx context.Context, s UserStore) error {
	return nil
}
