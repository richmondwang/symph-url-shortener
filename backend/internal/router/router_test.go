package router

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/richmondwang/symph-url-shortener/internal/handlers"
	"github.com/richmondwang/symph-url-shortener/internal/models"
)

type mockURLShortener struct{}
type mockUserService struct{}

func (m *mockURLShortener) Shorten(ctx context.Context, req models.ShortURL) (models.ShortURL, error) {
	return req, nil
}
func (m *mockURLShortener) GetBySlug(ctx context.Context, slug string) (*models.ShortURL, error) {
	return &models.ShortURL{Slug: slug, URL: "https://x.com"}, nil
}
func (m *mockURLShortener) IncrementRedirectCount(ctx context.Context, slug string) error { return nil }
func (m *mockURLShortener) ListByUser(ctx context.Context, username string, page, size int, includeExpired bool) ([]models.ShortURL, error) {
	return []models.ShortURL{{Slug: "slugged", URL: "https://x.com"}}, nil
}

func (m *mockUserService) Register(ctx context.Context, username, password string) error { return nil }
func (m *mockUserService) Login(ctx context.Context, username, password string) (*models.User, error) {
	return &models.User{Username: username}, nil
}
func (m *mockUserService) GetByUsername(ctx context.Context, username string) (*models.User, error) {
	return &models.User{Username: username}, nil
}
func (m *mockURLShortener) IsSlugAvailable(ctx context.Context, slug string) (bool, error) {
	return true, nil // default: always available for tests
}

func TestRouterSetup(t *testing.T) {
	h := handlers.NewHandler(&mockURLShortener{}, &mockUserService{}, "http://localhost")
	r := NewRouter(h)

	// Test root endpoint
	req := httptest.NewRequest("GET", "/", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Result().StatusCode != http.StatusOK {
		t.Errorf("expected 200 for root, got %d", w.Result().StatusCode)
	}

	// Test login endpoint
	req = httptest.NewRequest("POST", "/api/login", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Result().StatusCode != http.StatusBadRequest {
		t.Errorf("expected 400 for login (missing body), got %d", w.Result().StatusCode)
	}

	// Test register endpoint
	req = httptest.NewRequest("POST", "/api/register", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Result().StatusCode != http.StatusBadRequest {
		t.Errorf("expected 400 for register (missing body), got %d", w.Result().StatusCode)
	}

	// Test shorten endpoint (protected, should be unauthorized)
	req = httptest.NewRequest("POST", "/api/shorten", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Result().StatusCode != http.StatusUnauthorized {
		t.Errorf("expected 401 for shorten, got %d", w.Result().StatusCode)
	}

	// Test slugs endpoint (protected, should be unauthorized)
	req = httptest.NewRequest("GET", "/api/slugs", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Result().StatusCode != http.StatusUnauthorized {
		t.Errorf("expected 401 for slugs, got %d", w.Result().StatusCode)
	}

	// Test redirect endpoint
	req = httptest.NewRequest("GET", "/abc123", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Result().StatusCode != http.StatusMovedPermanently {
		t.Errorf("expected 301 for redirect, got %d", w.Result().StatusCode)
	}
}
