package analyze

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"mime/multipart"
	"net/http"
	"strconv"
)

const mcEndpoint = "https://api.meaningcloud.com/deepcategorization-1.0"

var errNotOKStatus = errors.New("received non-ok status")

type mcBackend struct {
	key        string
	httpClient *http.Client
}

func newMCBackend(ctx context.Context, mcKey string, c *http.Client) (*mcBackend, error) {
	return &mcBackend{mcKey, c}, nil
}

func (n *mcBackend) Classify(ctx context.Context, dat *Response) (*Response, error) {
	body := new(bytes.Buffer)
	form := multipart.NewWriter(body)

	form.WriteField("key", n.key)
	form.WriteField("txt", dat.Corpus)
	form.WriteField("model", "IAB_2.0")

	err := form.Close()
	if err != nil {
		return nil, fmt.Errorf("failed write request payload: %w", err)
	}

	req, err := http.NewRequestWithContext(
		ctx, http.MethodPost, mcEndpoint, body)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", form.FormDataContentType())

	resp, err := n.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to do request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("received non-200 status code: %d", resp.StatusCode)
	}

	var responsePayload map[string]interface{}

	err = json.NewDecoder(resp.Body).Decode(&responsePayload)
	if err != nil {
		return nil, fmt.Errorf("failed to decode response json: %w", err)
	}

	status := responsePayload["status"].(map[string]interface{})
	if msg := status["msg"].(string); msg != "OK" {
		return nil, fmt.Errorf("%w: %s", errNotOKStatus, msg)
	}

	categories := responsePayload["category_list"].([]interface{})

	dat.Tags = make([]*Tag, len(categories))

	for i, iface := range categories {
		cat := iface.(map[string]interface{})

		confidence, err := strconv.ParseFloat(cat["relevance"].(string), 32)
		if err != nil {
			return nil, fmt.Errorf("failed to parse confidence: %w", err)
		}

		dat.Tags[i] = &Tag{
			Name:       cat["code"].(string),
			Confidence: float32(confidence),
		}
	}

	return dat, nil
}

func (n *mcBackend) Close() error {
	return nil
}
