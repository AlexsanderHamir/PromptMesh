import React from 'react';
import { WelcomeScreen } from './WelcomeScreen';
import { BuilderView } from './views/BuilderView';
import { ViewerView } from './views/ViewerView';
import { ResultsView } from './views/ResultsView';
import { usePipelineContext } from '../contexts/PipelineContext';
import { DashViews } from '../types';

export const MainContent: React.FC = () => {
  const { currentView, pipelinesError, pipelines, createNewPipeline } = usePipelineContext();

  // Show error if there's a storage issue
  if (pipelinesError) {
    return (
      <div className="p-4 m-4 bg-red-900/20 border border-red-500/30 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-red-300 font-medium">
            Storage Error
          </span>
        </div>
        <p className="text-red-400 text-sm mt-1">
          Failed to load pipelines from storage:{" "}
          {pipelinesError.message}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-red-300 hover:text-red-200 text-sm underline mt-2"
        >
          Reload page to retry
        </button>
      </div>
    );
  }

  // Render the appropriate view based on current state
  switch (currentView) {
    case DashViews.WELCOME:
      return (
        <WelcomeScreen 
          hasExistingPipelines={pipelines.length > 0}
          onCreateNewPipeline={createNewPipeline}
        />
      );
    
    case DashViews.BUILDER:
      return <BuilderView />;
    
    case DashViews.VIEWER:
      return <ViewerView />;
    
    case DashViews.RESULTS:
      return <ResultsView />;
    
    default:
      return (
        <WelcomeScreen 
          hasExistingPipelines={pipelines.length > 0}
          onCreateNewPipeline={createNewPipeline}
        />
      );
  }
};
