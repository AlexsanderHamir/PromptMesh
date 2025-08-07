package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/AlexsanderHamir/PromptMesh/agents"
	"github.com/AlexsanderHamir/PromptMesh/orchestration"
	"github.com/AlexsanderHamir/PromptMesh/shared"
)

func NewServer() *Server {
	s := &Server{
		executions: make(map[string]*PipelineExecution),
	}

	// Start cleanup goroutine
	go func() {
		ticker := time.NewTicker(10 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			s.cleanupOldExecutions()
		}
	}()

	return s
}

func InitServer() *http.ServeMux {
	s := NewServer()
	mux := http.NewServeMux()

	// Add CORS middleware wrapper
	corsHandler := func(handler http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			// Set CORS headers
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

			// Handle preflight requests
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusOK)
				return
			}

			handler(w, r)
		}
	}

	s.registerRoutes(mux, corsHandler)
	return mux
}

// RegisterRoutes sets up the server's HTTP routes with CORS middleware
func (s *Server) registerRoutes(mux *http.ServeMux, corsHandler func(http.HandlerFunc) http.HandlerFunc) {
	mux.HandleFunc("/pipelines/execute", corsHandler(s.ExecutePipeline))
}

// ExecutePipeline handles the complete pipeline execution in one request
func (s *Server) ExecutePipeline(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.sendError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req ExecutePipelineRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.sendError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	// Validate required fields
	if req.Name == "" || req.FirstPrompt == "" {
		s.sendError(w, http.StatusBadRequest, "Missing required fields: name, first_prompt")
		return
	}

	if len(req.Agents) == 0 {
		s.sendError(w, http.StatusBadRequest, "At least one agent is required")
		return
	}

	// Create execution session
	executionID := generateID(PIPELINE_PREFIX)
	manager := &orchestration.AgentManager{
		FirstPrompt: req.FirstPrompt,
	}

	execution := &PipelineExecution{
		ID:          executionID,
		Name:        req.Name,
		Manager:     manager,
		FirstPrompt: req.FirstPrompt,
		Agents:      []*agents.Agent{},
		CreatedAt:   time.Now(),
	}

	// Create and add agents to the pipeline
	for i, agentConfig := range req.Agents {
		if agentConfig.Name == "" || agentConfig.Role == "" || agentConfig.SystemMsg == "" || agentConfig.Provider == "" {
			s.sendError(w, http.StatusBadRequest, fmt.Sprintf("Agent %d missing required fields: name, role, system_msg, provider", i+1))
			return
		}

		envVar, ok := shared.ProviderEnvVars[agentConfig.Provider]
		if !ok {
			s.sendError(w, http.StatusBadRequest, fmt.Sprintf("Provider '%s' is not supported. Supported providers: %s", agentConfig.Provider, getSupportedProviders()))
			return
		}

		agent, err := agents.NewAgent(
			agentConfig.Name,
			agentConfig.Role,
			agentConfig.SystemMsg,
			agentConfig.Provider,
			envVar,
			agentConfig.Model,
		)
		if err != nil {
			s.sendError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to create agent '%s': %v", agentConfig.Name, err))
			return
		}

		execution.Agents = append(execution.Agents, agent)
		manager.AddToPipeline(agent)
	}

	// Store execution session
	s.mutex.Lock()
	s.executions[executionID] = execution
	s.mutex.Unlock()

	// Execute the pipeline
	result, err := manager.StartPipeline()

	s.mutex.Lock()
	now := time.Now()
	execution.CompletedAt = &now

	if err != nil {
		errorMsg := err.Error()
		execution.Error = &errorMsg
		s.mutex.Unlock()
		s.sendError(w, http.StatusInternalServerError, fmt.Sprintf("Pipeline execution failed: %v", err))
		return
	}

	execution.Result = &result
	s.mutex.Unlock()

	s.sendJSON(w, http.StatusOK, ExecutePipelineResponse{
		Result:  result,
		Message: fmt.Sprintf("Pipeline '%s' executed successfully", req.Name),
	})
}
