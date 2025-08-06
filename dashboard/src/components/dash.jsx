import { useState } from "react";

export default function Dash() {
  const [pipelines, setPipelines] = useState([]);
  const [currentPipeline, setCurrentPipeline] = useState(null);
  const [currentView, setCurrentView] = useState("welcome"); // 'welcome', 'builder', 'viewer'
  const [showModal, setShowModal] = useState(false);
  const [agents, setAgents] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [result, setResult] = useState("");
  const [progress, setProgress] = useState(0);

  // Form states
  const [pipelineForm, setPipelineForm] = useState({
    name: "",
    firstPrompt: "",
  });

  const [agentForm, setAgentForm] = useState({
    name: "",
    role: "",
    provider: "",
    model: "",
    systemMsg: "",
  });

  const createNewPipeline = () => {
    setCurrentView("builder");
    setCurrentPipeline(null);
    setPipelineForm({ name: "", firstPrompt: "" });
    setAgents([]);
    setLogs([]);
    setResult("");
    setProgress(0);
  };

  const showAddAgent = () => {
    setAgentForm({
      name: "",
      role: "",
      provider: "",
      model: "",
      systemMsg: "",
    });
    setShowModal(true);
  };

  const hideAddAgent = () => {
    setShowModal(false);
  };

  const addAgent = (e) => {
    e.preventDefault();
    const newAgent = {
      id: Date.now(),
      ...agentForm,
    };
    setAgents([...agents, newAgent]);
    setShowModal(false);
  };

  const removeAgent = (id) => {
    setAgents(agents.filter((agent) => agent.id !== id));
  };

  const savePipeline = () => {
    if (
      !pipelineForm.name ||
      !pipelineForm.firstPrompt ||
      agents.length === 0
    ) {
      alert("Please fill in all required fields and add at least one agent");
      return;
    }

    const pipeline = {
      id: Date.now(),
      name: pipelineForm.name,
      firstPrompt: pipelineForm.firstPrompt,
      agents: agents,
      status: "idle",
      createdAt: new Date().toISOString(),
    };

    setPipelines([...pipelines, pipeline]);
    setCurrentPipeline(pipeline);
  };

  const runPipeline = async () => {
    if (
      !pipelineForm.name ||
      !pipelineForm.firstPrompt ||
      agents.length === 0
    ) {
      alert("Please complete the pipeline configuration first");
      return;
    }

    setIsRunning(true);
    setCurrentView("viewer");
    setLogs([]);
    setResult("");
    setProgress(0);

    // Simulate pipeline execution
    const addLog = (type, message) => {
      const timestamp = new Date().toLocaleTimeString();
      setLogs((prev) => [...prev, { type, message, timestamp }]);
    };

    addLog("info", "Starting pipeline execution...");
    setProgress(10);

    // Simulate agent processing
    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      addLog("info", `Processing with ${agent.name} (${agent.provider})...`);

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 2000));

      addLog("success", `${agent.name} completed successfully`);
      setProgress(((i + 1) / agents.length) * 80);
    }

    addLog("success", "Pipeline execution completed!");
    setProgress(100);
    setResult(
      "This is a simulated result from the AI agent pipeline. In a real implementation, this would contain the actual output from your configured agents processing the initial prompt through the defined workflow."
    );
    setIsRunning(false);
  };

  const selectPipeline = (pipeline) => {
    setCurrentPipeline(pipeline);
    setPipelineForm({ name: pipeline.name, firstPrompt: pipeline.firstPrompt });
    setAgents(pipeline.agents);
    setCurrentView("builder");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-600 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 text-xl font-bold text-indigo-400">
          <span>🔗</span>
          PromptMesh
        </div>
        <div className="flex gap-4 items-center">
          <button
            onClick={createNewPipeline}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
          >
            <span>➕</span>
            New Pipeline
          </button>
          <button className="bg-transparent border border-slate-600 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-md transition-colors">
            <span>⚙️</span>
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <aside className="w-80 bg-slate-800 border-r border-slate-600 overflow-y-auto">
          <div className="px-6 py-6 border-b border-slate-600 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Pipelines</h2>
            <span className="text-slate-400">{pipelines.length}</span>
          </div>

          <div className="p-4">
            {pipelines.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <div className="text-5xl mb-4 opacity-50">🚀</div>
                <p className="mb-1">No pipelines yet</p>
                <small>Create your first AI agent pipeline</small>
              </div>
            ) : (
              pipelines.map((pipeline) => (
                <div
                  key={pipeline.id}
                  onClick={() => selectPipeline(pipeline)}
                  className={`bg-slate-900 border rounded-lg p-4 mb-4 cursor-pointer transition-all hover:border-indigo-500 hover:-translate-y-0.5 ${
                    currentPipeline?.id === pipeline.id
                      ? "border-indigo-500 bg-indigo-500/10"
                      : "border-slate-600"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-sm">{pipeline.name}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        pipeline.status === "idle"
                          ? "bg-slate-600/20 text-slate-300"
                          : pipeline.status === "running"
                          ? "bg-green-500/20 text-green-400"
                          : pipeline.status === "error"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-indigo-500/20 text-indigo-400"
                      }`}
                    >
                      {pipeline.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-xs">
                    <span className="flex items-center gap-1">
                      <span>🤖</span>
                      {pipeline.agents.length} agents
                    </span>
                    <span>
                      {new Date(pipeline.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 flex flex-col">
          <div className="bg-slate-800 border-b border-slate-600 px-8 py-6 flex justify-between items-center">
            <h1 className="text-xl font-semibold">
              {currentView === "welcome"
                ? "Welcome to PromptMesh"
                : currentView === "builder"
                ? currentPipeline
                  ? currentPipeline.name
                  : "New Pipeline"
                : "Pipeline Execution"}
            </h1>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Welcome Screen */}
            {currentView === "welcome" && (
              <div className="flex-1 flex items-center justify-center text-center text-slate-400">
                <div>
                  <div className="text-6xl mb-6 opacity-50">🔗</div>
                  <h2 className="text-2xl font-semibold text-slate-200 mb-2">
                    Welcome to PromptMesh
                  </h2>
                  <p className="mb-6">
                    Create and orchestrate AI agent pipelines
                  </p>
                  <button
                    onClick={createNewPipeline}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md flex items-center gap-2 mx-auto transition-colors"
                  >
                    <span>➕</span>
                    Create Your First Pipeline
                  </button>
                </div>
              </div>
            )}

            {/* Pipeline Builder */}
            {currentView === "builder" && (
              <div className="p-8 overflow-y-auto">
                <div className="bg-slate-800 rounded-xl p-6 mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span>📋</span>
                    Pipeline Configuration
                  </h3>
                  <div className="mb-6">
                    <label className="block mb-2 font-medium text-slate-300">
                      Pipeline Name
                    </label>
                    <input
                      type="text"
                      value={pipelineForm.name}
                      onChange={(e) =>
                        setPipelineForm({
                          ...pipelineForm,
                          name: e.target.value,
                        })
                      }
                      className="w-full p-3 bg-slate-900 border border-slate-600 rounded-md text-slate-50 focus:border-indigo-500 focus:outline-none"
                      placeholder="My AI Pipeline"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-medium text-slate-300">
                      Initial Prompt
                    </label>
                    <textarea
                      value={pipelineForm.firstPrompt}
                      onChange={(e) =>
                        setPipelineForm({
                          ...pipelineForm,
                          firstPrompt: e.target.value,
                        })
                      }
                      className="w-full p-3 bg-slate-900 border border-slate-600 rounded-md text-slate-50 focus:border-indigo-500 focus:outline-none min-h-24 resize-vertical"
                      placeholder="Enter the initial prompt for your pipeline..."
                    />
                  </div>
                </div>

                <div className="bg-slate-800 rounded-xl p-6 mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <span>🤖</span>
                      Agents
                    </h3>
                    <button
                      onClick={showAddAgent}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-sm transition-colors"
                    >
                      Add Agent
                    </button>
                  </div>

                  <div className="min-h-48">
                    {agents.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <div className="text-4xl mb-4 opacity-50">🤖</div>
                        <p className="mb-1">No agents configured</p>
                        <small>Add agents to process your pipeline</small>
                      </div>
                    ) : (
                      agents.map((agent, index) => (
                        <div
                          key={agent.id}
                          className="bg-slate-900 border border-slate-600 rounded-lg p-4 mb-4 flex items-center gap-4"
                        >
                          <div className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{agent.name}</h4>
                            <p className="text-slate-400 text-sm">
                              {agent.role} • {agent.provider}
                            </p>
                          </div>
                          <div className="bg-slate-700 px-3 py-1 rounded-full text-xs">
                            {agent.provider}
                          </div>
                          <button
                            onClick={() => removeAgent(agent.id)}
                            className="text-red-400 hover:text-red-300 px-2 py-1 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-slate-800 rounded-xl p-6">
                  <div className="flex gap-4">
                    <button
                      onClick={runPipeline}
                      disabled={isRunning}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2 rounded-md flex items-center gap-2 transition-colors"
                    >
                      <span>▶️</span>
                      {isRunning ? "Running..." : "Run Pipeline"}
                    </button>
                    <button
                      onClick={savePipeline}
                      className="bg-transparent border border-slate-600 hover:bg-slate-700 text-slate-300 px-6 py-2 rounded-md flex items-center gap-2 transition-colors"
                    >
                      <span>💾</span>
                      Save Pipeline
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Pipeline Viewer */}
            {currentView === "viewer" && (
              <div className="p-8 flex flex-col gap-8">
                <div className="bg-slate-800 rounded-xl p-6 flex-1">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <span>📊</span>
                      Execution Log
                    </h3>
                    <div className="w-48 bg-slate-700 rounded-sm h-1">
                      <div
                        className="bg-indigo-600 h-full rounded-sm transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
                    {logs.map((log, index) => (
                      <div
                        key={index}
                        className={`mb-2 p-2 rounded border-l-2 ${
                          log.type === "info"
                            ? "bg-indigo-500/10 border-l-indigo-500"
                            : log.type === "success"
                            ? "bg-green-500/10 border-l-green-500"
                            : "bg-red-500/10 border-l-red-500"
                        }`}
                      >
                        <div className="text-slate-400 text-xs mb-1">
                          {log.timestamp}
                        </div>
                        <div>{log.message}</div>
                      </div>
                    ))}
                    {logs.length === 0 && (
                      <div className="text-slate-400 text-center py-8">
                        Execution logs will appear here...
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-800 rounded-xl p-6 min-h-48">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span>✨</span>
                    Final Result
                  </h3>
                  <div className="bg-slate-900 rounded-lg p-4 min-h-32 whitespace-pre-wrap">
                    {result || "Pipeline result will appear here..."}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Agent Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-slate-800 rounded-xl p-8 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-6">Add New Agent</h3>
            <form onSubmit={addAgent}>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block mb-2 font-medium text-slate-300">
                    Agent Name
                  </label>
                  <input
                    type="text"
                    value={agentForm.name}
                    onChange={(e) =>
                      setAgentForm({ ...agentForm, name: e.target.value })
                    }
                    className="w-full p-3 bg-slate-900 border border-slate-600 rounded-md text-slate-50 focus:border-indigo-500 focus:outline-none"
                    placeholder="Agent Alpha"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-slate-300">
                    Role
                  </label>
                  <input
                    type="text"
                    value={agentForm.role}
                    onChange={(e) =>
                      setAgentForm({ ...agentForm, role: e.target.value })
                    }
                    className="w-full p-3 bg-slate-900 border border-slate-600 rounded-md text-slate-50 focus:border-indigo-500 focus:outline-none"
                    placeholder="Assistant"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block mb-2 font-medium text-slate-300">
                    Provider
                  </label>
                  <select
                    value={agentForm.provider}
                    onChange={(e) =>
                      setAgentForm({ ...agentForm, provider: e.target.value })
                    }
                    className="w-full p-3 bg-slate-900 border border-slate-600 rounded-md text-slate-50 focus:border-indigo-500 focus:outline-none"
                    required
                  >
                    <option value="">Select Provider</option>
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="googleai">Google AI</option>
                    <option value="cohere">Cohere</option>
                    <option value="huggingface">Hugging Face</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-medium text-slate-300">
                    Model (Optional)
                  </label>
                  <input
                    type="text"
                    value={agentForm.model}
                    onChange={(e) =>
                      setAgentForm({ ...agentForm, model: e.target.value })
                    }
                    className="w-full p-3 bg-slate-900 border border-slate-600 rounded-md text-slate-50 focus:border-indigo-500 focus:outline-none"
                    placeholder="Auto-detect"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block mb-2 font-medium text-slate-300">
                  System Message
                </label>
                <textarea
                  value={agentForm.systemMsg}
                  onChange={(e) =>
                    setAgentForm({ ...agentForm, systemMsg: e.target.value })
                  }
                  className="w-full p-3 bg-slate-900 border border-slate-600 rounded-md text-slate-50 focus:border-indigo-500 focus:outline-none min-h-24 resize-vertical"
                  placeholder="You are a helpful AI assistant..."
                  required
                />
              </div>

              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={hideAddAgent}
                  className="bg-transparent border border-slate-600 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Add Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
