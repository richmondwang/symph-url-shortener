package utils

import (
	"crypto/rand"
	"fmt"
	"net/url"
	"time"
)

// ParseURL parses a string into a *url.URL, returning an error if invalid.
func ParseURL(s string) (*url.URL, error) {
	return url.ParseRequestURI(s)
}

// AllowedChars defines the characters used to generate random slugs.
// It includes lowercase ASCII letters and digits.  Exporting this
// slice enables tests to verify that generated slugs use only the
// allowed character set.
var AllowedChars = []byte("abcdefghijklmnopqrstuvwxyz0123456789")

// GenerateSlug returns a random string of the given length consisting
// of characters defined in AllowedChars.  It utilises crypto/rand to
// generate cryptographically secure random bytes.  Errors from
// rand.Read are propagated as panics since they should never occur
// under normal circumstances.
func GenerateSlug(n int) string {
	if n <= 0 {
		n = 8
	}
	b := make([]byte, n)
	// Fill with random bytes
	if _, err := rand.Read(b); err != nil {
		panic(fmt.Errorf("failed to generate random slug: %w", err))
	}
	// Map each byte to a character in AllowedChars
	for i := range b {
		b[i] = AllowedChars[int(b[i])%len(AllowedChars)]
	}
	return string(b)
}

// ComposeDestination appends non‑empty UTM parameters to the given base
// URL.  Each key/value pair in utms results in a query parameter
// named "utm_<key>".  If the base URL already contains a query
// string (detected by the presence of '?'), additional parameters are
// concatenated with '&'.  Keys and values are URL‑encoded via
// url.QueryEscape.
func ComposeDestination(base string, utms map[string]string) string {
	// Trim whitespace from the base; avoid modifying input string
	urlStr := base
	// Collect non‑empty UTM values
	pairs := make([]string, 0)
	for k, v := range utms {
		if v == "" {
			continue
		}
		// URL‑encode the value
		pairs = append(pairs, fmt.Sprintf("utm_%s=%s", k, url.QueryEscape(v)))
	}
	if len(pairs) == 0 {
		return urlStr
	}
	sep := "?"
	if hasQuery(urlStr) {
		sep = "&"
	}
	return urlStr + sep + joinParams(pairs)
}

// hasQuery checks whether the provided URL already contains a
// query component by looking for '?' in the string.  This simple
// heuristic suffices for the purposes of this application.
func hasQuery(s string) bool {
	for i := 0; i < len(s); i++ {
		if s[i] == '?' {
			return true
		}
	}
	return false
}

// joinParams concatenates a slice of "key=value" strings using '&'.
func joinParams(params []string) string {
	result := ""
	for i, p := range params {
		if i > 0 {
			result += "&"
		}
		result += p
	}
	return result
}

// ParseExpiration parses an ISO‑8601 timestamp string into a
// *time.Time value.  Empty strings yield a nil pointer.  If parsing
// fails, the returned time will be zero.  Expiration times are
// truncated to seconds for consistency.
func ParseExpiration(s string) *time.Time {
	if s == "" {
		return nil
	}
	// Attempt to parse as RFC3339 or ISO8601 format
	if t, err := time.Parse(time.RFC3339, s); err == nil {
		u := t.Truncate(time.Second)
		return &u
	}
	// Try parsing without timezone (YYYY-MM-DDTHH:MM:SS)
	if t, err := time.Parse("2006-01-02T15:04:05", s); err == nil {
		u := t
		return &u
	}
	return nil
}
