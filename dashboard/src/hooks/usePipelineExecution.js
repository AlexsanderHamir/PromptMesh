import { useState, useCallback } from "react";
import { LOG_TYPES } from "../constants";
import { apiClient } from "../api/client";

export const usePipelineExecution = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [result, setResult] = useState("");
  const [progress, setProgress] = useState(0);
  const [currentAgent, setCurrentAgent] = useState(null);
  const [agentProgress, setAgentProgress] = useState({});

  const addLog = useCallback((type, message, metadata = {}) => {
    const timestamp = new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLogs((prev) => [...prev, { type, message, timestamp, metadata }]);
  }, []);

  // Execute pipeline with streaming updates
  const runPipelineStream = useCallback(
    async (pipelineForm, agents, uploadedFiles = []) => {
      setIsRunning(true);
      setLogs([]);
      setResult("");
      setProgress(0);
      setCurrentAgent(null);
      setAgentProgress({});

      try {
        addLog(LOG_TYPES.INFO, "🚀 Starting streaming pipeline execution...");
        setProgress(10);

        addLog(
          LOG_TYPES.INFO,
          `📋 Pipeline: ${pipelineForm.name} with ${agents.length} agent(s)`
        );
        setProgress(20);

        // Execute pipeline with streaming updates
        const streamResult = await apiClient.executePipelineStream(
          pipelineForm,
          agents,
          uploadedFiles,
          (eventType, data) => {
            switch (eventType) {
              case "status":
                if (data.type === "pipeline_started") {
                  addLog(LOG_TYPES.INFO, data.message);
                  setProgress(30);
                } else if (data.type === "pipeline_completed") {
                  addLog(LOG_TYPES.SUCCESS, data.message);
                  setResult(data.result);
                  setProgress(100);
                }
                break;

              case "agent_started":
                setCurrentAgent(data.agent_name);
                addLog(LOG_TYPES.INFO, data.message, {
                  agent: data.agent_name,
                  role: data.agent_role,
                  type: "agent_start",
                });
                setAgentProgress((prev) => ({
                  ...prev,
                  [data.agent_name]: { status: "started", progress: 0 },
                }));
                break;

              case "agent_processing":
                setAgentProgress((prev) => ({
                  ...prev,
                  [data.agent_name]: { status: "processing", progress: 50 },
                }));
                addLog(LOG_TYPES.INFO, data.message, {
                  agent: data.agent_name,
                  role: data.agent_role,
                  type: "agent_processing",
                  inputLength: data.input_length,
                  agentInput: data.agent_input, // Capture the actual input
                });
                break;

              case "agent_completed":
                setAgentProgress((prev) => ({
                  ...prev,
                  [data.agent_name]: { status: "completed", progress: 100 },
                }));
                addLog(LOG_TYPES.SUCCESS, data.message, {
                  agent: data.agent_name,
                  role: data.agent_role,
                  type: "agent_completed",
                  outputLength: data.output_length,
                  isLast: data.is_last,
                  agentOutput: data.agent_output, // Capture the actual output
                });

                if (data.is_last) {
                  setCurrentAgent(null);
                }
                break;

              case "agent_handoff":
                addLog(LOG_TYPES.INFO, data.message, {
                  fromAgent: data.from_agent,
                  toAgent: data.to_agent,
                  type: "agent_handoff",
                });
                setCurrentAgent(data.to_agent);
                break;

              case "agent_error":
                setAgentProgress((prev) => ({
                  ...prev,
                  [data.agent_name]: { status: "error", progress: 0 },
                }));
                addLog(LOG_TYPES.ERROR, data.message, {
                  agent: data.agent_name,
                  role: data.agent_role,
                  type: "agent_error",
                });
                break;

              case "error":
                addLog(LOG_TYPES.ERROR, data.message);
                setProgress(0);
                break;

              case "end":
                if (data.type === "pipeline_end") {
                  addLog(LOG_TYPES.INFO, "🏁 Pipeline execution ended");
                }
                break;
            }
          }
        );

        // Prefer the result returned by the streaming API if available
        if (streamResult) {
          setResult(streamResult);
          return streamResult;
        }

        // Fallback to whatever is in state
        return result;
      } catch (error) {
        addLog(
          LOG_TYPES.ERROR,
          `❌ Streaming pipeline execution failed: ${error.message}`
        );
        setProgress(0);
        console.error("Streaming pipeline execution error:", error);
        throw error;
      } finally {
        setIsRunning(false);
      }
    },
    [addLog, result]
  );

  // Execute pipeline with complete configuration in one request (legacy)
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
        const executionResult = await apiClient.executePipeline(
          pipelineForm,
          agents
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
        throw error;
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
    setCurrentAgent(null);
    setAgentProgress({});
  }, []);

  return {
    isRunning,
    logs,
    result,
    progress,
    currentAgent,
    agentProgress,
    runPipeline,
    runPipelineStream,
    resetExecution,
  };
};
