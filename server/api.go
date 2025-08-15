package server

import (
	"encoding/json"
	"errors"
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
	mux.HandleFunc("/", corsHandler(s.HealthCheck))
	mux.HandleFunc("/api/pipelines/execute", corsHandler(s.ExecutePipeline))
	mux.HandleFunc("/api/pipelines/execute/stream", corsHandler(s.ExecutePipelineStream))
}

// validateAgentOrder ensures agents have unique names and validates the order
func validateAgentOrder(agents []AgentConfig) error {
	if len(agents) == 0 {
		return errors.New("at least one agent is required")
	}

	// Ensure agents have unique names to avoid confusion
	seenNames := make(map[string]bool)
	for i, agent := range agents {
		if seenNames[agent.Name] {
			return fmt.Errorf("duplicate agent name '%s' at position %d", agent.Name, i+1)
		}
		seenNames[agent.Name] = true
	}

	return nil
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

	// Validate agent order and uniqueness
	if err := validateAgentOrder(req.Agents); err != nil {
		s.sendError(w, http.StatusBadRequest, fmt.Sprintf("Agent validation failed: %v", err))
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

// ExecutePipelineStream handles pipeline execution with streaming updates via Server-Sent Events
func (s *Server) ExecutePipelineStream(w http.ResponseWriter, r *http.Request) {
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

	// Validate agent order and uniqueness
	if err := validateAgentOrder(req.Agents); err != nil {
		s.sendSSEError(w, fmt.Sprintf("Agent validation failed: %v", err))
		return
	}

	// Set up SSE headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("X-Accel-Buffering", "no")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Cache-Control")

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
			s.sendSSEError(w, fmt.Sprintf("Agent %d missing required fields: name, role, system_msg, provider", i+1))
			return
		}

		envVar, ok := shared.ProviderEnvVars[agentConfig.Provider]
		if !ok {
			s.sendSSEError(w, fmt.Sprintf("Provider '%s' is not supported. Supported providers: %s", agentConfig.Provider, getSupportedProviders()))
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
			s.sendSSEError(w, fmt.Sprintf("Failed to create agent '%s': %v", agentConfig.Name, err))
			return
		}

		execution.Agents = append(execution.Agents, agent)
		manager.AddToPipeline(agent)
	}

	// Store execution session
	s.mutex.Lock()
	s.executions[executionID] = execution
	s.mutex.Unlock()

	// Send initial status
	s.sendSSEMessage(w, "status", map[string]interface{}{
		"type":         "pipeline_started",
		"message":      fmt.Sprintf("🚀 Starting pipeline '%s' with %d agent(s)", req.Name, len(req.Agents)),
		"execution_id": executionID,
	})

	// Execute the pipeline with streaming updates
	result, err := manager.StartPipelineStream(w, executionID)

	s.mutex.Lock()
	now := time.Now()
	execution.CompletedAt = &now

	if err != nil {
		errorMsg := err.Error()
		execution.Error = &errorMsg
		s.mutex.Unlock()
		s.sendSSEMessage(w, "error", map[string]interface{}{
			"type":    "pipeline_error",
			"message": fmt.Sprintf("❌ Pipeline execution failed: %v", err),
		})
		return
	}

	execution.Result = &result
	s.mutex.Unlock()

	// Send final success message
	s.sendSSEMessage(w, "status", map[string]interface{}{
		"type":    "pipeline_completed",
		"message": fmt.Sprintf("🎉 Pipeline '%s' executed successfully!", req.Name),
		"result":  result,
	})

	// Send end event
	s.sendSSEMessage(w, "end", map[string]interface{}{
		"type":         "pipeline_end",
		"execution_id": executionID,
	})
}

// sendSSEMessage sends a Server-Sent Event message
func (s *Server) sendSSEMessage(w http.ResponseWriter, eventType string, data interface{}) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return
	}

	fmt.Fprintf(w, "event: %s\n", eventType)
	fmt.Fprintf(w, "data: %s\n\n", jsonData)

	// Flush the response writer to ensure immediate delivery
	if flusher, ok := w.(http.Flusher); ok {
		flusher.Flush()
	}
}

// sendSSEError sends an error via SSE and ends the stream
func (s *Server) sendSSEError(w http.ResponseWriter, message string) {
	s.sendSSEMessage(w, "error", map[string]interface{}{
		"type":    "error",
		"message": message,
	})
	s.sendSSEMessage(w, "end", map[string]interface{}{
		"type": "error_end",
	})
}

// HealthCheck provides a simple health check endpoint
func (s *Server) HealthCheck(w http.ResponseWriter, r *http.Request) {
	s.sendJSON(w, http.StatusOK, map[string]interface{}{
		"status":  "healthy",
		"message": "PromptMesh API server is running",
		"time":    time.Now().Format(time.RFC3339),
	})
}
