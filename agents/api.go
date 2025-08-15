package agents

import (
	"context"
	"errors"
	"fmt"
	"os"
	"strings"

	"github.com/AlexsanderHamir/PromptMesh/shared"
	"github.com/tmc/langchaingo/llms"
	"github.com/tmc/langchaingo/llms/anthropic"
	"github.com/tmc/langchaingo/llms/cohere"
	"github.com/tmc/langchaingo/llms/googleai"
	"github.com/tmc/langchaingo/llms/huggingface"
	"github.com/tmc/langchaingo/llms/openai"
	"github.com/tmc/langchaingo/memory"
)

type Agent struct {
	Name      string
	Role      string
	SystemMsg string
	Provider  string
	Model     string
	LLM       llms.Model
	Memory    *memory.ConversationBuffer
	NextAgent *Agent
	IsLast    bool
	Verbose   bool
}

func NewAgent(name, role, systemMsg, provider, envVar, model string) (*Agent, error) {
	apiKey := os.Getenv(envVar)
	if apiKey == "" {
		return nil, fmt.Errorf("API key not found for provider %s. Please set environment variable %s", provider, envVar)
	}

	if model == "" {
		defaultModel, exists := shared.DefaultModels[provider]
		if exists {
			model = defaultModel
		} else {
			return nil, fmt.Errorf("no default model found for provider: %s", provider)
		}
	}

	var llm llms.Model
	var err error

	switch provider {
	case shared.PROVIDER_OPENAI:
		llm, err = openai.New(
			openai.WithModel(model),
			openai.WithToken(apiKey),
		)
	case shared.PROVIDER_ANTHROPIC:
		llm, err = anthropic.New(
			anthropic.WithModel(model),
			anthropic.WithToken(apiKey),
		)
	case shared.PROVIDER_GOOGLEAI:
		llm, err = googleai.New(
			context.Background(),
			googleai.WithAPIKey(apiKey),
			googleai.WithDefaultModel(model),
		)
	case shared.PROVIDER_COHERE:
		llm, err = cohere.New(
			cohere.WithModel(model),
			cohere.WithToken(apiKey),
		)
	case shared.PROVIDER_HUGGINGFACE:
		llm, err = huggingface.New(
			huggingface.WithModel(model),
			huggingface.WithToken(apiKey),
		)
	default:
		return nil, fmt.Errorf("unsupported provider: %s", provider)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to create %s LLM: %w", provider, err)
	}

	return &Agent{
		Name:      name,
		Role:      role,
		SystemMsg: systemMsg,
		Provider:  provider,
		Model:     model,
		LLM:       llm,
		Memory:    memory.NewConversationBuffer(),
		Verbose:   true,
	}, nil
}

// validatePrompt performs comprehensive validation of system message and input
func (a *Agent) validatePrompt(prompt string) error {
	if prompt == "" {
		return errors.New("prompt cannot be empty")
	}

	if strings.TrimSpace(prompt) == "" {
		return errors.New("prompt cannot be only whitespace")
	}

	if len(strings.TrimSpace(prompt)) < 1 {
		return errors.New("input must be at least 1 character long")
	}

	return nil
}

func (a *Agent) Handle(input string) (string, error) {
	if a.Verbose {
		fmt.Printf("[%s]: Received input: %s\n", a.Name, input)
	}

	ctx := context.Background()

	prompt := a.SystemMsg + "\n" + input
	if err := a.validatePrompt(prompt); err != nil {
		return "", fmt.Errorf("[%s] prompt validation failed: %w", a.Name, err)
	}

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

	// The orchestration layer handles the flow between agents
	// This agent just returns its response
	return resp, nil
}
