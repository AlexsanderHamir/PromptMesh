package server

import (
	"sync"
	"time"

	"github.com/AlexsanderHamir/PromptMesh/agents"
	"github.com/AlexsanderHamir/PromptMesh/orchestration"
)

// Request/Response types for single pipeline execution
type ExecutePipelineRequest struct {
	Name        string        `json:"name"`
	FirstPrompt string        `json:"first_prompt"`
	Agents      []AgentConfig `json:"agents"`
}

type AgentConfig struct {
	Name      string `json:"name"`
	Role      string `json:"role"`
	SystemMsg string `json:"system_msg"`
	Provider  string `json:"provider"`
	Model     string `json:"model,omitempty"`
}

type ExecutePipelineResponse struct {
	Result  string `json:"result"`
	Message string `json:"message"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

// Server holds only execution-related state
type Server struct {
	// Active pipeline executions (temporary, cleared after completion)
	executions map[string]*PipelineExecution
	mutex      sync.RWMutex
}

// PipelineExecution represents a temporary execution session
type PipelineExecution struct {
	ID          string
	Name        string
	FirstPrompt string
	Manager     *orchestration.AgentManager
	Agents      []*agents.Agent
	CreatedAt   time.Time
	CompletedAt *time.Time
	Result      *string
	Error       *string
}

// Cleanup old executions (older than 1 hour)
func (s *Server) cleanupOldExecutions() {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	cutoff := time.Now().Add(-time.Hour)
	for id, execution := range s.executions {
		if execution.CreatedAt.Before(cutoff) {
			delete(s.executions, id)
		}
	}
}
