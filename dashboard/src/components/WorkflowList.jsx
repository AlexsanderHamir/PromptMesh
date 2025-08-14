import { useState } from "react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import {
  Plus,
  Play,
  Edit,
  Trash2,
  Eye,
  GitBranch,
  Clock,
  CheckCircle,
  AlertCircle,
  PlayCircle,
} from "lucide-react";
import { WORKFLOW_STATUS, WORKFLOW_TYPES } from "../types/workflow";

export const WorkflowList = ({
  workflows,
  pipelines,
  onCreateWorkflow,
  onSelectWorkflow,
  onRunWorkflow,
  onEditWorkflow,
  onDeleteWorkflow,
  onViewWorkflow,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Filter workflows based on search and status
  const filteredWorkflows = workflows.filter((workflow) => {
    const matchesSearch =
      workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || workflow.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Get pipeline count for a workflow
  const getPipelineCount = (workflow) => {
    return workflow.pipelines.length;
  };

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
        return <PlayCircle className="w-4 h-4" />;
      case WORKFLOW_STATUS.COMPLETED:
        return <CheckCircle className="w-4 h-4" />;
      case WORKFLOW_STATUS.ERROR:
        return <AlertCircle className="w-4 h-4" />;
      case WORKFLOW_STATUS.PAUSED:
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Get workflow type label
  const getWorkflowTypeLabel = (type) => {
    switch (type) {
      case WORKFLOW_TYPES.LINEAR:
        return "Linear Chain";
      case WORKFLOW_TYPES.PARALLEL:
        return "Parallel";
      case WORKFLOW_TYPES.CONDITIONAL:
        return "Conditional";
      case WORKFLOW_TYPES.LOOP:
        return "Loop";
      default:
        return "Unknown";
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-200">Workflows</h1>
          <p className="text-slate-400">
            Connect pipelines to create powerful AI workflows
          </p>
        </div>
        <Button onClick={onCreateWorkflow} variant="success">
          <Plus className="w-4 h-4" />
          New Workflow
        </Button>
      </div>

      {/* Search and Filters */}
      <Card
        title="Search & Filters"
        subtitle="Find your workflows"
        icon={<GitBranch className="w-5 h-5" />}
      >
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value={WORKFLOW_STATUS.IDLE}>Idle</option>
            <option value={WORKFLOW_STATUS.RUNNING}>Running</option>
            <option value={WORKFLOW_STATUS.COMPLETED}>Completed</option>
            <option value={WORKFLOW_STATUS.ERROR}>Error</option>
            <option value={WORKFLOW_STATUS.PAUSED}>Paused</option>
          </select>
        </div>
      </Card>

      {/* Workflow Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorkflows.map((workflow) => (
          <Card
            key={workflow.id}
            title={workflow.name}
            subtitle={workflow.description}
            icon={<GitBranch className="w-5 h-5" />}
          >
            <div className="space-y-4">
              {/* Workflow Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Type:</span>
                  <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                    {getWorkflowTypeLabel(workflow.type)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Pipelines:</span>
                  <span className="text-xs px-2 py-1 bg-slate-500/20 text-slate-300 rounded">
                    {getPipelineCount(workflow)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Connections:</span>
                  <span className="text-xs px-2 py-1 bg-slate-500/20 text-slate-300 rounded">
                    {workflow.connections.length}
                  </span>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <div className={`${getStatusColor(workflow.status)}`}>
                  {getStatusIcon(workflow.status)}
                </div>
                <span
                  className={`text-sm font-medium ${getStatusColor(
                    workflow.status
                  )}`}
                >
                  {workflow.status.charAt(0).toUpperCase() +
                    workflow.status.slice(1)}
                </span>
              </div>

              {/* Last Execution */}
              {workflow.lastExecutionDate && (
                <div className="text-xs text-slate-400">
                  Last run: {formatDate(workflow.lastExecutionDate)}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => onSelectWorkflow(workflow)}
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>

                <Button
                  onClick={() => onRunWorkflow(workflow)}
                  variant="success"
                  size="sm"
                  disabled={workflow.status === WORKFLOW_STATUS.RUNNING}
                  className="flex-1"
                >
                  <Play className="w-4 h-4" />
                  Run
                </Button>

                {workflow.lastExecutionResult && (
                  <Button
                    onClick={() => onViewWorkflow(workflow)}
                    variant="ghost"
                    size="sm"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}

                <Button
                  onClick={() => onDeleteWorkflow(workflow)}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredWorkflows.length === 0 && (
        <Card
          title="No Workflows Found"
          subtitle="Create your first workflow"
          icon={<GitBranch className="w-5 h-5" />}
        >
          <div className="text-center py-12">
            <GitBranch className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <h3 className="text-lg font-medium text-slate-200 mb-2">
              {workflows.length === 0
                ? "No workflows yet"
                : "No matching workflows"}
            </h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              {workflows.length === 0
                ? "Create your first workflow to connect pipelines and build powerful AI processing chains."
                : "Try adjusting your search terms or filters to find what you're looking for."}
            </p>
            {workflows.length === 0 && (
              <Button onClick={onCreateWorkflow} variant="success">
                <Plus className="w-4 h-4" />
                Create First Workflow
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Statistics */}
      {workflows.length > 0 && (
        <Card
          title="Workflow Statistics"
          subtitle="Overview of your workflows"
          icon={<GitBranch className="w-5 h-5" />}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-800/50 rounded-lg">
              <div className="text-2xl font-bold text-slate-200">
                {workflows.length}
              </div>
              <div className="text-sm text-slate-400">Total</div>
            </div>
            <div className="text-center p-4 bg-blue-500/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">
                {
                  workflows.filter((w) => w.status === WORKFLOW_STATUS.RUNNING)
                    .length
                }
              </div>
              <div className="text-sm text-blue-400">Running</div>
            </div>
            <div className="text-center p-4 bg-green-500/20 rounded-lg">
              <div className="text-2xl font-bold text-green-400">
                {
                  workflows.filter(
                    (w) => w.status === WORKFLOW_STATUS.COMPLETED
                  ).length
                }
              </div>
              <div className="text-sm text-green-400">Completed</div>
            </div>
            <div className="text-center p-4 bg-red-500/20 rounded-lg">
              <div className="text-2xl font-bold text-red-400">
                {
                  workflows.filter((w) => w.status === WORKFLOW_STATUS.ERROR)
                    .length
                }
              </div>
              <div className="text-sm text-red-400">Errors</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
