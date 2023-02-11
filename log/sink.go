package log

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"sync"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials/stscreds"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs/types"
	"github.com/aws/aws-sdk-go-v2/service/sts"
	raven "github.com/getsentry/raven-go"
)

const logGroupName = "linksort-main"

type sink struct {
	writer        io.Writer
	buffer        []types.InputLogEvent
	mutex         sync.Mutex
	logStreamName string
	client        interface {
		PutLogEvents(
			ctx context.Context,
			params *cloudwatchlogs.PutLogEventsInput,
			optFns ...func(*cloudwatchlogs.Options),
		) (*cloudwatchlogs.PutLogEventsOutput, error)
	}
}

func newCloudwatchSink(ctx context.Context, w io.Writer) *sink {
	s := &sink{
		writer: w,
	}
	s.setupCloudwatchClient(ctx)
	go s.run(ctx)
	return s
}

func (s *sink) Write(p []byte) (int, error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	if !bytes.Contains(p, []byte("ELB-HealthChecker")) {
		s.buffer = append(s.buffer, types.InputLogEvent{
			Message:   aws.String(string(p)),
			Timestamp: aws.Int64(time.Now().UnixMilli()),
		})
	}

	return s.writer.Write(p)
}

func (s *sink) run(ctx context.Context) {
	ticker := time.NewTicker(time.Second * 5)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			go s.flush()
		case <-ctx.Done():
			return
		}
	}
}

func (s *sink) flush() {
	s.putLogs(s.clearBuffer())
}

func (s *sink) clearBuffer() []types.InputLogEvent {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	if len(s.buffer) == 0 {
		return nil
	}

	dst := make([]types.InputLogEvent, len(s.buffer))
	copy(dst, s.buffer)
	// https://yourbasic.org/golang/clear-slice/
	s.buffer = s.buffer[:0]
	fmt.Println("cleared log buffer")
	return dst
}

func (s *sink) putLogs(logEvents []types.InputLogEvent) {
	if len(logEvents) == 0 {
		return
	}

	_, err := s.client.PutLogEvents(context.TODO(), &cloudwatchlogs.PutLogEventsInput{
		LogGroupName:  aws.String(logGroupName),
		LogStreamName: aws.String(s.logStreamName),
		LogEvents:     logEvents,
	})
	if err != nil {
		fmt.Printf("error: failed to put logs on cloudwatch: %v", err)
		raven.CaptureError(err, nil)
	} else {
		fmt.Println("put logs")
	}
}

func (s *sink) setupCloudwatchClient(ctx context.Context) {
	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	if err != nil {
		panic(err)
	}

	stsC := sts.NewFromConfig(cfg)
	provider := stscreds.NewAssumeRoleProvider(stsC, os.Getenv("LOG_PUTTER"))

	client := cloudwatchlogs.NewFromConfig(cfg, func(o *cloudwatchlogs.Options) {
		o.Credentials = provider
	})

	// Create the log group if it doesn't exist already
	_, err = client.CreateLogGroup(ctx, &cloudwatchlogs.CreateLogGroupInput{
		LogGroupName: aws.String(logGroupName),
	})
	if err != nil {
		alreadyExists := new(types.ResourceAlreadyExistsException)
		if !errors.As(err, &alreadyExists) {
			panic(err)
		}
	}

	// Create a log stream for this release
	s.logStreamName = os.Getenv("RELEASE")
	_, err = client.CreateLogStream(ctx, &cloudwatchlogs.CreateLogStreamInput{
		LogGroupName:  aws.String(logGroupName),
		LogStreamName: aws.String(s.logStreamName),
	})
	if err != nil {
		alreadyExists := new(types.ResourceAlreadyExistsException)
		if !errors.As(err, &alreadyExists) {
			panic(err)
		}
	}

	s.client = client
	fmt.Println("setup cloudwatchlogs client")
}
