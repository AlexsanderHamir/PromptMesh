package orchestration

import (
	"fmt"

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
	finalRes, err := triggerAgent.Handle(ag.FirstPrompt)
	if err != nil {
		return "", fmt.Errorf("handle failed: %w", err)
	}

	return finalRes, nil
}
