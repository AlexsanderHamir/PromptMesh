import { PipelineForm, Agent } from '../types';

interface FileMetadata {
  name: string;
  type: string;
  size: number;
  mimeType: string;
}

interface UploadedFile {
  content: string;
  metadata: FileMetadata;
}

interface PipelineExecutionRequest {
  name: string;
  first_prompt: string;
  agents: Array<{
    name: string;
    role: string;
    system_msg: string;
    provider: string;
    model: string;
  }>;
  files_metadata: FileMetadata[];
}

interface PipelineExecutionResponse {
  result: string;
}

interface StreamingCallback {
  (eventType: string, data: any): void;
}

// Add type declarations for import.meta.env
declare global {
  interface ImportMeta {
    readonly env: {
      readonly DEV?: boolean;
      readonly VITE_API_URL?: string;
    };
  }
}

const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_API_URL || "http://localhost:8080";

class ApiClient {
  async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
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
  async executePipeline(
    pipelineForm: PipelineForm, 
    agents: Agent[], 
    uploadedFiles: UploadedFile[] = []
  ): Promise<PipelineExecutionResponse> {
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

  // Streaming pipeline execution API with Server-Sent Events
  async executePipelineStream(
    pipelineForm: PipelineForm,
    agents: Agent[],
    uploadedFiles: UploadedFile[] = [],
    onUpdate?: StreamingCallback
  ): Promise<string> {
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

    const payload: PipelineExecutionRequest = {
      name: pipelineForm.name,
      first_prompt: enhancedFirstPrompt,
      agents: agents
        .sort((a, b) => a.order - b.order) // Ensure agents are sent in correct order
        .map((agent) => ({
          name: agent.name,
          role: agent.role,
          system_msg: agent.systemMsg,
          provider: agent.provider,
          model: agent.model || "",
        })),
      files_metadata: uploadedFiles.map((f) => ({
        name: f.metadata.name,
        type: f.metadata.type,
        size: f.metadata.size,
        mimeType: f.metadata.mimeType,
      })),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/pipelines/execute/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();

      let buffer = "";
      let finalResult = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Events are separated by double newlines per SSE spec
        const events = buffer.split("\n\n");
        // Keep the last partial event (if any) in the buffer
        buffer = events.pop() || "";

        for (const rawEvent of events) {
          const lines = rawEvent.split("\n");
          let eventType = "message";
          let dataLine = null;

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              dataLine = (dataLine ? dataLine + "\n" : "") + line.slice(6);
            }
          }

          let parsedData = null;
          if (dataLine) {
            try {
              parsedData = JSON.parse(dataLine);
            } catch (err) {
              console.error("Error parsing SSE data:", err, dataLine);
            }
          }

          if (parsedData) {
            onUpdate && onUpdate(eventType, parsedData);
            if (
              eventType === "status" &&
              parsedData.type === "pipeline_completed"
            ) {
              finalResult = parsedData.result || finalResult;
            }
            if (eventType === "end") {
              return finalResult;
            }
          }
        }
      }

      return finalResult;
    } catch (error) {
      console.error("Streaming pipeline execution failed:", error);
      onUpdate && onUpdate("error", { message: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
export default apiClient;
