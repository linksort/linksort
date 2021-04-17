package random

import (
	crand "crypto/rand"
	"encoding/base64"
	mrand "math/rand"
)

const letterBytes = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

// String returns a string of the given length of random upper and lowercase
// letters.
func String(size int) string {
	bytes := make([]byte, size)

	for i := range bytes {
		bytes[i] = letterBytes[mrand.Intn(len(letterBytes))]
	}

	return string(bytes)
}

// Token returns a 32 character length string derived from a
// cryptographically secure random number generator.
func Token() string {
	randomBytes := make([]byte, 32)

	_, err := crand.Read(randomBytes)
	if err != nil {
		panic(err)
	}

	return base64.StdEncoding.EncodeToString(randomBytes)[:32]
}
