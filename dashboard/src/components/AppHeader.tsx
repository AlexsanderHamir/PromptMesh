import React from 'react';
import { usePipelineContext } from '../contexts/PipelineContext';
import { DashViews } from '../types';

export const AppHeader: React.FC = () => {
  const {
    currentView,
    currentPipeline,
    hasUnsavedChanges,
    createNewPipeline,
  } = usePipelineContext();

  const getHeaderContent = () => {
    switch (currentView) {
      case DashViews.BUILDER:
        return {
          title: currentPipeline?.name || 'New Pipeline',
          subtitle: hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved',
        };
      
      case DashViews.VIEWER:
        return {
          title: 'Pipeline Execution',
          subtitle: 'Monitor your pipeline as it runs',
        };
      
      case DashViews.RESULTS:
        return {
          title: currentPipeline?.name || 'Previous Results',
          subtitle: 'View previous execution results of this pipeline.',
        };
      
      case DashViews.WELCOME:
      default:
        return {
          title: 'Welcome to PromptMesh',
          subtitle: 'Create and manage your AI agent pipelines',
        };
    }
  };

  const headerContent = getHeaderContent();

  return (
    <div className="bg-slate-900/30 backdrop-blur border-b border-slate-700/50 px-8 py-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">
            {headerContent.title}
          </h1>
          {headerContent.subtitle && (
            <p className="text-slate-400 text-sm mt-1">
              {headerContent.subtitle}
            </p>
          )}
        </div>
        
        {currentView === DashViews.WELCOME && (
          <button
            onClick={createNewPipeline}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white font-medium"
          >
            Create New Pipeline
          </button>
        )}
      </div>
    </div>
  );
};
