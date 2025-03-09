package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials/stscreds"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
	"github.com/aws/aws-sdk-go-v2/service/sts"
	"github.com/getsentry/raven-go"

	"github.com/linksort/linksort/agent"
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

	// Setup AWS creds
	awsCfg, err := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	if err != nil {
		panic(err)
	}
	stsC := sts.NewFromConfig(awsCfg)
	provider := stscreds.NewAssumeRoleProvider(stsC, os.Getenv("LOG_PUTTER"))

	// Setup CloudwatchLogs
	cwlogsClient := cloudwatchlogs.NewFromConfig(awsCfg, func(o *cloudwatchlogs.Options) {
		o.Credentials = provider
	})

	// Setup Bedrock
	bedrockClient := bedrockruntime.NewFromConfig(awsCfg, func(o *bedrockruntime.Options) {
		o.Credentials = provider
	})

	// Configure the logger
	log.ConfigureGlobalLogger(ctx, isProd, cwlogsClient)
	defer log.CleanUp()

	// Setup Sentry for error reporting
	raven.SetDSN(getenv("SENTRY_DSN", ""))
	raven.SetRelease(getenv("RELEASE", ""))

	// Bootstrap the database
	mongo, err := db.NewMongoClient(ctx, getenv("DB_CONNECTION", "mongodb://localhost"))
	if err != nil {
		log.Fatal(err)
	}
	defer mongo.Disconnect(ctx)

	// Bootstrap the analyzer
	analyzer, err := analyze.New(ctx, bedrockClient)
	if err != nil {
		log.Fatal(err)
	}
	defer analyzer.Close()

	// Create the server instance
	port := getenv("PORT", "8080")
	srv := http.Server{
		Handler: handler.New(&handler.Config{
			Transactor:            db.NewTxnClient(mongo),
			UserStore:             db.NewUserStore(mongo),
			LinkStore:             db.NewLinkStore(mongo),
			ConversationStore:     db.NewConversationStore(mongo),
			Magic:                 magic.New(getenv("APP_SECRET", "")),
			Email:                 email.New(getenv("MAILGUN_KEY", "")),
			Analyzer:              analyzer,
			BedrockClient:         agent.AdaptBedrock(bedrockClient),
			FrontendProxyHostname: getenv("FRONTEND_HOSTNAME", "localhost"),
			FrontendProxyPort:     getenv("FRONTEND_PORT", "3000"),
			IsProd:                isProd,
		}),
		ReadTimeout:  time.Duration(5 * time.Second),
		WriteTimeout: time.Duration(30 * time.Second),
		Addr:         fmt.Sprintf(":%s", port),
	}

	// Handle shutdown properly
	go func() {
		signalC := make(chan os.Signal, 1)
		signal.Notify(signalC, os.Interrupt)
		defer signal.Stop(signalC)

		<-signalC
		srv.Shutdown(ctx)
	}()

	log.Printf("Listening on port :%s", port)

	// Start serving
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
