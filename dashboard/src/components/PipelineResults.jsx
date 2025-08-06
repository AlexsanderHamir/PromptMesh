import { CheckCircle } from "lucide-react";
import { Card } from "./ui/Card";

export const PipelineResults = ({ result }) => (
  <Card
    title="Pipeline Results"
    subtitle="Final output from your AI agent pipeline"
    icon={<CheckCircle className="w-5 h-5" />}
  >
    <div className="bg-slate-900/50 rounded-lg p-6 min-h-64">
      {result ? (
        <div className="prose prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-slate-200 leading-relaxed">
            {result}
          </div>
        </div>
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
