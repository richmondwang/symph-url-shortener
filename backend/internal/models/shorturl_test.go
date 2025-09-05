package models

import (
	"encoding/json"
	"testing"
	"time"
)

func TestShortURLFields(t *testing.T) {
	now := time.Now().UTC()
	s := ShortURL{
		Slug:          "slug123",
		URL:           "https://example.com",
		CreatedAt:     now,
		RedirectCount: 5,
		TrackClicks:   true,
		UTMs:          map[string]string{"utm_source": "test"},
	}
	if s.Slug != "slug123" {
		t.Errorf("expected slug 'slug123', got %s", s.Slug)
	}
	if s.URL != "https://example.com" {
		t.Errorf("expected url, got %s", s.URL)
	}
	if !s.TrackClicks {
		t.Errorf("expected TrackClicks true")
	}
	if s.RedirectCount != 5 {
		t.Errorf("expected RedirectCount 5, got %d", s.RedirectCount)
	}
	if s.UTMs["utm_source"] != "test" {
		t.Errorf("expected utm_source 'test'")
	}
}

func TestShortURLJSON(t *testing.T) {
	s := ShortURL{Slug: "slug123", URL: "https://example.com"}
	data, err := json.Marshal(s)
	if err != nil {
		t.Fatalf("json marshal error: %v", err)
	}
	if string(data) == "" {
		t.Error("expected non-empty json")
	}
}
