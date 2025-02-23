package agent

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime/document"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime/types"
)

type Agent struct {
	System   string
	Messages []Message
	Tools    []Tool
	Client   *bedrockruntime.Client
	Stream   chan string
}

type Config struct {
	System   string
	Messages []Message
	Tools    []Tool
	Client   *bedrockruntime.Client
}

type Message struct {
	Role Role
	// If IsToolUse is true, then the ToolUse field must be populated. Otherwise, the Text field must be populated.
	IsToolUse bool
	ToolUse   *[]ToolUse
	Text      *string
}

type Role string

const (
	RoleUser      Role = "user"
	RoleAssistant Role = "assistant"
)

type ToolUse struct {
	ID   string
	Name string
	// If ToolUseType is "request", then the Request field must be populated.
	// If ToolUseType is "response", then the Response field must be populated.
	Type     ToolUseType
	Request  *ToolUseRequest
	Response *ToolUseResponse
}

type ToolUseType string

const (
	ToolUseTypeRequest  ToolUseType = "request"
	ToolUseTypeResponse ToolUseType = "response"
)

type ToolUseRequest struct {
	Text string
}

type ToolUseResponse struct {
	Status ToolUseStatus
	Text   string
}

type ToolUseStatus string

const (
	ToolUseStatusSuccess ToolUseStatus = "success"
	ToolUseStatusError   ToolUseStatus = "error"
)

type Tool interface {
	Spec() Spec
	Use(id string, input string) ToolUseResponse
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
		Messages: c.Messages,
		Stream:   make(chan string),
	}
}

func nonTerminalStopReason(stopReson string) bool {
	switch stopReson {
	case "end_turn", "max_tokens", "stop_sequence", "guardrail_intervened", "content_filtered":
		return false
	case "tool_use":
		return true
	default:
		return false
	}
}

func (a *Agent) Act(ctx context.Context) error {
	stopReason := ""
	for nonTerminalStopReason(stopReason) {
		resp, err := a.Client.ConverseStream(ctx, &bedrockruntime.ConverseStreamInput{
			ModelId: aws.String(""),
			System: []types.SystemContentBlock{
				&types.SystemContentBlockMemberText{
					Value: a.System,
				},
			},
			Messages:   mapMessages(a.Messages),
			ToolConfig: mapTools(a.Tools),
		})
		if err != nil {
			return err
		}

		nextMessage := Message{}

		respStream := resp.GetStream()
		for ev := range respStream.Reader.Events() {
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
						text := ""
						nextMessage.Text = &text
					}

					*nextMessage.Text += delta.Value
					a.Stream <- delta.Value
				case *types.ContentBlockDeltaMemberToolUse:
					toolUseList := *nextMessage.ToolUse
					toolUseList[len(toolUseList)-1].Request = &ToolUseRequest{
						Text: *delta.Value.Input,
					}
				}
			case *types.ConverseStreamOutputMemberContentBlockStop:
				a.Messages = append(a.Messages, nextMessage)
			}
		}

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
						resp := tool.Use(toolUse.ID, toolUse.Request.Text)
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
		}
	}

	return nil
}

func mapMessages(messages []Message) []types.Message {
	var result []types.Message

	for _, msg := range messages {
		typesMsg := types.Message{
			Role: types.ConversationRole(msg.Role),
			Content: []types.ContentBlock{},
		}

		if msg.IsToolUse && msg.ToolUse != nil {
			// Handle tool use messages
			for _, tu := range *msg.ToolUse {
				if tu.Type == ToolUseTypeRequest {
					// Add tool use request
					typesMsg.Content = append(typesMsg.Content, &types.ContentBlockMemberToolUse{
						Value: types.ToolUseBlock{
							ToolUseId: &tu.ID,
							Name:      &tu.Name,
							Input:     document.NewLazyDocument(tu.Request.Text),
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
			// Handle text messages
			typesMsg.Content = append(typesMsg.Content, &types.ContentBlockMemberText{
				Value: *msg.Text,
			})
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
