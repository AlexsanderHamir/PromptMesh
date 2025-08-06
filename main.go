package main

import (
	"fmt"
	"log"

	"github.com/AlexsanderHamir/PromptMesh/agents"
	"github.com/AlexsanderHamir/PromptMesh/orchestration"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	manager := orchestration.AgentManager{
		FirstPrompt: "I'd like to write a blog post about how vector databases improve retrieval-augmented generation (RAG) systems. Can you summarize the key concepts and challenges involved?",
	}

	researcher, err := agents.NewAgent(
		"Researcher",
		"Finds background information on technical topics",
		"You are a helpful technical researcher. Provide clear and concise summaries.",
		"AI_API_KEY",
		"gpt-4",
	)
	if err != nil {
		fmt.Println("Error creating researcher:", err)
		return
	}

	writer, err := agents.NewAgent(
		"Writer",
		"Writes professional blog posts based on summaries",
		"You are a professional technical writer. Turn research summaries into engaging blog posts.",
		"AI_API_KEY",
		"gpt-4",
	)
	if err != nil {
		fmt.Println("Error creating writer:", err)
		return
	}

	manager.AddToPipeline(researcher)
	manager.AddToPipeline(writer)

	res, err := manager.StartPipeline()
	if err != nil {
		panic(err)
	}

	fmt.Println(res)
}
