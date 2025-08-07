import { CheckCircle, Clock, AlertCircle, FileText } from "lucide-react";
import { Card } from "./ui/Card";
import { LogEntry } from "./ui/LogEntry";
import { formatDate } from "../utils";

export const PipelineResults = ({
  result,
  logs = [],
  isFromPreviousExecution = false,
  lastExecutionDate,
  hasError = false,
}) => {
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
    <Card title="Pipeline Results" subtitle={subtitle} icon={icon}>
      <div className="bg-slate-900/50 rounded-lg p-6 min-h-64">
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
                    {hasError ? "Error from" : "Showing results from"} previous
                    execution on {formatDate(lastExecutionDate)}
                  </span>
                </div>
              </div>
            )}

            {/* Show result if available */}
            {hasResult && (
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Final Result
                </h4>
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
                <div className="bg-slate-800/30 rounded-lg p-4 max-h-80 overflow-y-auto">
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
                      Pipeline completed successfully with {logs.length} logged
                      steps
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
  );
};
