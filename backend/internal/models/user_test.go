package models

import (
	"encoding/json"
	"testing"
	"time"
)

func TestUserFields(t *testing.T) {
	now := time.Now().UTC()
	u := User{
		Username:  "tester",
		Password:  "secret",
		CreatedAt: now,
	}
	if u.Username != "tester" {
		t.Errorf("expected username 'tester', got %s", u.Username)
	}
	if u.Password != "secret" {
		t.Errorf("expected password 'secret', got %s", u.Password)
	}
}

func TestUserJSON(t *testing.T) {
	u := User{Username: "tester"}
	data, err := json.Marshal(u)
	if err != nil {
		t.Fatalf("json marshal error: %v", err)
	}
	if string(data) == "" {
		t.Error("expected non-empty json")
	}
}
