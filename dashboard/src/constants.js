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

export const STORAGE_KEYS = {
  PIPELINES: "promptmesh_pipelines",
  WORKFLOWS: "promptmesh_workflows",
  // Add other storage keys here as the app grows
  // USER_PREFERENCES: "promptmesh_user_prefs",
  // RECENT_ITEMS: "promptmesh_recent_items"
};

export const DEFAULT_VALUES = {
  PIPELINES: [],
  WORKFLOWS: [],
  // Add other default values here
};

export const WORKFLOW_VIEWS = {
  BUILDER: {
    id: "workflow_builder",
    title: "Workflow Builder",
    subtitle: "Connect pipelines to create workflows",
  },
  EXECUTOR: {
    id: "workflow_executor",
    title: "Workflow Execution",
    subtitle: "Monitor workflow execution",
  },
  VIEWER: {
    id: "workflow_viewer",
    title: "Workflow Results",
    subtitle: "View workflow execution results",
  },
};
