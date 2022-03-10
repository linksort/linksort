package analyze

import (
	"context"
	"errors"
	"fmt"
	"os"
	"strings"

	language "cloud.google.com/go/language/apiv1"
	"google.golang.org/api/option"
	languagepb "google.golang.org/genproto/googleapis/cloud/language/v1"
)

var (
	gcpKey          = os.Getenv("ANALYZER_KEY")
	errTooFewTokens = errors.New("too few tokens")
)

type gcpBackend struct {
	client *language.Client
}

func newGCPBackend(ctx context.Context) (*gcpBackend, error) {
	c, err := language.NewClient(ctx, option.WithCredentialsJSON([]byte(gcpKey)))
	if err != nil {
		return nil, fmt.Errorf("failed to bootstrap gcp client: %w", err)
	}

	return &gcpBackend{c}, nil
}

func (n *gcpBackend) Classify(ctx context.Context, dat *Response) (*Response, error) {
	gcpRes, err := n.client.ClassifyText(ctx, &languagepb.ClassifyTextRequest{
		Document: &languagepb.Document{
			Type: languagepb.Document_HTML,
			Source: &languagepb.Document_Content{
				Content: trim(dat.html),
			},
			Language: "en",
		},
	})
	if err != nil {
		if strings.Contains(err.Error(), "too few tokens (words) to process") {
			return dat, errTooFewTokens
		}

		return dat, err
	}

	dat.Tags = make([]*Tag, len(gcpRes.Categories))

	for i, cat := range gcpRes.Categories {
		dat.Tags[i] = &Tag{
			Name:       cat.Name,
			Confidence: cat.Confidence,
		}
	}

	return dat, nil
}

func (n *gcpBackend) Close() error {
	return n.client.Close()
}

func trim(s string) string {
	if len(s) < 1000000 {
		return s
	}

	return s[:1000000]
}
