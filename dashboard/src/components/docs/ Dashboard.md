# Dashboard Component

## Overview

Main application container that manages the entire pipeline workflow.

## State Management

- `pipelines`: List of all pipelines (persisted in localStorage)
- `currentPipeline`: Currently selected pipeline
- `currentView`: Controls active view (welcome/builder/viewer)
- `agents`: List of agents for current pipeline
- `pipelineForm`: Form data for pipeline configuration
- `agentForm`: Form data for agent configuration
- `errors`: Validation errors

## Key Features

1. Pipeline Management:

   - Create new pipelines
   - Save pipelines
   - Delete pipelines
   - Select existing pipelines

2. Agent Management:

   - Add/edit/remove agents
   - Form validation

3. Execution:
   - Run pipelines
   - Monitor progress
   - View results

## Views

1. Welcome Screen
2. Pipeline Builder
3. Execution Viewer

## Hooks Used

- `useLocalStorage`: Persists pipelines
- `usePipelineExecution`: Handles pipeline execution
