package services

import (
	"context"
	"encoding/json"
	"time"

	"github.com/richmondwang/symph-url-shortener/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// CacheShortURL is used for storing short URL data in Redis
type CacheShortURL struct {
	URL         string     `json:"url"`
	TrackClicks bool       `json:"trackClicks"`
	ExpireAt    *time.Time `json:"expireAt,omitempty"`
}

var _ URLShortenerService = (*MongoURLShortenerService)(nil)

type MongoURLShortenerService struct {
	Coll  *mongo.Collection
	Redis RedisCache
}

// RedisCache interface for cache operations
type RedisCache interface {
	Set(ctx context.Context, key string, value string, ttl time.Duration) error
	Get(ctx context.Context, key string) (string, error)
}

func NewMongoURLShortenerService(coll *mongo.Collection) *MongoURLShortenerService {
	return &MongoURLShortenerService{Coll: coll}
}

func NewMongoURLShortenerServiceWithCache(coll *mongo.Collection, redis RedisCache) *MongoURLShortenerService {
	return &MongoURLShortenerService{Coll: coll, Redis: redis}
}

// Helper to set cache for a ShortURL
func (s *MongoURLShortenerService) cacheShortURL(ctx context.Context, shortURL models.ShortURL) {
	if s.Redis != nil && shortURL.URL != "" {
		ttl := 24 * time.Hour
		if shortURL.ExpireAt != nil {
			diff := shortURL.ExpireAt.Sub(time.Now().UTC())
			if diff > 0 {
				ttl = diff
			} else {
				ttl = 0
			}
		}
		if ttl > 0 {
			// Store only relevant fields using ShortURL struct
			cacheObj := CacheShortURL{
				URL:         shortURL.URL,
				TrackClicks: shortURL.TrackClicks,
				ExpireAt:    shortURL.ExpireAt,
			}
			cacheBytes, _ := json.Marshal(cacheObj)
			_ = s.Redis.Set(ctx, shortURL.Slug, string(cacheBytes), ttl)
		}
	}
}

func (s *MongoURLShortenerService) Shorten(ctx context.Context, req models.ShortURL) (models.ShortURL, error) {
	// Insert logic here (simplified)
	_, err := s.Coll.InsertOne(ctx, req)
	s.cacheShortURL(ctx, req)
	return req, err
}

func (s *MongoURLShortenerService) GetBySlug(ctx context.Context, slug string) (*models.ShortURL, error) {
	// Try cache first
	if s.Redis != nil {
		val, err := s.Redis.Get(ctx, slug)
		if err == nil && val != "" {
			// Parse cached JSON
			var cacheObj CacheShortURL
			if err := json.Unmarshal([]byte(val), &cacheObj); err == nil {
				return &models.ShortURL{Slug: slug, URL: cacheObj.URL, TrackClicks: cacheObj.TrackClicks, ExpireAt: cacheObj.ExpireAt}, nil
			}
		}
	}
	var result models.ShortURL
	err := s.Coll.FindOne(ctx, bson.M{"slug": slug}).Decode(&result)
	if err == mongo.ErrNoDocuments {
		return nil, nil
	}
	s.cacheShortURL(ctx, result)
	return &result, err
}

func (s *MongoURLShortenerService) IncrementRedirectCount(ctx context.Context, slug string) error {
	_, err := s.Coll.UpdateOne(ctx, bson.M{"slug": slug}, bson.M{"$inc": bson.M{"redirectCount": 1}})
	return err
}

func (s *MongoURLShortenerService) ListByUser(ctx context.Context, username string, page, size int, includeExpired bool) ([]models.ShortURL, error) {
	skip := (page - 1) * size
	opts := options.Find().SetSkip(int64(skip)).SetLimit(int64(size)).SetSort(bson.D{{Key: "createdAt", Value: -1}})
	filter := bson.M{"createdBy": username}
	if !includeExpired {
		now := time.Now().UTC()
		filter["$or"] = []bson.M{
			{"expireAt": bson.M{"$gt": now}},
			{"expireAt": bson.M{"$exists": false}},
			{"expireAt": nil},
		}
	}
	cursor, err := s.Coll.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	var results []models.ShortURL
	for cursor.Next(ctx) {
		var s models.ShortURL
		if err := cursor.Decode(&s); err == nil {
			results = append(results, s)
		}
	}
	_ = cursor.Close(ctx)
	return results, nil
}

// IsSlugAvailable checks if a slug is not present in the database (available for use)
func (s *MongoURLShortenerService) IsSlugAvailable(ctx context.Context, slug string) (bool, error) {
	err := s.Coll.FindOne(ctx, bson.M{"slug": slug}).Err()
	if err == mongo.ErrNoDocuments {
		return true, nil
	}
	if err != nil {
		return false, err
	}
	return false, nil
}
