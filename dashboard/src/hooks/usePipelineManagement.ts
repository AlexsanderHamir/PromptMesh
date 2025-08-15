import { useState, useCallback, useMemo } from 'react';
import { useIndexedDB } from './useIndexedDB';
import { generateId, validatePipelineForm } from '../utils';
import { Pipeline, PipelineForm, Agent, PipelineStatus, STORAGE_KEYS, DEFAULT_VALUES, DashViews, LogEntry } from '../types';

export const usePipelineManagement = () => {
  const [pipelines, setPipelines, , isLoadingPipelines, pipelinesError] =
    useIndexedDB(STORAGE_KEYS.PIPELINES, DEFAULT_VALUES.PIPELINES);
  
  // Type the setPipelines function properly with readonly arrays
  const typedSetPipelines = setPipelines as (value: readonly Pipeline[] | ((prev: readonly Pipeline[]) => readonly Pipeline[])) => Promise<void>;
  
  const [currentPipeline, setCurrentPipeline] = useState<Pipeline | null>(null);
  const [currentView, setCurrentView] = useState<DashViews>(DashViews.WELCOME);
  const [pipelineForm, setPipelineForm] = useState<PipelineForm>({
    name: '',
    firstPrompt: '',
  });
  const [agents, setAgents] = useState<Agent[]>([]);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [isSaved, setIsSaved] = useState(false);

  // Memoized validation
  const isFormValid = useMemo(() => {
    const validationErrors = validatePipelineForm(pipelineForm, agents);
    return Object.keys(validationErrors).length === 0;
  }, [pipelineForm, agents]);

  // Check for unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!currentPipeline) return true;
    
    return (
      currentPipeline.name !== pipelineForm.name ||
      currentPipeline.firstPrompt !== pipelineForm.firstPrompt ||
      JSON.stringify(currentPipeline.agents) !== JSON.stringify(agents)
    );
  }, [currentPipeline, pipelineForm, agents]);

  // Update saved status when changes occur
  const updateSavedStatus = useCallback(() => {
    setIsSaved(!hasUnsavedChanges && currentPipeline !== null);
  }, [hasUnsavedChanges, currentPipeline]);

  // Pipeline form handlers
  const updatePipelineForm = useCallback((field: keyof PipelineForm, value: string) => {
    setPipelineForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  const resetPipelineForm = useCallback(() => {
    setPipelineForm({ name: '', firstPrompt: '' });
    setAgents([]);
    setErrors({});
    setIsSaved(false);
  }, []);

  // Pipeline CRUD operations
  const createNewPipeline = useCallback(() => {
    setCurrentPipeline(null);
    setCurrentView(DashViews.BUILDER);
    resetPipelineForm();
  }, [resetPipelineForm]);

  const selectPipeline = useCallback((pipeline: Pipeline) => {
    setCurrentPipeline(pipeline);
    setCurrentView(DashViews.BUILDER);
    setPipelineForm({
      name: pipeline.name,
      firstPrompt: pipeline.firstPrompt,
    });
    setAgents(pipeline.agents || []);
    setErrors({});
    setIsSaved(true);
  }, []);

  const closePipeline = useCallback(() => {
    setCurrentPipeline(null);
    setCurrentView(DashViews.WELCOME);
    resetPipelineForm();
  }, [resetPipelineForm]);

  const savePipeline = useCallback((): boolean => {
    const validationErrors = validatePipelineForm(pipelineForm, agents);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return false;
    }

    const pipeline: Pipeline = {
      id: currentPipeline?.id || generateId(),
      name: pipelineForm.name,
      firstPrompt: pipelineForm.firstPrompt,
      agents: agents,
      status: PipelineStatus.IDLE,
      createdAt: currentPipeline?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (currentPipeline) {
      typedSetPipelines((prev: readonly Pipeline[]) => {
        const updated = prev.map((p: Pipeline) => p.id === currentPipeline.id ? pipeline : p);
        return updated;
      });
    } else {
      typedSetPipelines((prev: readonly Pipeline[]) => {
        const updated = [...prev, pipeline];
        return updated;
      });
    }

    setCurrentPipeline(pipeline);
    setIsSaved(true);
    setErrors({});
    return true;
  }, [pipelineForm, agents, currentPipeline, typedSetPipelines]);

  const deletePipeline = useCallback((pipelineId: string) => {
    typedSetPipelines((prev: readonly Pipeline[]) => {
      const updated = prev.filter((p: Pipeline) => p.id !== pipelineId);
      return updated;
    });
    
    if (currentPipeline?.id === pipelineId) {
      setCurrentPipeline(null);
      setCurrentView(DashViews.WELCOME);
      resetPipelineForm();
    }
  }, [currentPipeline, resetPipelineForm, typedSetPipelines]);

  const resetPipelineStatus = useCallback((pipelineId: string) => {
    typedSetPipelines((prev: readonly Pipeline[]) => {
      const updated = prev.map((pipeline: Pipeline) =>
        pipeline.id === pipelineId
          ? {
              ...pipeline,
              status: PipelineStatus.IDLE,
              lastExecutionResult: undefined,
              lastExecutionError: undefined,
              lastExecutionLogs: undefined,
              lastExecutionDate: undefined,
            }
          : pipeline
      );
      return updated;
    });
  }, [typedSetPipelines]);

  const clearResults = useCallback(() => {
    if (currentPipeline) {
      const clearedPipeline: Pipeline = {
        ...currentPipeline,
        lastExecutionResult: undefined,
        lastExecutionError: undefined,
        lastExecutionLogs: undefined,
        lastExecutionDate: undefined,
      };
      
      typedSetPipelines((prev: readonly Pipeline[]) => {
        const updated = prev.map((p: Pipeline) => p.id === currentPipeline.id ? clearedPipeline : p);
        return updated;
      });
      setCurrentPipeline(clearedPipeline);
    }
  }, [currentPipeline, typedSetPipelines]);

  const updateExecutionResults = useCallback((results: {
    status: PipelineStatus;
    lastExecutionDate: string;
    lastExecutionLogs?: LogEntry[];
    lastExecutionResult?: string;
    lastExecutionError?: string;
  }) => {
    if (currentPipeline) {
      const updatedPipeline: Pipeline = {
        ...currentPipeline,
        status: results.status,
        lastExecutionDate: results.lastExecutionDate,
        lastExecutionLogs: results.lastExecutionLogs,
        lastExecutionResult: results.lastExecutionResult,
        lastExecutionError: results.lastExecutionError,
      };
      
      typedSetPipelines((prev: readonly Pipeline[]) => {
        const updated = prev.map((p: Pipeline) => p.id === currentPipeline.id ? updatedPipeline : p);
        return updated;
      });
      setCurrentPipeline(updatedPipeline);
    }
  }, [currentPipeline, typedSetPipelines]);

  // Agent management
  const addAgent = useCallback((agent: Omit<Agent, 'id'>) => {
    const newAgent: Agent = {
      ...agent,
      id: generateId(),
    };
    setAgents(prev => [...prev, newAgent]);
    setIsSaved(false);
  }, []);

  const updateAgent = useCallback((agentId: string, updates: Omit<Agent, 'id'>) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { ...updates, id: agentId }
        : agent
    ));
    setIsSaved(false);
  }, []);

  const removeAgent = useCallback((agentId: string) => {
    setAgents(prev => prev.filter(agent => agent.id !== agentId));
    setIsSaved(false);
  }, []);

  // View management
  const setCurrentViewHandler = useCallback((view: DashViews) => {
    setCurrentView(view);
  }, []);

  return {
    // State
    pipelines: (pipelines as unknown as Pipeline[]),
    currentPipeline,
    currentView,
    pipelineForm,
    agents,
    errors,
    isSaved,
    isLoadingPipelines,
    pipelinesError,
    isFormValid,
    hasUnsavedChanges,
    
    // Actions
    createNewPipeline,
    selectPipeline,
    closePipeline,
    savePipeline,
    deletePipeline,
    resetPipelineStatus,
    clearResults,
    updateExecutionResults,
    updatePipelineForm,
    resetPipelineForm,
    addAgent,
    updateAgent,
    removeAgent,
    setCurrentView: setCurrentViewHandler,
    updateSavedStatus,
  };
};
