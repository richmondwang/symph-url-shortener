package cache

import (
	"context"
	"os"
	"strconv"

	redis "github.com/redis/go-redis/v9"
)

// Connect initialises a Redis client using connection information
// supplied via the REDIS_ADDR, REDIS_PASSWORD and REDIS_DB
// environment variables.  REDIS_ADDR defaults to "localhost:6379"
// when unset.  It returns a client that should be shared for the
// lifetime of the application.
func Connect(ctx context.Context) (*redis.Client, error) {
	addr := os.Getenv("REDIS_ADDR")
	if addr == "" {
		addr = "localhost:6379"
	}
	password := os.Getenv("REDIS_PASSWORD")
	// Database number: parse from environment; default 0
	dbNum := 0
	if dbStr := os.Getenv("REDIS_DB"); dbStr != "" {
		if n, err := strconv.Atoi(dbStr); err == nil {
			dbNum = n
		}
	}
	client := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       dbNum,
	})
	// Test the connection
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, err
	}
	return client, nil
}
