import { Info, CheckCircle, AlertCircle, Bot, ArrowRight, Eye } from "lucide-react";
import { LOG_TYPES } from "../../constants";

export const LogEntry = ({ log, index, onAgentOutputClick }) => {
  const logConfig = {
    [LOG_TYPES.INFO]: {
      color: "bg-blue-500/10 border-l-blue-500 text-blue-300",
      icon: <Info className="w-3 h-3" />,
    },
    [LOG_TYPES.SUCCESS]: {
      color: "bg-green-500/10 border-l-green-500 text-green-300",
      icon: <CheckCircle className="w-3 h-3" />,
    },
    [LOG_TYPES.ERROR]: {
      color: "bg-red-500/10 border-l-red-500 text-red-300",
      icon: <AlertCircle className="w-3 h-3" />,
    },
    [LOG_TYPES.WARNING]: {
      color: "bg-yellow-500/10 border-l-yellow-500 text-yellow-300",
      icon: <AlertCircle className="w-3 h-3" />,
    },
  };

  const config = logConfig[log.type] || logConfig[LOG_TYPES.INFO];

  const renderMetadata = () => {
    if (!log.metadata) return null;

    const { agent, role, type, inputLength, outputLength, isLast, fromAgent, toAgent } = log.metadata;

    switch (type) {
      case 'agent_start':
        return (
          <div className="mt-2 p-2 bg-blue-500/10 rounded border border-blue-500/20">
            <div className="flex items-center gap-2 text-xs text-blue-300">
              <Bot className="w-3 h-3" />
              <span className="font-medium">{agent}</span>
              <span className="text-blue-400">({role})</span>
            </div>
          </div>
        );

      case 'agent_processing':
        return (
          <div className="mt-2 p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
            <div className="flex items-center gap-2 text-xs text-yellow-300">
              <Bot className="w-3 h-3" />
              <span className="font-medium">{agent}</span>
              <span className="text-yellow-400">
                Processing input ({inputLength} chars)
              </span>
            </div>
          </div>
        );

      case 'agent_completed':
        return (
          <div className="mt-2 p-2 bg-green-500/10 rounded border border-green-500/20">
            <div className="flex items-center justify-between text-xs text-green-300">
              <div className="flex items-center gap-2">
                <Bot className="w-3 h-3" />
                <span className="font-medium">{agent}</span>
                <span className="text-green-400">
                  Completed ({outputLength} chars) {isLast ? "(Final Agent)" : ""}
                </span>
              </div>
              {onAgentOutputClick && (
                <button
                  onClick={() => onAgentOutputClick(
                    agent, 
                    log.agentOutput || "No output available",
                    log.agentInput || "No input available"
                  )}
                  className="flex items-center gap-1 px-2 py-1 bg-green-500/20 hover:bg-green-500/30 rounded text-green-300 hover:text-green-200 transition-colors"
                  title="View agent input/output"
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-xs">View Details</span>
                </button>
              )}
            </div>
          </div>
        );

      case 'agent_handoff':
        return (
          <div className="mt-2 p-2 bg-purple-500/10 rounded border border-purple-500/20">
            <div className="flex items-center gap-2 text-xs text-purple-300">
              <ArrowRight className="w-3 h-3" />
              <span className="font-medium">{fromAgent}</span>
              <span className="text-purple-400">→</span>
              <span className="font-medium">{toAgent}</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`mb-3 p-3 rounded-lg border-l-2 transition-all duration-200 ${config.color}`}
    >
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
        <div className="flex items-center gap-2">
          {config.icon}
          <span className="font-mono">{log.timestamp}</span>
        </div>
        <span className="opacity-50">#{index + 1}</span>
      </div>
      <div className="text-sm font-medium">{log.message}</div>
      {renderMetadata()}
    </div>
  );
};
