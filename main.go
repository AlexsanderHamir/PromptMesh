package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/AlexsanderHamir/PromptMesh/server"
)

func main() {
	mux := server.InitServer()

	port := ":8080"
	fmt.Printf("🚀 PromptMesh API server starting on port %s\n", port)
	fmt.Printf("📡 API endpoints available at http://localhost%s\n", port)

	log.Fatal(http.ListenAndServe(port, mux))
}
