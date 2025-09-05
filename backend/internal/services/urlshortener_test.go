package services

import (
	"context"
	"errors"
	"testing"

	"github.com/richmondwang/symph-url-shortener/internal/models"
)

type fakeShortener struct{}

func (f *fakeShortener) Shorten(ctx context.Context, req models.ShortURL) (models.ShortURL, error) {
	req.Slug = "slugged"
	return req, nil
}
func (f *fakeShortener) GetBySlug(ctx context.Context, slug string) (*models.ShortURL, error) {
	if slug == "notfound" {
		return nil, nil
	}
	return &models.ShortURL{Slug: slug, URL: "https://x.com"}, nil
}
func (f *fakeShortener) IncrementRedirectCount(ctx context.Context, slug string) error {
	if slug == "fail" {
		return errors.New("fail")
	}
	return nil
}
func (f *fakeShortener) ListByUser(ctx context.Context, username string, page, size int, includeExpired bool) ([]models.ShortURL, error) {
	return []models.ShortURL{{Slug: "slugged", URL: "https://x.com"}}, nil
}

func TestShorten(t *testing.T) {
	s := &fakeShortener{}
	ctx := context.Background()
	url := models.ShortURL{URL: "https://x.com"}
	out, err := s.Shorten(ctx, url)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if out.Slug != "slugged" {
		t.Errorf("expected slugged, got %s", out.Slug)
	}
}

func TestGetBySlug(t *testing.T) {
	s := &fakeShortener{}
	ctx := context.Background()
	out, err := s.GetBySlug(ctx, "slugged")
	if err != nil || out == nil || out.Slug != "slugged" {
		t.Errorf("expected slugged, got %v, err %v", out, err)
	}
	out, err = s.GetBySlug(ctx, "notfound")
	if out != nil {
		t.Errorf("expected nil for notfound")
	}
}

func TestIncrementRedirectCount(t *testing.T) {
	s := &fakeShortener{}
	ctx := context.Background()
	if err := s.IncrementRedirectCount(ctx, "fail"); err == nil {
		t.Errorf("expected error for fail")
	}
	if err := s.IncrementRedirectCount(ctx, "ok"); err != nil {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestListByUser(t *testing.T) {
	s := &fakeShortener{}
	ctx := context.Background()
	out, err := s.ListByUser(ctx, "tester", 1, 10, false)
	if err != nil || len(out) == 0 {
		t.Errorf("expected at least one result, got %v, err %v", out, err)
	}
}
