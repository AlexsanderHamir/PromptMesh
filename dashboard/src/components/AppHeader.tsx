import React from 'react';
import { usePipelineContext } from '../contexts/PipelineContext';
import { DashViews } from '../types';

export const AppHeader: React.FC = () => {
  const {
    currentView,
    currentPipeline,
    hasUnsavedChanges,
    closePipeline,
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
        return {
          title: '',
          subtitle: '',
        };
      
      default:
        return {
          title: '',
          subtitle: '',
        };
    }
  };

  const headerContent = getHeaderContent();

  // Don't render anything when in WELCOME view or when there's no content
  if (!headerContent.title || currentView === DashViews.WELCOME) {
    return null;
  }

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
        
        <button
          onClick={closePipeline}
          className="px-4 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg transition-colors"
          title="Close pipeline"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
