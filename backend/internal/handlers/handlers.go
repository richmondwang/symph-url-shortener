package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"

	"github.com/richmondwang/symph-url-shortener/internal/models"
	"github.com/richmondwang/symph-url-shortener/internal/services"
	"github.com/richmondwang/symph-url-shortener/internal/utils"
)

// writeJSONError writes a JSON error response with the given status code and message.
func writeJSONError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

// contextKey is a custom type for context keys to avoid collisions
type contextKey string

// Handler uses service interfaces for business logic
type Handler struct {
	URLShortener services.URLShortenerService
	UserService  services.UserService
	BaseURL      string
}

// NewHandler constructs a new Handler with injected services and base URL
func NewHandler(urlShortener services.URLShortenerService, userService services.UserService, baseURL string) *Handler {
	return &Handler{URLShortener: urlShortener, UserService: userService, BaseURL: baseURL}
}

// shortenRequest defines the expected JSON payload for the POST
// /api/shorten endpoint.  The URL field is mandatory; slug and
// expiration are optional.  UTM parameters are accepted as a map of
// strings.  All fields use json tags for proper decoding.
type shortenRequest struct {
	URL         string            `json:"url"`
	Slug        string            `json:"slug,omitempty"`
	Expiration  string            `json:"expiration,omitempty"`
	UTMs        map[string]string `json:"utms,omitempty"`
	TrackClicks bool              `json:"trackClicks,omitempty"`
}

// shortenResponse defines the JSON structure returned by the
// /api/shorten endpoint.  It exposes the slug, the complete short
// link (including the configured base URL), the destination URL and
// optional expiration.
type shortenResponse struct {
	Slug      string     `json:"slug"`
	ShortLink string     `json:"shortLink"`
	URL       string     `json:"destination"`
	ExpireAt  *time.Time `json:"expiration,omitempty"`
}

// registerRequest defines the expected JSON payload for registration
// Only username and password are required
type registerRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type loginResponse struct {
	Token     string `json:"token"`
	ExpiresAt int64  `json:"expiresAt"`
}

type SlugInfo struct {
	Slug          string            `json:"slug"`
	ShortLink     string            `json:"shortLink"`
	Destination   string            `json:"destination"`
	ExpireAt      *time.Time        `json:"expiration,omitempty"`
	RedirectCount int64             `json:"redirectCount,omitempty"`
	UTMs          map[string]string `json:"utms,omitempty"`
	TrackClicks   bool              `json:"trackClicks,omitempty"`
}

// SlugsResponse for frontend
type slugsResponse struct {
	Slugs []SlugInfo `json:"slugs"`
}

// CheckSlugRequest and CheckSlugResponse for slug availability
type checkSlugRequest struct {
	Slug string `json:"slug"`
}

type checkSlugResponse struct {
	Available bool   `json:"available"`
	Message   string `json:"message"`
}

// JWT middleware for chi
func JWTAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		auth := r.Header.Get("Authorization")
		if !strings.HasPrefix(auth, "Bearer ") {
			http.Error(w, "Missing or invalid token", http.StatusUnauthorized)
			return
		}
		tokenStr := strings.TrimPrefix(auth, "Bearer ")
		secret := os.Getenv("JWT_SECRET_KEY")
		if secret == "" {
			http.Error(w, "JWT secret not configured", http.StatusInternalServerError)
			return
		}
		claims := jwt.MapClaims{}
		_, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		})
		if err != nil || claims["sub"] == nil {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}
		// Store username in context for handler use
		ctx := context.WithValue(r.Context(), contextKey("username"), claims["sub"].(string))
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// Shorten accepts a JSON body describing the URL to be shortened.
// @Summary Shorten a URL
// @Description Create a shortened URL with optional custom slug, expiration and UTM parameters. Returns the generated slug, the full short link and the destination URL with UTM parameters appended.
// @Tags shorten
// @Accept json
// @Produce json
// @Param request body shortenRequest true "URL payload"
// @Success 201 {object} shortenResponse
// @Failure 400 {object} map[string]string "Bad Request"
// @Failure 500 {object} map[string]string "Internal Server Error"
// @Router /api/shorten [post]
func (h *Handler) Shorten(w http.ResponseWriter, r *http.Request) {
	var req shortenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}
	username, _ := r.Context().Value(contextKey("username")).(string)
	urlStr := strings.TrimSpace(req.URL)
	if msg, ok := validateURL(urlStr); !ok {
		writeJSONError(w, http.StatusBadRequest, msg)
		return
	}
	destination := utils.ComposeDestination(urlStr, req.UTMs)
	slug := strings.TrimSpace(req.Slug)
	if slug != "" {
		if msg, ok := validateSlug(slug); !ok {
			writeJSONError(w, http.StatusBadRequest, msg)
			return
		}
	} else {
		slug = utils.GenerateSlug(8)
	}
	expire := utils.ParseExpiration(strings.TrimSpace(req.Expiration))
	if expire != nil {
		utc := expire.UTC()
		expire = &utc
	}
	now := time.Now().UTC()
	record := models.ShortURL{
		Slug:        slug,
		URL:         destination,
		ExpireAt:    expire,
		UTMs:        req.UTMs,
		CreatedAt:   now,
		CreatedBy:   username,
		TrackClicks: req.TrackClicks,
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	inserted, err := h.URLShortener.Shorten(ctx, record)
	if err != nil {
		// Check for MongoDB duplicate key error
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "E11000") {
			writeJSONError(w, http.StatusBadRequest, "Slug is already taken")
			return
		}
		writeJSONError(w, http.StatusInternalServerError, fmt.Sprintf("Error shortening URL: %v", err))
		return
	}
	base := strings.TrimRight(h.BaseURL, "/")
	resp := shortenResponse{
		Slug:      inserted.Slug,
		ShortLink: fmt.Sprintf("%s/%s", base, inserted.Slug),
		URL:       destination,
		ExpireAt:  expire,
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(resp)
}

