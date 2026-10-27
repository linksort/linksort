package agent

import (
	"context"
	"encoding/json"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime/document"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime/types"
	"github.com/linksort/linksort/log"
)

type Agent struct {
	System   string
	Messages []Message
	Tools    []Tool
	Stream   chan any
	Client   ConverseStreamProvider
}

type ConverseStreamProvider interface {
	ConverseStream(
		ctx context.Context,
		params *bedrockruntime.ConverseStreamInput,
		optFns ...func(*bedrockruntime.Options),
	) (ConverseStreamOutputStreamGetter, error)
}

type ConverseStreamOutputStreamGetter interface {
	GetStream() *bedrockruntime.ConverseStreamEventStream
}

type Config struct {
	System   string
	Messages []Message
	Tools    []Tool
	Client   ConverseStreamProvider
}

type Message struct {
	Role Role
	// If IsToolUse is true, then the ToolUse field must be populated. Otherwise, the Text field must be populated.
	IsToolUse bool
	ToolUse   *[]ToolUse
	Text      *[]string
}

type Role string

const (
	RoleUser      Role = "user"
	RoleAssistant Role = "assistant"
)

type ToolUse struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	// If ToolUseType is "request", then the Request field must be populated.
	// If ToolUseType is "response", then the Response field must be populated.
	Type     ToolUseType      `json:"type"`
	Request  *ToolUseRequest  `json:"request,omitempty"`
	Response *ToolUseResponse `json:"response,omitempty"`
}

type ToolUseType string

const (
	ToolUseTypeRequest  ToolUseType = "request"
	ToolUseTypeResponse ToolUseType = "response"
)

type ToolUseRequest struct {
	Text string `json:"text"`
}

type ToolUseResponse struct {
	Status ToolUseStatus `json:"status"`
	Text   string        `json:"text"`
}

type ToolUseStatus string

const (
	ToolUseStatusSuccess ToolUseStatus = "success"
	ToolUseStatusError   ToolUseStatus = "error"
)

type Tool interface {
	Spec() Spec
	Use(ctx context.Context, id string, input string) ToolUseResponse
}

type Spec struct {
	Name        string
	Description string
	// InputSchema must be JSON serializable.
	InputSchema any
}

func New(c Config) *Agent {
	return &Agent{
		System:   c.System,
		Tools:    c.Tools,
		Messages: trim(c.Messages),
		Stream:   make(chan any),
		Client:   c.Client,
	}
}

func trim(messages []Message) []Message {
	if len(messages) > 0 {
		if messages[0].IsToolUse {
			message := messages[0]
			toolUseList := *message.ToolUse
			if toolUseList[0].Type == ToolUseTypeResponse {
				return messages[1:]
			}
		}
	}
	return messages
}

func nonTerminalStopReason(stopReson string) bool {
	switch stopReson {
	case "end_turn", "max_tokens", "stop_sequence", "guardrail_intervened", "content_filtered":
		return false
	case "tool_use", "":
		return true
	default:
		return false
	}
}

