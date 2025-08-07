# AddAgentModal Component

## Overview

A modal dialog for adding or editing AI agents in the pipeline.

## Props

- `showModal` (Boolean): Controls visibility of the modal
- `agentForm` (Object): Contains form data for the agent
- `errors` (Object): Validation errors
- `isEditing` (Boolean): Whether in edit mode
- `onFormChange` (Function): Handler for form field changes
- `onSubmit` (Function): Handler for form submission
- `onClose` (Function): Handler for closing the modal

## Form Fields

1. Agent Name (required)
2. Role (required)
3. Provider (dropdown, required)
4. Model (optional)
5. System Message (textarea, required)

## UI Elements

- Modal overlay with blur effect
- Responsive grid layout for form fields
- Conditional rendering for edit/add mode
- Form validation display
