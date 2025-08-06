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
