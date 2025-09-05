# URL Shortener Backend (Go)

This directory contains a simple REST API written in Go for creating
and resolving shortened URLs.  The service stores records in MongoDB
and exposes endpoints via the [go‑chi/chi](https://github.com/go-chi/chi) router.

The project follows a conventional Go project layout:

* `cmd/server` – entry point that wires up the database, cache, router and starts the HTTP server.
* `internal/models` – data structures used to represent database records.
* `internal/utils` – helper functions for slug generation, URL composition and expiration parsing.
* `internal/db` – MongoDB connection and index creation logic.
* `internal/cache` – Redis connection logic.
* `internal/handlers` – HTTP handlers for shortening and redirecting URLs.
* `internal/router` – constructs a configured router and mounts routes including Swagger UI.
* `docs` – contains the pre‑generated `swagger.json` specification consumed by the Swagger UI.

> **Note on GORM:**
>
> The original requirement mentioned using GORM with MongoDB.  GORM is
> an ORM designed for relational databases such as MySQL, PostgreSQL
> and SQLite; the official documentation explicitly lists these as
> supported backends【445708725454800†L11-L13】.  Community answers
> reiterate that MongoDB is not supported and recommend using the
> official MongoDB Go driver instead【89921777865662†L1015-L1025】.
> Accordingly, this implementation uses the official
> [`go.mongodb.org/mongo-driver`](https://pkg.go.dev/go.mongodb.org/mongo-driver)
> package for MongoDB access while retaining a clean, GORM‑inspired
> model structure.  If you need to use GORM you should switch to a
> relational database supported by GORM.

## Features

* **Shorten URL:** `POST /api/shorten` accepts a JSON payload with the
  original URL, optional custom slug, optional expiration timestamp
  (ISO‑8601 / RFC3339), and an optional map of UTM parameters.  If
  no slug is provided a random 8‑character code is generated.  The
  destination URL is stored in MongoDB and a JSON response is
  returned containing the slug, the full short link and the
  destination URL.

* **Redirect:** `GET /{slug}` looks up the slug in the database.  If
  found and not expired, it issues a `301` redirect to the stored
  destination URL.  If the entry has expired a `410 Gone` status is
  returned; if not found a `404 Not Found` is returned.

* **Base URL configuration:** The returned short link uses the
  `BASE_URL` environment variable.  If unset the server constructs
  a base URL from the listen port (e.g., `http://localhost:8080`).

* **Slug uniqueness:** A unique index on the `slug` field ensures no
  two records share the same slug.  If a generated slug collides,
  another slug is generated automatically.

* **Redis caching:** Frequently accessed and newly created slugs are
  stored in Redis for fast lookup.  When a slug is created, it is
  written to the cache with a time‑to‑live based on the link’s
  expiration (defaulting to 24 hours if no expiration is set).  When
  resolving a slug, the API first consults Redis; cache misses fall
  back to MongoDB and update the cache.  Caching behaviour is
  transparent to clients and does not require any additional API
  calls.  If Redis is unavailable or misconfigured, the application
  still functions using MongoDB alone.

* **Swagger documentation:** The API is annotated with OpenAPI/Swagger
  comments and a pre‑generated `swagger.json` specification is
  included.  Start the server and visit
  `http://localhost:8080/swagger/index.html` to explore the API via
  the interactive Swagger UI.

* **Graceful shutdown:** The HTTP server listens for `SIGINT` or
  `SIGTERM` and shuts down gracefully, waiting up to five seconds for
  ongoing requests to complete.

## Prerequisites

* Go 1.20 or newer.
* A running MongoDB instance.  You can run MongoDB locally using
  Docker:

  ```sh
  docker run -d --name mongodb -p 27017:27017 mongo:7
  ```

* A running Redis instance for caching (optional but recommended).
  You can run Redis locally using Docker:

  ```sh
  docker run -d --name redis -p 6379:6379 redis:7
  ```

## Configuration

The service can be configured using the following environment
variables:

| Variable        | Description                                                         | Default              |
|-----------------|---------------------------------------------------------------------|----------------------|
| `MONGODB_URI`   | MongoDB connection string                                           | `mongodb://localhost:27017` |
| `MONGODB_DB`    | Database name                                                       | `urlshortener`       |
| `MONGODB_COLL`  | Collection name                                                     | `links`              |
| `PORT`          | Port on which the HTTP server listens                              | `8080`               |
| `BASE_URL`      | Base URL used when returning the short link                         | `http://localhost:<PORT>` |
| `REDIS_ADDR`    | Address of the Redis server (`host:port`)                           | `localhost:6379`       |
| `REDIS_PASSWORD`| Password for the Redis server (if any)                              | empty                  |
| `REDIS_DB`      | Redis logical database number                                        | `0`                  |

## Running the server

```sh
# Ensure dependencies are downloaded
cd symph-url-shortener
go mod tidy

# Set environment variables if necessary
export MONGODB_URI="mongodb://localhost:27017"
export BASE_URL="https://symph.co"

# Run the server
go run ./...

# The API will be available at http://localhost:8080
```

## Example usage

Create a new short link:

```sh
curl -X POST http://localhost:8080/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/landing","utms":{"source":"newsletter","campaign":"fall"}}'

# Response:
# {
#   "slug":"abc123xy",
#   "shortLink":"https://symph.co/abc123xy",
#   "destination":"https://example.com/landing?utm_source=newsletter&utm_campaign=fall"
# }
```

Redirect to the original URL:

```sh
curl -v http://localhost:8080/abc123xy
# ... HTTP/1.1 301 Moved Permanently
# Location: https://example.com/landing?utm_source=newsletter&utm_campaign=fall
```

## Testing

This repository includes a small unit test for slug generation.  Run
the tests with:

```sh
cd symph-url-shortener
go test
```

## Future enhancements

* **Analytics and statistics**: track click counts, last accessed
  timestamps and other metrics.
* **Authentication**: restrict shortening and management to
  authenticated users.
* **Admin API**: provide endpoints to list, update or delete links.
