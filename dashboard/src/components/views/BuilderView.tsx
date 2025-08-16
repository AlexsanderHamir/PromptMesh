import React, { useState } from 'react';
import { PipelineConfiguration } from '../PipelineConfiguration';
import { AgentConfiguration } from '../AgentConfiguration';
import { PipelineActions } from '../PipelineActions';
import { AddAgentModal } from '../AddAgentModal';
import { usePipelineContext } from '../../contexts/PipelineContext';
import { Agent, DashViews } from '../../types';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface UploadedFile {
  id: string;
  metadata: {
    name: string;
    size: number;
    type: string;
  };
  content: string;
}

interface AgentForm {
  name: string;
  role: string;
  provider: string;
  model: string;
  systemMsg: string;
  order: number; // Add order field to match Agent interface
}

export const BuilderView: React.FC = () => {
  const {
    pipelineForm,
    agents,
    errors,
    isSaved,
    currentPipeline,
    useStreaming,
    updatePipelineForm,
    setUploadedFiles,
    toggleStreaming,
    runPipeline,
    savePipeline,
    closePipeline,
    clearResults,
    addAgent,
    removeAgent,
    updateAgent,
    moveAgentUp,
    moveAgentDown,
    isFormValid,
    setCurrentView,
  } = usePipelineContext();

  // Local state for the add agent modal
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [isEditingAgent, setIsEditingAgent] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [agentForm, setAgentForm] = useState<AgentForm>({
    name: '',
    role: '',
    provider: 'openai',
    model: '',
    systemMsg: '',
    order: 0, // Initialize order to 0
  });
  const [agentFormErrors, setAgentFormErrors] = useState<Record<string, string | null>>({});

  // State for agent deletion confirmation
  const [showDeleteAgentDialog, setShowDeleteAgentDialog] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);

  const hasLastExecution = Boolean(
    currentPipeline?.lastExecutionResult || 
    currentPipeline?.lastExecutionError || 
    (currentPipeline?.lastExecutionLogs && currentPipeline.lastExecutionLogs.length > 0)
  );

  // Convert the setUploadedFiles function to match the expected type
  const handleFilesChange = (files: UploadedFile[]) => {
    // Convert UploadedFile[] to File[] for the context
    const fileArray = files.map(f => new File([f.content], f.metadata.name, { type: f.metadata.type }));
    setUploadedFiles(fileArray);
  };

  // Handle showing the add agent modal
  const handleShowAddAgent = () => {
    setIsEditingAgent(false);
    setEditingAgentId(null);
    setShowAddAgentModal(true);
  };

  // Handle closing the add agent modal
  const handleCloseAddAgent = () => {
    setShowAddAgentModal(false);
    setIsEditingAgent(false);
    setEditingAgentId(null);
    setAgentForm({
      name: '',
      role: '',
      provider: 'openai',
      model: '',
      systemMsg: '',
      order: 0, // Reset order to 0
    });
    setAgentFormErrors({});
  };

  // Handle agent form changes
  const handleAgentFormChange = (field: keyof AgentForm, value: string | number) => {
    setAgentForm(prev => ({ ...prev, [field]: value }));
  };

  // Handle agent form submission
  const handleAgentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields before submitting
    const validationErrors: Record<string, string | null> = {};
    
    if (!agentForm.name?.trim()) {
      validationErrors.name = "Agent name is required";
    }
    
    if (!agentForm.role?.trim()) {
      validationErrors.role = "Role is required";
    }
    
    if (!agentForm.provider) {
      validationErrors.provider = "Provider is required";
    }
    
    if (!agentForm.systemMsg?.trim()) {
      validationErrors.systemMsg = "System message is required";
    }
    
    // If there are validation errors, don't submit
    if (Object.keys(validationErrors).length > 0) {
      // Set errors to show validation messages
      setAgentFormErrors(validationErrors);
      return;
    }
    
    // If validation passes, add or update the agent
    if (isEditingAgent && editingAgentId) {
      // Update existing agent
      updateAgent(editingAgentId, agentForm);
    } else {
      // Add new agent
      addAgent(agentForm);
    }
    
    setAgentFormErrors({});
    handleCloseAddAgent();
  };

  // Handle editing an existing agent
  const handleEditAgent = (agent: Agent) => {
    setIsEditingAgent(true);
    setEditingAgentId(agent.id);
    setAgentForm({
      name: agent.name,
      role: agent.role,
      provider: agent.provider,
      model: agent.model || '',
      systemMsg: agent.systemMsg,
      order: agent.order, // Set order from the agent
    });
    setShowAddAgentModal(true);
  };

  // Handle removing an agent
  const handleRemoveAgent = (agentId: string) => {
    setAgentToDelete(agentId);
    setShowDeleteAgentDialog(true);
  };

  // Confirm agent deletion
  const confirmDeleteAgent = () => {
    if (agentToDelete) {
      removeAgent(agentToDelete);
      setShowDeleteAgentDialog(false);
      setAgentToDelete(null);
    }
  };

  // Cancel agent deletion
  const cancelDeleteAgent = () => {
    setShowDeleteAgentDialog(false);
    setAgentToDelete(null);
  };

  return (
    <div className="p-8 space-y-8">
      <PipelineConfiguration
        pipelineForm={pipelineForm}
        onFormChange={updatePipelineForm}
        errors={errors}
        onFilesChange={handleFilesChange}
      />
      
      <AgentConfiguration
        agents={agents}
        errors={errors}
        onShowAddAgent={handleShowAddAgent}
        onEditAgent={handleEditAgent}
        onRemoveAgent={handleRemoveAgent}
        onMoveAgentUp={moveAgentUp}
        onMoveAgentDown={moveAgentDown}
      />
      
      <PipelineActions
        isRunning={false} // Builder view doesn't show running state
        isFormValid={isFormValid} // Use actual form validation from context
        isSaved={isSaved}
        hasLastExecution={hasLastExecution}
        lastExecutionDate={currentPipeline?.lastExecutionDate}
        onRunPipeline={() => {
          runPipeline();
        }}
        onRunPipelineStream={() => {
          runPipeline();
        }}
        onSavePipeline={savePipeline}
        onViewResults={() => {
          // Switch to results view to show previous execution results
          setCurrentView(DashViews.RESULTS);
        }}
        onClosePipeline={closePipeline}
        onClearResults={clearResults}
        useStreaming={useStreaming}
        onToggleStreaming={toggleStreaming}
      />

      <AddAgentModal
        showModal={showAddAgentModal}
        agentForm={agentForm}
        errors={agentFormErrors}
        isEditing={isEditingAgent}
        onFormChange={handleAgentFormChange}
        onSubmit={handleAgentSubmit}
        onClose={handleCloseAddAgent}
      />

      <ConfirmDialog
        isOpen={showDeleteAgentDialog}
        title="Delete Agent"
        message="Are you sure you want to remove this agent? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteAgent}
        onCancel={cancelDeleteAgent}
        variant="danger"
      />
    </div>
  );
};
