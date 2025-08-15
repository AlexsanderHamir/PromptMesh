export interface Agent {
  id: string;
  name: string;
  role: string;
  provider: string;
  model: string;
  systemMsg: string;
  order: number; // Explicit order in the pipeline
}

export interface Pipeline {
  id: string;
  name: string;
  firstPrompt: string;
  agents: Agent[];
  status: PipelineStatus;
  createdAt: string;
  updatedAt: string;
  lastExecutionResult?: string;
  lastExecutionError?: string;
  lastExecutionLogs?: LogEntry[];
  lastExecutionDate?: string;
}

export interface PipelineForm {
  name: string;
  firstPrompt: string;
}

export interface AgentForm {
  name: string;
  role: string;
  provider: string;
  model: string;
  systemMsg: string;
  order: number; // Add order field to match Agent interface
}

export interface LogEntry {
  timestamp: string;
  message: string;
  level?: 'info' | 'warning' | 'error';
  agentId?: string;
  metadata?: {
    type?: 'agent_start' | 'agent_processing' | 'agent_completed' | 'agent_handoff';
    agent?: string;
    agentOutput?: string;
    agentInput?: string;
    progress?: number;
  };
}

export interface ExecutionState {
  isRunning: boolean;
  logs: LogEntry[];
  result: string;
  progress: number;
  currentAgent: string | null;
  agentProgress: number;
  totalAgents: number;
  completedAgents: number;
}

export interface PipelineContextState {
  pipelines: Pipeline[];
  currentPipeline: Pipeline | null;
  currentView: DashViews;
  pipelineForm: PipelineForm;
  agents: Agent[];
  errors: Record<string, string | null>;
  isSaved: boolean;
  uploadedFiles: File[];
  useStreaming: boolean;
  executionState: ExecutionState;
  pipelinesError?: Error;
  isFormValid: boolean;
  hasUnsavedChanges: boolean;
}

export interface PipelineContextActions {
  createNewPipeline: () => void;
  selectPipeline: (pipeline: Pipeline) => void;
  closePipeline: () => void;
  savePipeline: () => boolean;
  deletePipeline: (pipelineId: string) => void;
  resetPipelineStatus: (pipelineId: string) => void;
  clearResults: () => void;
  runPipeline: () => Promise<void>;
  updatePipelineForm: (field: keyof PipelineForm, value: string) => void;
  addAgent: (agent: Omit<Agent, 'id'>) => void;
  updateAgent: (agentId: string, updates: Partial<Omit<Agent, 'id' | 'order'>>) => void;
  editAgent: (agent: Agent) => void;
  removeAgent: (agentId: string) => void;
  moveAgentUp: (agentId: string) => void;
  moveAgentDown: (agentId: string) => void;
  reorderAgents: (fromIndex: number, toIndex: number) => void;
  setCurrentView: (view: DashViews) => void;
  setUploadedFiles: (files: File[]) => void;
  toggleStreaming: () => void;
  resetExecution: () => void;
  clearExecutionState: () => void;
  restoreExecutionState: (pipeline: Pipeline) => {
    hasResults: boolean;
    lastExecutionResult?: string;
    lastExecutionError?: string;
    lastExecutionLogs?: LogEntry[];
    lastExecutionDate?: string;
    status: PipelineStatus;
  };
}

export interface PipelineContextValue extends PipelineContextState, PipelineContextActions {}

export enum PipelineStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  COMPLETED = 'completed',
  ERROR = 'error'
}

export enum DashViews {
  WELCOME = 'welcome',
  BUILDER = 'builder',
  VIEWER = 'viewer',
  RESULTS = 'results'
}

export interface ViewConfig {
  id: string;
  title: string | ((pipeline?: Pipeline | null, hasUnsavedChanges?: boolean) => string);
  subtitle?: string;
}

export interface ValidationErrors {
  [key: string]: string | null;
}

// Constants
export const STORAGE_KEYS = {
  PIPELINES: "promptmesh_pipelines",
} as const;

export const DEFAULT_VALUES = {
  PIPELINES: [],
} as const;
