import { Plus, Zap, Workflow } from "lucide-react";
import { Button } from "./ui/Button";

export const WelcomeScreen = ({
  onCreateNewPipeline,
  onCreateNewWorkflow,
  hasExistingPipelines = false,
  hasExistingWorkflows = false,
  isLoading = false,
}) => (
  <div className="flex-1 flex items-center justify-center p-8">
    <div className="text-center max-w-md">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
        <Zap className="w-10 h-10 text-white" />
      </div>

      <div className="mb-4">
        <h2 className="text-3xl font-bold text-slate-100 mb-3">
          Welcome to PromptMesh
        </h2>
      </div>

      <div className="mb-6">
        <p className="text-slate-400 mb-8 leading-relaxed">
          Create and orchestrate powerful AI agent pipelines and workflows.
          Chain together specialized agents to process complex workflows and
          deliver sophisticated results.
        </p>
      </div>

      <div className="flex gap-4 justify-center">
        <Button size="lg" onClick={onCreateNewPipeline} disabled={isLoading}>
          <Plus className="w-5 h-5" />
          {isLoading
            ? "Loading..."
            : hasExistingPipelines
            ? "New Pipeline"
            : "First Pipeline"}
        </Button>

        <Button
          size="lg"
          variant="secondary"
          onClick={onCreateNewWorkflow}
          disabled={isLoading}
        >
          <Workflow className="w-5 h-5" />
          {isLoading
            ? "Loading..."
            : hasExistingWorkflows
            ? "New Workflow"
            : "First Workflow"}
        </Button>
      </div>
    </div>
  </div>
);
