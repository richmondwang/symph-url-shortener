package services

import (
	"context"

	"github.com/richmondwang/symph-url-shortener/internal/models"
)

// UserService defines the interface for user management logic
type UserService interface {
	Register(ctx context.Context, username, password string) error
	Login(ctx context.Context, username, password string) (*models.User, error)
	GetByUsername(ctx context.Context, username string) (*models.User, error)
}
