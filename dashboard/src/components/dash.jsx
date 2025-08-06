import { useState, useCallback, useMemo } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { WelcomeScreen } from "./WelcomeScreen";
import { PipelineConfiguration } from "./PipelineConfiguration";
import { AgentConfiguration } from "./AgentConfiguration";
import { PipelineActions } from "./PipelineActions";
import { ExecutionMonitor } from "./ExecutionMonitor";
import { PipelineResults } from "./PipelineResults";
import { AddAgentModal } from "./AddAgentModal";
import { usePipelineExecution } from "../hooks/usePipelineExecution";
import { generateId, validatePipelineForm, validateAgentForm } from "../utils";
import { PIPELINE_STATUS } from "../constants";

export default function Dashboard() {
  const [pipelines, setPipelines] = useState([]);
  const [currentPipeline, setCurrentPipeline] = useState(null);
  const [currentView, setCurrentView] = useState("welcome");
  const [showModal, setShowModal] = useState(false);
  const [agents, setAgents] = useState([]);
  const [errors, setErrors] = useState({});

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

  // Event handlers
  const handleCreateNewPipeline = useCallback(() => {
    setCurrentView("builder");
    setCurrentPipeline(null);
    setPipelineForm({ name: "", firstPrompt: "" });
    setAgents([]);
    resetExecution();
    setErrors({});
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
      id: generateId(),
      name: pipelineForm.name,
      firstPrompt: pipelineForm.firstPrompt,
      agents: agents,
      status: PIPELINE_STATUS.IDLE,
      createdAt: new Date().toISOString(),
    };

    setPipelines((prev) => [...prev, pipeline]);
    setCurrentPipeline(pipeline);
    setErrors({});
  }, [pipelineForm, agents]);

  const handleRunPipeline = useCallback(async () => {
    const validationErrors = validatePipelineForm(pipelineForm, agents);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setCurrentView("viewer");
    setErrors({});

    await runPipeline(pipelineForm, agents);
  }, [pipelineForm, agents, runPipeline]);

  const handleSelectPipeline = useCallback((pipeline) => {
    setCurrentPipeline(pipeline);
    setPipelineForm({
      name: pipeline.name,
      firstPrompt: pipeline.firstPrompt,
    });
    setAgents(pipeline.agents);
    setCurrentView("builder");
    setErrors({});
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
        return <WelcomeScreen onCreateNewPipeline={handleCreateNewPipeline} />;

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
            />
            <PipelineActions
              isRunning={isRunning}
              isFormValid={isFormValid}
              onRunPipeline={handleRunPipeline}
              onSavePipeline={handleSavePipeline}
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
        return <WelcomeScreen onCreateNewPipeline={handleCreateNewPipeline} />;
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
        return {
          title: currentPipeline ? currentPipeline.name : "New Pipeline",
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
    </div>
  );
}
