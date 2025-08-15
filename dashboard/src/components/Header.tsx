import React from 'react';
import { Zap } from "lucide-react";

export const Header: React.FC = () => (
  <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 px-8 py-4">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-2 rounded-lg">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            PromptMesh
          </h1>
          <p className="text-xs text-slate-400">AI Pipeline Orchestration</p>
        </div>
      </div>
    </div>
  </header>
);