// Redirect handles GET requests for a particular slug.
// @Summary Redirect to destination
// @Description Redirects to the original URL associated with the slug. Returns 301 Moved Permanently when the slug exists and has not expired.
// @Tags redirect
// @Produce plain
// @Param slug path string true "Slug"
// @Success 301 {string} string "Moved Permanently"
// @Failure 404 {string} string "Not Found"
// @Failure 410 {string} string "Gone"
// @Failure 500 {string} string "Internal Server Error"
// @Router /{slug} [get]
func (h *Handler) Redirect(w http.ResponseWriter, r *http.Request) {
	// No JWT required for redirect endpoint
	slug := chi.URLParam(r, "slug")
	if slug == "" {
		http.Error(w, "Missing slug", http.StatusBadRequest)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	result, err := h.URLShortener.GetBySlug(ctx, slug)
	if err != nil {
		http.Error(w, fmt.Sprintf("Database error: %v", err), http.StatusInternalServerError)
		return
	}
	if result == nil {
		http.NotFound(w, r)
		return
	}
	// Use 302 for temporary links (with expiration), 301 for permanent
	status := http.StatusMovedPermanently
	if result.ExpireAt != nil {
		status = http.StatusFound // 302
		if time.Now().UTC().After(*result.ExpireAt) {
			http.Error(w, "This link has expired", http.StatusGone)
			return
		}
	}
	// Only track clicks if enabled for this slug (persisted in DB)
	if result.TrackClicks {
		_ = h.URLShortener.IncrementRedirectCount(ctx, slug)
		// Prevent browser disk caching for analytics accuracy
		w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
		w.Header().Set("Pragma", "no-cache")
		w.Header().Set("Expires", "0")
	}
	http.Redirect(w, r, result.URL, status)
}

// Register creates a new user with username and password
// @Summary Register a new user
// @Description Creates a new user with username and password
// @Tags auth
// @Accept json
// @Produce json
// @Param request body registerRequest true "Registration payload"
// @Success 201 {object} map[string]string
// @Failure 400 {object} map[string]string "Bad Request"
// @Failure 409 {object} map[string]string "Conflict"
// @Failure 500 {object} map[string]string "Internal Server Error"
// @Router /api/register [post]
func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}
	if req.Username == "" || req.Password == "" {
		writeJSONError(w, http.StatusBadRequest, "Username and password required")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	err := h.UserService.Register(ctx, req.Username, req.Password)
	if err != nil {
		if err.Error() == "username already exists" {
			writeJSONError(w, http.StatusConflict, "Username already exists")
			return
		}
		writeJSONError(w, http.StatusInternalServerError, "Database error")
		return
	}
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]string{"message": "User registered"})
}

