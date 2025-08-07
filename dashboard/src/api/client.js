// src/api/client.js (Updated to handle file content)
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

  // Enhanced pipeline execution API with file content support
  async executePipeline(pipelineForm, agents, uploadedFiles = []) {
    // Process the first prompt to include file content if any
    let enhancedFirstPrompt = pipelineForm.firstPrompt;

    if (uploadedFiles.length > 0) {
      let fileContent = "\n\n--- ATTACHED FILES ---\n";

      uploadedFiles.forEach((uploadedFile, index) => {
        const { content, metadata } = uploadedFile;

        fileContent += `\n--- FILE ${index + 1}: ${metadata.name} ---\n`;
        fileContent += `File Type: ${metadata.type}\n`;
        fileContent += `Size: ${(metadata.size / 1024).toFixed(2)} KB\n`;

        if (metadata.type === "image") {
          // For images, we need to handle them specially
          // Most AI models expect specific formats for images
          if (content.startsWith("data:image")) {
            fileContent += `Content: [IMAGE - Base64 encoded]\n`;
            fileContent += `Image Data: ${content}\n`;
          }
        } else {
          fileContent += `Content:\n${content}\n`;
        }

        fileContent += `--- END FILE ${index + 1} ---\n`;
      });

      fileContent += "\n--- END ATTACHED FILES ---\n\n";

      // Add file content to the prompt if not already included
      if (!enhancedFirstPrompt.includes("--- ATTACHED FILES ---")) {
        enhancedFirstPrompt += fileContent;
      }
    }

    return this.request("/pipelines/execute", {
      method: "POST",
      body: JSON.stringify({
        name: pipelineForm.name,
        first_prompt: enhancedFirstPrompt,
        agents: agents.map((agent) => ({
          name: agent.name,
          role: agent.role,
          system_msg: agent.systemMsg,
          provider: agent.provider,
          model: agent.model || "",
        })),
        // Include file metadata for backend processing if needed
        files_metadata: uploadedFiles.map((f) => ({
          name: f.metadata.name,
          type: f.metadata.type,
          size: f.metadata.size,
          mimeType: f.metadata.mimeType,
        })),
      }),
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
