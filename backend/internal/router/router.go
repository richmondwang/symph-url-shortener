package router

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	httpSwagger "github.com/swaggo/http-swagger"

	"github.com/richmondwang/symph-url-shortener/internal/handlers"
)

// NewRouter constructs and configures a chi.Router with the API routes.
// It attaches standard middleware such as request logging and
// recoverer.  The shorten endpoint is mounted under /api/shorten;
// slugs are handled at the root path.  Swagger documentation and
// Swagger UI are served under /swagger.json and /swagger/* respectively.
func NewRouter(h *handlers.Handler) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	allowedOrigins := os.Getenv("CORS_ALLOWED_ORIGINS")
	if allowedOrigins == "" {
		allowedOrigins = "*"
	}
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   strings.Split(allowedOrigins, ","),
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))
	r.Route("/api", func(api chi.Router) {
		api.Post("/login", h.Login)
		api.Post("/register", h.Register)
		// Protected endpoints
		api.Group(func(protected chi.Router) {
			protected.Use(handlers.JWTAuthMiddleware)
			protected.Post("/shorten", h.Shorten)
			protected.Get("/slugs", h.Slugs)
			protected.Post("/checkSlug", h.CheckSlug)
		})
	})
	r.Get("/{slug}", h.Redirect)
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"message":"URL Shortener API"}`))
	})
	// Serve the raw OpenAPI spec at /swagger.json
	r.Get("/swagger.json", func(w http.ResponseWriter, r *http.Request) {
		// Resolve the file path relative to the project root
		fp := filepath.Join(".", "docs", "swagger.json")
		http.ServeFile(w, r, fp)
	})
	// Serve Swagger UI at /swagger/index.html, configured to fetch
	// our spec from /swagger.json.  httpSwagger.URL sets the
	// location of the OpenAPI document.
	r.Get("/swagger/*", httpSwagger.Handler(httpSwagger.URL("/swagger.json")))
	return r
}
