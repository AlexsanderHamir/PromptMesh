import { Info, CheckCircle, AlertCircle } from "lucide-react";
import { LOG_TYPES } from "../../constants";

export const LogEntry = ({ log, index }) => {
  const logConfig = {
    [LOG_TYPES.INFO]: {
      color: "bg-blue-500/10 border-l-blue-500 text-blue-300",
      icon: <Info className="w-3 h-3" />,
    },
    [LOG_TYPES.SUCCESS]: {
      color: "bg-green-500/10 border-l-green-500 text-green-300",
      icon: <CheckCircle className="w-3 h-3" />,
    },
    [LOG_TYPES.ERROR]: {
      color: "bg-red-500/10 border-l-red-500 text-red-300",
      icon: <AlertCircle className="w-3 h-3" />,
    },
    [LOG_TYPES.WARNING]: {
      color: "bg-yellow-500/10 border-l-yellow-500 text-yellow-300",
      icon: <AlertCircle className="w-3 h-3" />,
    },
  };

  const config = logConfig[log.type] || logConfig[LOG_TYPES.INFO];

  return (
    <div
      className={`mb-3 p-3 rounded-lg border-l-2 transition-all duration-200 ${config.color}`}
    >
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
        <div className="flex items-center gap-2">
          {config.icon}
          <span className="font-mono">{log.timestamp}</span>
        </div>
        <span className="opacity-50">#{index + 1}</span>
      </div>
      <div className="text-sm font-medium">{log.message}</div>
    </div>
  );
};
