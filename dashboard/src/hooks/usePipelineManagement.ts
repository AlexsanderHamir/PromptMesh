import { useState, useCallback, useMemo, useEffect } from 'react';
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

  // Pipeline form handlers
  const updatePipelineForm = useCallback((field: keyof PipelineForm, value: string) => {
    setPipelineForm(prev => ({ ...prev, [field]: value }));
    setIsSaved(false);
  }, []);

  const resetPipelineForm = useCallback(() => {
    setPipelineForm({
      name: '',
      firstPrompt: '',
    });
    setAgents([]);
    setErrors({});
    setIsSaved(false);
  }, []);

  // Initialize agent order when agents are loaded from storage
  const initializeAgentOrder = useCallback(() => {
    setAgents(prev => {
      // Check if any agents are missing the order field
      const needsOrderInit = prev.some(agent => typeof agent.order !== 'number');
      if (needsOrderInit) {
        console.log('Initializing agent order for existing agents...');
        return prev.map((agent, index) => ({
          ...agent,
          order: index,
        }));
      }
      return prev;
    });
  }, []);

  // Pipeline management
  const createNewPipeline = useCallback(() => {
    setCurrentPipeline(null);
    setCurrentView(DashViews.BUILDER);
    resetPipelineForm();
  }, [resetPipelineForm, setCurrentView]);

  // Function to restore execution state from saved pipeline data
  const restoreExecutionState = useCallback((pipeline: Pipeline) => {
    // This will be called by the execution management hook to restore state
    return {
      hasResults: !!(pipeline.lastExecutionResult || pipeline.lastExecutionError),
      lastExecutionResult: pipeline.lastExecutionResult,
      lastExecutionError: pipeline.lastExecutionError,
      lastExecutionLogs: pipeline.lastExecutionLogs,
      lastExecutionDate: pipeline.lastExecutionDate,
      status: pipeline.status,
    };
  }, []);

  const selectPipeline = useCallback((pipeline: Pipeline, onExecutionStateRestore?: (pipelineData: ReturnType<typeof restoreExecutionState>) => void) => {
    setCurrentPipeline(pipeline);
    setPipelineForm({
      name: pipeline.name,
      firstPrompt: pipeline.firstPrompt,
    });
    setAgents(pipeline.agents);
    setCurrentView(DashViews.BUILDER);
    setIsSaved(true);
    setErrors({});
    
    // Initialize agent order for existing agents
    setTimeout(() => initializeAgentOrder(), 0);
    
    // Restore execution state if callback is provided
    if (onExecutionStateRestore) {
      const pipelineData = restoreExecutionState(pipeline);
      onExecutionStateRestore(pipelineData);
    }
  }, [initializeAgentOrder, setCurrentView, restoreExecutionState]);

  const closePipeline = useCallback(() => {
    setCurrentPipeline(null);
    setCurrentView(DashViews.WELCOME);
    resetPipelineForm();
  }, [resetPipelineForm, setCurrentView]);

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
      status: currentPipeline?.status || PipelineStatus.IDLE,
      createdAt: currentPipeline?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Preserve execution results when updating existing pipeline
      lastExecutionResult: currentPipeline?.lastExecutionResult,
      lastExecutionError: currentPipeline?.lastExecutionError,
      lastExecutionLogs: currentPipeline?.lastExecutionLogs,
      lastExecutionDate: currentPipeline?.lastExecutionDate,
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
  }, [currentPipeline, resetPipelineForm, typedSetPipelines, setCurrentView]);

  const resetPipelineStatus = useCallback((pipelineId: string, onExecutionStateClear?: () => void) => {
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

    // If the current pipeline is being reset, also clear the current pipeline state
    if (currentPipeline?.id === pipelineId) {
      setCurrentPipeline(prev => prev ? {
        ...prev,
        status: PipelineStatus.IDLE,
        lastExecutionResult: undefined,
        lastExecutionError: undefined,
        lastExecutionLogs: undefined,
        lastExecutionDate: undefined,
      } : null);
      
      // Clear execution state if callback is provided
      if (onExecutionStateClear) {
        onExecutionStateClear();
      }
    }
  }, [typedSetPipelines, currentPipeline]);

  const clearResults = useCallback((onExecutionStateClear?: () => void) => {
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
      
      // Clear execution state if callback is provided
      if (onExecutionStateClear) {
        onExecutionStateClear();
      }
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
      order: agents.length, // Assign order based on current position
    };
    setAgents(prev => [...prev, newAgent]);
    setIsSaved(false);
  }, [agents.length]);

  const updateAgent = useCallback((agentId: string, updates: Partial<Omit<Agent, 'id' | 'order'>>) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { ...agent, ...updates, id: agentId } // Preserve existing fields including order
        : agent
    ));
    setIsSaved(false);
  }, []);

  const removeAgent = useCallback((agentId: string) => {
    setAgents(prev => {
      const filtered = prev.filter(agent => agent.id !== agentId);
      // Reorder remaining agents
      filtered.forEach((agent, index) => {
        agent.order = index;
      });
      return filtered;
    });
    setIsSaved(false);
  }, []);

  // Agent reordering functionality
  const moveAgentUp = useCallback((agentId: string) => {
    setAgents(prev => {
      const index = prev.findIndex(agent => agent.id === agentId);
      if (index > 0) {
        const newAgents = [...prev];
        [newAgents[index], newAgents[index - 1]] = [newAgents[index - 1], newAgents[index]];
        // Update order fields to match new positions
        newAgents[index].order = index;
        newAgents[index - 1].order = index - 1;
        return newAgents;
      }
      return prev;
    });
    setIsSaved(false);
  }, []);

  const moveAgentDown = useCallback((agentId: string) => {
    setAgents(prev => {
      const index = prev.findIndex(agent => agent.id === agentId);
      if (index < prev.length - 1) {
        const newAgents = [...prev];
        [newAgents[index], newAgents[index + 1]] = [newAgents[index + 1], newAgents[index]];
        // Update order fields to match new positions
        newAgents[index].order = index;
        newAgents[index + 1].order = index + 1;
        return newAgents;
      }
      return prev;
    });
    setIsSaved(false);
  }, []);

  const reorderAgents = useCallback((fromIndex: number, toIndex: number) => {
    setAgents(prev => {
      const newAgents = [...prev];
      const [movedAgent] = newAgents.splice(fromIndex, 1);
      newAgents.splice(toIndex, 0, movedAgent);
      
      // Update order fields to match new positions
      newAgents.forEach((agent, index) => {
        agent.order = index;
      });
      
      return newAgents;
    });
    setIsSaved(false);
  }, []);

  const setCurrentViewHandler = useCallback((view: DashViews) => {
    setCurrentView(view);
  }, []);

  // Initialize agent order when agents are first loaded
  useEffect(() => {
    if (agents.length > 0) {
      initializeAgentOrder();
    }
  }, [agents.length, initializeAgentOrder]);

  return {
    // State
    pipelines,
    currentPipeline,
    currentView,
    pipelineForm,
    agents,
    errors,
    isSaved,
    isFormValid,
    hasUnsavedChanges,
    isLoadingPipelines,
    pipelinesError,

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
    addAgent,
    updateAgent,
    removeAgent,
    moveAgentUp,
    moveAgentDown,
    reorderAgents,
    setCurrentViewHandler,
    restoreExecutionState,
  };
};
