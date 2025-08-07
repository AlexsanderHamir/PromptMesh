import { FileText, Paperclip } from "lucide-react";
import { Card } from "./ui/Card";
import { FormInput, FormTextarea } from "./ui/FormControls";
import { FileUpload } from "./ui/FileUpload";
import { useFileUpload } from "../hooks/useFileUpload";
import { useEffect } from "react";

export const PipelineConfiguration = ({
  pipelineForm,
  onFormChange,
  errors,
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

  // Update the initial prompt when files are uploaded/removed
  useEffect(() => {
    const fileContent = getFormattedContent();
    if (
      fileContent &&
      !pipelineForm.firstPrompt.includes("--- UPLOADED FILE")
    ) {
      // Add file content to the prompt
      const updatedPrompt = pipelineForm.firstPrompt + "\n\n" + fileContent;
      onFormChange("firstPrompt", updatedPrompt);
    } else if (
      !fileContent &&
      pipelineForm.firstPrompt.includes("--- UPLOADED FILE")
    ) {
      // Remove file content from the prompt
      const lines = pipelineForm.firstPrompt.split("\n");
      const filteredLines = [];
      let inFileSection = false;

      for (const line of lines) {
        if (line.startsWith("--- UPLOADED FILE")) {
          inFileSection = true;
          continue;
        }
        if (line.startsWith("--- END FILE")) {
          inFileSection = false;
          continue;
        }
        if (!inFileSection) {
          filteredLines.push(line);
        }
      }

      onFormChange("firstPrompt", filteredLines.join("\n").trim());
    }
  }, [
    uploadedFiles,
    getFormattedContent,
    pipelineForm.firstPrompt,
    onFormChange,
  ]);

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
            isProcessing={isProcessing}
            processingProgress={processingProgress}
          />
        </div>

        {/* Initial Prompt */}
        <div>
          <FormTextarea
            label="Initial Prompt"
            value={pipelineForm.firstPrompt}
            onChange={(e) => onFormChange("firstPrompt", e.target.value)}
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
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
