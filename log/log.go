// Package log provides helpers for logging and error reporting.
package log

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	raven "github.com/getsentry/raven-go"
	"github.com/linksort/linksort/errors"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/hlog"
)

// nolint
var _logger zerolog.Logger

func ConfigureGlobalLogger(ctx context.Context, isProd bool) {
	var writer io.Writer
	if isProd {
		writer = newCloudwatchSink(ctx, os.Stderr)
	} else {
		writer = zerolog.ConsoleWriter{Out: os.Stderr}
	}

	_logger = zerolog.New(writer).
		With().
		Timestamp().
		Logger()
}

type Printer interface {
	Print(v ...interface{})
	Printf(format string, i ...interface{})
}

// Print logs to stderr.
func Print(v ...interface{}) {
	_logger.Print(v...)
}

// Printf logs to stderr with a format string.
func Printf(format string, i ...interface{}) {
	_logger.Printf(format, i...)
}

// Fatal is equivalent to Print() followed by a call to panic().
func Panicf(format string, i ...interface{}) {
	_logger.Printf(format, i...)
	panic(fmt.Sprintf(format, i...))
}

// Alarm logs the error to stderr and triggers an alarm.
func Alarm(err error) {
	raven.CaptureError(err, nil)
	_logger.Error().Msg(err.Error())
}

// AlarmWithContext logs the error to stderr and triggers an alarm that includes information,
// such as the request ID, from the given context.
func AlarmWithContext(ctx context.Context, err error) {
	raven.CaptureError(errors.E(errors.Opf("RequestID=%s", requestIDFromContext(ctx)), err), nil)
	FromContext(ctx).Print(err.Error())
}

// Fatal is equivalent to Print() followed by a call to os.Exit(1).
func Fatal(v ...interface{}) {
	_logger.Fatal().Msg(fmt.Sprint(v...))
}

// FromContext returns a Printer from the given request.
func FromRequest(r *http.Request) Printer {
	return hlog.FromRequest(r)
}

// FromContext returns a Printer from the given context.
func FromContext(ctx context.Context) Printer {
	return zerolog.Ctx(ctx)
}

// WithAccessLogging prints access logs for the given handler.
func WithAccessLogging(h http.Handler) http.Handler {
	return hlog.NewHandler(_logger)(
		hlog.AccessHandler(func(r *http.Request, status, size int, duration time.Duration) {
			hlog.FromRequest(r).Info().
				Str("Method", r.Method).
				Str("UserAgent", r.UserAgent()).
				Str("IP", r.Header.Get("X-Forwarded-For")).
				Stringer("URL", r.URL).
				Int("Status", status).
				Int("Size", size).
				Dur("Duration", duration).
				Msg("")
		})(
			hlog.RequestIDHandler("RequestID", "X-Request-ID")(
				h,
			),
		),
	)
}

// RequestIDFromContext gets the request's ID from the context, if there is one.
func requestIDFromContext(ctx context.Context) string {
	id, ok := hlog.IDFromCtx(ctx)
	if ok {
		return id.String()
	}

	return "missing-request-id"
}
