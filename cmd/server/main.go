package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/linksort/linksort/errors"
	"github.com/linksort/linksort/handler"
	"github.com/linksort/linksort/log"
)

func main() {
	ctx := context.Background()

	h := handler.New(&handler.Config{})

	port := getenv("PORT", "8080")
	srv := http.Server{Handler: h, Addr: fmt.Sprintf(":%s", port)}

	idleConnsClosed := make(chan struct{})

	go func() {
		signalChan := make(chan os.Signal, 1)

		signal.Notify(signalChan, os.Interrupt, syscall.SIGTERM)
		defer signal.Stop(signalChan)

		<-signalChan // Signal: clean up and exit gracefully
		log.Print("Signal detected, cleaning up...")

		if err := srv.Shutdown(ctx); err != nil {
			// Error from closing listeners or context timeout
			log.Printf("HTTP server shutdown error: %v", err)
		} else {
			log.Print("HTTP server shutdown")
		}

		close(idleConnsClosed)
	}()

	log.Printf("Listening on port :%s", port)

	if err := srv.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
		log.Alarm(err)
		log.Panicf("ListenAndServe: %v", err)
	}

	<-idleConnsClosed
}

func getenv(name, fallback string) string {
	if val, ok := os.LookupEnv(name); ok {
		return val
	}

	return fallback
}
