import {
  TrendingUp,
  User,
  Bot,
  ArrowRight,
  Zap,
  Radio,
  Eye,
} from "lucide-react";
import { useState } from "react";
import { Card } from "./ui/Card";
import { ProgressBar } from "./ui/ProgressBar";
import { LogEntry } from "./ui/LogEntry";
import { AgentOutputModal } from "./ui/AgentOutputModal";

export const ExecutionMonitor = ({
  progress,
  logs,
  currentAgent,
  agentProgress,
  isStreaming = true,
}) => {
  const [selectedAgentOutput, setSelectedAgentOutput] = useState(null);
  const [isOutputModalOpen, setIsOutputModalOpen] = useState(false);

  const handleAgentOutputClick = (agentName, agentOutput, agentInput) => {
    setSelectedAgentOutput({ agentName, agentOutput, agentInput });
    setIsOutputModalOpen(true);
  };

  const closeOutputModal = () => {
    setIsOutputModalOpen(false);
    setSelectedAgentOutput(null);
  };

  const getAgentIcon = (log) => {
    if (
      log.metadata?.type === "agent_start" ||
      log.metadata?.type === "agent_processing"
    ) {
      return <Bot className="w-4 h-4 text-blue-400" />;
    } else if (log.metadata?.type === "agent_handoff") {
      return <ArrowRight className="w-4 h-4 text-yellow-400" />;
    } else if (log.metadata?.type === "agent_completed") {
      return <Bot className="w-4 h-4 text-green-400" />;
    }
    return null;
  };

  const getAgentStatus = (agentName) => {
    const status = agentProgress[agentName];
    if (!status) return null;

    const statusColors = {
      started: "text-blue-400",
      processing: "text-yellow-400",
      completed: "text-green-400",
      error: "text-red-400",
    };

    const statusText = {
      started: "Started",
      processing: "Processing...",
      completed: "Completed",
      error: "Error",
    };

    return (
      <div className="flex items-center gap-2 text-sm">
        <span className={`${statusColors[status.status]}`}>
          {statusText[status.status]}
        </span>
        {status.status === "processing" && (
          <div className="w-16">
            <ProgressBar progress={status.progress} className="h-1" />
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Card
        title="Execution Monitor"
        subtitle={`Pipeline progress: ${progress.toFixed(0)}%`}
        icon={<TrendingUp className="w-5 h-5" />}
      >
        {/* Streaming Status Indicator */}
        {isStreaming && (
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-blue-300">
              <div className="animate-pulse">
                <Radio className="w-4 h-4" />
              </div>
              <span className="font-medium">Live Streaming Enabled</span>
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-blue-200">Real-time agent updates</span>
            </div>
          </div>
        )}

        <div className="mb-6">
          <ProgressBar progress={progress} className="w-full" />
        </div>

        {/* Current Agent Status */}
        {currentAgent && (
          <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-blue-300">
              <div className="animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <span className="font-medium">Currently Active:</span>
              <span className="text-blue-200">{currentAgent}</span>
            </div>
          </div>
        )}

        {/* Agent Progress Overview */}
        {Object.keys(agentProgress).length > 0 && (
          <div className="mb-4 p-3 bg-slate-800/50 rounded-lg">
            <h4 className="text-sm font-medium text-slate-300 mb-2">
              Agent Progress
            </h4>
            <div className="space-y-2">
              {Object.entries(agentProgress).map(([agentName, status]) => {
                // Find the log entry for this agent to get the output
                const agentLog = logs.find(
                  (log) =>
                    log.metadata?.agent === agentName &&
                    log.metadata?.type === "agent_completed"
                );
                const hasOutput = agentLog?.metadata?.agentOutput;

                return (
                  <div
                    key={agentName}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Bot className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-300">{agentName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getAgentStatus(agentName)}
                      {status.status === "completed" && hasOutput && (
                        <button
                          onClick={() => {
                            const agentLog = logs.find(
                              (log) =>
                                log.metadata?.agent === agentName &&
                                log.metadata?.type === "agent_completed"
                            );
                            const agentInputLog = logs.find(
                              (log) =>
                                log.metadata?.agent === agentName &&
                                log.metadata?.type === "agent_processing"
                            );
                            handleAgentOutputClick(
                              agentName,
                              hasOutput,
                              agentInputLog?.metadata?.agentInput
                            );
                          }}
                          className="flex items-center gap-1 px-2 py-1 bg-green-500/20 hover:bg-green-500/30 rounded text-green-300 hover:text-green-200 transition-colors text-xs"
                          title="View agent input/output"
                        >
                          <Eye className="w-3 h-3" />
                          Details
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-slate-900/50 rounded-lg p-4 h-80 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400">
              <div className="text-center">
                <div className="animate-pulse mb-4">⏳</div>
                <p>Execution logs will appear here...</p>
                {isStreaming && (
                  <p className="text-xs text-slate-500 mt-2">
                    Live updates will stream here as agents work
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log, index) => (
                <div key={index} className="flex items-start gap-2">
                  {getAgentIcon(log)}
                  <LogEntry
                    log={log}
                    index={index}
                    onAgentOutputClick={handleAgentOutputClick}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Agent Output Modal */}
      <AgentOutputModal
        isOpen={isOutputModalOpen}
        onClose={closeOutputModal}
        agentName={selectedAgentOutput?.agentName}
        agentOutput={selectedAgentOutput?.agentOutput}
      />
    </>
  );
};
