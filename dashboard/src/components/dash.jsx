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
import { PIPELINE_STATUS } from "../constants";

export default function Dashboard() {
  // Use localStorage for pipelines persistence
  const [pipelines, setPipelines] = useLocalStorage("promptmesh_pipelines", []);
  const [currentPipeline, setCurrentPipeline] = useState(null);
  const [currentView, setCurrentView] = useState("welcome");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pipelineToDelete, setPipelineToDelete] = useState(null);
  const [agents, setAgents] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSaved, setIsSaved] = useState(false);

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
    setCurrentView("builder");
    setCurrentPipeline(null);
    setPipelineForm({ name: "", firstPrompt: "" });
    setAgents([]);
    resetExecution();
    setErrors({});
    setIsSaved(false);
  }, [resetExecution]);

  const handleClosePipeline = useCallback(() => {
    setCurrentView("welcome");
    setCurrentPipeline(null);
    setPipelineForm({ name: "", firstPrompt: "" });
    setAgents([]);
    resetExecution();
    setErrors({});
    setIsSaved(false);
  }, [resetExecution]);

  const handleShowAddAgent = useCallback(() => {
    setAgentForm({
      name: "",
      role: "",
      provider: "",
      model: "",
      systemMsg: "",
    });
    setErrors({});
    setShowModal(true);
  }, []);

  const handleHideAddAgent = useCallback(() => {
    setShowModal(false);
    setErrors({});
  }, []);

  const handleAddAgent = useCallback(
    (e) => {
      e.preventDefault();
      const validationErrors = validateAgentForm(agentForm);

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      const newAgent = {
        id: generateId(),
        ...agentForm,
      };

      setAgents((prev) => [...prev, newAgent]);
      setShowModal(false);
      setErrors({});
    },
    [agentForm]
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

    // Show success message (you could add a toast notification here)
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

    setCurrentView("viewer");
    setErrors({});

    await runPipeline(pipelineForm, agents);
  }, [pipelineForm, agents, runPipeline, isSaved, handleSavePipeline]);

  const handleSelectPipeline = useCallback((pipeline) => {
    setCurrentPipeline(pipeline);
    setPipelineForm({
      name: pipeline.name,
      firstPrompt: pipeline.firstPrompt,
    });
    setAgents(pipeline.agents || []); // Ensure agents is always an array
    setCurrentView("builder");
    setErrors({});
    setIsSaved(true); // Pipeline is saved when selected from list
  }, []);

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

  const confirmDeletePipeline = useCallback(() => {
    if (pipelineToDelete) {
      setPipelines((prev) => prev.filter((p) => p.id !== pipelineToDelete.id));

      // If the deleted pipeline was currently selected, reset the view
      if (currentPipeline?.id === pipelineToDelete.id) {
        setCurrentPipeline(null);
        setCurrentView("welcome");
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
      case "welcome":
        return (
          <WelcomeScreen
            onCreateNewPipeline={handleCreateNewPipeline}
            hasExistingPipelines={pipelines.length > 0}
          />
        );

      case "builder":
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
              onRemoveAgent={handleRemoveAgent}
              onClosePipeline={handleClosePipeline}
            />
            <PipelineActions
              isRunning={isRunning}
              isFormValid={isFormValid}
              isSaved={isSaved}
              onRunPipeline={handleRunPipeline}
              onSavePipeline={handleSavePipeline}
              onClosePipeline={handleClosePipeline}
            />
          </div>
        );

      case "viewer":
        return (
          <div className="p-8 space-y-8">
            <ExecutionMonitor progress={progress} logs={logs} />
            <PipelineResults result={result} />
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

  // Render header title and subtitle based on current view
  const getHeaderContent = () => {
    switch (currentView) {
      case "welcome":
        return {
          title: "Welcome to PromptMesh",
          subtitle: null,
        };
      case "builder":
        const title = currentPipeline ? currentPipeline.name : "New Pipeline";
        const unsavedIndicator =
          hasUnsavedChanges && currentPipeline ? " (Unsaved Changes)" : "";
        return {
          title: title + unsavedIndicator,
          subtitle:
            "Configure your AI agent pipeline with custom prompts and specialized agents",
        };
      case "viewer":
        return {
          title: "Pipeline Execution",
          subtitle: null,
        };
      default:
        return {
          title: "Welcome to PromptMesh",
          subtitle: null,
        };
    }
  };

  const headerContent = getHeaderContent();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-50">
      <Header onCreateNewPipeline={handleCreateNewPipeline} />

      <div className="flex h-[calc(100vh-80px)]">
        <Sidebar
          pipelines={pipelines}
          currentPipeline={currentPipeline}
          onSelectPipeline={handleSelectPipeline}
          onDeletePipeline={handleDeletePipeline}
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
