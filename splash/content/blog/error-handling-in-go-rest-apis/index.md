---
title: Error Handling in Go REST APIs
date: 2021-09-09
author: Alex Richey
---
<aside class="message">
  This is a technical post that is probably only of interest to Go developers.
</aside>

In writing a REST API, we have to deal with at least two types of errors.

- **Client errors:** These errors are the fault of the user, e.g., providing an invalid email address, or a password that's too short. These errors are in the HTTP status range 400-499.
- **Internal errors:** These errors are not that fault of the user. As the author of the codebase in question, these errors *are my fault* or the fault of one or more of my dependencies. They often mean that there's a bug in the code that I wrote, or other code that I'm using, or that a dependent service is down. These errors are in the HTTP status range 500-599.


The problem is that Go's standard library's `errors` package does not straightforwardly make it easy to distinguish these cases. Here's an example. Let's say I have a simple HTTP handler that validates the incoming request and returns an error if the validation fails and does some work if the validation succeeds.

```go
func MyHandler(w http.ResponseWriter, r *http.Request) {
	err := validateRequest(r)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest) 
		w.Write(err.Error())
		return
  }
  
  // Do work.
}
```

The problem with the code above is that it doesn't account for the case where the `validateRequest()` function fails because of an internal error. This code would hide what could be a programming issue or an issue with a dependency and would falsely classify it as a client error with status 400. That's bad. It prevents me, as the service owner, from knowing that something's wrong; and it also prevents the end-user from accurately figuring out what actions they might need to take.

Moreover, depending on the way `validateRequest()` is written, we might end up exposing security related information to the user by simply writing `err.Error()` to the HTTP response body. What if `validateRequest()` returns an error that says "downstream auth service is down"? That would not be an appropriate message to send to the end user.

## Package `errors`

I couldn't figure out how to handle this kind of case elegantly until a collegue at work recommended I read Rob Pike and Andrew Gerrand's article ["Error handing in Upspin](https://commandcenter.blogspot.com/2017/12/error-handling-in-upspin.html)." The key insight of the article—which maybe should have been obvious to me—is that I can define my own error type. The only thing required for something to be an error in Go is that it satisfy the error interface, which is simply:

```go
type Error interface {
	Error() string
}
```

When something satisfies this interface, that doesn't mean that it can't satisfy other interfaces too. In other words, the object that implements the error interface can include more functionality and information than just the `Error()` method. Here's why this is important: I can add additional information to a custom `Error` type that will allow me to distinguish between client and internal errors and which satisfies the standard library's `Error` interface.

Following Upspin's example, with a few modifications, I defined my own error type in a new errors package like so:

```go
// Op describes an operation, usually as the package and method,
// such as db.GetUser.
type Op string

// Error implements the error interface.
type Error struct {
        err      error // The underlying error, if there is one
        code     int   // The HTTP status code
        op       Op    // The operation where the error occured
        messages map[string]string // A customer-facing message
}
```

The fields of `Error` are used to distinguish client from internal errors, to provide customer-facing error messages, and to provide useful traces.

I also wrote a function called `E()`, whose name I also took from Upspin, to make it easy to create these errors. Here's how it looks when it's used. You can find the implementation [on GitHub](https://github.com/linksort/linksort/blob/main/errors/errors.go).

```go
func validateRequest(r *http.Request) error {
	op := errors.Op("validateRequest")
	
	c, err := r.Cookie("session-id")
	if err != nil {
		if errors.Is(err, http.ErrorNoCookie) {
			return errors.E(op, err, http.StatusUnauthorized, map[string]string{
				"message": "Required session cookie was not found.",
			})
		}
		
		return errors.E(op, err, http.StatusInternalServerError, map[string]string{
			"message": "An internal error occured. Please try again.",
		})
	}
	
	return nil
}
```

Note that we've now distinguished between client and internal errors and provided a way to surface customer-facing error messages. The client error in this example is when a `session-id` cookie is missing from the incoming request. The internal error is when, for whatever reason, `r.Cookie()` returns an unexpected error. (In the [implementation of `r.Cookie()`](https://cs.opensource.google/go/go/+/refs/tags/go1.17:src/net/http/request.go;l=421-426), this isn't actually possible, but I think this example gets the point across if you pretend that `r.Cookie()` could return such an unexpected error. It may also be worth mentioning that this is a toy example whose only purpose is to demonstrate `errors.E()`—there may be better patterns for validating cookies.)

Note that I also populated my project's `errors` package with other functions as well, such as `Is()`, `As()`, and `Unwrap()`, so that it can completely replace the standard library's `errors` package within the scope of my project.

## Package `payload`

Now that I have an `Error` type that's rich enough for me to distinguish among different kinds of errors, I need a way of returning them to end-users nicely and of printing their contents to my application's logs for debugging purposes. That's where package `payload` comes in.

Package `payload` provides utilities for dealing with HTTP requests and responses. I call it "payload" because it's primarily concerned with reading and writing request and response payloads. Here's how I use it to handle errors.

```go
func MyHandler(w http.ResponseWriter, r *http.Request) {
	err = validateRequest(req)
	if err != nil {
		payload.WriteError(w, r, err)
		return
	}
	
	// Do work.
}
```

The intended behavior is that, no matter what error is given, `payload.WriteError(w, r, err)` will write the correct information to the response.

Here's how it works. In package `payload`, I defined an interface called `ClientReporter` that my custom `Error` type implements. (I left the implementation of this interface out of the definition above, but it should be straightforward. If it isn't, take a look at the source [on GitHub](https://github.com/linksort/linksort/blob/a1f069924f2ca535218fee66deca7776fd9d4add/errors/errors.go#L72-L114).)

```go
// ClientReporter provides information about an error such that client and
// server errors can be distinguished and handled appropriately.
type ClientReporter interface {
        error
        Message() map[string]string
        StatusCode() int
}
```

In `payload.WriteError(w, r, err)`, I check whether the given `err` implements `ClientReporter`. If it does, then I use that information to write the response to the user. If it doesn't then, I write a 500-level error to the response because that clearly means I didn't handle something right in my programming.

```go
func WriteError(w http.ResponseWriter, r *http.Request, e error) {
	if cr, ok := e.(ClientReporter); ok {
		status := cr.Status()
		if status >= http.StatusInternalServerError {
			handleInternalServerError(w, r, e)
			return
		}

		// Write is another function provided by package payload that handles
		// writing JSON to http.ResponseWriter.
		Write(w, r, cr.Message(), status)
		
		return
	}

	handleInternalServerError(w, r, e)
}

var encodedErrResp []byte = json.RawMessage(`{"message":"Something has gone wrong"}`)

func handleInternalServerError(w http.ResponseWriter, r *http.Request, e error) {
	log.Print(e.Error()) // Log errors for debugging
	w.Header().Add("Content-Type", "application/json")
	w.WriteHeader(http.StatusInternalServerError)
	
	if _, err := w.Write(encodedErrResp); err != nil {
		// panic, etc.
	}
}
```

With the combination of my custom package `errors` and package `payload`, I have a streamlined way of handing errors throughout my application. I can distinguish between client and internal errors based on their HTTP statuses, which are assigned to the errors when they are created with `errors.E()`. I can also provide customer-facing error messages, that are sure not to accidentally expose any security relevant information, by means of the `map[string]string` that can also be provided to `errors.E()`. At the same time, I can log useful traces by printing underlying error messages to my application's logs, as I do in `handleInternalServerError()` above, which will make my life easier when I have to debug issues.
