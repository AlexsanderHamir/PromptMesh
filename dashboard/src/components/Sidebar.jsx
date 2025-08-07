import { Bot, Trash2 } from "lucide-react";
import { StatusBadge } from "./ui/StatusBadge";
import { Button } from "./ui/Button";
import { formatDate } from "../utils";

export const Sidebar = ({
  pipelines,
  currentPipeline,
  onSelectPipeline,
  onDeletePipeline,
}) => (
  <aside className="w-80 bg-slate-900/50 backdrop-blur border-r border-slate-700/50 overflow-y-auto">
    <div className="px-6 py-6 border-b border-slate-700/50">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Pipelines</h2>
        <span className="bg-slate-700 px-2 py-1 rounded-full text-xs font-medium">
          {pipelines.length}
        </span>
      </div>
    </div>

    <div className="p-4">
      {pipelines.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-slate-800/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-300 font-medium mb-1">No pipelines yet</p>
          <p className="text-slate-400 text-sm">
            Create your first AI agent pipeline
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pipelines.map((pipeline) => (
            <div
              key={pipeline.id}
              className={`group bg-slate-800/30 border rounded-xl p-4 transition-all duration-200 hover:bg-slate-700/30 hover:border-blue-500/50 hover:shadow-lg hover:-translate-y-0.5 ${
                currentPipeline?.id === pipeline.id
                  ? "border-blue-500 bg-blue-500/10 shadow-blue-500/25 shadow-lg"
                  : "border-slate-700"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => onSelectPipeline(pipeline)}
                >
                  <h3 className="font-semibold text-slate-100 group-hover:text-white transition-colors">
                    {pipeline.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={pipeline.status} />
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
              <div
                className="flex justify-between items-center text-slate-400 text-xs cursor-pointer"
                onClick={() => onSelectPipeline(pipeline)}
              >
                <div className="flex items-center gap-2">
                  <Bot className="w-3 h-3" />
                  <span>{pipeline.agents.length} agents</span>
                </div>
                <span>{formatDate(pipeline.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </aside>
);
