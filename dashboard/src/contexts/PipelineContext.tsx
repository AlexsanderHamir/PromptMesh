import React, { createContext, useContext, useMemo, useCallback, useEffect } from 'react';
import { usePipelineManagement } from '../hooks/usePipelineManagement';
import { useAgentManagement } from '../hooks/useAgentManagement';
import { useExecutionManagement } from '../hooks/useExecutionManagement';
import { Pipeline, PipelineForm, Agent, PipelineStatus, DashViews, ExecutionState, PipelineContextValue } from '../types';

interface PipelineProviderProps {
  children: React.ReactNode;
}

export const PipelineContext = createContext<PipelineContextValue | undefined>(undefined);

export const usePipelineContext = () => {
  const context = useContext(PipelineContext);
  if (context === undefined) {
    throw new Error('usePipelineContext must be used within a PipelineProvider');
  }
  return context;
};

export const PipelineProvider: React.FC<PipelineProviderProps> = ({ children }) => {
  // Initialize all the management hooks
  const pipelineManagement = usePipelineManagement();
  const agentManagement = useAgentManagement();
  const executionManagement = useExecutionManagement();

  // Create stable function references
  const setCurrentViewStable = useCallback((view: DashViews) => {
    pipelineManagement.setCurrentView(view);
  }, [pipelineManagement]);

  // Set up automatic result saving
  useEffect(() => {
    executionManagement.setResultSaveCallback((results) => {
      pipelineManagement.updateExecutionResults(results);
    });
  }, [executionManagement, pipelineManagement]);

  // Create the context value with useMemo but only depend on primitive values
  const contextValue = useMemo((): PipelineContextValue => {
    return {
      // Pipeline state
      pipelines: (pipelineManagement.pipelines as unknown as Pipeline[]),
      currentPipeline: pipelineManagement.currentPipeline,
      currentView: pipelineManagement.currentView,
      pipelineForm: pipelineManagement.pipelineForm,
      agents: pipelineManagement.agents,
      errors: pipelineManagement.errors,
      isSaved: pipelineManagement.isSaved,
      uploadedFiles: executionManagement.uploadedFiles as unknown as File[],
      useStreaming: executionManagement.useStreaming,
      executionState: {
        isRunning: executionManagement.isRunning,
        logs: executionManagement.logs,
        result: executionManagement.result,
        progress: executionManagement.progress,
        currentAgent: executionManagement.currentAgent,
        agentProgress: typeof executionManagement.agentProgress === 'number' ? executionManagement.agentProgress : 0,
      } as ExecutionState,
      pipelinesError: pipelineManagement.pipelinesError || undefined,
      isFormValid: pipelineManagement.isFormValid,
      hasUnsavedChanges: pipelineManagement.hasUnsavedChanges,

      // Pipeline actions - create stable function references
      createNewPipeline: () => pipelineManagement.createNewPipeline(),
      selectPipeline: (pipeline: Pipeline) => pipelineManagement.selectPipeline(pipeline),
      closePipeline: () => pipelineManagement.closePipeline(),
      savePipeline: () => pipelineManagement.savePipeline(),
      deletePipeline: (pipelineId: string) => pipelineManagement.deletePipeline(pipelineId),
      resetPipelineStatus: (pipelineId: string) => pipelineManagement.resetPipelineStatus(pipelineId),
      clearResults: () => pipelineManagement.clearResults(),
      runPipeline: async () => {
        try {
          await executionManagement.executePipeline(
            pipelineManagement.pipelineForm,
            pipelineManagement.agents,
            () => {
              // Status update handled silently
            },
            pipelineManagement.setCurrentView
          );
          
          // Results are now automatically saved via the callback
          // No need to manually save here
          
        } catch (error) {
          console.error('Pipeline execution failed:', error);
          
          // Save error results
          pipelineManagement.updateExecutionResults({
            status: PipelineStatus.ERROR,
            lastExecutionDate: new Date().toISOString(),
            lastExecutionError: error instanceof Error ? error.message : 'Unknown error occurred',
          });
        }
      },
      updatePipelineForm: (field: keyof PipelineForm, value: string) => pipelineManagement.updatePipelineForm(field, value),
      addAgent: (agent: Omit<Agent, 'id'>) => {
        pipelineManagement.addAgent(agent);
      },
      updateAgent: (agentId: string, updates: Partial<Omit<Agent, 'id' | 'order'>>) => {
        pipelineManagement.updateAgent(agentId, updates);
      },
      editAgent: (agent: Agent) => agentManagement.showEditAgentModal(agent),
      removeAgent: (agentId: string) => {
        pipelineManagement.removeAgent(agentId);
      },
      moveAgentUp: (agentId: string) => {
        pipelineManagement.moveAgentUp(agentId);
      },
      moveAgentDown: (agentId: string) => {
        pipelineManagement.moveAgentDown(agentId);
      },
      reorderAgents: (fromIndex: number, toIndex: number) => {
        pipelineManagement.reorderAgents(fromIndex, toIndex);
      },
      setCurrentView: (view: DashViews) => setCurrentViewStable(view),
      setUploadedFiles: (files: File[]) => {
        executionManagement.setUploadedFiles(files);
      },
      toggleStreaming: () => executionManagement.toggleStreaming(),
      resetExecution: () => executionManagement.resetExecution(),
    };
  }, [
    // Only depend on primitive values, not objects
    pipelineManagement.pipelines,
    pipelineManagement.currentPipeline?.id,
    pipelineManagement.currentView,
    pipelineManagement.pipelineForm.name,
    pipelineManagement.pipelineForm.firstPrompt,
    pipelineManagement.agents.length,
    // Add dependency on agent data to trigger updates when agents are modified
    JSON.stringify(pipelineManagement.agents),
    pipelineManagement.errors,
    pipelineManagement.isSaved,
    pipelineManagement.pipelinesError?.message,
    pipelineManagement.isFormValid,
    pipelineManagement.hasUnsavedChanges,
    executionManagement.uploadedFiles.length,
    executionManagement.useStreaming,
    executionManagement.isRunning,
    executionManagement.logs.length,
    executionManagement.result,
    executionManagement.progress,
    executionManagement.currentAgent,
    executionManagement.agentProgress,
  ]);

  return (
    <PipelineContext.Provider value={contextValue}>
      {children}
    </PipelineContext.Provider>
  );
};
