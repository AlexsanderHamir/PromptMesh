import { TrendingUp } from "lucide-react";
import { Card } from "./ui/Card";
import { ProgressBar } from "./ui/ProgressBar";
import { LogEntry } from "./ui/LogEntry";

export const ExecutionMonitor = ({ progress, logs }) => (
  <Card
    title="Execution Monitor"
    subtitle={`Pipeline progress: ${progress.toFixed(0)}%`}
    icon={<TrendingUp className="w-5 h-5" />}
  >
    <div className="mb-6">
      <ProgressBar progress={progress} className="w-full" />
    </div>

    <div className="bg-slate-900/50 rounded-lg p-4 h-80 overflow-y-auto">
      {logs.length === 0 ? (
        <div className="h-full flex items-center justify-center text-slate-400">
          <div className="text-center">
            <div className="animate-pulse mb-4">⏳</div>
            <p>Execution logs will appear here...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log, index) => (
            <LogEntry key={index} log={log} index={index} />
          ))}
        </div>
      )}
    </div>
  </Card>
);
