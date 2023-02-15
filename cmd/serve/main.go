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

// @title					Linksort API
// @version					1.0
// @description				Linksort API documentation
// @termsOfService			https://linksort.com/terms

// @license.name				Copyright (c) 2023 Linksort
// @license.url				https://github.com/linksort/linksort/blob/main/LICENSE

// @contact.name				Linksort Support
// @contact.url				https://linksort.com
// @contact.email				alex@linksort.com

// @host					linksort.com
// @BasePath				/api
// @schemes					https
// @accept					json
// @produce					json

// @securityDefinitions.apikey	ApiKeyAuth
// @in					header
// @name					Authorization
// @description				Bearer token. Your token can be found on Linksort's account page. Example: Bearer \<token\>
func main() {
	ctx := context.Background()
	isProd := getenv("PRODUCTION", "1") == "1"

	log.ConfigureGlobalLogger(ctx, isProd)
	defer log.CleanUp()

	raven.SetDSN(getenv("SENTRY_DSN", ""))
	raven.SetRelease(getenv("RELEASE", ""))

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
			IsProd:                isProd,
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
