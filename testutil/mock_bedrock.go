package testutil

import (
	"context"
	"io"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime/types"
	"github.com/linksort/linksort/agent"
)

// MockBedrockClient implements a mock version of the BedrockClient interface
// for testing purposes. It returns a simple "hello world" response.
type MockBedrockClient struct{}

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
	// Create a simple response with "hello world"
	responseText := "Hello world! I'm a mock assistant response."

	// Create a series of events that simulate the streaming response
	events := []types.ConverseStreamOutput{
		// Message start event
		&types.ConverseStreamOutputMemberMessageStart{
			Value: types.MessageStartEvent{
				Role: types.ConversationRoleAssistant,
			},
		},
	}

	// Split the response text into chunks to simulate streaming
	chunks := strings.Split(responseText, " ")
	for _, chunk := range chunks {
		events = append(events, &types.ConverseStreamOutputMemberContentBlockDelta{
			Value: types.ContentBlockDeltaEvent{
				Delta: &types.ContentBlockDeltaMemberText{
					Value: chunk + " ",
				},
			},
		})
	}

	// Add content block stop and message stop events
	events = append(events,
		&types.ConverseStreamOutputMemberContentBlockStop{},
		&types.ConverseStreamOutputMemberMessageStop{
			Value: types.MessageStopEvent{
				StopReason: types.StopReasonEndTurn,
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
