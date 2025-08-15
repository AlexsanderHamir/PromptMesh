import { useState, useCallback, useEffect } from 'react';
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

  // Auto-save results when they become available
  const [onResultSave, setOnResultSave] = useState<((results: {
    status: PipelineStatus;
    lastExecutionDate: string;
    lastExecutionLogs?: LogEntry[];
    lastExecutionResult?: string;
    lastExecutionError?: string;
  }) => void) | null>(null);

  // Set the callback for saving results
  const setResultSaveCallback = useCallback((callback: (results: {
    status: PipelineStatus;
    lastExecutionDate: string;
    lastExecutionLogs?: LogEntry[];
    lastExecutionResult?: string;
    lastExecutionError?: string;
  }) => void) => {
    setOnResultSave(() => callback);
  }, []);

  // Auto-save results when they become available
  useEffect(() => {
    if (onResultSave && !isRunning && (result || logs.length > 0)) {
      // Determine if there was an error
      const hasError = result === '' && logs.length > 0 && logs.some(log => log.level === 'error');
      
      if (hasError) {
        // Save error results
        onResultSave({
          status: PipelineStatus.ERROR,
          lastExecutionDate: new Date().toISOString(),
          lastExecutionLogs: logs,
          lastExecutionError: 'Pipeline execution failed - see logs for details',
        });
      } else if (result && result.trim()) {
        // Save successful results
        onResultSave({
          status: PipelineStatus.COMPLETED,
          lastExecutionDate: new Date().toISOString(),
          lastExecutionLogs: logs,
          lastExecutionResult: result,
        });
      }
    }
  }, [onResultSave, isRunning, result, logs]);

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
      
      // Convert files for API if needed
      const apiFiles = await convertFilesForAPI(uploadedFiles);
      
      const result = useStreaming
        ? await runPipelineStream(pipelineForm, agents, apiFiles)
        : await runPipeline(pipelineForm, agents);

      onStatusUpdate(PipelineStatus.COMPLETED);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onStatusUpdate(PipelineStatus.ERROR, errorMessage);
      throw error;
    }
  }, [useStreaming, runPipelineStream, runPipeline, uploadedFiles, convertFilesForAPI]);

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
    setResultSaveCallback,
  };
};
