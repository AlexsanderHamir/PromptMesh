import React, { useState, useMemo } from 'react';
import {
  Bot,
  Trash2,
  RotateCcw,
  Search,
} from "lucide-react";
import { StatusBadge } from "./ui/StatusBadge";
import { Button } from "./ui/Button";
import { formatDate } from "../utils";
import { Pipeline, PipelineStatus } from "../types";

interface SidebarProps {
  pipelines: Pipeline[];
  currentPipeline: Pipeline | null;
  onSelectPipeline: (pipeline: Pipeline) => void;
  onDeletePipeline: (pipelineId: string) => void;
  onResetPipelineStatus: (pipelineId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  pipelines,
  currentPipeline,
  onSelectPipeline,
  onDeletePipeline,
  onResetPipelineStatus,
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

  return (
    <aside className="w-80 bg-slate-900/50 backdrop-blur border-r border-slate-700/50 overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700/50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Pipelines</h2>
          <div className="flex items-center gap-2">
            <span className="bg-slate-700 px-2 py-1 rounded-full text-xs font-medium">
              {filteredPipelines.length}
            </span>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search pipelines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 
              transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
              hover:border-slate-500"
          />
        </div>
      </div>

      <div className="p-4">
        {filteredPipelines.length === 0 ? (
          <div className="text-center py-12">
            {searchTerm.trim() ? (
              <>
                <div className="bg-slate-800/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-300 font-medium mb-1">
                  No matching pipelines
                </p>
                <p className="text-slate-400 text-sm">
                  Try adjusting your search terms
                </p>
              </>
            ) : (
              <>
                <div className="bg-slate-800/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-300 font-medium mb-1">No pipelines yet</p>
                <p className="text-slate-400 text-sm">
                  Create your first AI agent pipeline
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPipelines.map((pipeline) => {
              const canResetStatus =
                pipeline.status !== PipelineStatus.IDLE &&
                pipeline.status !== PipelineStatus.RUNNING;

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
            })}
          </div>
        )}
      </div>
    </aside>
  );
};
