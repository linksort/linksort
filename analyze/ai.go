package analyze

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime/types"
)

const systemPrompt = `# IDENTITY and PURPOSE

You are an expert content summarizer. You take in content and output cogent Markdown summaries according to the format below.

Before you begin, take a deep breath and think carefully about how to best accomplish your goal.

# FORMAT

- Output a bulleted list of at most 7 points summarizing the content in a clear and concise manner.
- In the first bullet point, combine all of your understanding of the content into one to three sentences that express the primary thesis of the text.
- In the remaining bullet points, output the most important points of the content. If there is a core argument expressed in the text, express that argument in these points.

# OUTPUT INSTRUCTIONS

- Create the output using the formatting above.
- You only output human readable Markdown.
- You only output bullet points.
- Do not output any headings or introductions.
- Do not output warnings or notes.
- Do not repeat items in the output sections.
- Do not start items with the same opening words.
`

// aiClient interface defines the methods that any AI provider should implement
type aiClient interface {
	Summarize(ctx context.Context, text string) (string, error)
}

type bedrockClient struct {
	client *bedrockruntime.Client
}

func (c *bedrockClient) Summarize(ctx context.Context, text string) (string, error) {
	resp, err := c.client.Converse(ctx, &bedrockruntime.ConverseInput{
		ModelId: aws.String("us.anthropic.claude-3-5-haiku-20241022-v1:0"),
		System: []types.SystemContentBlock{
			&types.SystemContentBlockMemberText{
				Value: systemPrompt,
			},
		},
		Messages: []types.Message{
			{
				Role: types.ConversationRoleUser,
				Content: []types.ContentBlock{
					&types.ContentBlockMemberText{
						Value: text,
					},
				},
			},
		},
	})
	if err != nil {
		return "", err
	}

	switch output := resp.Output.(type) {
	case *types.ConverseOutputMemberMessage:
		for i := range output.Value.Content {
			switch content := output.Value.Content[i].(type) {
			case *types.ContentBlockMemberText:
				return content.Value, nil
			}
		}
	}

	return "", fmt.Errorf("no summary content in the response")
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
func getAIClient(bedrockC *bedrockruntime.Client) (aiClient, error) {
	return &bedrockClient{bedrockC}, nil
}
