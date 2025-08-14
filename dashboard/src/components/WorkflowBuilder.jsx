import { useState, useCallback, useMemo } from "react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { FormInput, FormTextarea } from "./ui/FormControls";
import {
  Plus,
  Trash2,
  Link,
  Unlink,
  Play,
  Save,
  Eye,
  ArrowRight,
  Bot,
  GitBranch,
  AlertCircle,
} from "lucide-react";
import {
  Workflow,
  PipelineConnection,
  WORKFLOW_TYPES,
} from "../types/workflow";

export const WorkflowBuilder = ({
  workflow,
  pipelines,
  onWorkflowChange,
  onSaveWorkflow,
  onRunWorkflow,
  onViewWorkflow,
  isRunning = false,
  isSaved = false,
  onFormChange,
}) => {
  const [connectionMode, setConnectionMode] = useState(false);
  const [connectionStart, setConnectionStart] = useState(null);
  const [newPipelineId, setNewPipelineId] = useState("");

  // Available pipelines that can be added
  const availablePipelines = useMemo(() => {
    return pipelines.filter((p) => !workflow.pipelines.includes(p.id));
  }, [pipelines, workflow.pipelines]);

  // Get pipeline by ID
  const getPipeline = useCallback(
    (id) => {
      return pipelines.find((p) => p.id === id);
    },
    [pipelines]
  );

  // Add pipeline to workflow
  const handleAddPipeline = useCallback(() => {
    if (newPipelineId && !workflow.pipelines.includes(newPipelineId)) {
      const updatedWorkflow = workflow.clone();
      updatedWorkflow.addPipeline(newPipelineId);
      onWorkflowChange(updatedWorkflow);
      setNewPipelineId("");
    }
  }, [newPipelineId, workflow, onWorkflowChange]);

  // Remove pipeline from workflow
  const handleRemovePipeline = useCallback(
    (pipelineId) => {
      const updatedWorkflow = workflow.clone();
      updatedWorkflow.removePipeline(pipelineId);
      onWorkflowChange(updatedWorkflow);
    },
    [workflow, onWorkflowChange]
  );

  // Start connection creation
  const handleStartConnection = useCallback((pipelineId, agentIndex = -1) => {
    setConnectionMode(true);
    setConnectionStart({ pipelineId, agentIndex });
  }, []);

  // Complete connection creation
  const handleCompleteConnection = useCallback(
    (toPipelineId, toAgentIndex = 0) => {
      if (connectionStart && connectionStart.pipelineId !== toPipelineId) {
        const connection = new PipelineConnection(
          connectionStart.pipelineId,
          connectionStart.agentIndex,
          toPipelineId,
          toAgentIndex
        );

        const updatedWorkflow = workflow.clone();
        if (updatedWorkflow.addConnection(connection)) {
          onWorkflowChange(updatedWorkflow);
        }
      }

      setConnectionMode(false);
      setConnectionStart(null);
    },
    [connectionStart, workflow, onWorkflowChange]
  );

  // Remove connection
  const handleRemoveConnection = useCallback(
    (connectionId) => {
      const updatedWorkflow = workflow.clone();
      updatedWorkflow.removeConnection(connectionId);
      onWorkflowChange(updatedWorkflow);
    },
    [workflow, onWorkflowChange]
  );

  // Get connection description
  const getConnectionDescription = useCallback(
    (connection) => {
      const fromPipeline = getPipeline(connection.fromPipelineId);
      const toPipeline = getPipeline(connection.toPipelineId);

      const fromDesc =
        connection.fromAgentIndex === -1
          ? `${fromPipeline?.name || "Unknown"} Output`
          : `${fromPipeline?.name || "Unknown"} Agent ${
              connection.fromAgentIndex + 1
            }`;

      const toDesc =
        connection.toAgentIndex === 0
          ? `${toPipeline?.name || "Unknown"} Input`
          : `${toPipeline?.name || "Unknown"} Agent ${connection.toAgentIndex}`;

      return `${fromDesc} → ${toDesc}`;
    },
    [getPipeline]
  );

  // Check if workflow is valid
  const isWorkflowValid = useMemo(() => {
    return workflow.isValid();
  }, [workflow]);

  // Get execution order
  const executionOrder = useMemo(() => {
    try {
      return workflow.getExecutionOrder();
    } catch (error) {
      return [];
    }
  }, [workflow]);

  return (
    <div className="space-y-6">
      {/* Workflow Configuration */}
      <Card
        title="Workflow Configuration"
        subtitle="Define your workflow settings"
        icon={<GitBranch className="w-5 h-5" />}
      >
        <div className="space-y-4">
          <FormInput
            label="Workflow Name"
            value={workflow.name}
            onChange={(e) =>
              onFormChange && onFormChange("name", e.target.value)
            }
            placeholder="My AI Workflow"
            required
          />

          <FormTextarea
            label="Description"
            value={workflow.description}
            onChange={(e) =>
              onFormChange && onFormChange("description", e.target.value)
            }
            placeholder="Describe what this workflow does..."
            rows={3}
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Workflow Type
            </label>
            <select
              value={workflow.type}
              onChange={(e) =>
                onFormChange && onFormChange("type", e.target.value)
              }
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={WORKFLOW_TYPES.LINEAR}>Linear Chain</option>
              <option value={WORKFLOW_TYPES.PARALLEL}>
                Parallel Execution
              </option>
              <option value={WORKFLOW_TYPES.CONDITIONAL}>
                Conditional Branching
              </option>
              <option value={WORKFLOW_TYPES.LOOP}>Loop Execution</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Pipeline Management */}
      <Card
        title="Pipeline Management"
        subtitle="Add and manage pipelines in your workflow"
        icon={<GitBranch className="w-5 h-5" />}
      >
        <div className="space-y-4">
          {/* Add Pipeline */}
          <div className="flex gap-2">
            <select
              value={newPipelineId}
              onChange={(e) => setNewPipelineId(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a pipeline to add...</option>
              {availablePipelines.map((pipeline) => (
                <option key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </option>
              ))}
            </select>
            <Button
              onClick={handleAddPipeline}
              disabled={!newPipelineId}
              variant="secondary"
            >
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>

          {/* Pipeline List */}
          <div className="space-y-3">
            {workflow.pipelines.map((pipelineId, index) => {
              const pipeline = getPipeline(pipelineId);
              if (!pipeline) return null;

              return (
                <div
                  key={pipelineId}
                  className="p-4 bg-slate-800/50 rounded-lg border border-slate-600"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <GitBranch className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-200">
                          {pipeline.name}
                        </h4>
                        <p className="text-sm text-slate-400">
                          {pipeline.agents?.length || 0} agents
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleRemovePipeline(pipelineId)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Connection Points */}
                  <div className="space-y-2">
                    {/* Input Connections */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-20">
                        Input:
                      </span>
                      <Button
                        onClick={() => handleStartConnection(pipelineId, 0)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-400 hover:text-blue-300"
                        disabled={connectionMode}
                      >
                        <Link className="w-4 h-4" />
                        Connect
                      </Button>
                    </div>

                    {/* Agent Connections */}
                    {pipeline.agents?.map((agent, agentIndex) => (
                      <div key={agentIndex} className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 w-20">
                          Agent {agentIndex + 1}:
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            onClick={() =>
                              handleStartConnection(pipelineId, agentIndex)
                            }
                            variant="ghost"
                            size="sm"
                            className="text-blue-400 hover:text-blue-300"
                            disabled={connectionMode}
                          >
                            <Link className="w-4 h-4" />
                            Connect
                          </Button>
                          <span className="text-xs text-slate-500">→</span>
                          <Button
                            onClick={() =>
                              handleCompleteConnection(
                                pipelineId,
                                agentIndex + 1
                              )
                            }
                            variant="ghost"
                            size="sm"
                            className="text-green-400 hover:text-green-300"
                            disabled={
                              !connectionMode ||
                              connectionStart?.pipelineId === pipelineId
                            }
                          >
                            <Link className="w-4 h-4" />
                            Connect
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Output Connections */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-20">
                        Output:
                      </span>
                      <Button
                        onClick={() => handleCompleteConnection(pipelineId, -1)}
                        variant="ghost"
                        size="sm"
                        className="text-green-400 hover:text-green-300"
                        disabled={
                          !connectionMode ||
                          connectionStart?.pipelineId === pipelineId
                        }
                      >
                        <Link className="w-4 h-4" />
                        Connect
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {workflow.pipelines.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No pipelines added yet</p>
              <p className="text-sm">
                Add pipelines to start building your workflow
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Connections */}
      <Card
        title="Pipeline Connections"
        subtitle="Manage how data flows between pipelines"
        icon={<Link className="w-5 h-5" />}
      >
        <div className="space-y-3">
          {workflow.connections.map((connection) => (
            <div
              key={connection.id}
              className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-600"
            >
              <div className="flex items-center gap-3">
                <ArrowRight className="w-4 h-4 text-blue-400" />
                <span className="text-slate-200">
                  {getConnectionDescription(connection)}
                </span>
              </div>
              <Button
                onClick={() => handleRemoveConnection(connection.id)}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300"
              >
                <Unlink className="w-4 h-4" />
              </Button>
            </div>
          ))}

          {workflow.connections.length === 0 && (
            <div className="text-center py-6 text-slate-400">
              <Link className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No connections yet</p>
              <p className="text-sm">Connect pipelines to define data flow</p>
            </div>
          )}
        </div>
      </Card>

      {/* Workflow Validation */}
      <Card
        title="Workflow Validation"
        subtitle="Check if your workflow is ready to execute"
        icon={<Eye className="w-5 h-5" />}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                isWorkflowValid ? "bg-green-400" : "bg-red-400"
              }`}
            />
            <span
              className={isWorkflowValid ? "text-green-400" : "text-red-400"}
            >
              {isWorkflowValid ? "Workflow is valid" : "Workflow has issues"}
            </span>
          </div>

          {isWorkflowValid && executionOrder.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">
                Execution Order:
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                {executionOrder.map((pipelineId, index) => {
                  const pipeline = getPipeline(pipelineId);
                  return (
                    <div key={pipelineId} className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-blue-500/20 rounded-lg text-blue-300 text-sm">
                        {pipeline?.name || "Unknown"}
                      </div>
                      {index < executionOrder.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!isWorkflowValid && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">
                Workflow contains cycles or invalid connections. Please fix the
                issues before executing.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Workflow Actions */}
      <Card
        title="Workflow Actions"
        subtitle="Save, run, or view your workflow"
        icon={<Play className="w-5 h-5" />}
      >
        <div className="flex gap-4 flex-wrap">
          <Button
            variant="success"
            onClick={onRunWorkflow}
            disabled={
              isRunning || !isWorkflowValid || workflow.pipelines.length === 0
            }
          >
            <Play className="w-4 h-4" />
            {isRunning ? "Running..." : "Run Workflow"}
          </Button>

          <Button
            variant="secondary"
            onClick={onSaveWorkflow}
            disabled={!isWorkflowValid}
          >
            {isSaved ? "Saved" : <Save className="w-4 h-4" />}
            {isSaved ? "Saved" : "Save Workflow"}
          </Button>

          {workflow.lastExecutionResult && (
            <Button variant="secondary" onClick={onViewWorkflow}>
              <Eye className="w-4 h-4" />
              View Results
            </Button>
          )}
        </div>

        {!isWorkflowValid && (
          <p className="text-amber-400 text-sm mt-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Fix workflow validation issues before saving or running
          </p>
        )}

        {workflow.pipelines.length === 0 && (
          <p className="text-amber-400 text-sm mt-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Add at least one pipeline to create a workflow
          </p>
        )}
      </Card>

      {/* Connection Mode Indicator */}
      {connectionMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-600">
            <div className="text-center">
              <Link className="w-12 h-12 mx-auto mb-4 text-blue-400" />
              <h3 className="text-lg font-medium text-slate-200 mb-2">
                Creating Connection
              </h3>
              <p className="text-slate-400 mb-4">
                Click on a pipeline or agent to complete the connection
              </p>
              <Button
                onClick={() => {
                  setConnectionMode(false);
                  setConnectionStart(null);
                }}
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
