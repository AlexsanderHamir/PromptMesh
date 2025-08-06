import { Bot, Plus, X } from "lucide-react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";

export const AgentConfiguration = ({
  agents,
  errors,
  onShowAddAgent,
  onRemoveAgent,
}) => (
  <Card
    title="Agent Configuration"
    subtitle={`Configure the AI agents that will process your pipeline ${
      agents.length > 0 ? `(${agents.length} configured)` : ""
    }`}
    icon={<Bot className="w-5 h-5" />}
  >
    <div className="flex justify-between items-center mb-6">
      <div>
        {errors.agents && (
          <p className="text-red-400 text-sm">{errors.agents}</p>
        )}
      </div>
      <Button onClick={onShowAddAgent}>
        <Plus className="w-4 h-4" />
        Add Agent
      </Button>
    </div>

    {agents.length === 0 ? (
      <div className="text-center py-12 text-slate-400">
        <div className="bg-slate-700/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Bot className="w-8 h-8" />
        </div>
        <p className="font-medium mb-1">No agents configured</p>
        <p className="text-sm">Add agents to process your pipeline</p>
      </div>
    ) : (
      <div className="space-y-4">
        {agents.map((agent, index) => (
          <div
            key={agent.id}
            className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 flex items-center gap-4"
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white w-10 h-10 rounded-lg flex items-center justify-center font-semibold">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-100 mb-1">
                {agent.name}
              </h4>
              <p className="text-slate-400 text-sm">
                {agent.role} • {agent.provider}
                {agent.model && ` • ${agent.model}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-slate-700 px-3 py-1 rounded-full text-xs font-medium">
                {agent.provider}
              </span>
              <Button
                variant="danger"
                size="sm"
                onClick={() => onRemoveAgent(agent.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    )}
  </Card>
);
