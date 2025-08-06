package server

import (
	"sync"

	"github.com/AlexsanderHamir/PromptMesh/agents"
	"github.com/AlexsanderHamir/PromptMesh/orchestration"
)

// Request/Response types
type SetAPIKeyRequest struct {
	APIKey string `json:"api_key"`
}

type SetAPIKeyResponse struct {
	Message string `json:"message"`
}

// Request/Response types
type CreatePipelineRequest struct {
	Name        string `json:"name"`
	FirstPrompt string `json:"first_prompt"`
}

type CreatePipelineResponse struct {
	PipelineID string `json:"pipeline_id"`
	Message    string `json:"message"`
}

type AddAgentToPipelineRequest struct {
	PipelineID string `json:"pipeline_id"`
	Name       string `json:"name"`
	Role       string `json:"role"`
	SystemMsg  string `json:"system_msg"`
	Provider   string `json:"provider"`
	Model      string `json:"model,omitempty"`
}

type AddAgentToPipelineResponse struct {
	AgentID    string `json:"agent_id"`
	Message    string `json:"message"`
	AgentCount int    `json:"agent_count"`
	AgentOrder int    `json:"agent_order"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

type StartPipelineRequest struct {
	PipelineID string `json:"pipeline_id"`
}

type StartPipelineResponse struct {
	Result  string `json:"result"`
	Message string `json:"message"`
}

// Server holds our in-memory storage
type Server struct {
	agents    map[string]*agents.Agent
	pipelines map[string]*PipelineInfo
	mutex     sync.RWMutex
}

type PipelineInfo struct {
	Name        string
	Manager     *orchestration.AgentManager
	AgentIDs    []string
	FirstPrompt string
	IsBuilt     bool // Track if pipeline has been built/connected
}
