# PipelineResults Component

## Overview

Displays the output from pipeline execution.

## Props

- `result` (String): The execution result
- `isFromPreviousExecution` (Boolean): Whether showing old results
- `lastExecutionDate` (String): Date of execution

## UI Elements

- Result display area with:
  - Pre-formatted text
  - Syntax highlighting
- Empty state when no results
- Indicator for historical results
- Timestamp display

## Features

- Preserves whitespace and formatting
- Clear distinction between current/previous results
- Responsive design
