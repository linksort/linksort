// Package transport provides utilities for dealing with HTTP requests and responses.
// It integrates with sibling packages log and errors.
package transport

import (
	"encoding/json"
	"net/http"

	"github.com/go-playground/validator"

	"github.com/linksort/linksort/errors"
	"github.com/linksort/linksort/log"
)

// nolint
var (
	encodedErrResp []byte = json.RawMessage(`{"message":"Something has gone wrong"}`)
	v                     = validator.New()
)

// ClientReporter provides information about an error such that client and
// server errors can be distinguished and handled appropriately.
type ClientReporter interface {
	error
	Message() map[string]string
	Status() int
}

// Error writes an appropriate error response to the given response
// writer. If the given error implements ClientReport, then the values from
// ErrorReport() and StatusCode() are written to the response, except in
// the case of a 5XX error, where the error is logged and a default message is
// written to the response.
func Error(w http.ResponseWriter, r *http.Request, e error) {
	// nolint
	if cr, ok := e.(ClientReporter); ok {
		status := cr.Status()
		if status >= http.StatusInternalServerError {
			handleInternalServerError(w, e)

			return
		}

		log.Printf("Client Error: %v", e)

		Write(w, r, cr.Message(), status)

		return
	}

	handleInternalServerError(w, e)
}

// Read unmarshals the payload from the incoming request to the given sturct pointer.
func Read(dst interface{}, r *http.Request) error {
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(dst); err != nil {
		return errors.E(errors.Op("transport.Read"), http.StatusBadRequest, err,
			map[string]string{"message": "Could not decode request body"})
	}

	return nil
}

// Write writes the given interface to the response. If the interface
// cannot be marshaled, a 500 error is written instead. If the writer
// cannot be written to, then this function panics.
func Write(w http.ResponseWriter, r *http.Request, payload interface{}, status int) {
	encoded, err := json.Marshal(payload)
	if err != nil {
		handleInternalServerError(w, errors.E(errors.Op("transport.Write"), err))
	} else {
		w.Header().Add("Content-Type", "application/json")
		w.WriteHeader(status)

		_, err := w.Write(encoded)
		if err != nil {
			panic(errors.E(errors.Op("transport.Write"), err))
		}
	}
}

// Valid validates the given struct.
func Valid(dst interface{}) error {
	// TODO: Massage errors
	return v.Struct(dst)
}

// ReadValid is equivalent to calling Read followed by Valid.
func ReadValid(dst interface{}, r *http.Request) error {
	op := errors.Op("transport.ReadValid")

	if err := Read(dst, r); err != nil {
		return errors.E(op, err)
	}

	if err := v.Struct(dst); err != nil {
		return errors.E(op, err)
	}

	return nil
}

// handleInternalServerError writes the given error to stderr and returns a
// 500 response with a default message.
func handleInternalServerError(w http.ResponseWriter, e error) {
	log.Alarm(e)
	w.Header().Add("Content-Type", "application/json")
	w.WriteHeader(http.StatusInternalServerError)

	if _, err := w.Write(encodedErrResp); err != nil {
		panic(errors.E(errors.Op("transport.handleInternalServerError"), err))
	}
}
