package agents

import (
	"context"
	"fmt"
	"os"

	"github.com/tmc/langchaingo/llms"
	"github.com/tmc/langchaingo/llms/openai"
	"github.com/tmc/langchaingo/memory"
)

type Agent struct {
	Name      string
	Role      string
	SystemMsg string
	LLM       llms.Model
	Memory    *memory.ConversationBuffer
	NextAgent *Agent
	IsLast    bool
	Verbose   bool
}

func NewAgent(name, role, systemMsg, keyLabel, model string) (*Agent, error) {
	llm, err := openai.New(
		openai.WithModel(model),
		openai.WithToken(os.Getenv(keyLabel)),
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create LLM: %w", err)
	}

	return &Agent{
		Name:      name,
		Role:      role,
		SystemMsg: systemMsg,
		LLM:       llm,
		Memory:    memory.NewConversationBuffer(),
	}, nil
}

func (a *Agent) Handle(input string) (string, error) {
	if a.Verbose {
		fmt.Printf("[%s]: Received input: %s\n", a.Name, input)
	}

	ctx := context.Background()

	prompt := a.SystemMsg + "\n" + input
	resp, err := llms.GenerateFromSinglePrompt(ctx, a.LLM, prompt)
	if err != nil {
		return "", fmt.Errorf("[%s] LLM error: %w", a.Name, err)
	}

	if a.Verbose {
		fmt.Printf("[%s]: Responded with: %s\n", a.Name, resp)
	}

	err = a.Memory.SaveContext(ctx, map[string]any{"input": input}, map[string]any{"output": resp})
	if err != nil {
		return "", fmt.Errorf("[%s] memory error: %w", a.Name, err)
	}

	if a.IsLast {
		if a.Verbose {
			fmt.Printf("[%s]: End of pipeline.\n", a.Name)
		}
		return resp, nil
	}

	if a.NextAgent != nil {
		return a.NextAgent.Handle(resp)
	}

	return "", fmt.Errorf("[%s]: No NextAgent found", a.Name)
}
