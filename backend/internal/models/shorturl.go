package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ShortURL represents a single shortened URL entry stored in MongoDB.
// Each record contains a unique slug, the original destination URL
// (including any appended UTM parameters), an optional expiration
// timestamp, a map of UTM parameters (for informational purposes)
// and a creation timestamp.  MongoDB automatically generates a
// unique ObjectID for the _id field when omitted on insert.
type ShortURL struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Slug          string             `bson:"slug" json:"slug"`
	URL           string             `bson:"url" json:"url"`
	ExpireAt      *time.Time         `bson:"expireAt,omitempty" json:"expireAt,omitempty"`
	UTMs          map[string]string  `bson:"utms,omitempty" json:"utms,omitempty"`
	CreatedAt     time.Time          `bson:"createdAt" json:"createdAt"`
	CreatedBy     string             `bson:"createdBy,omitempty" json:"createdBy,omitempty"`
	RedirectCount int                `bson:"redirectCount" json:"redirectCount"`
	TrackClicks   bool               `bson:"trackClicks" json:"trackClicks"`
}
