package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/linksort/analyze"

	"github.com/linksort/linksort/db"
	"github.com/linksort/linksort/email"
	"github.com/linksort/linksort/errors"
	"github.com/linksort/linksort/handler"
	"github.com/linksort/linksort/log"
	"github.com/linksort/linksort/magic"
)

func main() {
	ctx := context.Background()

	mongo, closer, err := db.NewMongoClient(ctx, getenv("DB_CONNECTION", "mongodb://localhost"))
	if err != nil {
		log.Fatal(err)
	}

	err = db.SetupIndexes(ctx, mongo)
	if err != nil {
		log.Fatal(err)
	}

	analyzer, err := analyze.New(ctx)
	if err != nil {
		log.Fatal(err)
	}

	h := handler.New(&handler.Config{
		Transactor:            db.NewTxnClient(mongo),
		UserStore:             db.NewUserStore(mongo),
		LinkStore:             db.NewLinkStore(mongo),
		Magic:                 magic.New(getenv("APP_SECRET", "")),
		Email:                 email.New(),
		Analyzer:              analyzer,
		FrontendProxyHostname: getenv("FRONTEND_HOSTNAME", "localhost"),
		FrontendProxyPort:     getenv("FRONTEND_PORT", "3000"),
		IsProd:                getenv("PRODUCTION", "1"),
	})

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

		if err := closer(); err != nil {
			log.Printf("MongoDB shutdown error: %v", err)
		} else {
			log.Print("MongoDB connection closed")
		}

		if err := analyzer.Close(); err != nil {
			log.Printf("Analyzer shutdown error: %v", err)
		} else {
			log.Print("Analyzer connections closed")
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
