package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/AlexsanderHamir/PromptMesh/shared"
	"github.com/google/uuid"
)

// Utility functions
func (s *Server) sendJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func (s *Server) sendError(w http.ResponseWriter, status int, message string) {
	s.sendJSON(w, status, ErrorResponse{Error: message})
}

// Generate unique IDs for temporary execution sessions
func generateID(prefix string) string {
	return fmt.Sprintf("%s-%s", prefix, uuid.NewString())
}

// Helper function to get list of supported providers
func getSupportedProviders() string {
	var providers []string
	for provider := range shared.ProviderEnvVars {
		providers = append(providers, provider)
	}
	return strings.Join(providers, ", ")
}
