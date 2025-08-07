# AgentConfiguration Component

## Overview

Displays and manages the list of configured agents for a pipeline.

## Props

- `agents` (Array): List of configured agents
- `errors` (Object): Validation errors
- `onShowAddAgent` (Function): Opens the add agent modal
- `onEditAgent` (Function): Opens edit modal for an agent
- `onRemoveAgent` (Function): Removes an agent
- `onClosePipeline` (Function): Closes the pipeline view

## Features

- Displays agent cards with:
  - Name and role
  - Provider and model info
  - Sequential numbering
- Empty state when no agents are configured
- Add Agent button
- Edit and Delete buttons for each agent
- Validation error display
