import { useState, useCallback, useMemo, useEffect } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { WelcomeScreen } from "./WelcomeScreen";
import { PipelineConfiguration } from "./PipelineConfiguration";
import { AgentConfiguration } from "./AgentConfiguration";
import { PipelineActions } from "./PipelineActions";
import { ExecutionMonitor } from "./ExecutionMonitor";
import { PipelineResults } from "./PipelineResults";
import { AddAgentModal } from "./AddAgentModal";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { usePipelineExecution } from "../hooks/usePipelineExecution";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { generateId, validatePipelineForm, validateAgentForm } from "../utils";
import {
  PIPELINE_STATUS,
  DASH_VIEWS,
  STORAGE_KEYS,
  DEFAULT_VALUES,
} from "../constants";

export default function Dashboard() {
  const [pipelines, setPipelines] = useLocalStorage(
    STORAGE_KEYS.PIPELINES,
    DEFAULT_VALUES.PIPELINES
  );
  const [currentPipeline, setCurrentPipeline] = useState(null);
  const [currentView, setCurrentView] = useState(DASH_VIEWS.WELCOME.id);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pipelineToDelete, setPipelineToDelete] = useState(null);
  const [agents, setAgents] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSaved, setIsSaved] = useState(false);

  const [editingAgent, setEditingAgent] = useState(null);
  const [isEditingAgent, setIsEditingAgent] = useState(false);

  const [pipelineForm, setPipelineForm] = useState({
    name: "",
    firstPrompt: "",
  });

  const [agentForm, setAgentForm] = useState({
    name: "",
    role: "",
    provider: "",
    model: "",
    systemMsg: "",
  });

  // Custom hook for pipeline execution
  const { isRunning, logs, result, progress, runPipeline, resetExecution } =
    usePipelineExecution();

  // Memoized values
  const isFormValid = useMemo(() => {
    const validationErrors = validatePipelineForm(pipelineForm, agents);
    return Object.keys(validationErrors).length === 0;
  }, [pipelineForm, agents]);

  // Check if current state matches saved pipeline
  const hasUnsavedChanges = useMemo(() => {
    if (!currentPipeline) return true; // New pipeline always has "unsaved changes"

    return (
      currentPipeline.name !== pipelineForm.name ||
      currentPipeline.firstPrompt !== pipelineForm.firstPrompt ||
      JSON.stringify(currentPipeline.agents) !== JSON.stringify(agents)
    );
  }, [currentPipeline, pipelineForm, agents]);

  // Update isSaved status when changes occur
  useEffect(() => {
    setIsSaved(!hasUnsavedChanges && currentPipeline !== null);
  }, [hasUnsavedChanges, currentPipeline]);

  // Event handlers
  const handleCreateNewPipeline = useCallback(() => {
    setCurrentView(DASH_VIEWS.BUILDER.id);
    setCurrentPipeline(null);
    setPipelineForm({ name: "", firstPrompt: "" });
    setAgents([]);
    resetExecution();
    setErrors({});
    setIsSaved(false);
  }, [resetExecution]);

  const handleClosePipeline = useCallback(() => {
    setCurrentView(DASH_VIEWS.WELCOME.id);
    setCurrentPipeline(null);
    setPipelineForm({ name: "", firstPrompt: "" });
    setAgents([]);
    resetExecution();
    setErrors({});
    setIsSaved(false);
  }, [resetExecution]);

  // New navigation handler for going back to builder from results
  const handleBackToBuilder = useCallback(() => {
    setCurrentView(DASH_VIEWS.BUILDER.id);
  }, []);

  // Handler for editing pipeline from results view
  const handleEditPipelineFromResults = useCallback(() => {
    setCurrentView(DASH_VIEWS.BUILDER.id);
  }, []);

  const handleShowAddAgent = useCallback(() => {
    setAgentForm({
      name: "",
      role: "",
      provider: "",
      model: "",
      systemMsg: "",
    });
    setEditingAgent(null);
    setIsEditingAgent(false);
    setErrors({});
    setShowModal(true);
  }, []);

  // Add handler for editing an agent
  const handleEditAgent = useCallback((agent) => {
    setAgentForm({
      name: agent.name,
      role: agent.role,
      provider: agent.provider,
      model: agent.model || "",
      systemMsg: agent.systemMsg,
    });
    setEditingAgent(agent);
    setIsEditingAgent(true);
    setErrors({});
    setShowModal(true);
  }, []);

  const handleHideAddAgent = useCallback(() => {
    setShowModal(false);
    setErrors({});
    setEditingAgent(null);
    setIsEditingAgent(false);
  }, []);

  // Handle both adding and editing agents
  const handleAddAgent = useCallback(
    (e) => {
      e.preventDefault();
      const validationErrors = validateAgentForm(agentForm);

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      if (isEditingAgent && editingAgent) {
        // Update existing agent
        const updatedAgent = {
          ...editingAgent,
          ...agentForm,
        };

        setAgents((prev) =>
          prev.map((agent) =>
            agent.id === editingAgent.id ? updatedAgent : agent
          )
        );
      } else {
        // Add new agent
        const newAgent = {
          id: generateId(),
          ...agentForm,
        };

        setAgents((prev) => [...prev, newAgent]);
      }

      setShowModal(false);
      setErrors({});
      setEditingAgent(null);
      setIsEditingAgent(false);
    },
    [agentForm, isEditingAgent, editingAgent]
  );

  const handleRemoveAgent = useCallback((id) => {
    setAgents((prev) => prev.filter((agent) => agent.id !== id));
  }, []);

  const handleSavePipeline = useCallback(() => {
    const validationErrors = validatePipelineForm(pipelineForm, agents);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const pipeline = {
      id: currentPipeline?.id || generateId(),
      name: pipelineForm.name,
      firstPrompt: pipelineForm.firstPrompt,
      agents: agents,
      status: PIPELINE_STATUS.IDLE,
      createdAt: currentPipeline?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (currentPipeline) {
      // Update existing pipeline
      setPipelines((prev) =>
        prev.map((p) => (p.id === currentPipeline.id ? pipeline : p))
      );
    } else {
      // Add new pipeline
      setPipelines((prev) => [...prev, pipeline]);
    }

    setCurrentPipeline(pipeline);
    setErrors({});
    setIsSaved(true);

    console.log("Pipeline saved successfully!");
  }, [pipelineForm, agents, currentPipeline, setPipelines]);

  const handleRunPipeline = useCallback(async () => {
    const validationErrors = validatePipelineForm(pipelineForm, agents);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Save pipeline before running if not already saved
    if (!isSaved) {
      handleSavePipeline();
    }

    // Update pipeline status to running
    if (currentPipeline) {
      const updatedPipeline = {
        ...currentPipeline,
        status: PIPELINE_STATUS.RUNNING,
        updatedAt: new Date().toISOString(),
      };
      setPipelines((prev) =>
        prev.map((p) => (p.id === currentPipeline.id ? updatedPipeline : p))
      );
      setCurrentPipeline(updatedPipeline);
    }

    setCurrentView(DASH_VIEWS.VIEWER.id);
    setErrors({});

    try {
      const result = await runPipeline(pipelineForm, agents);

      // Update pipeline status to completed and save results
      if (currentPipeline) {
        const completedPipeline = {
          ...currentPipeline,
          status: PIPELINE_STATUS.COMPLETED,
          lastExecutionResult: result,
          lastExecutionDate: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setPipelines((prev) =>
          prev.map((p) => (p.id === currentPipeline.id ? completedPipeline : p))
        );
        setCurrentPipeline(completedPipeline);
      }
    } catch (error) {
      // Update pipeline status to error
      if (currentPipeline) {
        const errorPipeline = {
          ...currentPipeline,
          status: PIPELINE_STATUS.ERROR,
          lastExecutionError: error.message,
          lastExecutionDate: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setPipelines((prev) =>
          prev.map((p) => (p.id === currentPipeline.id ? errorPipeline : p))
        );
        setCurrentPipeline(errorPipeline);
      }
    }
  }, [
    pipelineForm,
    agents,
    runPipeline,
    isSaved,
    handleSavePipeline,
    currentPipeline,
    setPipelines,
  ]);

  const handleSelectPipeline = useCallback(
    (pipeline) => {
      setCurrentPipeline(pipeline);
      setPipelineForm({
        name: pipeline.name,
        firstPrompt: pipeline.firstPrompt,
      });
      setAgents(pipeline.agents || []);
      setCurrentView(DASH_VIEWS.BUILDER.id);
      setErrors({});
      setIsSaved(true);

      // If pipeline has execution results, restore them
      if (pipeline.lastExecutionResult) {
        resetExecution();
      }
    },
    [resetExecution]
  );

  const handleDeletePipeline = useCallback(
    (pipelineId) => {
      const pipelineToDelete = pipelines.find((p) => p.id === pipelineId);
      if (pipelineToDelete) {
        setPipelineToDelete(pipelineToDelete);
        setShowDeleteDialog(true);
      }
    },
    [pipelines]
  );

  // Handler for resetting pipeline status
  const handleResetPipelineStatus = useCallback(
    (pipelineId) => {
      setPipelines((prev) =>
        prev.map((pipeline) =>
          pipeline.id === pipelineId
            ? {
                ...pipeline,
                status: PIPELINE_STATUS.IDLE,
                lastExecutionResult: undefined,
                lastExecutionError: undefined,
                lastExecutionDate: undefined,
                updatedAt: new Date().toISOString(),
              }
            : pipeline
        )
      );

      // If the reset pipeline is currently selected, update it
      if (currentPipeline?.id === pipelineId) {
        setCurrentPipeline((prev) =>
          prev
            ? {
                ...prev,
                status: PIPELINE_STATUS.IDLE,
                lastExecutionResult: undefined,
                lastExecutionError: undefined,
                lastExecutionDate: undefined,
                updatedAt: new Date().toISOString(),
              }
            : prev
        );
        // Clear any execution state
        resetExecution();
      }

      console.log("Pipeline status reset to idle successfully!");
    },
    [setPipelines, currentPipeline, resetExecution]
  );

  const confirmDeletePipeline = useCallback(() => {
    if (pipelineToDelete) {
      setPipelines((prev) => prev.filter((p) => p.id !== pipelineToDelete.id));

      // If the deleted pipeline was currently selected, reset the view
      if (currentPipeline?.id === pipelineToDelete.id) {
        setCurrentPipeline(null);
        setCurrentView(DASH_VIEWS.WELCOME.id);
        setPipelineForm({ name: "", firstPrompt: "" });
        setAgents([]);
        resetExecution();
        setIsSaved(false);
      }

      setShowDeleteDialog(false);
      setPipelineToDelete(null);
      console.log("Pipeline deleted successfully!");
    }
  }, [pipelineToDelete, currentPipeline, setPipelines, resetExecution]);

  const cancelDeletePipeline = useCallback(() => {
    setShowDeleteDialog(false);
    setPipelineToDelete(null);
  }, []);

  const handleFormChange = useCallback(
    (field, value) => {
      setPipelineForm((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: null }));
      }
    },
    [errors]
  );

  const handleAgentFormChange = useCallback(
    (field, value) => {
      setAgentForm((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: null }));
      }
    },
    [errors]
  );

  // Render main content based on current view
  const renderMainContent = () => {
    switch (currentView) {
      case DASH_VIEWS.WELCOME.id:
        return (
          <WelcomeScreen
            onCreateNewPipeline={handleCreateNewPipeline}
            hasExistingPipelines={pipelines.length > 0}
          />
        );

      case DASH_VIEWS.BUILDER.id:
        return (
          <div className="p-8 space-y-8">
            <PipelineConfiguration
              pipelineForm={pipelineForm}
              onFormChange={handleFormChange}
              errors={errors}
            />
            <AgentConfiguration
              agents={agents}
              errors={errors}
              onShowAddAgent={handleShowAddAgent}
              onEditAgent={handleEditAgent}
              onRemoveAgent={handleRemoveAgent}
              onClosePipeline={handleClosePipeline}
            />
            <PipelineActions
              isRunning={isRunning}
              isFormValid={isFormValid}
              isSaved={isSaved}
              hasLastExecution={
                currentPipeline?.lastExecutionResult ||
                currentPipeline?.lastExecutionError
              }
              lastExecutionDate={currentPipeline?.lastExecutionDate}
              onRunPipeline={handleRunPipeline}
              onSavePipeline={handleSavePipeline}
              onViewResults={() => setCurrentView(DASH_VIEWS.VIEWER.id)}
              onClosePipeline={handleClosePipeline}
            />
          </div>
        );

      case DASH_VIEWS.VIEWER.id:
        // Determine what data we have to show
        const hasCurrentResult = result && result.trim();
        const hasCurrentLogs = logs && logs.length > 0;
        const hasPreviousResult = currentPipeline?.lastExecutionResult;
        const hasPreviousError = currentPipeline?.lastExecutionError;
        const isCurrentError =
          currentPipeline?.status === PIPELINE_STATUS.ERROR;

        // Show current execution data if available, otherwise show previous data
        const displayResult = hasCurrentResult
          ? result
          : hasPreviousResult
          ? currentPipeline.lastExecutionResult
          : null;
        const displayLogs = hasCurrentLogs ? logs : [];
        const isFromPrevious =
          !hasCurrentResult &&
          !hasCurrentLogs &&
          (hasPreviousResult || hasPreviousError);
        const hasError =
          isCurrentError ||
          (isFromPrevious && hasPreviousError && !hasPreviousResult);

        return (
          <div className="p-8 space-y-8">
            <ExecutionMonitor progress={progress} logs={logs} />
            <PipelineResults
              result={displayResult}
              logs={displayLogs}
              isFromPreviousExecution={isFromPrevious}
              lastExecutionDate={currentPipeline?.lastExecutionDate}
              hasError={hasError}
              onBackToBuilder={handleBackToBuilder}
              onEditPipeline={handleEditPipelineFromResults}
              onClosePipeline={handleClosePipeline}
              pipelineName={currentPipeline?.name}
            />
          </div>
        );

      default:
        return (
          <WelcomeScreen
            onCreateNewPipeline={handleCreateNewPipeline}
            hasExistingPipelines={pipelines.length > 0}
          />
        );
    }
  };

  const getHeaderContent = (
    currentView,
    currentPipeline,
    hasUnsavedChanges
  ) => {
    switch (currentView) {
      case DASH_VIEWS.BUILDER.id:
        return {
          title: DASH_VIEWS.BUILDER.title(currentPipeline, hasUnsavedChanges),
          subtitle: DASH_VIEWS.BUILDER.subtitle,
        };
      case DASH_VIEWS.VIEWER.id:
        return DASH_VIEWS.VIEWER;
      case DASH_VIEWS.WELCOME.id:
      default:
        return DASH_VIEWS.WELCOME;
    }
  };

  const headerContent = getHeaderContent(
    currentView,
    currentPipeline,
    hasUnsavedChanges
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-50">
      <Header onCreateNewPipeline={handleCreateNewPipeline} />

      <div className="flex h-[calc(100vh-80px)]">
        <Sidebar
          pipelines={pipelines}
          currentPipeline={currentPipeline}
          onSelectPipeline={handleSelectPipeline}
          onDeletePipeline={handleDeletePipeline}
          onResetPipelineStatus={handleResetPipelineStatus}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-slate-900/30 backdrop-blur border-b border-slate-700/50 px-8 py-6">
            <h1 className="text-2xl font-semibold text-slate-100">
              {headerContent.title}
            </h1>
            {headerContent.subtitle && (
              <p className="text-slate-400 text-sm mt-1">
                {headerContent.subtitle}
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">{renderMainContent()}</div>
        </main>
      </div>

      <AddAgentModal
        showModal={showModal}
        agentForm={agentForm}
        errors={errors}
        isEditing={isEditingAgent}
        onFormChange={handleAgentFormChange}
        onSubmit={handleAddAgent}
        onClose={handleHideAddAgent}
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Pipeline"
        message={`Are you sure you want to delete "${pipelineToDelete?.name}"? This action cannot be undone and will permanently remove the pipeline and all its configurations.`}
        confirmText="Delete Pipeline"
        cancelText="Cancel"
        onConfirm={confirmDeletePipeline}
        onCancel={cancelDeletePipeline}
        variant="danger"
      />
    </div>
  );
}
