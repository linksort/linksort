package controller

import (
	"context"

	handler "github.com/linksort/linksort/handler/user"
	"github.com/linksort/linksort/model"
)

type Session struct{}

func (s *Session) CreateSession(context.Context, *handler.CreateSessionRequest) (*model.User, error) {
	return nil, nil
}

func (s *Session) DeleteSession(context.Context, *model.User) error {
	return nil
}
