package analyze

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

// aiClient interface defines the methods that any AI provider should implement
type aiClient interface {
	Summarize(ctx context.Context, text string) (string, error)
}

// anthropicClient implements the aiClient interface using Anthropic's API
type anthropicClient struct {
	apiKey     string
	httpClient *http.Client
}

// newAnthropicClient creates a new anthropicClient
func newAnthropicClient(apiKey string) *anthropicClient {
	return &anthropicClient{
		apiKey:     apiKey,
		httpClient: &http.Client{
			Timeout: time.Duration(defaultHTTPRequestTimeoutSeconds) * time.Second},
	}
}

// Summarize sends a request to Anthropic's API to summarize the given text
func (c *anthropicClient) Summarize(ctx context.Context, text string) (string, error) {
	const apiURL = "https://api.anthropic.com/v1/completions"

	prompt := fmt.Sprintf("Summarize the following text in a concise manner:\n\n%s", text)

	requestBody, err := json.Marshal(map[string]interface{}{
		"model":      "claude-2",
		"prompt":     prompt,
		"max_tokens": 150,
	})
	if err != nil {
		return "", fmt.Errorf("error marshaling request body: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", apiURL, strings.NewReader(string(requestBody)))
	if err != nil {
		return "", fmt.Errorf("error creating request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", c.apiKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("error sending request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var result struct {
		Completion string `json:"completion"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("error decoding response: %w", err)
	}

	return strings.TrimSpace(result.Completion), nil
}

// getAIClient returns an aiClient based on the environment configuration
func getAIClient() (aiClient, error) {
	apiKey := os.Getenv("ANTHROPIC_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("ANTHROPIC_API_KEY environment variable is not set")
	}
	return newAnthropicClient(apiKey), nil
}
