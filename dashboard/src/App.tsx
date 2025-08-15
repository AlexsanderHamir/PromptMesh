import React from 'react';
import { Dashboard } from './components/Dashboard';
import { PipelineProvider } from './contexts/PipelineContext';

const App: React.FC = () => {
  return (
    <PipelineProvider>
      <Dashboard />
    </PipelineProvider>
  );
};

export default App;
