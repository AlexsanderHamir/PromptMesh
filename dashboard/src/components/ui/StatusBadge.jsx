import { PIPELINE_STATUS } from "../../constants";

export const StatusBadge = ({ status }) => {
  const statusConfig = {
    [PIPELINE_STATUS.IDLE]: {
      color: "bg-gray-500/20 text-gray-300",
      icon: "⏸️",
    },
    [PIPELINE_STATUS.RUNNING]: {
      color: "bg-blue-500/20 text-blue-400",
      icon: "🔄",
    },
    [PIPELINE_STATUS.COMPLETED]: {
      color: "bg-green-500/20 text-green-400",
      icon: "✅",
    },
    [PIPELINE_STATUS.ERROR]: {
      color: "bg-red-500/20 text-red-400",
      icon: "❌",
    },
  };

  const config = statusConfig[status] || statusConfig[PIPELINE_STATUS.IDLE];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
    >
      <span className="text-[10px]">{config.icon}</span>
      {status}
    </span>
  );
};
