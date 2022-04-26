package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"

	"github.com/getsentry/raven-go"

	"github.com/linksort/linksort/analyze"
	"github.com/linksort/linksort/db"
	"github.com/linksort/linksort/email"
	"github.com/linksort/linksort/errors"
	"github.com/linksort/linksort/handler"
	"github.com/linksort/linksort/log"
	"github.com/linksort/linksort/magic"
)

func main() {
	ctx := context.Background()

	raven.SetDSN(getenv("SENTRY_DSN", ""))

	mongo, err := db.NewMongoClient(ctx, getenv("DB_CONNECTION", "mongodb://localhost"))
	if err != nil {
		log.Fatal(err)
	}
	defer mongo.Disconnect(ctx)

	analyzer, err := analyze.New(ctx)
	if err != nil {
		log.Fatal(err)
	}
	defer analyzer.Close()

	port := getenv("PORT", "8080")
	srv := http.Server{
		Handler: handler.New(&handler.Config{
			Transactor:            db.NewTxnClient(mongo),
			UserStore:             db.NewUserStore(mongo),
			LinkStore:             db.NewLinkStore(mongo),
			Magic:                 magic.New(getenv("APP_SECRET", "")),
			Email:                 email.New(getenv("MAILGUN_KEY", "")),
			Analyzer:              analyzer,
			FrontendProxyHostname: getenv("FRONTEND_HOSTNAME", "localhost"),
			FrontendProxyPort:     getenv("FRONTEND_PORT", "3000"),
			IsProd:                getenv("PRODUCTION", "1"),
		}),
		Addr: fmt.Sprintf(":%s", port),
	}

	go func() {
		signalC := make(chan os.Signal, 1)
		signal.Notify(signalC, os.Interrupt)
		defer signal.Stop(signalC)

		<-signalC
		srv.Shutdown(ctx)
	}()

	log.Printf("Listening on port :%s", port)

	if err := srv.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
		log.Alarm(err)
		log.Panicf("ListenAndServe: %v", err)
	}

	log.Print("Bye")
}

func getenv(name, fallback string) string {
	if val, ok := os.LookupEnv(name); ok {
		return val
	}

	return fallback
}
