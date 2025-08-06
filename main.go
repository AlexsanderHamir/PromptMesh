package main

import (
	"log"
	"net/http"

	"github.com/AlexsanderHamir/PromptMesh/server"
)

func main() {
	mux := server.InitServer()

	addr := ":8080"
	log.Printf("Server listening on %s...", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
