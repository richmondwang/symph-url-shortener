package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/richmondwang/symph-url-shortener/internal/cache"
	"github.com/richmondwang/symph-url-shortener/internal/db"
	"github.com/richmondwang/symph-url-shortener/internal/handlers"
	"github.com/richmondwang/symph-url-shortener/internal/router"
	"github.com/richmondwang/symph-url-shortener/internal/services"

	redis "github.com/redis/go-redis/v9"
)

func main() {
	// Create a root context for initial connection attempts
	ctx := context.Background()

	// Connect to MongoDB
	mongoClient, err := db.Connect(ctx)
	if err != nil {
		log.Fatalf("failed to connect to MongoDB: %v", err)
	}

	// Determine database and collection names from environment
	dbName := os.Getenv("MONGODB_DB")
	if dbName == "" {
		dbName = "urlshortener"
	}
	collName := os.Getenv("MONGODB_COLL")
	if collName == "" {
		collName = "links"
	}
	coll := mongoClient.Database(dbName).Collection(collName)
	// Ensure unique indexes on slug
	if err := db.EnsureIndexes(ctx, coll); err != nil {
		log.Fatalf("failed to create indexes: %v", err)
	}

	// Attempt to connect to Redis; cache is optional
	var redisClient *redis.Client
	if rc, err := cache.Connect(ctx); err != nil {
		// Log warning but continue without cache
		log.Printf("warning: could not connect to Redis: %v", err)
	} else {
		redisClient = rc
	}

	// Determine port and base URL
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}
	baseURL := os.Getenv("BASE_URL")
	if baseURL == "" {
		// If base URL not specified, construct from localhost and port
		baseURL = "http://localhost:" + port
	}

	// Construct service implementations
	urlShortenerService := services.NewMongoURLShortenerService(coll)
	userColl := mongoClient.Database(dbName).Collection("users")
	userService := services.NewMongoUserService(userColl)

	// Inject services into handler
	h := handlers.NewHandler(urlShortenerService, userService, baseURL)
	r := router.NewRouter(h)
	srv := &http.Server{
		Addr:    ":" + port,
		Handler: r,
	}

	// Start server in a separate goroutine
	go func() {
		log.Printf("starting server on port %s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %v", err)
		}
	}()

	// Setup signal handling for graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("shutting down server...")
	ctxShutDown, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctxShutDown); err != nil {
		log.Fatalf("server forced to shutdown: %v", err)
	}

	// Clean up connections
	if redisClient != nil {
		_ = redisClient.Close()
	}
	if err := mongoClient.Disconnect(ctx); err != nil {
		log.Printf("error disconnecting MongoDB: %v", err)
	}
	log.Println("server exiting")
}
