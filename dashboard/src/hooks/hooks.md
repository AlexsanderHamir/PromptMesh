# Custom Hooks Documentation

## Overview

The application uses two main custom hooks for state management and pipeline execution:

1. `useLocalStorage` - Persists state to browser storage
2. `usePipelineExecution` - Manages pipeline execution workflow

## Hook 1: `useLocalStorage.js`

### Purpose

Persists React state to localStorage and synchronizes changes.

### Implementation

```javascript
import { useState } from "react";

export const useLocalStorage = (key, initialValue) => {
  // State initialization with localStorage value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Wrapped setter function
  const setValue = (value) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Removal function
  const removeValue = () => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, removeValue];
};
```

### Usage in Dashboard

```javascript
// Storing pipelines
const [pipelines, setPipelines, removePipelines] = useLocalStorage(
  "promptmesh_pipelines",
  []
);
```

### Key Features

1. **Automatic Synchronization**: Any state changes automatically update localStorage
2. **Error Handling**: Gracefully falls back to initial value if localStorage access fails
3. **Full API**: Provides get, set, and remove operations
4. **Type Preservation**: Handles both direct values and functional updates like useState

### Benefits

- Persists pipeline data across page refreshes
- Maintains React's declarative programming model
- Provides clean abstraction over localStorage operations

---

## Hook 2: `usePipelineExecution.js`

### Purpose

Manages the complete lifecycle of pipeline execution including:

- Progress tracking
- Log generation
- Result handling
- Error management

### Implementation Highlights

```javascript
export const usePipelineExecution = () => {
  // State management
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [result, setResult] = useState("");
  const [progress, setProgress] = useState(0);

  // Logging utility
  const addLog = useCallback((type, message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { type, message, timestamp }]);
  }, []);

  // Core execution function
  const runPipeline = useCallback(async (pipelineForm, agents) => {
    setIsRunning(true);
    resetState();

    try {
      // Pipeline creation
      addLog(LOG_TYPES.INFO, "🚀 Creating pipeline...");
      const createResult = await apiClient.createPipeline(...);

      // Agent addition
      for (const agent of agents) {
        addLog(LOG_TYPES.INFO, `Adding agent ${agent.name}...`);
        await apiClient.addAgentToPipeline(...);
      }

      // Execution
      addLog(LOG_TYPES.INFO, "Starting execution...");
      const executionResult = await apiClient.startPipeline(...);

      // Completion
      setResult(executionResult.result);
      return executionResult.result;

    } catch (error) {
      addLog(LOG_TYPES.ERROR, `Failed: ${error.message}`);
      throw error;
    } finally {
      setIsRunning(false);
    }
  }, [addLog]);

  // Reset function
  const resetExecution = useCallback(() => {
    setLogs([]);
    setResult("");
    setProgress(0);
    setIsRunning(false);
  }, []);

  return {
    isRunning,
    logs,
    result,
    progress,
    runPipeline,
    resetExecution
  };
};
```

### Usage in Dashboard

```javascript
const { isRunning, logs, result, progress, runPipeline, resetExecution } =
  usePipelineExecution();

// Trigger execution
const handleRunPipeline = async () => {
  try {
    const result = await runPipeline(pipelineForm, agents);
    // Save results to pipeline
  } catch (error) {
    // Handle error
  }
};
```

### Execution Phases

1. **Initialization** (0-5% progress)

   - Clears previous state
   - Creates pipeline via API

2. **Agent Configuration** (20-80% progress)

   - Sequentially adds each agent
   - Progress updates proportionally

3. **Execution** (85-100% progress)
   - Runs the complete pipeline
   - Captures final result

### Error Handling

- Catches and logs errors at each stage
- Preserves error messages in execution logs
- Re-throws errors for component-level handling

### Integration Points

- **ExecutionMonitor**: Consumes `logs` and `progress`
- **PipelineResults**: Displays `result`
- **PipelineActions**: Uses `isRunning` to disable buttons

---

## Combined Data Flow

- Copy the Mermaid code below to [Mermaid Live Editor](https://mermaid.live/).
- Or use a Markdown editor with Mermaid support (VS Code, Obsidian, etc.).

```mermaid
graph TD
    A[Dashboard] -->|persists| B[useLocalStorage]
    A -->|manages| C[usePipelineExecution]
    C -->|feeds| D[ExecutionMonitor]
    C -->|provides| E[PipelineResults]
    B -->|syncs| F[Sidebar Pipeline List]
```

### Key Architectural Benefits

1. **Separation of Concerns**: Business logic isolated from components
2. **Reusability**: Hooks can be used across multiple components
3. **Testability**: Independent unit testing of complex logic
4. **Predictable State**: Centralized management of critical operations

---

## Error Handling Strategy

| Hook                   | Error Cases                        | Handling Approach                                           |
| ---------------------- | ---------------------------------- | ----------------------------------------------------------- |
| `useLocalStorage`      | - Quota exceeded<br>- Invalid JSON | - Falls back to initial value<br>- Logs to console          |
| `usePipelineExecution` | - API failures<br>- Network errors | - Detailed error logs<br>- Visual feedback<br>- State reset |
