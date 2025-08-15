import React, { useState } from 'react';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Edit,
  X,
  Copy,
  Check,
} from "lucide-react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { LogEntry } from "./ui/LogEntry";
import { formatDate } from "../utils";
import { LogEntry as LogEntryType } from "../types";
import { TIMEOUTS, UI } from "../constants";

interface PipelineResultsProps {
  result: string;
  logs?: LogEntryType[];
  isFromPreviousExecution?: boolean;
  lastExecutionDate: string;
  hasError?: boolean;
  onEditPipeline?: () => void;
  onClosePipeline?: () => void;
  pipelineName?: string;
}

export const PipelineResults: React.FC<PipelineResultsProps> = ({
  result,
  logs = [],
  isFromPreviousExecution = false,
  lastExecutionDate,
  hasError = false,
  onEditPipeline,
  onClosePipeline,
  pipelineName,
}) => {
  const [copied, setCopied] = useState(false);

  // Copy result to clipboard
  const copyToClipboard = async () => {
    if (result) {
      try {
        await navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), TIMEOUTS.COPY_RESET); // Reset after 2 seconds
      } catch (err) {
        console.error("Failed to copy: ", err);
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = result;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), TIMEOUTS.COPY_RESET);
      }
    }
  };

  // Determine what to show based on available data
  const hasResult = result && result.trim();
  const hasLogs = logs && logs.length > 0;
  const showContent = hasResult || hasLogs;

  // Determine icon and subtitle based on state
  const getIconAndSubtitle = () => {
    if (hasError) {
      return {
        icon: <AlertCircle className="w-5 h-5" />,
        subtitle: isFromPreviousExecution
          ? `Error logs from previous execution (${formatDate(
              lastExecutionDate
            )})`
          : "Pipeline execution encountered errors - see logs below",
      };
    }

    if (hasResult) {
      return {
        icon: isFromPreviousExecution ? (
          <Clock className="w-5 h-5" />
        ) : (
          <CheckCircle className="w-5 h-5" />
        ),
        subtitle: isFromPreviousExecution
          ? `Results from previous execution (${formatDate(lastExecutionDate)})`
          : "Final output from your AI agent pipeline",
      };
    }

    if (hasLogs) {
      return {
        icon: <FileText className="w-5 h-5" />,
        subtitle: isFromPreviousExecution
          ? `Execution logs from previous run (${formatDate(
              lastExecutionDate
            )})`
          : "Pipeline execution logs",
      };
    }

    return {
      icon: <CheckCircle className="w-5 h-5" />,
      subtitle: "Final output from your AI agent pipeline",
    };
  };

  const { icon, subtitle } = getIconAndSubtitle();

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {pipelineName && (
            <div className="text-sm text-slate-400">
              Viewing results for:{" "}
              <span className="text-slate-200">{pipelineName}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {onEditPipeline && (
            <Button 
              variant="secondary" 
              onClick={onEditPipeline}
            >
              <Edit className="w-4 h-4" />
              Edit Pipeline
            </Button>
          )}
          {onClosePipeline && (
            <Button variant="ghost" onClick={onClosePipeline}>
              <X className="w-4 h-4" />
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Results Card */}
      <Card title="Pipeline Results" subtitle={subtitle} icon={icon}>
        <div className={`bg-slate-900/50 rounded-lg p-6 min-h-${UI.HEIGHTS.MIN_MEDIUM}`}>
          {showContent ? (
            <div className="space-y-6">
              {/* Show indicator for historical data */}
              {isFromPreviousExecution && (
                <div
                  className={`border rounded-lg p-3 mb-4 ${
                    hasError
                      ? "bg-red-500/10 border-red-500/20"
                      : "bg-blue-500/10 border-blue-500/20"
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 text-sm ${
                      hasError ? "text-red-400" : "text-blue-400"
                    }`}
                  >
                    {hasError ? (
                      <AlertCircle className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                    <span>
                      {hasError ? "Error from" : "Showing results from"}{" "}
                      previous execution on {formatDate(lastExecutionDate)}
                    </span>
                  </div>
                </div>
              )}

              {/* Show result if available */}
              {hasResult && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      Final Result
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyToClipboard}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-slate-200 leading-relaxed bg-slate-800/50 rounded-lg p-4">
                      {result}
                    </div>
                  </div>
                </div>
              )}

              {/* Show logs if available and no result (error case) or if it's useful context */}
              {hasLogs && (!hasResult || hasError) && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    Execution Logs
                    {hasError && (
                      <span className="text-red-400 text-xs">
                        (Error Details)
                      </span>
                    )}
                  </h4>
                  <div className={`bg-slate-800/30 rounded-lg p-4 max-h-${UI.HEIGHTS.MAX_MEDIUM} overflow-y-auto`}>
                    <div className="space-y-2">
                      {logs.map((log, index) => (
                        <LogEntry key={index} log={log} index={index} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Show both result and logs summary if both exist */}
              {hasResult && hasLogs && !hasError && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    Execution Summary
                  </h4>
                  <div className="text-sm text-slate-400 bg-slate-800/30 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span>
                        Pipeline completed successfully with {logs.length}{" "}
                        logged steps
                      </span>
                      <span className="text-green-400">✓ Success</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">
              <div className="text-center">
                <div className="text-4xl mb-4 opacity-50">✨</div>
                <p>Pipeline results will appear here...</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
