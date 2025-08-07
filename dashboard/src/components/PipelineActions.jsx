import {
  Play,
  Save,
  AlertCircle,
  TrendingUp,
  X,
  Check,
  Eye,
} from "lucide-react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { formatDate } from "../utils";

export const PipelineActions = ({
  isRunning,
  isFormValid,
  isSaved,
  hasLastExecution,
  lastExecutionDate,
  onRunPipeline,
  onSavePipeline,
  onViewResults,
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

      {hasLastExecution && (
        <Button variant="secondary" onClick={onViewResults}>
          <Eye className="w-4 h-4" />
          View Results
        </Button>
      )}

      <Button variant="ghost" onClick={onClosePipeline}>
        <X className="w-4 h-4" />
        Close
      </Button>
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

    {hasLastExecution && (
      <p className="text-blue-400 text-sm mt-3 flex items-center gap-2">
        <Eye className="w-4 h-4" />
        Last executed: {formatDate(lastExecutionDate)}
      </p>
    )}
  </Card>
);
