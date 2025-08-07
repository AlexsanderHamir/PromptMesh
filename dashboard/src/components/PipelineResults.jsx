import { CheckCircle, Clock } from "lucide-react";
import { Card } from "./ui/Card";
import { formatDate } from "../utils";

export const PipelineResults = ({
  result,
  isFromPreviousExecution = false,
  lastExecutionDate,
}) => (
  <Card
    title="Pipeline Results"
    subtitle={
      isFromPreviousExecution
        ? `Results from previous execution (${formatDate(lastExecutionDate)})`
        : "Final output from your AI agent pipeline"
    }
    icon={
      isFromPreviousExecution ? (
        <Clock className="w-5 h-5" />
      ) : (
        <CheckCircle className="w-5 h-5" />
      )
    }
  >
    <div className="bg-slate-900/50 rounded-lg p-6 min-h-64">
      {result ? (
        <>
          {isFromPreviousExecution && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-blue-400 text-sm">
                <Clock className="w-4 h-4" />
                <span>
                  Showing results from previous execution on{" "}
                  {formatDate(lastExecutionDate)}
                </span>
              </div>
            </div>
          )}
          <div className="prose prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-slate-200 leading-relaxed">
              {result}
            </div>
          </div>
        </>
      ) : (
        <div className="h-full flex items-center justify-center text-slate-400">
          <div className="text-center">
            <div className="text-4xl mb-4 opacity-50">✨</div>
            <p>Pipeline results will appear here...</p>
          </div>
        </div>
      )}
    </div>
  </Card>
);
