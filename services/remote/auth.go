//go:build remote

package remote

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"os"
	"slices"
	"strings"
)

type Payload struct {
	Nonce  string   `json:"nonce"`
	Scopes []string `json:"scopes"`
}

var shared_secret string = ""

func init() {
	secret, success := os.LookupEnv("BREAKFAST_REMOTE_SECRET")
	if !success || secret == "" {
		return
	}

	shared_secret = secret
}

func generateHmac(message []byte) string {
	h := hmac.New(sha256.New, []byte(shared_secret))
	h.Write(message)
	hash := h.Sum(nil)
	return hex.EncodeToString(hash)
}

func verifyHmac(message []byte, hash string) bool {
	expected := generateHmac(message)
	return hmac.Equal([]byte(expected), []byte(hash))
}

func verifyToken(token string) error {
	parts := strings.Split(token, ".")

	if len(parts) != 2 {
		return errors.New("Invalid token")
	}

	payload_base := parts[0]
	hash := parts[1]
	payload_raw, err := base64.StdEncoding.DecodeString(payload_base)
	if err != nil {
		return errors.New("Invalid payload")
	}

	var payload Payload
	{
		err := json.Unmarshal([]byte(payload_raw), &payload)
		if err != nil {
			return errors.New("Invalid payload")
		}
	}

	if payload.Nonce == "" {
		return errors.New("No nonce was included")
	}

	if len(payload.Nonce) < 21 {
		return errors.New("Invalid nonce")
	}

	if !slices.Contains(payload.Scopes, "remote") {
		return errors.New("Remote scope not included")
	}

	hmac_passed := verifyHmac([]byte(payload_base), hash)
	if !hmac_passed {
		return errors.New("HMAC check failed")
	}

	return nil
}
