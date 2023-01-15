package analyze

import "context"

type nullBackend struct{}

func newNullBackend(ctx context.Context) (*nullBackend, error) {
	return &nullBackend{}, nil
}

func (n *nullBackend) Classify(ctx context.Context, dat *Response) (*Response, error) {
	return dat, nil
}

func (n *nullBackend) Close() error {
	return nil
}
