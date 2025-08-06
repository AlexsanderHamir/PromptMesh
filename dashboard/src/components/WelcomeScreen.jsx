import { Plus, Zap } from "lucide-react";
import { Button } from "./ui/Button";

export const WelcomeScreen = ({ onCreateNewPipeline }) => (
  <div className="flex-1 flex items-center justify-center p-8">
    <div className="text-center max-w-md">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
        <Zap className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-3xl font-bold text-slate-100 mb-4">
        Welcome to PromptMesh
      </h2>
      <p className="text-slate-400 mb-8 leading-relaxed">
        Create and orchestrate powerful AI agent pipelines. Chain together
        specialized agents to process complex workflows and deliver
        sophisticated results.
      </p>
      <Button size="lg" onClick={onCreateNewPipeline}>
        <Plus className="w-5 h-5" />
        Create Your First Pipeline
      </Button>
    </div>
  </div>
);
