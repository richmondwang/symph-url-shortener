package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/richmondwang/symph-url-shortener/internal/models"
)

type mockURLShortener struct {
	// Add IsSlugAvailable for interface compliance
	IsSlugAvailableFunc      func(ctx context.Context, slug string) (bool, error)
	ShortenFunc              func(ctx context.Context, req models.ShortURL) (models.ShortURL, error)
	GetBySlugFunc            func(ctx context.Context, slug string) (*models.ShortURL, error)
	IncrementRedirectCountFn func(ctx context.Context, slug string) error
	ListByUserFunc           func(ctx context.Context, username string, page, size int, includeExpired bool) ([]models.ShortURL, error)
}

func (m *mockURLShortener) IsSlugAvailable(ctx context.Context, slug string) (bool, error) {
	if m.IsSlugAvailableFunc != nil {
		return m.IsSlugAvailableFunc(ctx, slug)
	}
	return true, nil // default: always available for tests
}

func (m *mockURLShortener) Shorten(ctx context.Context, req models.ShortURL) (models.ShortURL, error) {
	return m.ShortenFunc(ctx, req)
}
func (m *mockURLShortener) GetBySlug(ctx context.Context, slug string) (*models.ShortURL, error) {
	return m.GetBySlugFunc(ctx, slug)
}
func (m *mockURLShortener) IncrementRedirectCount(ctx context.Context, slug string) error {
	return m.IncrementRedirectCountFn(ctx, slug)
}
func (m *mockURLShortener) ListByUser(ctx context.Context, username string, page, size int, includeExpired bool) ([]models.ShortURL, error) {
	return m.ListByUserFunc(ctx, username, page, size, includeExpired)
}

type mockUserService struct {
	RegisterFunc    func(ctx context.Context, username, password string) error
	LoginFunc       func(ctx context.Context, username, password string) (*models.User, error)
	GetByUsernameFn func(ctx context.Context, username string) (*models.User, error)
}

func (m *mockUserService) Register(ctx context.Context, username, password string) error {
	return m.RegisterFunc(ctx, username, password)
}
func (m *mockUserService) Login(ctx context.Context, username, password string) (*models.User, error) {
	return m.LoginFunc(ctx, username, password)
}
func (m *mockUserService) GetByUsername(ctx context.Context, username string) (*models.User, error) {
	return m.GetByUsernameFn(ctx, username)
}

func TestShortenHandler_Success(t *testing.T) {
	h := NewHandler(&mockURLShortener{
		ShortenFunc: func(ctx context.Context, req models.ShortURL) (models.ShortURL, error) {
			req.Slug = "abc12345"
			return req, nil
		},
	}, &mockUserService{}, "http://localhost")
	body := `{"url":"https://example.com","slug":"","utms":{},"trackClicks":true}`
	req := httptest.NewRequest("POST", "/api/shorten", bytes.NewBufferString(body))
	req = req.WithContext(context.WithValue(req.Context(), contextKey("username"), "tester"))
	w := httptest.NewRecorder()
	h.Shorten(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("expected 201, got %d", resp.StatusCode)
	}
	var out map[string]interface{}
	_ = json.NewDecoder(resp.Body).Decode(&out)
	if out["slug"] != "abc12345" {
		t.Errorf("expected slug abc12345, got %v", out["slug"])
	}
}

func TestShortenHandler_BadRequest(t *testing.T) {
	h := NewHandler(&mockURLShortener{}, &mockUserService{}, "http://localhost")
	req := httptest.NewRequest("POST", "/api/shorten", bytes.NewBufferString("bad json"))
	req = req.WithContext(context.WithValue(req.Context(), contextKey("username"), "tester"))
	w := httptest.NewRecorder()
	h.Shorten(w, req)
	if w.Result().StatusCode != http.StatusBadRequest {
		t.Error("expected 400 for bad json")
	}
}

func TestRedirectHandler_Success(t *testing.T) {
	h := NewHandler(&mockURLShortener{
		GetBySlugFunc: func(ctx context.Context, slug string) (*models.ShortURL, error) {
			return &models.ShortURL{Slug: slug, URL: "https://example.com", TrackClicks: false}, nil
		},
		IncrementRedirectCountFn: func(ctx context.Context, slug string) error { return nil },
	}, &mockUserService{}, "http://localhost")
	r := httptest.NewRequest("GET", "/abc12345", nil)
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("slug", "abc12345")
	r = r.WithContext(context.WithValue(r.Context(), chi.RouteCtxKey, rctx))
	w := httptest.NewRecorder()
	h.Redirect(w, r)
	if w.Result().StatusCode != http.StatusMovedPermanently {
		t.Errorf("expected 301, got %d", w.Result().StatusCode)
	}
}

