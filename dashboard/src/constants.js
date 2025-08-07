export const PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "googleai", label: "Google AI" },
  { value: "cohere", label: "Cohere" },
  { value: "huggingface", label: "Hugging Face" },
];

export const PIPELINE_STATUS = {
  IDLE: "idle",
  RUNNING: "running",
  COMPLETED: "completed",
  ERROR: "error",
};

export const LOG_TYPES = {
  INFO: "info",
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
};

export const DASH_VIEWS = {
  WELCOME: {
    id: "welcome",
    title: "Welcome to PromptMesh",
    subtitle: null,
    showSidebar: true,
  },
  BUILDER: {
    id: "builder",
    title: (pipeline, hasChanges) =>
      `${pipeline?.name || "New Pipeline"}${
        hasChanges ? " (Unsaved Changes)" : ""
      }`,
    subtitle:
      "Configure your AI agent pipeline with custom prompts and specialized agents",
    showSidebar: true,
  },
  VIEWER: {
    id: "viewer",
    title: "Pipeline Execution",
    subtitle: null,
    showSidebar: false,
  },
};
