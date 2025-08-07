# Sidebar Component

## Overview

Navigation panel showing all pipelines.

## Props

- `pipelines` (Array): List of pipelines
- `currentPipeline` (Object): Currently selected pipeline
- `onSelectPipeline` (Function): Selects a pipeline
- `onDeletePipeline` (Function): Deletes a pipeline

## Features

- Pipeline cards showing:
  - Name and creation date
  - Agent count
  - Status badge
  - Hover actions
- Empty state when no pipelines
- Delete pipeline button (on hover)
- Current pipeline highlighting
- Scrollable list