func TestRedirectHandler_NotFound(t *testing.T) {
	h := NewHandler(&mockURLShortener{
		GetBySlugFunc: func(ctx context.Context, slug string) (*models.ShortURL, error) {
			return nil, nil
		},
	}, &mockUserService{}, "http://localhost")
	r := httptest.NewRequest("GET", "/notfound", nil)
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("slug", "notfound")
	r = r.WithContext(context.WithValue(r.Context(), chi.RouteCtxKey, rctx))
	w := httptest.NewRecorder()
	h.Redirect(w, r)
	if w.Result().StatusCode != http.StatusNotFound {
		t.Errorf("expected 404, got %d", w.Result().StatusCode)
	}
}

func TestRegisterHandler_Success(t *testing.T) {
	h := NewHandler(&mockURLShortener{}, &mockUserService{
		RegisterFunc: func(ctx context.Context, username, password string) error { return nil },
	}, "http://localhost")
	body := `{"username":"tester","password":"pass"}`
	req := httptest.NewRequest("POST", "/api/register", bytes.NewBufferString(body))
	w := httptest.NewRecorder()
	h.Register(w, req)
	if w.Result().StatusCode != http.StatusCreated {
		t.Errorf("expected 201, got %d", w.Result().StatusCode)
	}
}

func TestRegisterHandler_Conflict(t *testing.T) {
	h := NewHandler(&mockURLShortener{}, &mockUserService{
		RegisterFunc: func(ctx context.Context, username, password string) error {
			return errors.New("username already exists")
		},
	}, "http://localhost")
	body := `{"username":"tester","password":"pass"}`
	req := httptest.NewRequest("POST", "/api/register", bytes.NewBufferString(body))
	w := httptest.NewRecorder()
	h.Register(w, req)
	if w.Result().StatusCode != http.StatusConflict {
		t.Errorf("expected 409, got %d", w.Result().StatusCode)
	}
}

func TestLoginHandler_Success(t *testing.T) {
	os.Setenv("JWT_SECRET_KEY", "testsecret")
	h := NewHandler(&mockURLShortener{}, &mockUserService{
		LoginFunc: func(ctx context.Context, username, password string) (*models.User, error) {
			return &models.User{Username: username}, nil
		},
	}, "http://localhost")
	body := `{"username":"tester","password":"pass"}`
	req := httptest.NewRequest("POST", "/api/login", bytes.NewBufferString(body))
	w := httptest.NewRecorder()
	h.Login(w, req)
	if w.Result().StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Result().StatusCode)
	}
}

func TestLoginHandler_Unauthorized(t *testing.T) {
	os.Setenv("JWT_SECRET_KEY", "testsecret")
	h := NewHandler(&mockURLShortener{}, &mockUserService{
		LoginFunc: func(ctx context.Context, username, password string) (*models.User, error) {
			return nil, errors.New("invalid credentials")
		},
	}, "http://localhost")
	body := `{"username":"tester","password":"wrong"}`
	req := httptest.NewRequest("POST", "/api/login", bytes.NewBufferString(body))
	w := httptest.NewRecorder()
	h.Login(w, req)
	if w.Result().StatusCode != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", w.Result().StatusCode)
	}
}

func TestSlugsHandler_Success(t *testing.T) {
	h := NewHandler(&mockURLShortener{
		ListByUserFunc: func(ctx context.Context, username string, page, size int, includeExpired bool) ([]models.ShortURL, error) {
			return []models.ShortURL{{Slug: "abc", URL: "https://x.com", TrackClicks: true}}, nil
		},
	}, &mockUserService{}, "http://localhost")
	req := httptest.NewRequest("GET", "/api/slugs", nil)
	req = req.WithContext(context.WithValue(req.Context(), contextKey("username"), "tester"))
	w := httptest.NewRecorder()
	h.Slugs(w, req)
	if w.Result().StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Result().StatusCode)
	}
	var out map[string][]map[string]interface{}
	_ = json.NewDecoder(w.Body).Decode(&out)
	if len(out["slugs"]) == 0 {
		t.Errorf("expected at least one slug")
	}
}
