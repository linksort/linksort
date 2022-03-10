// Package payload provides utilities for dealing with HTTP request and response payloads.
// It integrates with sibling packages log and errors.
package payload

import (
	"encoding/json"
	"fmt"
	"html"
	"net/http"
	"reflect"
	"strings"

	"github.com/go-playground/validator"
	"github.com/microcosm-cc/bluemonday"

	"github.com/linksort/linksort/errors"
	"github.com/linksort/linksort/log"
)

// nolint
var (
	encodedErrResp []byte = json.RawMessage(`{"message":"Something has gone wrong"}`)
	v                     = validator.New()
)

// nolint
func init() {
	v.RegisterTagNameFunc(func(fld reflect.StructField) string {
		name := strings.SplitN(fld.Tag.Get("json"), ",", 2)[0]

		if name == "-" {
			return ""
		}

		return name
	})
}

// ClientReporter provides information about an error such that client and
// server errors can be distinguished and handled appropriately.
type ClientReporter interface {
	error
	Message() map[string]string
	Status() int
}

// WriteError writes an appropriate error response to the given response
// writer. If the given error implements ClientReport, then the values from
// ErrorReport() and StatusCode() are written to the response, except in
// the case of a 5XX error, where the error is logged and a default message is
// written to the response.
func WriteError(w http.ResponseWriter, r *http.Request, e error) {
	// nolint
	if cr, ok := e.(ClientReporter); ok {
		status := cr.Status()
		if status >= http.StatusInternalServerError {
			handleInternalServerError(w, r, e)

			return
		}

		log.FromRequest(r).Print(cr.Error())

		Write(w, r, cr.Message(), status)

		return
	}

	handleInternalServerError(w, r, e)
}

// Read unmarshals the payload from the incoming request to the given sturct pointer.
func Read(dst interface{}, r *http.Request) error {
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(dst); err != nil {
		return errors.E(errors.Op("payload.Read"), http.StatusBadRequest, err,
			map[string]string{"message": "Could not decode request body"})
	}

	return nil
}

// Write writes the given payload to the response. If the payload
// cannot be marshaled, a 500 error is written instead. If the writer
// cannot be written to, then this function panics.
func Write(w http.ResponseWriter, r *http.Request, payload interface{}, status int) {
	op := errors.Op("payload.Write")

	if payload == nil {
		w.WriteHeader(status)

		return
	}

	encoded, err := json.Marshal(payload)
	if err != nil {
		handleInternalServerError(w, r, errors.E(op, err))
	} else {
		w.Header().Add("Content-Type", "application/json")
		w.WriteHeader(status)

		_, err := w.Write(encoded)
		if err != nil {
			panic(errors.E(op, err))
		}
	}
}

// Valid validates the given struct.
func Valid(dst interface{}) error {
	rv := reflect.ValueOf(dst).Elem()

	for i := 0; i < rv.NumField(); i++ {
		val, ok := rv.Field(i).Interface().(string)
		if !ok {
			continue
		}

		switch rv.Type().Field(i).Name {
		case "Password":
			// Do nothing.
		case "Corpus":
			val = html.UnescapeString(bluemonday.UGCPolicy().Sanitize(val))
		default:
			val = strings.TrimSpace(val)
			val = html.UnescapeString(bluemonday.StrictPolicy().Sanitize(val))
		}

		if rv.Field(i).CanSet() {
			rv.Field(i).SetString(val)
		}
	}

	err := v.Struct(dst)
	if err == nil {
		return nil
	}

	userFacingErrors := make(errors.M)

	// nolint
	for _, err := range err.(validator.ValidationErrors) {
		fieldName := err.Field()

		switch err.Tag() {
		case "required":
			userFacingErrors[fieldName] = "This field is required."
		case "min":
			if err.Type().Kind() == reflect.String {
				userFacingErrors[fieldName] =
					fmt.Sprintf("This field must be at least %s characters long.", err.Param())
			} else {
				userFacingErrors[fieldName] =
					fmt.Sprintf("This value does not meet the minimum of %s.", err.Param())
			}
		case "max":
			if err.Type().Kind() == reflect.String {
				userFacingErrors[fieldName] =
					fmt.Sprintf("This field must be less than %s characters long.", err.Param())
			} else {
				userFacingErrors[fieldName] =
					fmt.Sprintf("This value exceeds the maximum of %s.", err.Param())
			}
		case "email":
			userFacingErrors[fieldName] = "This isn't a valid email."
		default:
			userFacingErrors[fieldName] = "This is not valid."
		}
	}

	return errors.E(errors.Op("payload.Valid"), err, userFacingErrors, http.StatusBadRequest)
}

// ReadValid is equivalent to calling Read followed by Valid.
func ReadValid(dst interface{}, r *http.Request) error {
	op := errors.Op("payload.ReadValid")

	if err := Read(dst, r); err != nil {
		return errors.E(op, err)
	}

	if err := Valid(dst); err != nil {
		return errors.E(op, err)
	}

	return nil
}

// handleInternalServerError writes the given error to stderr and returns a
// 500 response with a default message.
func handleInternalServerError(w http.ResponseWriter, r *http.Request, e error) {
	log.AlarmWithContext(r.Context(), e)
	w.Header().Add("Content-Type", "application/json")
	w.WriteHeader(http.StatusInternalServerError)

	if _, err := w.Write(encodedErrResp); err != nil {
		panic(errors.E(errors.Op("payload.handleInternalServerError"), err))
	}
}
