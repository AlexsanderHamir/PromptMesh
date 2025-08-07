# PipelineActions Component

## Overview

Provides action buttons for pipeline operations.

## Props

- `isRunning` (Boolean): Whether pipeline is executing
- `isFormValid` (Boolean): Whether form is valid
- `isSaved` (Boolean): Whether pipeline is saved
- `hasLastExecution` (Boolean): Whether has previous results
- `lastExecutionDate` (String): Date of last execution
- `onRunPipeline` (Function): Runs the pipeline
- `onSavePipeline` (Function): Saves the pipeline
- `onViewResults` (Function): Views previous results
- `onClosePipeline` (Function): Closes the pipeline

## Actions

1. Run Pipeline (disabled when invalid or running)
2. Save Pipeline (disabled when invalid)
3. View Results (conditional)
4. Close Pipeline

## Status Indicators

- Form validation warnings
- Save confirmation
- Last execution timestamp
