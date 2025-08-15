import React, { useState } from 'react';
import { X, Bot, Copy, Check, ArrowDown, ArrowUp } from "lucide-react";

interface AgentOutputModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentName?: string;
  agentOutput?: string;
  agentInput?: string;
}

export const AgentOutputModal: React.FC<AgentOutputModalProps> = ({
  isOpen,
  onClose,
  agentName,
  agentOutput,
  agentInput,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"input" | "output">("output");

  // Debug logging when modal opens
  React.useEffect(() => {
    if (isOpen) {
      console.log(`[DEBUG] AgentOutputModal opened for agent: ${agentName}`);
      console.log(`[DEBUG] Agent input:`, agentInput);
      console.log(`[DEBUG] Agent output:`, agentOutput);
    }
  }, [isOpen, agentName, agentInput, agentOutput]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  if (!isOpen) return null;

  const renderContent = (content: string | undefined, type: "input" | "output") => {
    if (!content) {
      return (
        <div className="text-center py-8 text-slate-400">
          <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No {type} available for this agent</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">
              {type === "input" ? "Input" : "Output"} Length
            </div>
            <div
              className={`text-2xl font-bold ${
                type === "input" ? "text-blue-400" : "text-green-400"
              }`}
            >
              {content.length} characters
            </div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">Word Count</div>
            <div className="text-2xl font-bold text-blue-400">
              {content.split(/\s+/).filter((word) => word.length > 0).length}{" "}
              words
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-slate-200">
              {type === "input" ? "Input" : "Output"} Content
            </h3>
            <button
              onClick={() => handleCopy(content)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-600">
            <pre className="text-slate-200 text-sm whitespace-pre-wrap break-words font-mono">
              {content}
            </pre>
          </div>
        </div>

        {/* Analysis */}
        <div className="bg-slate-700/50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-slate-200 mb-3">
            {type === "input" ? "Input" : "Output"} Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-slate-400 mb-1">Lines</div>
              <div className="text-slate-200 font-medium">
                {content.split("\n").length}
              </div>
            </div>
            <div>
              <div className="text-slate-400 mb-1">Paragraphs</div>
              <div className="text-slate-200 font-medium">
                {
                  content.split("\n\n").filter((p) => p.trim().length > 0)
                    .length
                }
              </div>
            </div>
            <div>
              <div className="text-slate-400 mb-1">Sentences</div>
              <div className="text-slate-200 font-medium">
                {
                  content.split(/[.!?]+/).filter((s) => s.trim().length > 0)
                    .length
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Bot className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-200">
                Agent Details: {agentName || "Unknown Agent"}
              </h2>
              <p className="text-sm text-slate-400">
                Complete input/output analysis for observability
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab("input")}
              className={`px-6 py-3 border-b-2 transition-colors ${
                activeTab === "input"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <ArrowDown className="w-4 h-4" />
                <span>Input</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("output")}
              className={`px-6 py-3 border-b-2 transition-colors ${
                activeTab === "output"
                  ? "border-green-500 text-green-400"
                  : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <ArrowUp className="w-4 h-4" />
                <span>Output</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === "input"
            ? renderContent(agentInput, "input")
            : renderContent(agentOutput, "output")}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