// Login authenticates user and returns JWT valid for 1 hour
// @Summary Login
// @Description Authenticates user and returns JWT valid for 1 hour
// @Tags auth
// @Accept json
// @Produce json
// @Param request body loginRequest true "Login payload"
// @Success 200 {object} loginResponse
// @Failure 400 {object} map[string]string "Bad Request"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 500 {object} map[string]string "Internal Server Error"
// @Router /api/login [post]
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}
	if req.Username == "" || req.Password == "" {
		writeJSONError(w, http.StatusBadRequest, "Username and password required")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	user, err := h.UserService.Login(ctx, req.Username, req.Password)
	if err != nil {
		if err.Error() == "invalid credentials" {
			writeJSONError(w, http.StatusUnauthorized, "Invalid credentials")
			return
		}
		writeJSONError(w, http.StatusInternalServerError, "Database error")
		return
	}
	// Create JWT
	expiresAt := time.Now().Add(time.Hour).Unix()
	claims := jwt.MapClaims{
		"sub": user.Username,
		"exp": expiresAt,
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	secret := []byte(os.Getenv("JWT_SECRET_KEY"))
	signed, err := token.SignedString(secret)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "Failed to sign token")
		return
	}
	resp := loginResponse{
		Token:     signed,
		ExpiresAt: expiresAt,
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}

// Slugs returns all shortened URLs for the authenticated user
// @Summary List user's shortened URLs
// @Description Returns all shortened URLs for the authenticated user
// @Tags slugs
// @Produce json
// @Param page query int false "Page number"
// @Param size query int false "Page size"
// @Param includeExpired query bool false "Include expired URLs"
// @Success 200 {object} slugsResponse
// @Failure 500 {object} map[string]string "Internal Server Error"
// @Router /api/slugs [get]
func (h *Handler) Slugs(w http.ResponseWriter, r *http.Request) {
	username, _ := r.Context().Value(contextKey("username")).(string)
	page := 1
	size := 100
	if p := r.URL.Query().Get("page"); p != "" {
		if n, err := strconv.Atoi(p); err == nil && n > 0 {
			page = n
		}
	}
	if s := r.URL.Query().Get("size"); s != "" {
		if n, err := strconv.Atoi(s); err == nil && n > 0 {
			size = n
		}
	}
	includeExpired := false
	if e := r.URL.Query().Get("includeExpired"); e == "true" {
		includeExpired = true
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	results, err := h.URLShortener.ListByUser(ctx, username, page, size, includeExpired)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "Database error")
		return
	}
	base := strings.TrimRight(h.BaseURL, "/")
	var slugs []SlugInfo
	for _, s := range results {
		slugs = append(slugs, SlugInfo{
			Slug:          s.Slug,
			ShortLink:     base + "/" + s.Slug,
			Destination:   s.URL,
			ExpireAt:      s.ExpireAt,
			UTMs:          s.UTMs,
			RedirectCount: int64(s.RedirectCount),
			TrackClicks:   s.TrackClicks,
		})
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(slugsResponse{Slugs: slugs})
}

// CheckSlug checks if a slug is available (not present in DB)
// @Summary Check slug availability
// @Description Checks if a custom slug is available (not present in the database)
// @Tags slug
// @Accept json
// @Produce json
// @Param request body checkSlugRequest true "Slug payload"
// @Success 200 {object} checkSlugResponse
// @Failure 400 {object} map[string]string "Bad Request"
// @Failure 500 {object} map[string]string "Internal Server Error"
// @Router /api/checkSlug [post]
func (h *Handler) CheckSlug(w http.ResponseWriter, r *http.Request) {
	var req checkSlugRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}
	slug := strings.TrimSpace(req.Slug)
	if msg, ok := validateSlug(slug); !ok {
		writeJSONError(w, http.StatusBadRequest, msg)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()
	available, err := h.URLShortener.IsSlugAvailable(ctx, slug)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "Database error")
		return
	}
	resp := checkSlugResponse{
		Available: available,
		Message:   "",
	}
	if !available {
		resp.Message = "Slug is already taken"
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}

// validateSlug checks if the slug is valid (length and alphanumeric)
func validateSlug(slug string) (string, bool) {
	slug = strings.TrimSpace(slug)
	if slug == "" {
		return "Missing slug field", false
	}
	if len(slug) < 8 || len(slug) > 16 {
		return "Custom slug must be between 8 and 16 characters", false
	}
	for _, c := range slug {
		if !(('a' <= c && c <= 'z') || ('A' <= c && c <= 'Z') || ('0' <= c && c <= '9')) {
			return "Custom slug must be alphanumeric (letters and numbers only)", false
		}
	}
	return "", true
}

// validateURL checks if the given string is a valid URL with http or https scheme.
func validateURL(urlStr string) (string, bool) {
	urlStr = strings.TrimSpace(urlStr)
	if urlStr == "" {
		return "Missing URL field", false
	}
	u, err := utils.ParseURL(urlStr)
	if err != nil {
		return "Invalid URL format", false
	}
	if u.Scheme != "http" && u.Scheme != "https" {
		return "URL must start with http:// or https://", false
	}
	if u.Host == "" {
		return "URL must have a valid host", false
	}
	return "", true
}
