package orchestration

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/AlexsanderHamir/PromptMesh/agents"
)

type AgentName string

type AgentManager struct {
	// The next agents will receive from the pipeline,
	// but the first agent will receive the intput from the user.
	FirstPrompt string

	// Pipeline holds all the agents.
	pipeline []*agents.Agent
}

func (ag *AgentManager) AddToPipeline(agent *agents.Agent) {
	ag.pipeline = append(ag.pipeline, agent)
}

func (ag *AgentManager) connectAgents() {
	pipelineLength := len(ag.pipeline)
	lastIndex := pipelineLength - 1

	for i, currentAgent := range ag.pipeline {
		if i == lastIndex {
			currentAgent.IsLast = true
			break
		}

		nextAgent := ag.pipeline[i+1]
		currentAgent.NextAgent = nextAgent
	}
}

func (ag *AgentManager) StartPipeline() (string, error) {
	ag.connectAgents()

	triggerAgent := ag.pipeline[0]
	finalRes, err := ag.executePipeline(triggerAgent, ag.FirstPrompt)
	if err != nil {
		return "", fmt.Errorf("pipeline execution failed: %w", err)
	}

	return finalRes, nil
}

// executePipeline executes the pipeline step by step without streaming
func (ag *AgentManager) executePipeline(currentAgent *agents.Agent, input string) (string, error) {
	if currentAgent == nil {
		return input, nil
	}

	// Execute the agent
	result, err := currentAgent.Handle(input)
	if err != nil {
		return "", fmt.Errorf("agent '%s' failed: %w", currentAgent.Name, err)
	}

	// If this is the last agent, return the result
	if currentAgent.IsLast {
		return result, nil
	}

	// Continue with the next agent
	return ag.executePipeline(currentAgent.NextAgent, result)
}

// StartPipelineStream executes the pipeline with streaming updates via SSE
func (ag *AgentManager) StartPipelineStream(w http.ResponseWriter, executionID string) (string, error) {
	ag.connectAgents()

	triggerAgent := ag.pipeline[0]

	// Send agent start notification
	ag.sendAgentUpdate(w, "agent_started", map[string]interface{}{
		"agent_name": triggerAgent.Name,
		"agent_role": triggerAgent.Role,
		"message":    fmt.Sprintf("🤖 Agent '%s' (%s) starting...", triggerAgent.Name, triggerAgent.Role),
	})

	// Execute the pipeline with streaming updates
	finalRes, err := ag.executePipelineWithStreaming(w, triggerAgent, ag.FirstPrompt)
	if err != nil {
		return "", fmt.Errorf("pipeline execution failed: %w", err)
	}

	return finalRes, nil
}

// executePipelineWithStreaming executes the pipeline step by step with streaming updates
func (ag *AgentManager) executePipelineWithStreaming(w http.ResponseWriter, currentAgent *agents.Agent, input string) (string, error) {
	if currentAgent == nil {
		return input, nil
	}

	// Send input processing notification
	ag.sendAgentUpdate(w, "agent_processing", map[string]interface{}{
		"agent_name":   currentAgent.Name,
		"agent_role":   currentAgent.Role,
		"message":      fmt.Sprintf("⚙️ Agent '%s' processing input...", currentAgent.Name),
		"input_length": len(input),
		"agent_input":  input, // Include the actual input for observability
	})

	// Execute the agent
	result, err := currentAgent.Handle(input)
	if err != nil {
		// Send error notification
		ag.sendAgentUpdate(w, "agent_error", map[string]interface{}{
			"agent_name": currentAgent.Name,
			"agent_role": currentAgent.Role,
			"message":    fmt.Sprintf("❌ Agent '%s' failed: %v", currentAgent.Name, err),
		})
		return "", fmt.Errorf("agent '%s' failed: %w", currentAgent.Name, err)
	}

	// Send completion notification with output
	ag.sendAgentUpdate(w, "agent_completed", map[string]interface{}{
		"agent_name":    currentAgent.Name,
		"agent_role":    currentAgent.Role,
		"message":       fmt.Sprintf("✅ Agent '%s' completed successfully", currentAgent.Name),
		"output_length": len(result),
		"is_last":       currentAgent.IsLast,
		"agent_output":  result, // Include the actual output for observability
		"agent_input":   input,  // Include the input that was used for this agent
	})

	// If this is the last agent, return the result
	if currentAgent.IsLast {
		return result, nil
	}

	// Send handoff notification
	ag.sendAgentUpdate(w, "agent_handoff", map[string]interface{}{
		"from_agent": currentAgent.Name,
		"to_agent":   currentAgent.NextAgent.Name,
		"message":    fmt.Sprintf("🔄 Handing off from '%s' to '%s'", currentAgent.Name, currentAgent.NextAgent.Name),
	})

	// Continue with the next agent
	return ag.executePipelineWithStreaming(w, currentAgent.NextAgent, result)
}

// sendAgentUpdate sends an agent update via SSE
func (ag *AgentManager) sendAgentUpdate(w http.ResponseWriter, eventType string, data interface{}) {
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
