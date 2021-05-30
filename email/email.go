package email

import (
	"context"

	"github.com/linksort/linksort/log"
	"github.com/linksort/linksort/model"
)

type Client struct{}

func New() *Client {
	return &Client{}
}

func (c *Client) SendForgotPassword(ctx context.Context, usr *model.User, link string) error {
	log.FromContext(ctx).Printf("email=%s link=%s", usr.Email, link)

	return nil
}
