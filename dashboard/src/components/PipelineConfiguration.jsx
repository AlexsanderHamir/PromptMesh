import { FileText, Paperclip } from "lucide-react";
import { Card } from "./ui/Card";
import { FormInput, FormTextarea } from "./ui/FormControls";
import { FileUpload } from "./ui/FileUpload";
import { useFileUpload } from "../hooks/useFileUpload";
import { useEffect, useRef } from "react";

export const PipelineConfiguration = ({
  pipelineForm,
  onFormChange,
  errors,
  onFilesChange,
}) => {
  const {
    uploadedFiles,
    isProcessing,
    processingProgress,
    handleFileUpload,
    removeFile,
    clearFiles,
    getFormattedContent,
  } = useFileUpload();

  // Notify parent component when files change
  useEffect(() => {
    if (onFilesChange) {
      onFilesChange(uploadedFiles);
    }
  }, [uploadedFiles, onFilesChange]);

  // Keep track of the original prompt (without file content)
  const originalPromptRef = useRef(pipelineForm.firstPrompt);

  // Update original prompt when user types (but not when files change)
  const handlePromptChange = (e) => {
    const newValue = e.target.value;

    // Check if this change is removing file content or user typing
    const hasFileMarkers = newValue.includes("--- UPLOADED FILE");

    if (!hasFileMarkers) {
      // User is typing, update the original prompt reference
      originalPromptRef.current = newValue;
    }

    onFormChange("firstPrompt", newValue);
  };

  // Update the prompt whenever files change
  useEffect(() => {
    const fileContent = getFormattedContent();

    // Always use the original prompt as the base
    let newPrompt = originalPromptRef.current;

    // Add file content if there are files
    if (fileContent.trim()) {
      newPrompt = originalPromptRef.current + "\n\n" + fileContent;
    }

    // Only update if the prompt actually changed
    if (newPrompt !== pipelineForm.firstPrompt) {
      onFormChange("firstPrompt", newPrompt);
    }
  }, [
    uploadedFiles,
    getFormattedContent,
    onFormChange,
    pipelineForm.firstPrompt,
  ]);

  // Initialize original prompt ref when component mounts or pipeline changes
  useEffect(() => {
    // Only set if it doesn't already have file markers (meaning it's a fresh prompt)
    if (!pipelineForm.firstPrompt.includes("--- UPLOADED FILE")) {
      originalPromptRef.current = pipelineForm.firstPrompt;
    } else {
      // Extract original prompt from existing content
      const lines = pipelineForm.firstPrompt.split("\n");
      const originalLines = [];
      let foundFileMarker = false;

      for (const line of lines) {
        if (line.startsWith("--- UPLOADED FILE")) {
          foundFileMarker = true;
          break;
        }
        originalLines.push(line);
      }

      if (foundFileMarker) {
        originalPromptRef.current = originalLines.join("\n").trim();
      } else {
        originalPromptRef.current = pipelineForm.firstPrompt;
      }
    }
  }, []); // Only run on mount

  return (
    <Card
      title="Pipeline Configuration"
      subtitle="Define the core settings for your AI agent pipeline"
      icon={<FileText className="w-5 h-5" />}
    >
      <div className="space-y-6">
        {/* Pipeline Name */}
        <FormInput
          label="Pipeline Name"
          value={pipelineForm.name}
          onChange={(e) => onFormChange("name", e.target.value)}
          placeholder="My AI Pipeline"
          required
          error={errors.name}
        />

        {/* File Upload Section */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4" />
              Upload Files (Optional)
            </div>
          </label>
          <p className="text-xs text-slate-400 mb-3">
            Upload documents, images, or data files to include in your pipeline.
            The AI will automatically process and understand different file
            formats.
          </p>

          <FileUpload
            uploadedFiles={uploadedFiles}
            onFileUpload={handleFileUpload}
            onFileRemove={removeFile}
            onClearFiles={clearFiles}
            isProcessing={isProcessing}
            processingProgress={processingProgress}
          />
        </div>

        {/* Initial Prompt */}
        <div>
          <FormTextarea
            label="Initial Prompt"
            value={pipelineForm.firstPrompt}
            onChange={handlePromptChange}
            placeholder="Enter the initial prompt that will be processed through your agent pipeline..."
            rows={6}
            required
            error={errors.firstPrompt}
          />

          {uploadedFiles.length > 0 && (
            <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-blue-400 font-medium">
                    {uploadedFiles.length} file
                    {uploadedFiles.length > 1 ? "s" : ""} attached
                  </p>
                  <p className="text-blue-300 text-xs mt-1">
                    File content will be automatically included in your prompt.
                    You can reference the uploaded files in your prompt text
                    above.
                  </p>
                  <div className="mt-2 text-xs text-blue-300">
                    <strong>Files:</strong>{" "}
                    {uploadedFiles.map((f, i) => (
                      <span key={f.id}>
                        {f.metadata.name}
                        {i < uploadedFiles.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
