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
} as const;

export const DEFAULT_VALUES = {
  PIPELINES: [],
} as const;

// Time constants
export const TIMEOUTS = {
  COPY_RESET: 2000, // 2 seconds
  AGENT_ORDER_INIT: 0, // Immediate
} as const;

// File size constants
export const FILE_SIZES = {
  KB: 1024,
  MB: 1024 * 1024,
} as const;

// API configuration
export const API_CONFIG = {
  DEFAULT_PORT: 8080,
  DEFAULT_HOST: "localhost",
  DEV_API_PATH: "/api",
} as const;

// UI constants
export const UI = {
  MIN_HEIGHT: 64,
  MAX_HEIGHT: 80,
  HEIGHTS: {
    MIN_SMALL: 32,
    MIN_MEDIUM: 64,
    MIN_LARGE: 80,
    MAX_SMALL: 32,
    MAX_MEDIUM: 80,
    MAX_LARGE: 96,
  },
  ICON_SIZES: {
    SMALL: "w-3 h-3",
    MEDIUM: "w-4 h-4",
    LARGE: "w-5 h-5",
  },
  TEXT_SIZES: {
    EXTRA_SMALL: "text-[10px]",
    SMALL: "text-xs",
    MEDIUM: "text-sm",
    LARGE: "text-base",
  },
  CONTENT_LIMITS: {
    PREVIEW_CHARS: 500,
  },
  PROGRESS: {
    COMPLETE: 100,
    DEFAULT: 0,
  },
  SPACING: {
    SMALL: 2,
    MEDIUM: 4,
    LARGE: 6,
    EXTRA_LARGE: 8,
  },
} as const;
