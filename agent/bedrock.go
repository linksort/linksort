package agent

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
)

func AdaptBedrock(c *bedrockruntime.Client) ConverseStreamProvider {
	return &BedrockAdapter{c}
}

type BedrockAdapter struct {
	client *bedrockruntime.Client
}

func (b *BedrockAdapter) ConverseStream(
	ctx context.Context,
	params *bedrockruntime.ConverseStreamInput,
	optFns ...func(*bedrockruntime.Options),
) (ConverseStreamOutputStreamGetter, error) {
	return b.client.ConverseStream(ctx, params, optFns...)
}
