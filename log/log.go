// Package log provides helpers for logging and error reporting.
package log

import (
	"log"
	"os"

	raven "github.com/getsentry/raven-go"
)

// nolint
var _logger = log.New(os.Stderr, "", log.LstdFlags)

// Print logs to stderr.
func Print(i ...interface{}) {
	_logger.Println(i...)
}

// Printf logs to stderr with a format string.
func Printf(format string, i ...interface{}) {
	_logger.Printf(format, i...)
}

func Panicf(format string, i ...interface{}) {
	_logger.Panicf(format, i...)
}

// Alarm logs the error to stderr and triggers an alarm.
func Alarm(err error) {
	raven.CaptureError(err, nil)
	_logger.Printf("Internal Server Error: %v", err.Error())
}

// Fatal is equivalent to Print() followed by a call to os.Exit(1).
func Fatal(v ...interface{}) {
	log.Fatal(v...)
}
