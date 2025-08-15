import React from 'react';
import { PipelineResults } from '../PipelineResults';
import { usePipelineContext } from '../../contexts/PipelineContext';
import { UI } from '../../constants';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { DashViews } from '../../types';

export const ResultsView: React.FC = () => {
  const {
    currentPipeline,
    closePipeline,
    setCurrentView,
  } = usePipelineContext();

  if (!currentPipeline) {
    return (
      <div className="p-8 space-y-8">
        <div className="text-center py-16">
          <div className="text-6xl mb-6">📊</div>
          <h2 className="text-2xl font-bold text-slate-200 mb-4">
            No Pipeline Selected
          </h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            Please select a pipeline to view its results.
          </p>
        </div>
      </div>
    );
  }

  const hasPreviousResult = currentPipeline.lastExecutionResult;
  const hasPreviousError = currentPipeline.lastExecutionError;
  const hasPreviousLogs = currentPipeline.lastExecutionLogs;

  if (!hasPreviousResult && !hasPreviousError && !hasPreviousLogs) {
    return (
      <div className="p-8 space-y-8">
        <div className="text-center py-16">
          <div className="text-6xl mb-6">📊</div>
          <h2 className="text-2xl font-bold text-slate-200 mb-4">
            No Previous Results
          </h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            This pipeline hasn't been executed yet. Run it first to see results.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-600">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-200">
            Previous Execution Results
          </h2>
        </div>

        {hasPreviousError ? (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-red-300 mb-2">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Execution Failed</span>
            </div>
            <p className="text-red-400">
              {currentPipeline.lastExecutionError}
            </p>
          </div>
        ) : hasPreviousResult ? (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-green-300 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">
                Execution Completed Successfully
              </span>
            </div>
            <p className="text-green-400">
              Last executed:{" "}
              {new Date(currentPipeline.lastExecutionDate!).toLocaleString()}
            </p>
          </div>
        ) : null}

        {hasPreviousResult && (
          <PipelineResults
            result={currentPipeline.lastExecutionResult!}
            logs={currentPipeline.lastExecutionLogs || []}
            isFromPreviousExecution={true}
            lastExecutionDate={currentPipeline.lastExecutionDate!}
            hasError={!!hasPreviousError}
            onEditPipeline={() => setCurrentView(DashViews.BUILDER)}
            onClosePipeline={closePipeline}
            pipelineName={currentPipeline.name}
          />
        )}

        {hasPreviousLogs && hasPreviousLogs.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-slate-200 mb-4">
              Execution Logs
            </h3>
            <div className={`bg-slate-900/50 rounded-lg p-4 max-h-${UI.HEIGHTS.MAX_LARGE} overflow-y-auto`}>
              {hasPreviousLogs.map((log, index) => (
                <div
                  key={index}
                  className="mb-3 p-3 rounded-lg border-l-2 bg-slate-800/50 border-slate-600"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="font-mono">{log.timestamp}</span>
                    <span className="opacity-50">#{index + 1}</span>
                  </div>
                  <div className="text-sm font-medium text-slate-200">
                    {log.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
