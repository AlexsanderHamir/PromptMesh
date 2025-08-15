import { PipelineForm, Agent, AgentForm, Pipeline, ValidationErrors } from './types';

export const generateId = (): string => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const formatDate = (date: string | Date): string =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));

// Generic validation helper
const validateRequiredField = (value: string | undefined, fieldName: string): string | null =>
  !value?.trim() ? `${fieldName} is required` : null;

export const validatePipelineForm = (form: PipelineForm, agents: Agent[]): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  const nameError = validateRequiredField(form.name, "Pipeline name");
  if (nameError) errors.name = nameError;
  
  const promptError = validateRequiredField(form.firstPrompt, "Initial prompt");
  if (promptError) errors.prompt = promptError;
  
  if (agents.length === 0) {
    errors.agents = "At least one agent is required";
  }
  
  return errors;
};

export const validateAgentForm = (form: AgentForm): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  const requiredFields: Array<{ field: keyof AgentForm; name: string }> = [
    { field: 'name', name: 'Agent name' },
    { field: 'role', name: 'Role' },
    { field: 'systemMsg', name: 'System message' }
  ];
  
  requiredFields.forEach(({ field, name }) => {
    const error = validateRequiredField(form[field] as string, name);
    if (error) errors[field] = error;
  });
  
  if (!form.provider) {
    errors.provider = "Provider is required";
  }
  
  return errors;
};

// Pipeline management utilities
export const exportPipelines = (pipelines: Pipeline[]): void => {
  const dataStr = JSON.stringify(pipelines, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `promptmesh-pipelines-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importPipelines = (file: File): Promise<Pipeline[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const pipelines = JSON.parse(e.target?.result as string);
        
        if (!Array.isArray(pipelines)) {
          reject(new Error("Invalid pipeline format"));
          return;
        }
        
        // Ensure each pipeline has required fields and update timestamps
        const validPipelines = pipelines.map((pipeline) => ({
          ...pipeline,
          id: pipeline.id || generateId(),
          createdAt: pipeline.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        resolve(validPipelines);
      } catch (error) {
        reject(new Error("Failed to parse pipeline file"));
      }
    };
    
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
};

export const duplicatePipeline = (pipeline: Pipeline): Pipeline => ({
  ...pipeline,
  id: generateId(),
  name: `${pipeline.name} (Copy)`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// Validate agent order consistency
export const validateAgentOrder = (agents: Agent[]): boolean => {
  if (agents.length === 0) return true;
  
  // Check if order field matches array position
  const hasOrderMismatch = agents.some((agent, index) => {
    if (agent.order !== index) {
      console.warn(`Agent order mismatch: agent ${agent.name} has order ${agent.order} but is at position ${index}`);
      return true;
    }
    return false;
  });
  
  return !hasOrderMismatch;
};

// Normalize agent order to ensure consistency
export const normalizeAgentOrder = (agents: Agent[]): Agent[] =>
  agents.map((agent, index) => ({
    ...agent,
    order: index,
  }));
