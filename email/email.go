package email

import (
	"context"
	"fmt"

	"github.com/mailgun/mailgun-go/v3"

	"github.com/linksort/linksort/errors"
	"github.com/linksort/linksort/log"
	"github.com/linksort/linksort/model"
)

type Client struct {
	mg *mailgun.MailgunImpl
}

func New(apiKey string) *Client {
	return &Client{
		mg: mailgun.NewMailgun("mg.linksort.com", apiKey),
	}
}

func (c *Client) SendForgotPassword(ctx context.Context, usr *model.User, link string) error {
	op := errors.Opf("SendForgotPassword(UserID=%s)", usr.ID)

	m := c.mg.NewMessage(
		"Linksort Team <noreply@linksort.com>",
		"Password Reset",
		fmt.Sprintf(`Hi %s,

Use the following link to reset your password:

%s

Thanks,
Linksort Team`, usr.FirstName, link),
		usr.Email)

	_, id, err := c.mg.Send(ctx, m)
	if err != nil {
		return errors.E(op, err)
	}

	log.FromContext(ctx).Printf("SentEmailID=%s", id)

	return nil
}
