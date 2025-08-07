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

  // Single pipeline execution API (stateless - server only handles execution)
  async executePipeline(pipelineForm, agents) {
    return this.request("/pipelines/execute", {
      method: "POST",
      body: JSON.stringify({
        name: pipelineForm.name,
        first_prompt: pipelineForm.firstPrompt,
        agents: agents.map(agent => ({
          name: agent.name,
          role: agent.role,
          system_msg: agent.systemMsg,
          provider: agent.provider,
          model: agent.model || "",
        })),
      }),
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
