export const PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "googleai", label: "Google AI" },
  { value: "cohere", label: "Cohere" },
  { value: "huggingface", label: "Hugging Face" },
] as const;

export const LOG_TYPES = {
  INFO: "info",
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
} as const;

export const STORAGE_KEYS = {
  PIPELINES: "promptmesh_pipelines",
  // Add other storage keys here as the app grows
  // USER_PREFERENCES: "promptmesh_user_prefs",
  // RECENT_ITEMS: "promptmesh_recent_items"
} as const;

export const DEFAULT_VALUES = {
  PIPELINES: [],
  // Add other default values here
} as const;
