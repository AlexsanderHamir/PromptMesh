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

  const runPipeline = useCallback(
    async (pipelineForm, agents) => {
      setIsRunning(true);
      setLogs([]);
      setResult("");
      setProgress(0);

      try {
        addLog(LOG_TYPES.INFO, "🚀 Creating pipeline...");
        setProgress(5);

        // Step 1: Create pipeline
        const createResult = await apiClient.createPipeline(
          pipelineForm.name,
          pipelineForm.firstPrompt
        );

        addLog(
          LOG_TYPES.SUCCESS,
          `✅ Pipeline created with ID: ${createResult.pipeline_id}`
        );
        setProgress(20);

        // Step 2: Add agents to pipeline
        for (let i = 0; i < agents.length; i++) {
          const agent = agents[i];
          addLog(
            LOG_TYPES.INFO,
            `🤖 Adding agent ${i + 1}/${agents.length}: ${agent.name}...`
          );

          const agentResult = await apiClient.addAgentToPipeline(
            createResult.pipeline_id,
            agent
          );

          addLog(
            LOG_TYPES.SUCCESS,
            `✅ Agent "${agent.name}" added at position ${agentResult.agent_order}`
          );
          setProgress(20 + ((i + 1) / agents.length) * 60);
        }

        addLog(LOG_TYPES.INFO, "🔄 Starting pipeline execution...");
        setProgress(85);

        // Step 3: Start pipeline execution
        const executionResult = await apiClient.startPipeline(
          createResult.pipeline_id
        );

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
