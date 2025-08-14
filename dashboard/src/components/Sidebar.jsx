import {
  Bot,
  Trash2,
  RotateCcw,
  Search,
  GitBranch,
  Workflow,
} from "lucide-react";
import { StatusBadge } from "./ui/StatusBadge";
import { Button } from "./ui/Button";
import { formatDate } from "../utils";
import { PIPELINE_STATUS } from "../constants";
import { WORKFLOW_STATUS } from "../types/workflow";
import { useState, useMemo } from "react";

export const Sidebar = ({
  pipelines,
  workflows = [],
  currentPipeline,
  currentWorkflow,
  onSelectPipeline,
  onSelectWorkflow,
  onDeletePipeline,
  onDeleteWorkflow,
  onResetPipelineStatus,
  onCreateWorkflow,
  view = "pipelines", // 'pipelines' or 'workflows'
  onViewChange,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter pipelines based on search term
  const filteredPipelines = useMemo(() => {
    if (!searchTerm.trim()) {
      return pipelines;
    }

    return pipelines.filter((pipeline) =>
      pipeline.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pipelines, searchTerm]);

  // Filter workflows based on search term
  const filteredWorkflows = useMemo(() => {
    if (!searchTerm.trim()) {
      return workflows;
    }

    return workflows.filter(
      (workflow) =>
        workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workflow.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [workflows, searchTerm]);

  const currentItems =
    view === "pipelines" ? filteredPipelines : filteredWorkflows;
  const currentItem = view === "pipelines" ? currentPipeline : currentWorkflow;

  return (
    <aside className="w-80 bg-slate-900/50 backdrop-blur border-r border-slate-700/50 overflow-y-auto">
      {/* View Toggle */}
      <div className="px-6 py-4 border-b border-slate-700/50">
        <div className="flex gap-2 mb-4">
          <Button
            variant={view === "pipelines" ? "primary" : "ghost"}
            size="sm"
            onClick={() => onViewChange("pipelines")}
            className="flex-1"
          >
            <Bot className="w-4 h-4 mr-2" />
            Pipelines
          </Button>
          <Button
            variant={view === "workflows" ? "primary" : "ghost"}
            size="sm"
            onClick={() => onViewChange("workflows")}
            className="flex-1"
          >
            <Workflow className="w-4 h-4 mr-2" />
            Workflows
          </Button>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {view === "pipelines" ? "Pipelines" : "Workflows"}
          </h2>
          <div className="flex items-center gap-2">
            <span className="bg-slate-700 px-2 py-1 rounded-full text-xs font-medium">
              {currentItems.length}
            </span>
            {view === "workflows" && (
              <Button
                onClick={onCreateWorkflow}
                variant="success"
                size="sm"
                className="ml-2"
              >
                <GitBranch className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${view}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 
              transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
              hover:border-slate-500"
          />
        </div>
      </div>

      <div className="p-4">
        {currentItems.length === 0 ? (
          <div className="text-center py-12">
            {searchTerm.trim() ? (
              <>
                <div className="bg-slate-800/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-300 font-medium mb-1">
                  No matching {view}
                </p>
                <p className="text-slate-400 text-sm">
                  Try adjusting your search terms
                </p>
              </>
            ) : (
              <>
                <div className="bg-slate-800/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  {view === "pipelines" ? (
                    <Bot className="w-8 h-8 text-slate-400" />
                  ) : (
                    <Workflow className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <p className="text-slate-300 font-medium mb-1">No {view} yet</p>
                <p className="text-slate-400 text-sm">
                  {view === "pipelines"
                    ? "Create your first AI agent pipeline"
                    : "Create your first workflow to connect pipelines"}
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {view === "pipelines"
              ? // Pipeline Items
                filteredPipelines.map((pipeline) => {
                  const canResetStatus =
                    pipeline.status !== PIPELINE_STATUS.IDLE &&
                    pipeline.status !== PIPELINE_STATUS.RUNNING;

                  return (
                    <div
                      key={pipeline.id}
                      onClick={() => onSelectPipeline(pipeline)}
                      className={`group bg-slate-800/30 border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:bg-slate-700/30 hover:border-blue-500/50 hover:shadow-lg hover:-translate-y-0.5 ${
                        currentPipeline?.id === pipeline.id
                          ? "border-blue-500 bg-blue-500/10 shadow-blue-500/25 shadow-lg"
                          : "border-slate-700"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-100 group-hover:text-white transition-colors">
                            {pipeline.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={pipeline.status} />
                          {canResetStatus && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onResetPipelineStatus(pipeline.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Reset pipeline status to idle"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePipeline(pipeline.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete pipeline"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-slate-400 text-xs">
                        <div className="flex items-center gap-2">
                          <Bot className="w-3 h-3" />
                          <span>{pipeline.agents.length} agents</span>
                        </div>
                        <span>{formatDate(pipeline.createdAt)}</span>
                      </div>
                    </div>
                  );
                })
              : // Workflow Items
                filteredWorkflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    onClick={() => onSelectWorkflow(workflow)}
                    className={`group bg-slate-800/30 border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:bg-slate-700/30 hover:border-blue-500/50 hover:shadow-lg hover:-translate-y-0.5 ${
                      currentWorkflow?.id === workflow.id
                        ? "border-blue-500 bg-blue-500/10 shadow-blue-500/25 shadow-lg"
                        : "border-slate-700"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-100 group-hover:text-white transition-colors">
                          {workflow.name}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                          {workflow.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={workflow.status} />
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteWorkflow(workflow.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete workflow"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-slate-400 text-xs">
                      <div className="flex items-center gap-2">
                        <Workflow className="w-3 h-3" />
                        <span>{workflow.pipelines.length} pipelines</span>
                      </div>
                      <span>{formatDate(workflow.createdAt)}</span>
                    </div>
                  </div>
                ))}
          </div>
        )}
      </div>
    </aside>
  );
};
