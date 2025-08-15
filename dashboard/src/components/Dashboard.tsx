import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';
import { MainContent } from './MainContent';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { usePipelineContext } from '../contexts/PipelineContext';
import { useState, useCallback } from 'react';
import { Pipeline } from '../types';

export const Dashboard: React.FC = () => {
  const {
    pipelines,
    currentPipeline,
    deletePipeline,
    resetPipelineStatus,
    selectPipeline,
  } = usePipelineContext();

  // Local state for delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pipelineToDelete, setPipelineToDelete] = useState<Pipeline | null>(null);

  const handleDeletePipeline = useCallback((pipelineId: string) => {
    const pipeline = pipelines.find(p => p.id === pipelineId);
    if (pipeline) {
      setPipelineToDelete(pipeline);
      setShowDeleteDialog(true);
    }
  }, [pipelines]);

  const confirmDeletePipeline = useCallback(() => {
    if (pipelineToDelete) {
      deletePipeline(pipelineToDelete.id);
      setShowDeleteDialog(false);
      setPipelineToDelete(null);
    }
  }, [pipelineToDelete, deletePipeline]);

  const cancelDeletePipeline = useCallback(() => {
    setShowDeleteDialog(false);
    setPipelineToDelete(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-50">
      <Header />
      
      <div className="flex h-[calc(100vh-80px)]">
        <Sidebar
          pipelines={pipelines}
          currentPipeline={currentPipeline}
          onSelectPipeline={selectPipeline}
          onDeletePipeline={handleDeletePipeline}
          onResetPipelineStatus={resetPipelineStatus}
        />
        
        <main className="flex-1 flex flex-col overflow-hidden">
          <AppHeader />
          
          <div className="flex-1 overflow-y-auto">
            <MainContent />
          </div>
        </main>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Pipeline"
        message={`Are you sure you want to delete "${
          pipelineToDelete?.name || "this pipeline"
        }"? This action cannot be undone and will permanently remove the pipeline and all its configurations.`}
        confirmText="Delete Pipeline"
        cancelText="Cancel"
        onConfirm={confirmDeletePipeline}
        onCancel={cancelDeletePipeline}
        variant="danger"
      />
    </div>
  );
};
