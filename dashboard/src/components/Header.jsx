import { Plus, Zap } from "lucide-react";
import { Button } from "./ui/Button";

export const Header = ({ onCreateNewPipeline }) => (
  <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 px-8 py-4">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-2 rounded-lg">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            PromptMesh
          </h1>
          <p className="text-xs text-slate-400">AI Pipeline Orchestration</p>
        </div>
      </div>
      <div className="flex gap-3 items-center">
        <Button onClick={onCreateNewPipeline}>
          <Plus className="w-4 h-4" />
          New Pipeline
        </Button>
      </div>
    </div>
  </header>
);
