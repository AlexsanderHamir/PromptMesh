import { useState, useCallback } from "react";
import { LOG_TYPES } from "../constants";
import { apiClient } from "../api/client";

export const usePipelineExecution = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [result, setResult] = useState("");
  const [progress, setProgress] = useState(0);

  const addLog = useCallback((type, message) => {
    const timestamp = new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLogs((prev) => [...prev, { type, message, timestamp }]);
  }, []);

  // Execute pipeline with complete configuration in one request
  const runPipeline = useCallback(
    async (pipelineForm, agents) => {
      setIsRunning(true);
      setLogs([]);
      setResult("");
      setProgress(0);

      try {
        addLog(LOG_TYPES.INFO, "🚀 Starting pipeline execution...");
        setProgress(10);

        addLog(
          LOG_TYPES.INFO,
          `📋 Pipeline: ${pipelineForm.name} with ${agents.length} agent(s)`
        );
        setProgress(30);

        // Execute pipeline with complete configuration
        const executionResult = await apiClient.executePipeline(pipelineForm, agents);

        addLog(
          LOG_TYPES.SUCCESS,
          "🎉 Pipeline execution completed successfully!"
        );
        setProgress(100);

        setResult(executionResult.result);

        // Return the result so it can be saved to the pipeline
        return executionResult.result;
      } catch (error) {
        addLog(
          LOG_TYPES.ERROR,
          `❌ Pipeline execution failed: ${error.message}`
        );
        setProgress(0);
        console.error("Pipeline execution error:", error);
        throw error; // Re-throw so the caller can handle it
      } finally {
        setIsRunning(false);
      }
    },
    [addLog]
  );

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
    resetExecution,
  };
};
