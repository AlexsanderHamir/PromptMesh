package tests

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/AlexsanderHamir/PromptMesh/server"
	"github.com/AlexsanderHamir/PromptMesh/shared"
)

func TestCreatePipeline_Success(t *testing.T) {
	mux := server.InitServer()

	body := `{"name":"test-pipeline","first_prompt":"Hello"}`
	req := httptest.NewRequest(http.MethodPost, "/pipelines/create", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected status 201 Created, got %d", rr.Code)
	}

	var res server.CreatePipelineResponse
	if err := json.NewDecoder(rr.Body).Decode(&res); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if res.PipelineID == "" {
		t.Fatal("expected non-empty pipeline ID")
	}
}

func TestCreatePipeline_MissingFields(t *testing.T) {
	s := server.NewServer()
	mux := http.NewServeMux()
	s.RegisterRoutes(mux)

	body := `{"name":"", "first_prompt":""}`
	req := httptest.NewRequest(http.MethodPost, "/pipelines/create", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 Bad Request, got %d", rr.Code)
	}
}

func TestAddAgentToPipeline_Success(t *testing.T) {
	mux := server.InitServer()

	pipelineBody := `{"name":"agent-pipeline","first_prompt":"Start"}`
	pipelineReq := httptest.NewRequest(http.MethodPost, "/pipelines/create", strings.NewReader(pipelineBody))
	pipelineReq.Header.Set("Content-Type", "application/json")
	pipelineRes := httptest.NewRecorder()
	mux.ServeHTTP(pipelineRes, pipelineReq)

	var pipelineResp server.CreatePipelineResponse
	if err := json.NewDecoder(pipelineRes.Body).Decode(&pipelineResp); err != nil {
		t.Fatalf("could not decode pipeline response: %v", err)
	}

	agentReqBody := server.AddAgentToPipelineRequest{
		PipelineID: pipelineResp.PipelineID,
		Name:       "AgentA",
		Role:       "helper",
		SystemMsg:  "You are helpful.",
		Provider:   shared.PROVIDER_OPENAI,
		Model:      shared.DEFAULT_MODEL_OPENAI,
	}

	buf := new(bytes.Buffer)
	if err := json.NewEncoder(buf).Encode(agentReqBody); err != nil {
		t.Fatalf("failed to encode agent request: %v", err)
	}

	agentReq := httptest.NewRequest(http.MethodPost, "/pipelines/add-agent", buf)
	agentReq.Header.Set("Content-Type", "application/json")
	agentRes := httptest.NewRecorder()
	mux.ServeHTTP(agentRes, agentReq)

	if agentRes.Code != http.StatusCreated {
		body := agentRes.Body.String()
		t.Fatalf("expected 201 Created, got %d\nResponse body: %s", agentRes.Code, body)
	}

	var agentResp server.AddAgentToPipelineResponse
	if err := json.NewDecoder(agentRes.Body).Decode(&agentResp); err != nil {
		t.Fatalf("failed to decode agent response: %v", err)
	}
	if agentResp.AgentID == "" {
		t.Fatal("expected non-empty agent ID")
	}
}

func TestAddAgentToPipeline_MissingFields(t *testing.T) {
	mux := server.InitServer()

	body := `{"pipeline_id": "", "name": "", "role": "", "system_msg": "", "provider": ""}`
	req := httptest.NewRequest(http.MethodPost, "/pipelines/add-agent", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 Bad Request, got %d", rr.Code)
	}
}

func TestAddAgentToPipeline_UnknownProvider(t *testing.T) {
	mux := server.InitServer()

	pipelineReqBody := server.CreatePipelineRequest{
		Name:        "bad-provider",
		FirstPrompt: "Start",
	}
	pipelineBuf := new(bytes.Buffer)
	if err := json.NewEncoder(pipelineBuf).Encode(pipelineReqBody); err != nil {
		t.Fatalf("failed to encode pipeline request: %v", err)
	}

	pipelineReq := httptest.NewRequest(http.MethodPost, "/pipelines/create", pipelineBuf)
	pipelineReq.Header.Set("Content-Type", "application/json")
	pipelineRes := httptest.NewRecorder()
	mux.ServeHTTP(pipelineRes, pipelineReq)

	var pipelineResp server.CreatePipelineResponse
	if err := json.NewDecoder(pipelineRes.Body).Decode(&pipelineResp); err != nil {
		t.Fatalf("could not decode pipeline response: %v", err)
	}

	agentReqBody := server.AddAgentToPipelineRequest{
		PipelineID: pipelineResp.PipelineID,
		Name:       "InvalidAgent",
		Role:       "none",
		SystemMsg:  "You are broken.",
		Provider:   "nonexistent",
		Model:      "any-model",
	}
	agentBuf := new(bytes.Buffer)
	if err := json.NewEncoder(agentBuf).Encode(agentReqBody); err != nil {
		t.Fatalf("failed to encode agent request: %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/pipelines/add-agent", agentBuf)
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		body := rr.Body.String()
		t.Fatalf("expected 400 Bad Request, got %d\nResponse body: %s", rr.Code, body)
	}
}
