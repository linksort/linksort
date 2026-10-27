package testutil

import (
	"context"
	"io"
	"strings"
	"sync"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime/types"
	"github.com/linksort/linksort/agent"
)

// DefaultMockResponse is the reply streamed by MockBedrockClient when no
// script has been set.
const DefaultMockResponse = "Hello world! I'm a mock assistant response."

// MockToolCall describes a tool invocation that the mock model requests.
type MockToolCall struct {
	ID    string
	Name  string
	Input string // JSON input for the tool
}

// MockTurn is one scripted model turn. If ToolCalls is non-empty, the turn
// ends with stop reason "tool_use" so the agent loop executes the tools and
// calls ConverseStream again (consuming the next scripted turn).
type MockTurn struct {
	Text      string
	ToolCalls []MockToolCall
}

// MockBedrockClient implements a mock version of the BedrockClient interface
// for testing purposes. By default it streams DefaultMockResponse. Tests can
// script one or more turns with SetScript; each call to ConverseStream
// consumes one turn, and when the script is exhausted the default reply is
// used again.
type MockBedrockClient struct {
	mu     sync.Mutex
	script []MockTurn
}

// SetScript replaces any pending scripted turns.
func (m *MockBedrockClient) SetScript(turns ...MockTurn) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.script = append([]MockTurn{}, turns...)
}

// Reset clears any pending scripted turns, restoring default behavior.
func (m *MockBedrockClient) Reset() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.script = nil
}

func (m *MockBedrockClient) nextTurn() MockTurn {
	m.mu.Lock()
	defer m.mu.Unlock()

	if len(m.script) > 0 {
		turn := m.script[0]
		m.script = m.script[1:]
		return turn
	}

	return MockTurn{Text: DefaultMockResponse}
}

// MockEventReader implements a simple event reader for the mock response
type MockEventReader struct {
	events []types.ConverseStreamOutput
	index  int
	ch     chan types.ConverseStreamOutput
}

func (r *MockEventReader) Next() (types.ConverseStreamOutput, error) {
	if r.index >= len(r.events) {
		return nil, io.EOF
	}
	event := r.events[r.index]
	r.index++
	return event, nil
}

func (r *MockEventReader) Close() error {
	return nil
}

func (r *MockEventReader) Err() error {
	return nil
}

func (r *MockEventReader) Events() <-chan types.ConverseStreamOutput {
	r.ch = make(chan types.ConverseStreamOutput)

	go func() {
		defer close(r.ch)

		for {
			event, err := r.Next()
			if err == io.EOF {
				return
			}
			r.ch <- event
			// Add a small delay to simulate streaming
			time.Sleep(10 * time.Millisecond)
		}
	}()

	return r.ch
}

// MockResponseStream implements the ConverseStreamOutput interface
type MockResponseStream struct {
	Reader *MockEventReader
}

func (s *MockResponseStream) GetStream() *bedrockruntime.ConverseStreamEventStream {
	return bedrockruntime.NewConverseStreamEventStream(func(cses *bedrockruntime.ConverseStreamEventStream) {
		cses.Reader = s.Reader
	})
}

// ConverseStream implements the BedrockClient interface method
func (m *MockBedrockClient) ConverseStream(
	ctx context.Context,
	params *bedrockruntime.ConverseStreamInput,
	optFns ...func(*bedrockruntime.Options),
) (agent.ConverseStreamOutputStreamGetter, error) {
	turn := m.nextTurn()

	events := []types.ConverseStreamOutput{
		&types.ConverseStreamOutputMemberMessageStart{
			Value: types.MessageStartEvent{
				Role: types.ConversationRoleAssistant,
			},
		},
	}

	// Split the response text into chunks to simulate streaming
	if turn.Text != "" {
		chunks := strings.Split(turn.Text, " ")
		for _, chunk := range chunks {
			events = append(events, &types.ConverseStreamOutputMemberContentBlockDelta{
				Value: types.ContentBlockDeltaEvent{
					Delta: &types.ContentBlockDeltaMemberText{
						Value: chunk + " ",
					},
				},
			})
		}

		events = append(events, &types.ConverseStreamOutputMemberContentBlockStop{})
	}

	// Emit tool use blocks, if any
	for _, tc := range turn.ToolCalls {
		input := tc.Input
		if input == "" {
			input = "{}"
		}

		events = append(events,
			&types.ConverseStreamOutputMemberContentBlockStart{
				Value: types.ContentBlockStartEvent{
					Start: &types.ContentBlockStartMemberToolUse{
						Value: types.ToolUseBlockStart{
							ToolUseId: aws.String(tc.ID),
							Name:      aws.String(tc.Name),
						},
					},
				},
			},
			&types.ConverseStreamOutputMemberContentBlockDelta{
				Value: types.ContentBlockDeltaEvent{
					Delta: &types.ContentBlockDeltaMemberToolUse{
						Value: types.ToolUseBlockDelta{
							Input: aws.String(input),
						},
					},
				},
			},
			&types.ConverseStreamOutputMemberContentBlockStop{},
		)
	}

	stopReason := types.StopReasonEndTurn
	if len(turn.ToolCalls) > 0 {
		stopReason = types.StopReasonToolUse
	}

	events = append(events,
		&types.ConverseStreamOutputMemberMessageStop{
			Value: types.MessageStopEvent{
				StopReason: stopReason,
			},
		},
	)

	reader := &MockEventReader{
		events: events,
		index:  0,
	}

	return &MockResponseStream{
		Reader: reader,
	}, nil
}
