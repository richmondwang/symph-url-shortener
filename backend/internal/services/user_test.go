package services

import (
	"context"
	"errors"
	"testing"

	"github.com/richmondwang/symph-url-shortener/internal/models"
)

type fakeUserService struct{}

func (f *fakeUserService) Register(ctx context.Context, username, password string) error {
	if username == "exists" {
		return errors.New("exists")
	}
	return nil
}
func (f *fakeUserService) Login(ctx context.Context, username, password string) (*models.User, error) {
	if username == "bad" {
		return nil, errors.New("invalid")
	}
	return &models.User{Username: username}, nil
}
func (f *fakeUserService) GetByUsername(ctx context.Context, username string) (*models.User, error) {
	if username == "notfound" {
		return nil, nil
	}
	return &models.User{Username: username}, nil
}

func TestRegister(t *testing.T) {
	s := &fakeUserService{}
	ctx := context.Background()
	if err := s.Register(ctx, "exists", "pass"); err == nil {
		t.Errorf("expected error for exists")
	}
	if err := s.Register(ctx, "new", "pass"); err != nil {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestLogin(t *testing.T) {
	s := &fakeUserService{}
	ctx := context.Background()
	u, err := s.Login(ctx, "bad", "pass")
	if err == nil || u != nil {
		t.Errorf("expected error for bad login")
	}
	u, err = s.Login(ctx, "good", "pass")
	if err != nil || u == nil || u.Username != "good" {
		t.Errorf("expected good login, got %v, err %v", u, err)
	}
}

func TestGetByUsername(t *testing.T) {
	s := &fakeUserService{}
	ctx := context.Background()
	u, err := s.GetByUsername(ctx, "notfound")
	if err != nil || u != nil {
		t.Errorf("expected nil for notfound")
	}
	u, err = s.GetByUsername(ctx, "tester")
	if err != nil || u == nil || u.Username != "tester" {
		t.Errorf("expected tester, got %v, err %v", u, err)
	}
}
