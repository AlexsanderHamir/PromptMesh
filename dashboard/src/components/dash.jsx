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
import { WorkflowBuilder } from "./WorkflowBuilder";
import { WorkflowExecutor } from "./WorkflowExecutor";
import { WorkflowList } from "./WorkflowList";
import { usePipelineExecution } from "../hooks/usePipelineExecution";
import { useIndexedDB } from "../hooks/useIndexedDB";
import { generateId, validatePipelineForm, validateAgentForm } from "../utils";
import {
  PIPELINE_STATUS,
  DASH_VIEWS,
  WORKFLOW_VIEWS,
  STORAGE_KEYS,
  DEFAULT_VALUES,
} from "../constants";
import {
  Workflow,
  WorkflowExecution,
  WORKFLOW_STATUS,
} from "../types/workflow";

export default function Dashboard() {
  const [pipelines, setPipelines, , isLoadingPipelines, pipelinesError] =
    useIndexedDB(STORAGE_KEYS.PIPELINES, DEFAULT_VALUES.PIPELINES);
  const [workflows, setWorkflows, , isLoadingWorkflows, workflowsError] =
    useIndexedDB(STORAGE_KEYS.WORKFLOWS, []);
  const [currentPipeline, setCurrentPipeline] = useState(null);
  const [currentWorkflow, setCurrentWorkflow] = useState(null);
  const [currentView, setCurrentView] = useState(DASH_VIEWS.WELCOME.id);
  const [sidebarView, setSidebarView] = useState("pipelines"); // 'pipelines' or 'workflows'
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pipelineToDelete, setPipelineToDelete] = useState(null);
  const [workflowToDelete, setWorkflowToDelete] = useState(null);
  const [agents, setAgents] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSaved, setIsSaved] = useState(false);
  const [isWorkflowSaved, setIsWorkflowSaved] = useState(false);

  const [editingAgent, setEditingAgent] = useState(null);
  const [isEditingAgent, setIsEditingAgent] = useState(false);

  const [pipelineForm, setPipelineForm] = useState({
    name: "",
    firstPrompt: "",
  });

  const [workflowForm, setWorkflowForm] = useState({
    name: "",
    description: "",
    type: "linear",
  });

  const [agentForm, setAgentForm] = useState({
    name: "",
    role: "",
    provider: "",
    model: "",
    systemMsg: "",
  });

  // Custom hook for pipeline execution
  const {
    isRunning,
    logs,
    result,
    progress,
    currentAgent,
    agentProgress,
    runPipeline,
    runPipelineStream,
    resetExecution,
  } = usePipelineExecution();

  // Workflow execution state
  const [workflowExecution, setWorkflowExecution] = useState(null);
  const [isWorkflowRunning, setIsWorkflowRunning] = useState(false);

  // Track uploaded files from PipelineConfiguration
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [useStreaming, setUseStreaming] = useState(true);

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

    // Clear any previous execution data
    resetExecution();

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
      // Use streaming or non-streaming execution based on toggle
      const result = useStreaming
        ? await runPipelineStream(pipelineForm, agents, uploadedFiles)
        : await runPipeline(pipelineForm, agents);

      // Update pipeline status to completed and save results with logs
      if (currentPipeline) {
        const completedPipeline = {
          ...currentPipeline,
          status: PIPELINE_STATUS.COMPLETED,
          lastExecutionResult: result,
          lastExecutionLogs: logs, // Save the execution logs
          lastExecutionDate: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setPipelines((prev) =>
          prev.map((p) => (p.id === currentPipeline.id ? completedPipeline : p))
        );
        setCurrentPipeline(completedPipeline);
      }
    } catch (error) {
      // Update pipeline status to error and save logs
      if (currentPipeline) {
        const errorPipeline = {
          ...currentPipeline,
          status: PIPELINE_STATUS.ERROR,
          lastExecutionError: error.message,
          lastExecutionLogs: logs, // Save the execution logs even on error
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
    uploadedFiles,
    runPipelineStream,
    isSaved,
    handleSavePipeline,
    currentPipeline,
    setPipelines,
    logs,
    useStreaming,
    runPipeline,
    resetExecution,
  ]);

  const handleSelectPipeline = useCallback(
    (pipeline) => {
      // Always reset execution when selecting a pipeline to ensure clean state
      resetExecution();

      setCurrentPipeline(pipeline);
      setPipelineForm({
        name: pipeline.name,
        firstPrompt: pipeline.firstPrompt,
      });
      setAgents(pipeline.agents || []);
      setCurrentView(DASH_VIEWS.BUILDER.id);
      setErrors({});
      setIsSaved(true);
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
                lastExecutionLogs: undefined, // Clear saved logs
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
                lastExecutionLogs: undefined, // Clear saved logs
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

  // Handler for clearing execution results from current pipeline
  const handleClearResults = useCallback(() => {
    if (currentPipeline) {
      const clearedPipeline = {
        ...currentPipeline,
        status: PIPELINE_STATUS.IDLE,
        lastExecutionResult: undefined,
        lastExecutionError: undefined,
        lastExecutionLogs: undefined,
        lastExecutionDate: undefined,
        updatedAt: new Date().toISOString(),
      };

      setPipelines((prev) =>
        prev.map((p) => (p.id === currentPipeline.id ? clearedPipeline : p))
      );
      setCurrentPipeline(clearedPipeline);

      // Clear any execution state
      resetExecution();

      console.log("Pipeline execution results cleared successfully!");
    }
  }, [currentPipeline, setPipelines, resetExecution]);

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

  const confirmDeleteWorkflow = useCallback(() => {
    if (workflowToDelete) {
      setWorkflows((prev) => prev.filter((w) => w.id !== workflowToDelete.id));

      // If the deleted workflow was currently selected, reset the view
      if (currentWorkflow?.id === workflowToDelete.id) {
        setCurrentWorkflow(null);
        setCurrentView(DASH_VIEWS.WELCOME.id);
        setWorkflowForm({ name: "", description: "", type: "linear" });
        setWorkflowExecution(null);
        setIsWorkflowRunning(false);
        setIsWorkflowSaved(false);
      }

      setShowDeleteDialog(false);
      setWorkflowToDelete(null);
      console.log("Workflow deleted successfully!");
    }
  }, [workflowToDelete, currentWorkflow, setWorkflows]);

  const cancelDeleteWorkflow = useCallback(() => {
    setShowDeleteDialog(false);
    setWorkflowToDelete(null);
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

  const handleWorkflowFormChange = useCallback(
    (field, value) => {
      setWorkflowForm((prev) => ({ ...prev, [field]: value }));
      // Update the current workflow with the form change
      if (currentWorkflow) {
        const updatedWorkflow = {
          ...currentWorkflow,
          [field]: value,
        };
        setCurrentWorkflow(updatedWorkflow);
        setIsWorkflowSaved(false);
      }
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: null }));
      }
    },
    [errors, currentWorkflow]
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

  // Workflow handlers
  const handleCreateNewWorkflow = useCallback(() => {
    const newWorkflow = new Workflow("", "");
    setCurrentWorkflow(newWorkflow);
    setWorkflowForm({ name: "", description: "", type: "linear" });
    setWorkflowExecution(null);
    setIsWorkflowRunning(false);
    setErrors({});
    setIsWorkflowSaved(false);
    setCurrentView(WORKFLOW_VIEWS.BUILDER.id);
  }, []);

  const handleSelectWorkflow = useCallback((workflow) => {
    setCurrentWorkflow(workflow);
    setWorkflowForm({
      name: workflow.name,
      description: workflow.description,
      type: workflow.type,
    });
    setCurrentView(WORKFLOW_VIEWS.BUILDER.id);
    setErrors({});
    setIsWorkflowSaved(true);
  }, []);

  const handleWorkflowChange = useCallback((workflow) => {
    setCurrentWorkflow(workflow);
    // Update the form to reflect the current workflow state
    setWorkflowForm({
      name: workflow.name,
      description: workflow.description,
      type: workflow.type,
    });
    setIsWorkflowSaved(false);
  }, []);

  const handleSaveWorkflow = useCallback(() => {
    if (!currentWorkflow) return;

    // If this is a new workflow, add it to the list
    if (!currentWorkflow.id || currentWorkflow.id.startsWith("workflow_")) {
      const savedWorkflow = {
        ...currentWorkflow,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setWorkflows((prev) => [...prev, savedWorkflow]);
      setCurrentWorkflow(savedWorkflow);
    } else {
      // Update existing workflow
      const updatedWorkflow = {
        ...currentWorkflow,
        updatedAt: new Date().toISOString(),
      };
      setWorkflows((prev) =>
        prev.map((w) => (w.id === currentWorkflow.id ? updatedWorkflow : w))
      );
      setCurrentWorkflow(updatedWorkflow);
    }

    setIsWorkflowSaved(true);
    console.log("Workflow saved successfully!");
  }, [currentWorkflow, setWorkflows]);

  const handleRunWorkflow = useCallback(async (workflow) => {
    if (!workflow || !workflow.isValid()) {
      console.error("Cannot run invalid workflow");
      return;
    }

    const execution = new WorkflowExecution(workflow.id, workflow);
    execution.start();

    setWorkflowExecution(execution);
    setIsWorkflowRunning(true);
    setCurrentView(WORKFLOW_VIEWS.EXECUTOR.id);

    // TODO: Implement actual workflow execution logic
    console.log("Starting workflow execution:", workflow.name);
  }, []);

  const handleDeleteWorkflow = useCallback(
    (workflowId) => {
      const workflowToDelete = workflows.find((w) => w.id === workflowId);
      if (workflowToDelete) {
        setWorkflowToDelete(workflowToDelete);
        setShowDeleteDialog(true);
      }
    },
    [workflows]
  );

  const handleViewWorkflow = useCallback((workflow) => {
    setCurrentWorkflow(workflow);
    setCurrentView(WORKFLOW_VIEWS.VIEWER.id);
  }, []);

  const handleCloseWorkflow = useCallback(() => {
    setCurrentView(DASH_VIEWS.WELCOME.id);
    setCurrentWorkflow(null);
    setWorkflowForm({ name: "", description: "", type: "linear" });
    setWorkflowExecution(null);
    setIsWorkflowRunning(false);
    setErrors({});
    setIsWorkflowSaved(false);
  }, []);

  const handleSidebarViewChange = useCallback((view) => {
    setSidebarView(view);
    if (view === "pipelines") {
      setCurrentWorkflow(null);
      setCurrentView(DASH_VIEWS.WELCOME.id);
    } else {
      setCurrentPipeline(null);
      setCurrentView(WORKFLOW_VIEWS.BUILDER.id);
    }
  }, []);

  // Render main content based on current view
  const renderMainContent = () => {
    switch (currentView) {
      case DASH_VIEWS.WELCOME.id:
        return (
          <WelcomeScreen
            onCreateNewPipeline={handleCreateNewPipeline}
            onCreateNewWorkflow={handleCreateNewWorkflow}
            hasExistingPipelines={pipelines.length > 0}
            hasExistingWorkflows={workflows.length > 0}
            isLoading={isLoadingPipelines || isLoadingWorkflows}
          />
        );

      case DASH_VIEWS.BUILDER.id:
        return (
          <div className="p-8 space-y-8">
            <PipelineConfiguration
              pipelineForm={pipelineForm}
              onFormChange={handleFormChange}
              errors={errors}
              onFilesChange={setUploadedFiles}
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
              onRunPipelineStream={handleRunPipeline}
              onSavePipeline={handleSavePipeline}
              onViewResults={() => setCurrentView(DASH_VIEWS.VIEWER.id)}
              onClosePipeline={handleClosePipeline}
              onClearResults={handleClearResults}
              useStreaming={useStreaming}
              onToggleStreaming={() => setUseStreaming(!useStreaming)}
            />
          </div>
        );

      case DASH_VIEWS.VIEWER.id:
        // Only show current execution data, not previous results
        const hasCurrentResult = result && result.trim();
        const hasCurrentLogs = logs && logs.length > 0;
        const isCurrentError =
          currentPipeline?.status === PIPELINE_STATUS.ERROR;

        // If we have current execution data, show it
        if (hasCurrentResult || hasCurrentLogs || isRunning) {
          return (
            <div className="p-8 space-y-8">
              <ExecutionMonitor
                progress={progress}
                logs={logs}
                currentAgent={currentAgent}
                agentProgress={agentProgress}
                isStreaming={useStreaming}
              />
              {hasCurrentResult && (
                <PipelineResults
                  result={result}
                  logs={logs}
                  isFromPreviousExecution={false}
                  lastExecutionDate={new Date().toISOString()}
                  hasError={isCurrentError}
                  onBackToBuilder={handleBackToBuilder}
                  onEditPipeline={handleEditPipelineFromResults}
                  onClosePipeline={handleClosePipeline}
                  pipelineName={currentPipeline?.name}
                />
              )}
            </div>
          );
        }

        // If no current execution data, show a message to go back to builder
        return (
          <div className="p-8 space-y-8">
            <div className="text-center py-16">
              <div className="text-6xl mb-6">🚀</div>
              <h2 className="text-2xl font-bold text-slate-200 mb-4">
                Ready to Execute Pipeline
              </h2>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                Your pipeline is configured and ready to run. Go back to the
                builder to start execution.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleBackToBuilder}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white font-medium"
                >
                  ← Back to Builder
                </button>
                <button
                  onClick={handleClosePipeline}
                  className="px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-slate-200"
                >
                  Close Pipeline
                </button>
              </div>
            </div>
          </div>
        );

      // Workflow Views
      case WORKFLOW_VIEWS.BUILDER.id:
        return (
          <div className="p-8 space-y-8">
            <WorkflowBuilder
              workflow={
                currentWorkflow ||
                new Workflow(workflowForm.name, workflowForm.description)
              }
              pipelines={pipelines}
              onWorkflowChange={handleWorkflowChange}
              onSaveWorkflow={handleSaveWorkflow}
              onRunWorkflow={() => handleRunWorkflow(currentWorkflow)}
              onViewWorkflow={() => handleViewWorkflow(currentWorkflow)}
              isRunning={isWorkflowRunning}
              isSaved={isWorkflowSaved}
              onFormChange={handleWorkflowFormChange}
            />
          </div>
        );

      case WORKFLOW_VIEWS.EXECUTOR.id:
        return (
          <div className="p-8 space-y-8">
            <WorkflowExecutor
              workflow={currentWorkflow}
              workflowExecution={workflowExecution}
              pipelines={pipelines}
              onPauseWorkflow={() => {
                if (workflowExecution) {
                  workflowExecution.status = WORKFLOW_STATUS.PAUSED;
                  setWorkflowExecution({ ...workflowExecution });
                }
              }}
              onResumeWorkflow={() => {
                if (workflowExecution) {
                  workflowExecution.status = WORKFLOW_STATUS.RUNNING;
                  setWorkflowExecution({ ...workflowExecution });
                }
              }}
              onStopWorkflow={() => {
                if (workflowExecution) {
                  workflowExecution.status = WORKFLOW_STATUS.IDLE;
                  setWorkflowExecution({ ...workflowExecution });
                  setIsWorkflowRunning(false);
                }
              }}
              onBackToBuilder={() => setCurrentView(WORKFLOW_VIEWS.BUILDER.id)}
            />
          </div>
        );

      case WORKFLOW_VIEWS.VIEWER.id:
        return (
          <div className="p-8 space-y-8">
            <div className="text-center py-16">
              <div className="text-6xl mb-6">📊</div>
              <h2 className="text-2xl font-bold text-slate-200 mb-4">
                Workflow Results
              </h2>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                View the results of your workflow execution.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setCurrentView(WORKFLOW_VIEWS.BUILDER.id)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white font-medium"
                >
                  ← Back to Builder
                </button>
                <button
                  onClick={handleCloseWorkflow}
                  className="px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-slate-200"
                >
                  Close Workflow
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <WelcomeScreen
            onCreateNewPipeline={handleCreateNewPipeline}
            onCreateNewWorkflow={handleCreateNewWorkflow}
            hasExistingPipelines={pipelines.length > 0}
            hasExistingWorkflows={workflows.length > 0}
            isLoading={isLoadingPipelines || isLoadingWorkflows}
          />
        );
    }
  };

  const getHeaderContent = (
    currentView,
    currentPipeline,
    currentWorkflow,
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
      case WORKFLOW_VIEWS.BUILDER.id:
        return {
          title: currentWorkflow?.name || "New Workflow",
          subtitle: WORKFLOW_VIEWS.BUILDER.subtitle,
        };
      case WORKFLOW_VIEWS.EXECUTOR.id:
        return WORKFLOW_VIEWS.EXECUTOR;
      case WORKFLOW_VIEWS.VIEWER.id:
        return WORKFLOW_VIEWS.VIEWER;
      case DASH_VIEWS.WELCOME.id:
      default:
        return DASH_VIEWS.WELCOME;
    }
  };

  const headerContent = getHeaderContent(
    currentView,
    currentPipeline,
    currentWorkflow,
    hasUnsavedChanges
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-50">
      <Header onCreateNewPipeline={handleCreateNewPipeline} />

      <div className="flex h-[calc(100vh-80px)]">
        <Sidebar
          pipelines={pipelines}
          workflows={workflows}
          currentPipeline={currentPipeline}
          currentWorkflow={currentWorkflow}
          onSelectPipeline={handleSelectPipeline}
          onSelectWorkflow={handleSelectWorkflow}
          onDeletePipeline={handleDeletePipeline}
          onDeleteWorkflow={handleDeleteWorkflow}
          onResetPipelineStatus={handleResetPipelineStatus}
          onCreateWorkflow={handleCreateNewWorkflow}
          view={sidebarView}
          onViewChange={handleSidebarViewChange}
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

          <div className="flex-1 overflow-y-auto">
            {pipelinesError && (
              <div className="p-4 m-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-300 font-medium">
                    Storage Error
                  </span>
                </div>
                <p className="text-red-400 text-sm mt-1">
                  Failed to load pipelines from storage:{" "}
                  {pipelinesError.message}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-red-300 hover:text-red-200 text-sm underline mt-2"
                >
                  Reload page to retry
                </button>
              </div>
            )}
            {workflowsError && (
              <div className="p-4 m-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-300 font-medium">
                    Storage Error
                  </span>
                </div>
                <p className="text-red-400 text-sm mt-1">
                  Failed to load workflows from storage:{" "}
                  {workflowsError.message}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-red-300 hover:text-red-200 text-sm underline mt-2"
                >
                  Reload page to retry
                </button>
              </div>
            )}
            {renderMainContent()}
          </div>
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
        title={pipelineToDelete ? "Delete Pipeline" : "Delete Workflow"}
        message={`Are you sure you want to delete "${
          pipelineToDelete?.name || workflowToDelete?.name
        }"? This action cannot be undone and will permanently remove the ${
          pipelineToDelete ? "pipeline" : "workflow"
        } and all its configurations.`}
        confirmText={pipelineToDelete ? "Delete Pipeline" : "Delete Workflow"}
        cancelText="Cancel"
        onConfirm={
          pipelineToDelete ? confirmDeletePipeline : confirmDeleteWorkflow
        }
        onCancel={
          pipelineToDelete ? cancelDeletePipeline : cancelDeleteWorkflow
        }
        variant="danger"
      />
    </div>
  );
}
