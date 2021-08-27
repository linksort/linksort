package magic

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/linksort/linksort/errors"
)

type Client struct {
	secret string
}

func New(secret string) *Client {
	return &Client{secret}
}

func (c *Client) Link(action, email, salt string) string {
	ts := b64ts()

	u := url.URL{
		Scheme: "https",
		Host:   "linksort.com",
		Path:   action,
		RawQuery: url.Values{
			"t": []string{ts},
			"u": []string{strings.ToLower(email)},
			"s": []string{c.getSignature(email, ts, salt)},
		}.Encode(),
	}

	return u.String()
}

func (c *Client) Verify(id, b64ts, salt, sig string, expiry time.Duration) error {
	op := errors.Op("magic.Verify")

	if sig != c.getSignature(id, b64ts, salt) {
		return errors.E(op, http.StatusUnauthorized, errors.Str("invalid signature"))
	}

	if err := isExpired(b64ts, expiry); err != nil {
		return errors.E(op, err)
	}

	return nil
}

func (c *Client) CSRF() []byte {
	ts := b64ts()
	sig := c.getSignature("", ts, "")
	token := fmt.Sprintf("%s.%s", ts, sig)
	return []byte(token)
}

func (c *Client) VerifyCSRF(token string, expiry time.Duration) error {
	op := errors.Op("magic.VerifyCSRF")

	split := strings.Split(token, ".")
	if len(split) != 2 {
		return errors.E(op, http.StatusUnauthorized, errors.Str("invalid signature"))
	}

	return c.Verify("", split[0], "", split[1], expiry)
}

func (c *Client) UserCSRF(sessionID string) []byte {
	ts := b64ts()
	sig := c.getSignature("", ts, sessionID)
	token := fmt.Sprintf("%s.%s", ts, sig)
	return []byte(token)
}

func (c *Client) VerifyUserCSRF(token, sessionID string, expiry time.Duration) error {
	op := errors.Op("magic.VerifyUserCSRF")

	split := strings.Split(token, ".")
	if len(split) != 2 {
		return errors.E(op, http.StatusUnauthorized, errors.Str("invalid signature"))
	}

	return c.Verify("", split[0], sessionID, split[1], expiry)
}

func (c *Client) getSignature(id, b64ts, salt string) string {
	h := hmac.New(sha256.New, []byte(c.secret))

	if _, err := h.Write([]byte(id + b64ts + salt)); err != nil {
		panic(errors.E(errors.Opf("getSignature(b64ts=%s, salt=%s)", b64ts, salt), err))
	}

	return hex.EncodeToString(h.Sum(nil))
}

func isExpired(b64ts string, expiry time.Duration) error {
	op := errors.Op("magic.TooOld")

	ts, err := timeFromB64(b64ts)
	if err != nil {
		return errors.E(op, http.StatusUnauthorized, err)
	}

	if diff := time.Since(ts); diff > expiry {
		return errors.E(
			op,
			http.StatusUnauthorized,
			errors.Str("expired"),
			errors.M{"message": "The given security token has expired."})
	}

	return nil
}

func timeFromB64(b64ts string) (time.Time, error) {
	op := errors.Op("magic.timeFromB64")

	byteTime, err := base64.URLEncoding.DecodeString(b64ts)
	if err != nil {
		return time.Now(), errors.E(op, http.StatusBadRequest, err)
	}

	intTime, err := strconv.Atoi(string(byteTime))
	if err != nil {
		return time.Now(), errors.E(op, http.StatusBadRequest, err)
	}

	return time.Unix(int64(intTime), 0), nil
}

func b64ts() string {
	sts := strconv.FormatInt(time.Now().Unix(), 10)
	return base64.URLEncoding.EncodeToString([]byte(sts))
}
