import { useState, useCallback } from 'react';
import { LOG_TYPES } from '../constants';
import { apiClient } from '../api/client';
import { PipelineForm, Agent, LogEntry, PipelineStatus } from '../types';

interface AgentProgress {
  status: 'started' | 'processing' | 'completed' | 'error';
  progress: number;
}

interface UploadedFile {
  content: string;
  metadata: {
    name: string;
    type: string;
    size: number;
    mimeType: string;
  };
}

export const usePipelineExecution = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState("");
  const [progress, setProgress] = useState(0);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const [agentProgress, setAgentProgress] = useState<Record<string, AgentProgress>>({});
  const [totalAgents, setTotalAgents] = useState(0);
  const [completedAgents, setCompletedAgents] = useState(0);

  const addLog = useCallback((type: string, message: string, metadata: Record<string, unknown> = {}) => {
    const timestamp = new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLogs((prev) => [...prev, { 
      timestamp, 
      message, 
      level: type as 'info' | 'warning' | 'error', 
      metadata 
    }]);
  }, []);

  // Calculate progress based on agent completion
  const updateProgress = useCallback((newCompletedAgents: number, total: number) => {
    if (total === 0) return;
    
    // Base progress: 10% for setup, 80% for agent execution, 10% for completion
    const setupProgress = 10;
    const agentProgress = (newCompletedAgents / total) * 80;
    const totalProgress = Math.min(setupProgress + agentProgress, 90);
    
    setProgress(totalProgress);
  }, []);

  // Execute pipeline with streaming updates
  const runPipelineStream = useCallback(
    async (pipelineForm: PipelineForm, agents: Agent[], uploadedFiles: UploadedFile[] = []) => {
      if (agents.length === 0) {
        throw new Error("No agents configured for pipeline execution");
      }

      // Validate agent order before execution
      const sortedAgents = [...agents].sort((a, b) => a.order - b.order);
      if (!sortedAgents.every((agent, index) => agent.order === index)) {
        console.warn('Agent order inconsistency detected, normalizing before execution');
        sortedAgents.forEach((agent, index) => {
          agent.order = index;
        });
      }

      setIsRunning(true);
      setProgress(10);
      setLogs([]);
      setResult("");
      setCurrentAgent(null);
      setAgentProgress({});
      setTotalAgents(agents.length);
      setCompletedAgents(0);

      try {
        addLog(LOG_TYPES.INFO, "🚀 Starting streaming pipeline execution...");
        setProgress(10);

        addLog(
          LOG_TYPES.INFO,
          `📋 Pipeline: ${pipelineForm.name} with ${agents.length} agent(s)`
        );
        setProgress(15);

        // Execute pipeline with streaming updates
        const streamResult = await apiClient.executePipelineStream(
          pipelineForm,
          sortedAgents, // Use sorted agents to ensure proper order
          uploadedFiles,
          (eventType: string, data: {
            type?: string;
            message?: string;
            result?: string;
            agent_name?: string;
            agent_role?: string;
            from_agent?: string;
            to_agent?: string;
            is_last?: boolean;
            [key: string]: unknown;
          }) => {
            switch (eventType) {
              case "status":
                if (data.type === "pipeline_started" && data.message) {
                  addLog(LOG_TYPES.INFO, data.message);
                  setProgress(20);
                } else if (data.type === "pipeline_completed" && data.result && data.message) {
                  addLog(LOG_TYPES.SUCCESS, data.message);
                  setResult(data.result);
                  setProgress(100);
                }
                break;

              case "agent_started":
                if (data.agent_name && data.message) {
                  setCurrentAgent(data.agent_name);
                  addLog(LOG_TYPES.INFO, data.message, {
                    agent: data.agent_name,
                    role: data.agent_role || 'unknown',
                    type: "agent_start",
                  });
                  const agentName = data.agent_name;
                  setAgentProgress((prev) => ({
                    ...prev,
                    [agentName]: { status: "started", progress: 0 },
                  }));
                  
                  // Small progress bump when agent starts
                  setProgress(prev => Math.min(prev + 2, 25));
                }
                break;

              case "agent_processing":
                if (data.agent_name) {
                  // Debug: Log what we're receiving from the backend
                  console.log(`[DEBUG] agent_processing event for ${data.agent_name}:`, data);
                  
                  // Try to get agent input from the backend data, or construct it
                  let agentInput = data.agent_input;
                  
                  console.log(`[DEBUG] Backend provided agent_input:`, agentInput);
                  
                  // If backend doesn't provide agent input, construct it from context
                  if (!agentInput) {
                    console.log(`[DEBUG] No agent_input from backend, constructing fallback input`);
                    // For the first agent, use the initial prompt + system message
                    if (data.agent_name === agents[0]?.name) {
                      const firstAgent = agents[0];
                      agentInput = `${firstAgent.systemMsg}\n\n${pipelineForm.firstPrompt}`;
                      // Add uploaded files content if any
                      if (uploadedFiles.length > 0) {
                        let fileContent = "\n\n--- ATTACHED FILES ---\n";
                        uploadedFiles.forEach((file, index) => {
                          fileContent += `\n--- FILE ${index + 1}: ${file.metadata.name} ---\n`;
                          fileContent += `Content:\n${file.content}\n`;
                          fileContent += `--- END FILE ${index + 1} ---\n`;
                        });
                        fileContent += "\n--- END ATTACHED FILES ---\n";
                        agentInput += fileContent;
                      }
                    } else {
                      // For subsequent agents, find the previous agent's output + current agent's system message
                      const currentAgentIndex = agents.findIndex(agent => agent.name === data.agent_name);
                      if (currentAgentIndex > 0) {
                        const currentAgent = agents[currentAgentIndex];
                        // Look for the previous agent's completed log
                        const previousAgentName = agents[currentAgentIndex - 1].name;
                        const previousAgentLog = logs.find(
                          (log) =>
                            log.metadata?.agent === previousAgentName &&
                            log.metadata?.type === "agent_completed" &&
                            log.metadata?.agentOutput
                        );
                        if (previousAgentLog?.metadata?.agentOutput) {
                          const previousOutput = previousAgentLog.metadata.agentOutput as string;
                          agentInput = `${currentAgent.systemMsg}\n\n${previousOutput}`;
                        } else {
                          agentInput = `${currentAgent.systemMsg}\n\nOutput from previous agent '${previousAgentName}' not available`;
                        }
                      } else {
                        agentInput = "No input available";
                      }
                    }
                    console.log(`[DEBUG] Constructed fallback input:`, agentInput);
                  }
                  
                  console.log(`[DEBUG] Storing agent_processing log with input for ${data.agent_name}:`, agentInput);
                  addLog(LOG_TYPES.INFO, `⚙️ Agent '${data.agent_name}' processing input...`, {
                    agent: data.agent_name,
                    type: "agent_processing",
                    agentInput: agentInput,
                  });
                  const agentName = data.agent_name;
                  setAgentProgress((prev) => ({
                    ...prev,
                    [agentName]: { status: "processing", progress: 50 },
                  }));
                  
                  // Small progress bump when agent starts processing
                  setProgress(prev => Math.min(prev + 3, 30));
                }
                break;

              case "agent_completed":
                if (data.agent_name && data.message) {
                  // Debug: Log what we're receiving from the backend
                  console.log(`[DEBUG] agent_completed event for ${data.agent_name}:`, data);
                  
                  // Find the agent input that was used for this agent
                  let agentInput = data.agent_input;
                  
                  console.log(`[DEBUG] Backend provided agent_input in completed event:`, agentInput);
                  
                  // If backend doesn't provide agent input, try to find it from our logs
                  if (!agentInput) {
                    console.log(`[DEBUG] No agent_input from backend in completed event, looking in logs`);
                    // Use a more reliable way to find the processing log by looking at the current logs state
                    const currentLogs = logs; // Capture current logs state
                    const processingLog = currentLogs.find(
                      (log) =>
                        log.metadata?.agent === data.agent_name &&
                        log.metadata?.type === "agent_processing"
                    );
                    if (processingLog?.metadata?.agentInput) {
                      agentInput = processingLog.metadata.agentInput as string;
                      console.log(`[DEBUG] Found agent_input in processing log:`, agentInput);
                    } else {
                      console.log(`[DEBUG] No agent_input found in processing log either`);
                      // As a last resort, try to construct the input from context
                      if (data.agent_name === agents[0]?.name) {
                        const firstAgent = agents[0];
                        agentInput = `${firstAgent.systemMsg}\n\n${pipelineForm.firstPrompt}`;
                        // Add uploaded files content if any
                        if (uploadedFiles.length > 0) {
                          let fileContent = "\n\n--- ATTACHED FILES ---\n";
                          uploadedFiles.forEach((file, index) => {
                            fileContent += `\n--- FILE ${index + 1}: ${file.metadata.name} ---\n`;
                            fileContent += `Content:\n${file.content}\n`;
                            fileContent += `--- END FILE ${index + 1} ---\n`;
                          });
                          fileContent += "\n--- END ATTACHED FILES ---\n";
                          agentInput += fileContent;
                        }
                      } else {
                        // For subsequent agents, find the previous agent's output
                        const currentAgentIndex = agents.findIndex(agent => agent.name === data.agent_name);
                        if (currentAgentIndex > 0) {
                          const currentAgent = agents[currentAgentIndex];
                          const previousAgentName = agents[currentAgentIndex - 1].name;
                          const previousAgentLog = currentLogs.find(
                            (log) =>
                              log.metadata?.agent === previousAgentName &&
                              log.metadata?.type === "agent_completed" &&
                              log.metadata?.agentOutput
                          );
                          if (previousAgentLog?.metadata?.agentOutput) {
                            const previousOutput = previousAgentLog.metadata.agentOutput as string;
                            agentInput = `${currentAgent.systemMsg}\n\n${previousOutput}`;
                          } else {
                            agentInput = `${currentAgent.systemMsg}\n\nOutput from previous agent '${previousAgentName}' not available`;
                          }
                        } else {
                          agentInput = "No input available";
                        }
                      }
                      console.log(`[DEBUG] Constructed fallback input for completed event:`, agentInput);
                    }
                  }
                  
                  console.log(`[DEBUG] Storing agent_completed log with input for ${data.agent_name}:`, agentInput);
                  addLog(LOG_TYPES.SUCCESS, data.message, {
                    agent: data.agent_name,
                    type: "agent_completed",
                    isLast: data.is_last,
                    agentOutput: data.agent_output,
                    agentInput: agentInput, // Store the input that was used
                  });
                  const agentName = data.agent_name;
                  setAgentProgress((prev) => ({
                    ...prev,
                    [agentName]: { status: "completed", progress: 100 },
                  }));
                  
                  // Update progress based on agent completion
                  setCompletedAgents(prev => {
                    const newCompleted = prev + 1;
                    updateProgress(newCompleted, agents.length);
                    
                    // If all agents are completed, set progress to 100%
                    if (newCompleted === agents.length) {
                      setProgress(100);
                    }
                    
                    return newCompleted;
                  });
                }
                break;

              case "agent_handoff":
                if (data.from_agent && data.to_agent && data.message) {
                  addLog(LOG_TYPES.INFO, data.message, {
                    fromAgent: data.from_agent,
                    toAgent: data.to_agent,
                    type: "agent_handoff",
                  });
                  setCurrentAgent(data.to_agent);
                }
                break;

              case "agent_error":
                if (data.agent_name && data.message) {
                  addLog(LOG_TYPES.ERROR, data.message, {
                    agent: data.agent_name,
                    type: "agent_error",
                  });
                  const agentName = data.agent_name;
                  setAgentProgress((prev) => ({
                    ...prev,
                    [agentName]: { status: "error", progress: 0 },
                  }));
                  
                  // Update progress even for failed agents to maintain accuracy
                  setCompletedAgents(prev => {
                    const newCompleted = prev + 1;
                    updateProgress(newCompleted, agents.length);
                    
                    // If all agents are completed (including failed ones), set progress to 100%
                    if (newCompleted === agents.length) {
                      setProgress(100);
                    }
                    
                    return newCompleted;
                  });
                }
                break;

              case "error":
                if (data.message) {
                  addLog(LOG_TYPES.ERROR, data.message, { type: "pipeline_error" });
                }
                break;

              case "end":
                if (data.type) {
                  addLog(LOG_TYPES.INFO, `Pipeline execution ended: ${data.type}`);
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
          `❌ Streaming pipeline execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        setProgress(0);
        console.error("Streaming pipeline execution error:", error);
        throw error;
      } finally {
        setIsRunning(false);
      }
    },
    [addLog, result, updateProgress]
  );

  // Execute pipeline with complete configuration in one request (legacy)
  const runPipeline = useCallback(
    async (pipelineForm: PipelineForm, agents: Agent[]) => {
      setIsRunning(true);
      setLogs([]);
      setResult("");
      setProgress(0);
      setTotalAgents(agents.length);
      setCompletedAgents(0);

      try {
        addLog(LOG_TYPES.INFO, "🚀 Starting pipeline execution...");
        setProgress(10);

        addLog(
          LOG_TYPES.INFO,
          `📋 Pipeline: ${pipelineForm.name} with ${agents.length} agent(s)`
        );
        setProgress(15);

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
          `❌ Pipeline execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
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
    setTotalAgents(0);
    setCompletedAgents(0);
  }, []);

  // Restore execution state from saved pipeline data
  const restoreExecutionState = useCallback((pipelineData: {
    hasResults: boolean;
    lastExecutionResult?: string;
    lastExecutionError?: string;
    lastExecutionLogs?: LogEntry[];
    lastExecutionDate?: string;
    status: PipelineStatus;
  }) => {
    if (pipelineData.hasResults) {
      // Restore logs if available
      if (pipelineData.lastExecutionLogs) {
        setLogs(pipelineData.lastExecutionLogs);
      }
      
      // Restore result if available
      if (pipelineData.lastExecutionResult) {
        setResult(pipelineData.lastExecutionResult);
      }
      
      // Set progress based on status
      if (pipelineData.status === PipelineStatus.COMPLETED) {
        setProgress(100);
      } else if (pipelineData.status === PipelineStatus.ERROR) {
        setProgress(100); // Error also means completion
      } else {
        setProgress(0);
      }
      
      // Reset execution state
      setIsRunning(false);
      setCurrentAgent(null);
      setAgentProgress({});
      setTotalAgents(0);
      setCompletedAgents(0);
    }
  }, []);

  return {
    isRunning,
    logs,
    result,
    progress,
    currentAgent,
    agentProgress,
    totalAgents,
    completedAgents,
    runPipeline,
    runPipelineStream,
    resetExecution,
    restoreExecutionState,
  };
};