import React from 'react';
import { ExecutionMonitor } from '../ExecutionMonitor';
import { PipelineResults } from '../PipelineResults';
import { usePipelineContext } from '../../contexts/PipelineContext';
import { PipelineStatus, DashViews } from '../../types';

export const ViewerView: React.FC = () => {
  const {
    executionState,
    currentPipeline,
    useStreaming,
    closePipeline,
    setCurrentView,
  } = usePipelineContext();

  const { isRunning, logs, result, progress, currentAgent, agentProgress } = executionState;
  
  // Check if we have current execution data
  const hasCurrentResult = result && result.trim();
  const hasCurrentLogs = logs && logs.length > 0;
  const isCurrentError = currentPipeline?.status === PipelineStatus.ERROR;

  // Convert agentProgress to the expected format
  const formattedAgentProgress: Record<string, { status: 'started' | 'processing' | 'completed' | 'error'; progress?: number }> = {};
  if (typeof agentProgress === 'number') {
    // If agentProgress is a number, create a default progress object
    formattedAgentProgress['default'] = {
      status: isRunning ? 'processing' : 'completed',
      progress: agentProgress
    };
  }

  // If we have current execution data, show it
  if (hasCurrentResult || hasCurrentLogs || isRunning) {
    return (
      <div className="p-8 space-y-8">
        <ExecutionMonitor
          progress={progress}
          logs={logs}
          currentAgent={currentAgent}
          agentProgress={formattedAgentProgress}
          isStreaming={useStreaming}
        />
        
        {hasCurrentResult && (
          <PipelineResults
            result={result}
            logs={logs}
            isFromPreviousExecution={false}
            lastExecutionDate={new Date().toISOString()}
            hasError={isCurrentError}
            onEditPipeline={() => {
              alert('Edit Pipeline button clicked!');
              setCurrentView(DashViews.BUILDER);
            }}
            onClosePipeline={closePipeline}
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
            onClick={() => setCurrentView(DashViews.BUILDER)} // Handled by context
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white font-medium"
          >
            ← Back to Builder
          </button>
          <button
            onClick={closePipeline}
            className="px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-slate-200"
          >
            Close Pipeline
          </button>
        </div>
      </div>
    </div>
  );
};
