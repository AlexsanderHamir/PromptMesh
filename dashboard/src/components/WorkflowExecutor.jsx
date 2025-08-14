import { useState, useEffect } from "react";
import { Card } from "./ui/Card";
import { ProgressBar } from "./ui/ProgressBar";
import { Button } from "./ui/Button";
import {
  Play,
  Pause,
  Square,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Clock,
  GitBranch,
  Bot,
} from "lucide-react";
import { WORKFLOW_STATUS } from "../types/workflow";

export const WorkflowExecutor = ({
  workflow,
  workflowExecution,
  pipelines,
  onPauseWorkflow,
  onResumeWorkflow,
  onStopWorkflow,
  onBackToBuilder,
}) => {
  const [currentPipelineId, setCurrentPipelineId] = useState(null);

  // Get pipeline by ID
  const getPipeline = (id) => {
    return pipelines.find((p) => p.id === id);
  };

  // Get current pipeline
  const currentPipeline = currentPipelineId
    ? getPipeline(currentPipelineId)
    : null;

  // Get execution order
  const executionOrder = workflow.getExecutionOrder();
  const currentIndex = workflowExecution.currentPipelineIndex;
  const totalPipelines = executionOrder.length;

  // Update current pipeline when execution changes
  useEffect(() => {
    if (
      workflowExecution &&
      workflowExecution.status === WORKFLOW_STATUS.RUNNING
    ) {
      const currentPipelineId = workflowExecution.getCurrentPipeline();
      setCurrentPipelineId(currentPipelineId);
    }
  }, [workflowExecution]);

  // Get workflow status color
  const getStatusColor = (status) => {
    switch (status) {
      case WORKFLOW_STATUS.RUNNING:
        return "text-blue-400";
      case WORKFLOW_STATUS.COMPLETED:
        return "text-green-400";
      case WORKFLOW_STATUS.ERROR:
        return "text-red-400";
      case WORKFLOW_STATUS.PAUSED:
        return "text-yellow-400";
      default:
        return "text-slate-400";
    }
  };

  // Get workflow status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case WORKFLOW_STATUS.RUNNING:
        return <Play className="w-4 h-4" />;
      case WORKFLOW_STATUS.COMPLETED:
        return <CheckCircle className="w-4 h-4" />;
      case WORKFLOW_STATUS.ERROR:
        return <AlertCircle className="w-4 h-4" />;
      case WORKFLOW_STATUS.PAUSED:
        return <Pause className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Get pipeline status
  const getPipelineStatus = (pipelineId) => {
    if (workflowExecution.pipelineResults[pipelineId]) {
      return "completed";
    }
    if (pipelineId === currentPipelineId) {
      return "running";
    }
    if (executionOrder.indexOf(pipelineId) < currentIndex) {
      return "completed";
    }
    return "pending";
  };

  // Get pipeline status color
  const getPipelineStatusColor = (status) => {
    switch (status) {
      case "running":
        return "text-blue-400";
      case "completed":
        return "text-green-400";
      case "pending":
        return "text-slate-400";
      default:
        return "text-slate-400";
    }
  };

  // Get pipeline status icon
  const getPipelineStatusIcon = (status) => {
    switch (status) {
      case "running":
        return <Play className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Workflow Status */}
      <Card
        title="Workflow Execution"
        subtitle={`${workflow.name} - ${workflow.description}`}
        icon={<GitBranch className="w-5 h-5" />}
      >
        <div className="space-y-4">
          {/* Overall Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-300">
                Overall Progress
              </span>
              <span className="text-sm text-slate-400">
                {currentIndex} / {totalPipelines} pipelines
              </span>
            </div>
            <ProgressBar
              progress={workflowExecution.getProgress()}
              className="w-full"
            />
          </div>

          {/* Workflow Status */}
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${getStatusColor(
                workflowExecution.status
              )}`}
            >
              {getStatusIcon(workflowExecution.status)}
            </div>
            <div>
              <span
                className={`font-medium ${getStatusColor(
                  workflowExecution.status
                )}`}
              >
                {workflowExecution.status.charAt(0).toUpperCase() +
                  workflowExecution.status.slice(1)}
              </span>
              {workflowExecution.startTime && (
                <p className="text-sm text-slate-400">
                  Started:{" "}
                  {new Date(workflowExecution.startTime).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          {/* Execution Controls */}
          <div className="flex gap-3">
            {workflowExecution.status === WORKFLOW_STATUS.RUNNING && (
              <>
                <Button onClick={onPauseWorkflow} variant="secondary" size="sm">
                  <Pause className="w-4 h-4" />
                  Pause
                </Button>
                <Button
                  onClick={onStopWorkflow}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300"
                >
                  <Square className="w-4 h-4" />
                  Stop
                </Button>
              </>
            )}

            {workflowExecution.status === WORKFLOW_STATUS.PAUSED && (
              <Button onClick={onResumeWorkflow} variant="success" size="sm">
                <Play className="w-4 h-4" />
                Resume
              </Button>
            )}

            <Button onClick={onBackToBuilder} variant="ghost" size="sm">
              ← Back to Builder
            </Button>
          </div>
        </div>
      </Card>

      {/* Pipeline Execution Status */}
      <Card
        title="Pipeline Execution Status"
        subtitle="Monitor individual pipeline progress"
        icon={<GitBranch className="w-5 h-5" />}
      >
        <div className="space-y-4">
          {executionOrder.map((pipelineId, index) => {
            const pipeline = getPipeline(pipelineId);
            const status = getPipelineStatus(pipelineId);
            const isCurrent = pipelineId === currentPipelineId;
            const isCompleted = workflowExecution.pipelineResults[pipelineId];

            if (!pipeline) return null;

            return (
              <div
                key={pipelineId}
                className={`p-4 rounded-lg border transition-all ${
                  isCurrent
                    ? "bg-blue-500/10 border-blue-500/30"
                    : "bg-slate-800/50 border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${getPipelineStatusColor(
                        status
                      )}`}
                    >
                      {getPipelineStatusIcon(status)}
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-200">
                        {index + 1}. {pipeline.name}
                      </h4>
                      <p className="text-sm text-slate-400">
                        {pipeline.agents?.length || 0} agents
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCurrent && (
                      <div className="flex items-center gap-2 text-blue-400">
                        <Bot className="w-4 h-4 animate-pulse" />
                        <span className="text-sm">Running...</span>
                      </div>
                    )}
                    {isCompleted && (
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Completed</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pipeline Progress */}
                {isCurrent && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">
                        Pipeline Progress
                      </span>
                      <span className="text-xs text-slate-400">
                        {/* pipelineProgress[pipelineId] || 0 */}
                        0%
                      </span>
                    </div>
                    <ProgressBar
                      progress={/* pipelineProgress[pipelineId] || 0 */ 0}
                      className="h-2"
                    />
                  </div>
                )}

                {/* Pipeline Result Preview */}
                {isCompleted &&
                  workflowExecution.pipelineResults[pipelineId] && (
                    <div className="mt-3 p-3 bg-green-500/10 rounded border border-green-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium text-green-400">
                          Result
                        </span>
                      </div>
                      <div className="text-sm text-slate-300">
                        {workflowExecution.pipelineResults[
                          pipelineId
                        ].substring(0, 100)}
                        {workflowExecution.pipelineResults[pipelineId].length >
                          100 && "..."}
                      </div>
                    </div>
                  )}

                {/* Execution Arrow */}
                {index < executionOrder.length - 1 && (
                  <div className="flex justify-center mt-3">
                    <ArrowRight className="w-5 h-5 text-slate-500" />
                  </div>
                )}
              </div>
            );
          })}

          {executionOrder.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No pipelines in workflow</p>
            </div>
          )}
        </div>
      </Card>

      {/* Current Pipeline Details */}
      {currentPipeline && (
        <Card
          title="Current Pipeline"
          subtitle={`Executing: ${currentPipeline.name}`}
          icon={<Bot className="w-5 h-5" />}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <GitBranch className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-slate-200">
                  {currentPipeline.name}
                </h4>
                <p className="text-sm text-slate-400">
                  {currentPipeline.agents?.length || 0} agents processing...
                </p>
              </div>
            </div>

            {/* Agent Status */}
            {currentPipeline.agents?.map((agent, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg"
              >
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Bot className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-slate-200">{agent.name}</h5>
                  <p className="text-sm text-slate-400">{agent.role}</p>
                </div>
                <div className="text-blue-400 text-sm">Processing...</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Workflow Results */}
      {workflowExecution.status === WORKFLOW_STATUS.COMPLETED && (
        <Card
          title="Workflow Results"
          subtitle="Final output from your workflow"
          icon={<CheckCircle className="w-5 h-5" />}
        >
          <div className="space-y-4">
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="font-medium text-green-400">
                  Workflow Completed Successfully!
                </span>
              </div>
              <p className="text-sm text-slate-300">
                Execution time:{" "}
                {workflowExecution.startTime && workflowExecution.endTime
                  ? `${Math.round(
                      (new Date(workflowExecution.endTime) -
                        new Date(workflowExecution.startTime)) /
                        1000
                    )}s`
                  : "Unknown"}
              </p>
            </div>

            {workflowExecution.pipelineResults["final"] && (
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">
                  Final Result:
                </h4>
                <div className="p-3 bg-slate-900 rounded border border-slate-600">
                  <pre className="text-slate-200 text-sm whitespace-pre-wrap">
                    {workflowExecution.pipelineResults["final"]}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Workflow Error */}
      {workflowExecution.status === WORKFLOW_STATUS.ERROR && (
        <Card
          title="Workflow Error"
          subtitle="Execution failed"
          icon={<AlertCircle className="w-5 h-5" />}
        >
          <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="font-medium text-red-400">Execution Failed</span>
            </div>
            <p className="text-sm text-slate-300">
              {workflowExecution.error || "Unknown error occurred"}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
