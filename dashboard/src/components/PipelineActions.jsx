import { Play, Save, AlertCircle, TrendingUp, X, Check } from "lucide-react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";

export const PipelineActions = ({
  isRunning,
  isFormValid,
  isSaved,
  onRunPipeline,
  onSavePipeline,
  onClosePipeline,
}) => (
  <Card
    title="Pipeline Actions"
    subtitle="Execute or save your configured pipeline"
    icon={<TrendingUp className="w-5 h-5" />}
  >
    <div className="flex gap-4 flex-wrap">
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
        {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {isSaved ? "Saved" : "Save Pipeline"}
      </Button>

      {isSaved && (
        <Button variant="ghost" onClick={onClosePipeline}>
          <X className="w-4 h-4" />
          Close
        </Button>
      )}
    </div>

    {!isFormValid && (
      <p className="text-amber-400 text-sm mt-3 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        Complete all required fields and add at least one agent to continue
      </p>
    )}

    {isSaved && (
      <p className="text-green-400 text-sm mt-3 flex items-center gap-2">
        <Check className="w-4 h-4" />
        Pipeline saved successfully! You can now close this editor or continue
        making changes.
      </p>
    )}
  </Card>
);
