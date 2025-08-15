import { useState, useCallback } from 'react';
import { usePipelineExecution } from './usePipelineExecution';
import { PipelineForm, Agent, PipelineStatus, DashViews, LogEntry } from '../types';

// Interface matching what the API client expects
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
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
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

  // Convert File[] to UploadedFile[] for API calls
  const convertFilesForAPI = useCallback(async (files: File[]): Promise<UploadedFile[]> => {
    const convertedFiles: UploadedFile[] = [];
    
    for (const file of files) {
      try {
        const content = await file.text();
        convertedFiles.push({
          content,
          metadata: {
            name: file.name,
            type: file.type.split('/')[0] || 'unknown',
            size: file.size,
            mimeType: file.type,
          }
        });
      } catch (error) {
        console.error(`Failed to read file ${file.name}:`, error);
      }
    }
    
    return convertedFiles;
  }, []);

  // Note: Result saving is now handled directly in the pipeline execution functions
  // This removes the callback system that was causing infinite loops

  const toggleStreaming = useCallback(() => {
    setUseStreaming(prev => !prev);
  }, []);

  const executePipeline = useCallback(async (
    pipelineForm: PipelineForm,
    agents: Agent[],
    onStatusUpdate: (status: PipelineStatus, error?: string) => void,
    setCurrentView?: (view: DashViews) => void,
    onResultSave?: (results: {
      status: PipelineStatus;
      lastExecutionDate: string;
      lastExecutionLogs?: LogEntry[];
      lastExecutionResult?: string;
      lastExecutionError?: string;
    }) => void
  ) => {
    try {
      onStatusUpdate(PipelineStatus.RUNNING);
      
      // Switch to viewer view when execution starts
      if (setCurrentView) {
        setCurrentView(DashViews.VIEWER);
      }
      
      // Convert files for API if needed
      const apiFiles = await convertFilesForAPI(uploadedFiles);
      
      const result = useStreaming
        ? await runPipelineStream(pipelineForm, agents, apiFiles)
        : await runPipeline(pipelineForm, agents);

      onStatusUpdate(PipelineStatus.COMPLETED);
      
      // Save successful results if callback is provided
      if (onResultSave && result && result.trim()) {
        onResultSave({
          status: PipelineStatus.COMPLETED,
          lastExecutionDate: new Date().toISOString(),
          lastExecutionLogs: logs,
          lastExecutionResult: result,
        });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onStatusUpdate(PipelineStatus.ERROR, errorMessage);
      
      // Save error results if callback is provided
      if (onResultSave) {
        onResultSave({
          status: PipelineStatus.ERROR,
          lastExecutionDate: new Date().toISOString(),
          lastExecutionLogs: logs,
          lastExecutionError: errorMessage,
        });
      }
      
      throw error;
    }
  }, [useStreaming, runPipelineStream, runPipeline, uploadedFiles, convertFilesForAPI, logs]);

  const clearExecutionData = useCallback(() => {
    resetExecution();
    setUploadedFiles([]);
  }, [resetExecution]);

  const clearExecutionState = useCallback(() => {
    resetExecution();
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
    clearExecutionState,
    resetExecution,
  };
};
