package db

import (
    "context"
    "os"

    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/mongo/options"
    "go.mongodb.org/mongo-driver/mongo/readpref"
)

// Connect establishes a new client connection to MongoDB using
// connection information supplied via the MONGODB_URI environment
// variable.  If MONGODB_URI is unset, it falls back to the default
// URI of "mongodb://localhost:27017".  The returned client is
// pinged to ensure the connection is alive.  Callers should defer
// client.Disconnect on the returned client when it is no longer
// needed.
func Connect(ctx context.Context) (*mongo.Client, error) {
    uri := os.Getenv("MONGODB_URI")
    if uri == "" {
        uri = "mongodb://localhost:27017"
    }
    clientOpts := options.Client().ApplyURI(uri)
    client, err := mongo.Connect(ctx, clientOpts)
    if err != nil {
        return nil, err
    }
    // Verify the connection works
    if err := client.Ping(ctx, readpref.Primary()); err != nil {
        return nil, err
    }
    return client, nil
}

// EnsureIndexes creates a unique index on the slug field so that
// duplicate slugs are rejected by MongoDB.  It should be called
// once after connecting and obtaining the collection.
func EnsureIndexes(ctx context.Context, coll *mongo.Collection) error {
    idx := mongo.IndexModel{
        Keys:    bson.D{{Key: "slug", Value: 1}},
        Options: options.Index().SetUnique(true),
    }
    _, err := coll.Indexes().CreateOne(ctx, idx)
    return err
}