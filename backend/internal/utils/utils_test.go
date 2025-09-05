package utils

import "testing"

// TestGenerateSlug ensures the generated slug has the correct length
// and consists solely of characters in the allowed set.
func TestGenerateSlug(t *testing.T) {
	slug := GenerateSlug(8)
	if len(slug) != 8 {
		t.Fatalf("expected slug length 8, got %d", len(slug))
	}
	for i := 0; i < len(slug); i++ {
		c := slug[i]
		valid := false
		for _, a := range AllowedChars {
			if c == a {
				valid = true
				break
			}
		}
		if !valid {
			t.Fatalf("invalid character %q in slug", c)
		}
	}
}

// TestComposeDestination verifies UTM parameters are appended
// correctly for various base URLs.
func TestComposeDestination(t *testing.T) {
	// Without existing query
	dest := ComposeDestination("https://example.com", map[string]string{"source": "google", "campaign": "summer"})
	if dest != "https://example.com?utm_source=google&utm_campaign=summer" && dest != "https://example.com?utm_campaign=summer&utm_source=google" {
		t.Fatalf("unexpected destination: %s", dest)
	}
	// With existing query
	dest = ComposeDestination("https://example.com/?q=1", map[string]string{"source": "newsletter"})
	if dest != "https://example.com/?q=1&utm_source=newsletter" {
		t.Fatalf("unexpected destination: %s", dest)
	}
	// With no params
	dest = ComposeDestination("https://example.com", map[string]string{})
	if dest != "https://example.com" {
		t.Fatalf("unexpected destination: %s", dest)
	}
}
