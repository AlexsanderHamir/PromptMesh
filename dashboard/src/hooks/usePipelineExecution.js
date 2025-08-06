import { useState, useCallback } from "react";
import { LOG_TYPES } from "../constants";

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
        addLog(LOG_TYPES.INFO, "🚀 Initializing pipeline execution...");
        setProgress(5);

        // Simulate pipeline execution
        for (let i = 0; i < agents.length; i++) {
          const agent = agents[i];
          addLog(
            LOG_TYPES.INFO,
            `🤖 Processing with ${agent.name} (${agent.provider}/${
              agent.model || "default"
            })...`
          );

          const delay = Math.random() * 2000 + 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));

          if (Math.random() < 0.1) {
            addLog(
              LOG_TYPES.WARNING,
              `⚠️ ${agent.name} encountered a minor issue but recovered`
            );
          }

          addLog(
            LOG_TYPES.SUCCESS,
            `✅ ${agent.name} completed processing successfully`
          );
          setProgress(10 + ((i + 1) / agents.length) * 75);
        }

        addLog(LOG_TYPES.INFO, "🔄 Consolidating results...");
        await new Promise((resolve) => setTimeout(resolve, 1000));

        addLog(
          LOG_TYPES.SUCCESS,
          "🎉 Pipeline execution completed successfully!"
        );
        setProgress(100);

        setResult(`# Pipeline Execution Results

## Summary
Pipeline "${pipelineForm.name}" executed successfully with ${
          agents.length
        } agent(s).

## Initial Prompt
${pipelineForm.firstPrompt}

## Processing Chain
${agents
  .map(
    (agent, i) =>
      `${i + 1}. **${agent.name}** (${agent.provider}) - ${agent.role}`
  )
  .join("\n")}

## Output
This is a simulated comprehensive result from your AI agent pipeline. In a production environment, this would contain:

- Processed data from each agent in the chain
- Transformed content based on your initial prompt
- Analytics and insights from the execution
- Any intermediate results or decision points
- Final synthesized output combining all agent contributions

The pipeline successfully processed your prompt through ${
          agents.length
        } specialized agent${
          agents.length > 1 ? "s" : ""
        }, each contributing their unique capabilities to deliver this result.`);
      } catch (error) {
        addLog(
          LOG_TYPES.ERROR,
          `❌ Pipeline execution failed: ${error.message}`
        );
        setProgress(0);
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