func (a *Agent) Act(ctx context.Context) error {
	ll := log.FromContext(ctx)
	defer close(a.Stream)

	stopReason := ""
	iterations := 1
	for nonTerminalStopReason(stopReason) {
		ll.Printf("calling ConverseStream: [iteration=%d]", iterations)
		resp, err := a.Client.ConverseStream(ctx, &bedrockruntime.ConverseStreamInput{
			// ModelId: aws.String("us.anthropic.claude-3-5-sonnet-20241022-v2:0"),
			ModelId: aws.String("us.anthropic.claude-haiku-4-5-20251001-v1:0"),
			System: []types.SystemContentBlock{
				&types.SystemContentBlockMemberText{
					Value: a.System,
				},
			},
			Messages:   mapMessages(a.Messages),
			ToolConfig: mapTools(a.Tools),
		})
		if err != nil {
			ll.Printf("error calling ConverseStream: %v", err)
			if strings.Contains(err.Error(), "Input is too long for requested model") {
				ll.Print("cutting messages")
				a.Messages = a.Messages[2:]
				if a.Messages[0].IsToolUse && (*a.Messages[0].ToolUse)[0].Type == ToolUseTypeResponse {
					a.Messages = a.Messages[1:]
				}
				continue
			}

			return err
		}

		nextMessage := Message{}

		respStream := resp.GetStream()
		err = respStream.Err()
		if err != nil {
			ll.Printf("error reading from ConverseStream response: %v", err)
			return err
		}
		defer respStream.Close()

		for ev := range respStream.Events() {
			switch event := ev.(type) {
			case *types.ConverseStreamOutputMemberMessageStart:
				switch event.Value.Role {
				case types.ConversationRoleAssistant:
					nextMessage.Role = RoleAssistant
				case types.ConversationRoleUser:
					nextMessage.Role = RoleUser
				}
			case *types.ConverseStreamOutputMemberMessageStop:
				stopReason = string(event.Value.StopReason)
			case *types.ConverseStreamOutputMemberContentBlockStart:
				switch toolUse := event.Value.Start.(type) {
				case *types.ContentBlockStartMemberToolUse:
					if !nextMessage.IsToolUse {
						nextMessage.IsToolUse = true
						toolUseList := make([]ToolUse, 0)
						nextMessage.ToolUse = &toolUseList
					}

					seen := false
					for _, tu := range *nextMessage.ToolUse {
						if tu.ID == *toolUse.Value.ToolUseId {
							seen = true
						}
					}

					if !seen {
						*nextMessage.ToolUse = append(*nextMessage.ToolUse, ToolUse{
							ID:   *toolUse.Value.ToolUseId,
							Name: *toolUse.Value.Name,
							Type: ToolUseTypeRequest,
						})
					}
				}
			case *types.ConverseStreamOutputMemberContentBlockDelta:
				switch delta := event.Value.Delta.(type) {
				case *types.ContentBlockDeltaMemberText:
					if nextMessage.Text == nil {
						textArray := []string{""}
						nextMessage.Text = &textArray
					} else if len(*nextMessage.Text) == 0 {
						*nextMessage.Text = append(*nextMessage.Text, "")
					}

					// Append to the last text entry
					lastIndex := len(*nextMessage.Text) - 1
					(*nextMessage.Text)[lastIndex] += delta.Value
					a.Stream <- delta.Value
				case *types.ContentBlockDeltaMemberToolUse:
					toolUseList := *nextMessage.ToolUse
					target := toolUseList[len(toolUseList)-1].Request
					if target == nil {
						toolUseList[len(toolUseList)-1].Request = &ToolUseRequest{
							Text: *delta.Value.Input,
						}
					} else {
						target.Text += *delta.Value.Input
					}
				}
			case *types.ConverseStreamOutputMemberContentBlockStop:
			}
		}

		a.Messages = append(a.Messages, nextMessage)
		// Send completed message to the stream
		a.Stream <- nextMessage

		if nextMessage.IsToolUse {
			toolUseList := make([]ToolUse, 0)
			toolUseResponseMessage := Message{
				Role:      RoleUser,
				IsToolUse: true,
				ToolUse:   &toolUseList,
			}

			for _, toolUse := range *nextMessage.ToolUse {
				nextToolUse := ToolUse{
					ID:   toolUse.ID,
					Name: toolUse.Name,
					Type: ToolUseTypeResponse,
				}

				foundTool := false
				for _, tool := range a.Tools {
					if toolUse.Name == tool.Spec().Name {
						foundTool = true

						ll.Printf("calling tool %q", toolUse.Name)
						resp := tool.Use(ctx, toolUse.ID, toolUse.Request.Text)
						ll.Printf("tool %q response: [status=%q]", toolUse.Name, resp.Status)
						nextToolUse.Response = &ToolUseResponse{
							Status: resp.Status,
							Text:   resp.Text,
						}
					}
				}

				if !foundTool {
					nextToolUse.Response = &ToolUseResponse{
						Status: ToolUseStatusError,
						Text:   "The selected tool does not exist.",
					}
				}

				toolUseList = append(toolUseList, nextToolUse)
			}

			a.Messages = append(a.Messages, toolUseResponseMessage)
			// Send tool response message to the stream
			a.Stream <- toolUseResponseMessage
		}

		iterations++

		if iterations > 16 {
			break
		}
	}

	return nil
}

func mapMessages(messages []Message) []types.Message {
	var result []types.Message

	for _, msg := range messages {
		typesMsg := types.Message{
			Role:    types.ConversationRole(msg.Role),
			Content: []types.ContentBlock{},
		}

		if msg.IsToolUse && msg.ToolUse != nil {
			// Handle tool use messages
			for _, tu := range *msg.ToolUse {
				if tu.Type == ToolUseTypeRequest {
					toolUseInput := make(map[string]any)
					json.Unmarshal([]byte(tu.Request.Text), &toolUseInput)
					// Add tool use request
					typesMsg.Content = append(typesMsg.Content, &types.ContentBlockMemberToolUse{
						Value: types.ToolUseBlock{
							ToolUseId: &tu.ID,
							Name:      &tu.Name,
							Input:     document.NewLazyDocument(toolUseInput),
						},
					})
				} else if tu.Type == ToolUseTypeResponse && tu.Response != nil {
					// Add tool use response
					typesMsg.Content = append(typesMsg.Content, &types.ContentBlockMemberToolResult{
						Value: types.ToolResultBlock{
							ToolUseId: &tu.ID,
							Content: []types.ToolResultContentBlock{
								&types.ToolResultContentBlockMemberText{
									Value: tu.Response.Text,
								},
							},
						},
					})
				}
			}
		} else if msg.Text != nil {
			// Handle text messages - iterate through all text entries
			for _, text := range *msg.Text {
				typesMsg.Content = append(typesMsg.Content, &types.ContentBlockMemberText{
					Value: text,
				})
			}
		}

		result = append(result, typesMsg)
	}

	return result
}

func mapTools(tools []Tool) *types.ToolConfiguration {
	if len(tools) == 0 {
		return nil
	}

	var awsTools []types.Tool
	for _, tool := range tools {
		spec := tool.Spec()
		awsTools = append(awsTools, &types.ToolMemberToolSpec{
			Value: types.ToolSpecification{
				Name:        &spec.Name,
				Description: &spec.Description,
				InputSchema: &types.ToolInputSchemaMemberJson{
					Value: document.NewLazyDocument(spec.InputSchema),
				},
			},
		})
	}

	return &types.ToolConfiguration{
		Tools: awsTools,
		// Using Auto as the default tool choice, which lets the model decide
		// whether to use tools or generate text
		ToolChoice: &types.ToolChoiceMemberAuto{
			Value: types.AutoToolChoice{},
		},
	}
}
