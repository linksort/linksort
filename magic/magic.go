package magic

import (
	"bytes"
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
	// Get time and convert to epoc string
	ts := time.Now().Unix()
	sts := strconv.FormatInt(ts, 10)
	b64ts := base64.URLEncoding.EncodeToString([]byte(sts))

	u := url.URL{
		Scheme: "https",
		Host:   "linksort.com",
		Path:   action,
		RawQuery: url.Values{
			"t": []string{b64ts},
			"u": []string{strings.ToLower(email)},
			"s": []string{c.getSignature(email, b64ts, salt)},
		}.Encode(),
	}

	return u.String()
}

func (c *Client) Verify(email, b64ts, salt, sig string, expiry time.Duration) error {
	op := errors.Op("magic.Verify")

	if sig != c.getSignature(email, b64ts, salt) {
		return errors.E(op, http.StatusUnauthorized, errors.Str("invalid signature"))
	}

	if err := isExpired(b64ts, expiry); err != nil {
		return errors.E(op, err)
	}

	return nil
}

func (c *Client) CSRF() []byte {
	ts := time.Now().Unix()
	sts := strconv.FormatInt(ts, 10)
	b64ts := base64.URLEncoding.EncodeToString([]byte(sts))

	sig := c.getSignature("", b64ts, "")
	token := fmt.Sprintf("%s.%s", b64ts, sig)

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

func (c *Client) getSignature(email, b64ts, salt string) string {
	h := hmac.New(sha256.New, []byte(c.secret))

	if _, err := h.Write([]byte(email + b64ts + salt)); err != nil {
		panic(errors.E(errors.Opf("getSignature(b64ts=%s, salt=%s)", b64ts, salt), err))
	}

	sha := hex.EncodeToString(h.Sum(nil))

	return sha
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
			errors.M{"message": "This link has expired."})
	}

	return nil
}

func timeFromB64(b64ts string) (time.Time, error) {
	op := errors.Op("magic.timeFromB64")

	byteTime, err := base64.URLEncoding.DecodeString(b64ts)
	if err != nil {
		return time.Now(), errors.E(op, http.StatusBadRequest, err)
	}

	stringTime := bytes.NewBuffer(byteTime).String()

	intTime, err := strconv.Atoi(stringTime)
	if err != nil {
		return time.Now(), errors.E(op, http.StatusBadRequest, err)
	}

	timestamp := time.Unix(int64(intTime), 0)

	return timestamp, nil
}
