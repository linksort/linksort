package analyze

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
)

const uclassifyEndpoint = "https://api.uclassify.com/v1/uClassify/iab-taxonomy/classify"

type uclassifyBackend struct {
	key        string
	httpClient *http.Client
}

func newUClassifyBackend(ctx context.Context, uclassifyKey string, c *http.Client) (*uclassifyBackend, error) {
	return &uclassifyBackend{uclassifyKey, c}, nil
}

func (n *uclassifyBackend) Classify(ctx context.Context, dat *Response) (*Response, error) {
	body, err := json.Marshal(map[string]interface{}{"texts": []string{dat.Corpus}})
	if err != nil {
		return nil, fmt.Errorf("failed to marshal json: %w", err)
	}

	req, err := http.NewRequestWithContext(
		ctx, http.MethodPost, uclassifyEndpoint, bytes.NewBuffer(body))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Token %s", n.key))
	req.Header.Set("Content-Type", "application/json")

	resp, err := n.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to do request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("received non-200 status code: %d", resp.StatusCode)
	}

	var responsePayload []interface{}

	err = json.NewDecoder(resp.Body).Decode(&responsePayload)
	if err != nil {
		return nil, fmt.Errorf("failed to decode response json: %w", err)
	}

	result := responsePayload[0].(map[string]interface{})
	categories := result["classification"].([]interface{})

	dat.Tags = make([]*Tag, len(categories))

	for i, iface := range categories {
		cat := iface.(map[string]interface{})

		confidence := cat["p"].(float64)

		dat.Tags[i] = &Tag{
			Name:       cat["className"].(string),
			Confidence: float32(confidence),
		}
	}

	return dat, nil
}

func (n *uclassifyBackend) Close() error {
	return nil
}
