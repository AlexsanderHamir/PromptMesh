export const generateId = () => Date.now() + Math.random();

export const formatDate = (date) =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));

export const validatePipelineForm = (form, agents) => {
  const errors = {};
  if (!form.name?.trim()) errors.name = "Pipeline name is required";
  if (!form.firstPrompt?.trim())
    errors.firstPrompt = "Initial prompt is required";
  if (agents.length === 0) errors.agents = "At least one agent is required";
  return errors;
};

export const validateAgentForm = (form) => {
  const errors = {};
  if (!form.name?.trim()) errors.name = "Agent name is required";
  if (!form.role?.trim()) errors.role = "Role is required";
  if (!form.provider) errors.provider = "Provider is required";
  if (!form.systemMsg?.trim()) errors.systemMsg = "System message is required";
  return errors;
};

// Pipeline management utilities
export const exportPipelines = (pipelines) => {
  const dataStr = JSON.stringify(pipelines, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `promptmesh-pipelines-${
    new Date().toISOString().split("T")[0]
  }.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importPipelines = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const pipelines = JSON.parse(e.target.result);
        if (Array.isArray(pipelines)) {
          // Ensure each pipeline has required fields and update timestamps
          const validPipelines = pipelines.map((pipeline) => ({
            ...pipeline,
            id: pipeline.id || generateId(),
            createdAt: pipeline.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
          resolve(validPipelines);
        } else {
          reject(new Error("Invalid pipeline format"));
        }
      } catch (error) {
        reject(new Error("Failed to parse pipeline file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
};

export const duplicatePipeline = (pipeline) => {
  return {
    ...pipeline,
    id: generateId(),
    name: `${pipeline.name} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};
