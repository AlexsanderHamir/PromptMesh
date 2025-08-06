package server

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/AlexsanderHamir/PromptMesh/agents"
	"github.com/AlexsanderHamir/PromptMesh/orchestration"
	"github.com/AlexsanderHamir/PromptMesh/shared"
)

func NewServer() *Server {
	return &Server{
		agents:    make(map[string]*agents.Agent),
		pipelines: make(map[string]*PipelineInfo),
	}
}

func InitServer() *http.ServeMux {
	s := NewServer()
	mux := http.NewServeMux()
	s.RegisterRoutes(mux)

	return mux
}

// RegisterRoutes sets up the server's HTTP routes
func (s *Server) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/pipelines/create", s.CreatePipeline)
	mux.HandleFunc("/pipelines/add-agent", s.AddAgentToPipeline)
	mux.HandleFunc("/pipelines/start", s.StartPipeline)
}

// Create an empty pipeline
func (s *Server) CreatePipeline(w http.ResponseWriter, r *http.Request) {
	var req CreatePipelineRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.sendError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	if req.Name == "" || req.FirstPrompt == "" {
		s.sendError(w, http.StatusBadRequest, "Missing required fields: name, first_prompt")
		return
	}

	manager := &orchestration.AgentManager{
		FirstPrompt: req.FirstPrompt,
	}

	s.mutex.Lock()
	pipelineID := generateID(PIPELINE_PREFIX)
	s.pipelines[pipelineID] = &PipelineInfo{
		Name:        req.Name,
		Manager:     manager,
		AgentIDs:    []string{},
		FirstPrompt: req.FirstPrompt,
		IsBuilt:     false,
	}
	s.mutex.Unlock()

	s.sendJSON(w, http.StatusCreated, CreatePipelineResponse{
		PipelineID: pipelineID,
		Message:    fmt.Sprintf("Empty pipeline '%s' created successfully", req.Name),
	})
}

// Create agent and add to pipeline in one step
func (s *Server) AddAgentToPipeline(w http.ResponseWriter, r *http.Request) {
	var req AddAgentToPipelineRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.sendError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	if req.PipelineID == "" || req.Name == "" || req.Role == "" || req.SystemMsg == "" || req.Provider == "" {
		s.sendError(w, http.StatusBadRequest, "Missing required fields: pipeline_id, name, role, system_msg, provider")
		return
	}

	envVar, ok := shared.ProviderEnvVars[req.Provider]
	if !ok {
		s.sendError(w, http.StatusBadRequest, fmt.Sprintf("Provider '%s' is not supported. Supported providers: %s", req.Provider, getSupportedProviders()))
		return
	}

	s.mutex.Lock()
	defer s.mutex.Unlock()

	pipeline, pipelineExists := s.pipelines[req.PipelineID]
	if !pipelineExists {
		s.sendError(w, http.StatusNotFound, fmt.Sprintf("Pipeline with ID '%s' not found", req.PipelineID))
		return
	}

	agent, err := agents.NewAgent(req.Name, req.Role, req.SystemMsg, req.Provider, envVar, req.Model)
	if err != nil {
		s.sendError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to create agent: %v", err))
		return
	}

	agentID := generateID(AGENT_PRFIX)
	s.agents[agentID] = agent

	pipeline.AgentIDs = append(pipeline.AgentIDs, agentID)
	pipeline.Manager.AddToPipeline(agent)
	pipeline.IsBuilt = false

	agentOrder := len(pipeline.AgentIDs)

	s.sendJSON(w, http.StatusCreated, AddAgentToPipelineResponse{
		AgentID:    agentID,
		Message:    fmt.Sprintf("Agent '%s' created and added to pipeline '%s' at position %d", agent.Name, pipeline.Name, agentOrder),
		AgentCount: len(pipeline.AgentIDs),
		AgentOrder: agentOrder,
	})
}

func (s *Server) StartPipeline(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.sendError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req StartPipelineRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.sendError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	if req.PipelineID == "" {
		s.sendError(w, http.StatusBadRequest, "Missing required field: pipeline_id")
		return
	}

	s.mutex.RLock()
	pipeline, ok := s.pipelines[req.PipelineID]
	s.mutex.RUnlock()

	if !ok {
		s.sendError(w, http.StatusNotFound, fmt.Sprintf("Pipeline with ID '%s' not found", req.PipelineID))
		return
	}

	result, err := pipeline.Manager.StartPipeline()
	if err != nil {
		s.sendError(w, http.StatusInternalServerError, fmt.Sprintf("Pipeline execution failed: %v", err))
		return
	}

	s.sendJSON(w, http.StatusOK, StartPipelineResponse{
		Result:  result,
		Message: fmt.Sprintf("Pipeline '%s' executed successfully", pipeline.Name),
	})
}
