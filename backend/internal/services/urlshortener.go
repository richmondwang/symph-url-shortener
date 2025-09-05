package services

import (
	"context"

	"github.com/richmondwang/symph-url-shortener/internal/models"
)

// URLShortenerService defines the interface for URL shortening logic
type URLShortenerService interface {
	Shorten(ctx context.Context, req models.ShortURL) (models.ShortURL, error)
	GetBySlug(ctx context.Context, slug string) (*models.ShortURL, error)
	IncrementRedirectCount(ctx context.Context, slug string) error
	ListByUser(ctx context.Context, username string, page, size int, includeExpired bool) ([]models.ShortURL, error)
	IsSlugAvailable(ctx context.Context, slug string) (bool, error)
}
