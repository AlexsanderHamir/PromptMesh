import { Play, Save, AlertCircle, TrendingUp } from "lucide-react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";

export const PipelineActions = ({
  isRunning,
  isFormValid,
  onRunPipeline,
  onSavePipeline,
}) => (
  <Card
    title="Pipeline Actions"
    subtitle="Execute or save your configured pipeline"
    icon={<TrendingUp className="w-5 h-5" />}
  >
    <div className="flex gap-4">
      <Button
        variant="success"
        onClick={onRunPipeline}
        disabled={isRunning || !isFormValid}
      >
        <Play className="w-4 h-4" />
        {isRunning ? "Running..." : "Run Pipeline"}
      </Button>
      <Button
        variant="secondary"
        onClick={onSavePipeline}
        disabled={!isFormValid}
      >
        <Save className="w-4 h-4" />
        Save Pipeline
      </Button>
    </div>
    {!isFormValid && (
      <p className="text-amber-400 text-sm mt-3 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        Complete all required fields and add at least one agent to continue
      </p>
    )}
  </Card>
);
