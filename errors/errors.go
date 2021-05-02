// Package errors defines error handling resources for Linksort.
// It is based on patterns developed at Upspin:
// https://commandcenter.blogspot.com/2017/12/error-handling-in-upspin.html
package errors

import (
	native "errors"
	"fmt"
	"net/http"
	"strings"
)

// Op describes an operation, usually as the package and method,
// such as "model.GetUser".
type Op string

// M is an alias for map[string]string whose purpose is just to save keystrokes.
type M map[string]string

// Error is the type that implements the error interface.
type Error struct {
	err      error
	status   int
	op       Op
	messages M
}

// E creates a new Error instance. The extras arguments can be (1) an error, (2)
// a message for the client as M, or (3) an HTTP status status. If
// one of the extras is an error that implements ClientReporter, its messages,
// if it has any, are merged into the new error's messages.
func E(op Op, extras ...interface{}) error {
	e := &Error{
		op:       op,
		status:   http.StatusInternalServerError,
		messages: M{},
	}

	for _, ex := range extras {
		switch t := ex.(type) {
		case *Error:
			// Merge client reports. If it is attempted to write the same key more
			// than once, the later write always wins.
			for k, v := range t.Message() {
				e.messages[k] = v
			}

			// If there is more than one error, which, as a best practice, there
			// shouldn't be, the last error wins.
			e.err = t

			// If the status has already been set to something other than the default
			// don't reset it; otherwise, inherit from t.
			if e.status == http.StatusInternalServerError {
				e.status = t.Status()
			}
		case int:
			e.status = t
		case error:
			e.err = t
		case M:
			// New error messages win.
			for k, v := range t {
				e.messages[k] = v
			}
		}
	}

	return e
}

// Error returns a string with information about the error for debugging purposes.
// This value should not be returned to the user.
func (e *Error) Error() string {
	b := new(strings.Builder)
	b.WriteString(fmt.Sprintf("%s: ", string(e.op)))

	if e.err != nil {
		b.WriteString(e.err.Error())
	}

	return b.String()
}

// Message returns a map of strings suitable to be returned to the end user.
func (e *Error) Message() map[string]string {
	if len(e.messages) == 0 {
		switch e.status {
		case http.StatusBadRequest:
			return M{"message": "The request was invalid"}
		case http.StatusUnauthorized:
			return M{"message": "Unauthorized"}
		case http.StatusForbidden:
			return M{"message": "You do not have permission to perform this action"}
		case http.StatusNotFound:
			return M{"message": "The requested resource was not found"}
		case http.StatusUnsupportedMediaType:
			return M{"message": "Unsupported content-type"}
		default:
			return M{"message": "Something went wrong"}
		}
	}

	return e.messages
}

// Status returns the HTTP status status for the error.
func (e *Error) Status() int {
	if e.status >= http.StatusBadRequest {
		return e.status
	}

	return http.StatusInternalServerError
}

// Unwrap returns the current error's underlying error, if there is one.
func (e *Error) Unwrap() error {
	return e.err
}

// Strf is the same as fmt.Errorf.
func Strf(format string, args ...interface{}) error {
	// nolint
	return fmt.Errorf(format, args...)
}

// Str returns an error from the given string.
func Str(s string) error {
	// nolint
	return fmt.Errorf(s)
}

// Opf returns an Op from the given format string.
func Opf(format string, args ...interface{}) Op {
	return Op(fmt.Sprintf(format, args...))
}

// Is is the same as native errors.Is.
func Is(err, target error) bool {
	return native.Is(err, target)
}

// As is the same as native errors.As.
func As(err error, target interface{}) bool {
	return native.As(err, target)
}

// Wrap is like E but it returns nil if the given error is nil.
func Wrap(op Op, err error) error {
	if err == nil {
		return nil
	}

	return E(op, err)
}

// Unwrap is the same as native errors.Unwrap.
func Unwrap(err error) error {
	return native.Unwrap(err)
}
