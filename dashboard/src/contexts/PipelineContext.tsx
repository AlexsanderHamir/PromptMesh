import React, { createContext, useContext, useMemo } from 'react';
import { usePipelineManagement } from '../hooks/usePipelineManagement';
import { useAgentManagement } from '../hooks/useAgentManagement';
import { useExecutionManagement } from '../hooks/useExecutionManagement';
import { Pipeline, PipelineForm, Agent, DashViews, ExecutionState, PipelineContextValue } from '../types';

interface PipelineProviderProps {
  children: React.ReactNode;
}

const PipelineContext = createContext<PipelineContextValue | undefined>(undefined);

export const usePipelineContext = () => {
  const context = useContext(PipelineContext);
  if (context === undefined) {
    throw new Error('usePipelineContext must be used within a PipelineProvider');
  }
  return context;
};

const PipelineProvider: React.FC<PipelineProviderProps> = ({ children }) => {
  // Initialize all the management hooks
  const pipelineManagement = usePipelineManagement();
  const agentManagement = useAgentManagement();
  const executionManagement = useExecutionManagement();

  // Note: Result saving is now handled directly in the execution management hooks
  // No need for the callback setup that was causing infinite loops

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
        totalAgents: executionManagement.totalAgents,
        completedAgents: executionManagement.completedAgents,
      } as ExecutionState,
      pipelinesError: pipelineManagement.pipelinesError || undefined,
      isFormValid: pipelineManagement.isFormValid,
      hasUnsavedChanges: pipelineManagement.hasUnsavedChanges,

      // Pipeline actions - create stable function references
      createNewPipeline: () => pipelineManagement.createNewPipeline(),
      selectPipeline: (pipeline: Pipeline) => {
        pipelineManagement.selectPipeline(pipeline, (pipelineData) => {
          // Restore execution state when pipeline is selected
          executionManagement.restoreExecutionState(pipelineData);
        });
      },
      closePipeline: () => pipelineManagement.closePipeline(),
      savePipeline: () => pipelineManagement.savePipeline(),
      deletePipeline: (pipelineId: string) => pipelineManagement.deletePipeline(pipelineId),
      resetPipelineStatus: (pipelineId: string) => pipelineManagement.resetPipelineStatus(pipelineId, () => executionManagement.clearExecutionState()),
      clearResults: () => pipelineManagement.clearResults(() => executionManagement.clearExecutionState()),
      runPipeline: async () => {
        try {
          await executionManagement.executePipeline(
            pipelineManagement.pipelineForm,
            pipelineManagement.agents,
            () => {
              // Status update handled silently
            },
            pipelineManagement.setCurrentViewHandler,
            (results) => {
              // Save results directly to pipeline management
              pipelineManagement.updateExecutionResults(results);
            }
          );
          
        } catch (error) {
          console.error('Pipeline execution failed:', error);
          
          // Error results are now handled in the executePipeline function
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
      setCurrentView: (view: DashViews) => pipelineManagement.setCurrentViewHandler(view),
      setUploadedFiles: (files: File[]) => executionManagement.setUploadedFiles(files),
      toggleStreaming: () => executionManagement.toggleStreaming(),
      resetExecution: () => executionManagement.resetExecution(),
      clearExecutionState: () => executionManagement.clearExecutionState(),
      restoreExecutionState: (pipeline: Pipeline) => {
        const pipelineData = pipelineManagement.restoreExecutionState(pipeline);
        executionManagement.restoreExecutionState(pipelineData);
        return pipelineData;
      },
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

export { PipelineProvider, PipelineContext };
