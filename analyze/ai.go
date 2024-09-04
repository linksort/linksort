package analyze

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

const systemPrompt = `# IDENTITY and PURPOSE

You are an expert content summarizer. You take in content and output a cogent plane text summary using the format below.

Take a deep breath and think about how to best accomplish your goal using the following steps.

# GOAL

- Output a bulleted list of at most 10 points summarizing the content in clear and concise manner.

- In the first bullet point, combine all of your understanding of the content into one to three sentences. These sentences should express the primary thesis of the text.

- In the remaining bullets, output the most important points of the content. If there is a core argument expressed in the text, this argument should also be expressed in these points.

# OUTPUT INSTRUCTIONS

- Create the output using the formatting above.
- You only output human readable plane text.
- Output bulleted lists, not numbers.
- Do not output warnings or notes—just the requested sections.
- Do not repeat items in the output sections.
- Do not start items with the same opening words.
- You are extremely smart and capable. I know you'll do a great job.

# INPUT:

INPUT:`

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
		apiKey: apiKey,
		httpClient: &http.Client{
			Timeout: time.Duration(defaultHTTPRequestTimeoutSeconds) * time.Second},
	}
}

// Summarize sends a request to Anthropic's API to summarize the given text
func (c *anthropicClient) Summarize(ctx context.Context, text string) (string, error) {
	// Only generate summary if text is more than roughly 1,500 words
	words := len(strings.Fields(text))
	if words <= 700 {
		return "", nil
	}

	const apiURL = "https://api.anthropic.com/v1/messages"

	requestBody, err := json.Marshal(map[string]interface{}{
		"model": "claude-3-haiku-20240307",
		"max_tokens": 665,
		"messages": []map[string]string{
			{
				"role": "user",
				"content": text,
			},
		},
		"system": systemPrompt,
	})
	if err != nil {
		return "", fmt.Errorf("error marshaling request body: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", apiURL, bytes.NewReader(requestBody))
	if err != nil {
		return "", fmt.Errorf("error creating request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", c.apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")

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
		Content []struct {
			Text string `json:"text"`
		} `json:"content"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("error decoding response: %w", err)
	}

	if len(result.Content) == 0 || result.Content[0].Text == "" {
		return "", fmt.Errorf("no summary content in the response")
	}

	return strings.TrimSpace(result.Content[0].Text), nil
}

// getAIClient returns an aiClient based on the environment configuration
func getAIClient() (aiClient, error) {
	apiKey := os.Getenv("ANTHROPIC_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("ANTHROPIC_API_KEY environment variable is not set")
	}
	return newAnthropicClient(apiKey), nil
}
