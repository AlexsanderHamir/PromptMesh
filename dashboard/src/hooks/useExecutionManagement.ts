import { useState, useCallback } from 'react';
import { usePipelineExecution } from './usePipelineExecution';
import { PipelineForm, Agent, PipelineStatus, DashViews } from '../types';

interface UploadedFile {
  content: string;
  metadata: {
    name: string;
    type: string;
    size: number;
    mimeType: string;
  };
}

export const useExecutionManagement = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [useStreaming, setUseStreaming] = useState(true);

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

  const toggleStreaming = useCallback(() => {
    setUseStreaming(prev => !prev);
  }, []);

  const executePipeline = useCallback(async (
    pipelineForm: PipelineForm,
    agents: Agent[],
    onStatusUpdate: (status: PipelineStatus, error?: string) => void,
    setCurrentView?: (view: DashViews) => void
  ) => {
    try {
      onStatusUpdate(PipelineStatus.RUNNING);
      
      // Switch to viewer view when execution starts
      if (setCurrentView) {
        setCurrentView(DashViews.VIEWER);
      }
      
      const result = useStreaming
        ? await runPipelineStream(pipelineForm, agents, uploadedFiles)
        : await runPipeline(pipelineForm, agents);

      onStatusUpdate(PipelineStatus.COMPLETED);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onStatusUpdate(PipelineStatus.ERROR, errorMessage);
      throw error;
    }
  }, [useStreaming, runPipelineStream, runPipeline, uploadedFiles]);

  const clearExecutionData = useCallback(() => {
    resetExecution();
    setUploadedFiles([]);
  }, [resetExecution]);

  return {
    // State
    isRunning,
    logs,
    result,
    progress,
    currentAgent,
    agentProgress,
    uploadedFiles,
    useStreaming,
    
    // Actions
    executePipeline,
    toggleStreaming,
    setUploadedFiles,
    clearExecutionData,
    resetExecution,
  };
};
