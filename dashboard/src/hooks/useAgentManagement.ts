import { useState, useCallback } from 'react';
import { Agent, AgentForm, ValidationErrors } from '../types';
import { validateAgentForm } from '../utils';

export const useAgentManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [isEditingAgent, setIsEditingAgent] = useState(false);
  const [agentForm, setAgentForm] = useState<AgentForm>({
    name: '',
    role: '',
    provider: '',
    model: '',
    systemMsg: '',
    order: 0, // Initialize order to 0
  });
  const [errors, setErrors] = useState<ValidationErrors>({});

  const resetAgentForm = useCallback(() => {
    setAgentForm({
      name: '',
      role: '',
      provider: '',
      model: '',
      systemMsg: '',
      order: 0, // Reset order to 0
    });
    setErrors({});
  }, []);

  const showAddAgentModal = useCallback(() => {
    resetAgentForm();
    setEditingAgent(null);
    setIsEditingAgent(false);
    setShowModal(true);
  }, [resetAgentForm]);

  const showEditAgentModal = useCallback((agent: Agent) => {
    setAgentForm({
      name: agent.name,
      role: agent.role,
      provider: agent.provider,
      model: agent.model || '',
      systemMsg: agent.systemMsg,
      order: agent.order, // Set order from the agent
    });
    setEditingAgent(agent);
    setIsEditingAgent(true);
    setErrors({});
    setShowModal(true);
  }, []);

  const hideAgentModal = useCallback(() => {
    setShowModal(false);
    resetAgentForm();
    setEditingAgent(null);
    setIsEditingAgent(false);
  }, [resetAgentForm]);

  const updateAgentForm = useCallback((field: keyof AgentForm, value: string | number) => {
    setAgentForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  const validateAndSubmitAgent = useCallback((onSubmit: (agent: Omit<Agent, 'id'>) => void) => {
    const validationErrors = validateAgentForm(agentForm);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return false;
    }

    onSubmit(agentForm);
    hideAgentModal();
    return true;
  }, [agentForm, hideAgentModal]);

  return {
    // State
    showModal,
    editingAgent,
    isEditingAgent,
    agentForm,
    errors,
    
    // Actions
    showAddAgentModal,
    showEditAgentModal,
    hideAgentModal,
    updateAgentForm,
    validateAndSubmitAgent,
    resetAgentForm,
  };
};
