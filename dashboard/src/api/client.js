// In development, use the Vite proxy. In production, use the environment variable.
const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? "/api"
    : process.env.REACT_APP_API_URL || "http://localhost:8080";

class ApiClient {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Pipeline APIs
  async createPipeline(name, firstPrompt) {
    return this.request("/pipelines/create", {
      method: "POST",
      body: JSON.stringify({
        name,
        first_prompt: firstPrompt,
      }),
    });
  }

  async addAgentToPipeline(pipelineId, agent) {
    return this.request("/pipelines/add-agent", {
      method: "POST",
      body: JSON.stringify({
        pipeline_id: pipelineId,
        name: agent.name,
        role: agent.role,
        system_msg: agent.systemMsg,
        provider: agent.provider,
        model: agent.model || "",
      }),
    });
  }

  async startPipeline(pipelineId) {
    return this.request("/pipelines/start", {
      method: "POST",
      body: JSON.stringify({
        pipeline_id: pipelineId,
      }),
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
