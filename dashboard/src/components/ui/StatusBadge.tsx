import React from 'react';
import { PipelineStatus } from "../../types";
import { UI } from "../../constants";

interface StatusBadgeProps {
  status: PipelineStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusConfig = {
    [PipelineStatus.IDLE]: {
      color: "bg-gray-500/20 text-gray-300",
      icon: "⏸️",
    },
    [PipelineStatus.RUNNING]: {
      color: "bg-blue-500/20 text-blue-400",
      icon: "🔄",
    },
    [PipelineStatus.COMPLETED]: {
      color: "bg-green-500/20 text-green-400",
      icon: "✅",
    },
    [PipelineStatus.ERROR]: {
      color: "bg-red-500/20 text-red-400",
      icon: "❌",
    },
  };

  const config = statusConfig[status] ?? statusConfig[PipelineStatus.IDLE];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
    >
      <span className={UI.TEXT_SIZES.EXTRA_SMALL}>{config.icon}</span>
      {status}
    </span>
  );
};
