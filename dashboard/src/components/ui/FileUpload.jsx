// src/components/ui/FileUpload.jsx
import {
  Upload,
  X,
  FileText,
  Image,
  FileSpreadsheet,
  File,
  AlertCircle,
} from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "./Button";

export const FileUpload = ({
  uploadedFiles = [],
  onFileUpload,
  onFileRemove,
  isProcessing = false,
  processingProgress = {},
  className = "",
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFileUpload(files);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      onFileUpload(files);
    }
    // Reset input value to allow re-selecting the same file
    e.target.value = "";
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case "image":
        return <Image className="w-4 h-4 text-blue-400" />;
      case "pdf":
        return <FileText className="w-4 h-4 text-red-400" />;
      case "spreadsheet":
        return <FileSpreadsheet className="w-4 h-4 text-green-400" />;
      case "document":
        return <FileText className="w-4 h-4 text-indigo-400" />;
      case "text":
        return <FileText className="w-4 h-4 text-gray-400" />;
      default:
        return <File className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={className}>
      {/* File Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${
            isDragOver
              ? "border-blue-400 bg-blue-500/10"
              : "border-slate-600 hover:border-slate-500"
          }
          ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.md,.json,.xml,.html,.png,.jpg,.jpeg,.gif,.bmp,.webp,.mp3,.wav,.mp4,.avi"
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          <div className="bg-slate-700 rounded-full p-3">
            <Upload className="w-6 h-6 text-slate-300" />
          </div>

          <div>
            <p className="text-slate-300 font-medium">
              {isProcessing
                ? "Processing files..."
                : "Drop files here or click to upload"}
            </p>
            <p className="text-slate-400 text-sm mt-1">
              Supports: PDF, Word, Excel, Images, Text files, and more
            </p>
          </div>

          {!isProcessing && (
            <Button variant="secondary" size="sm" onClick={openFileDialog}>
              Choose Files
            </Button>
          )}
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-slate-300 mb-2">
            Uploaded Files ({uploadedFiles.length})
          </h4>

          {uploadedFiles.map((uploadedFile) => {
            const progress = processingProgress[uploadedFile.id] || 100;
            const isProcessingThis = progress < 100;
            const hasError = uploadedFile.metadata?.error;

            return (
              <div
                key={uploadedFile.id}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileIcon(uploadedFile.metadata.type)}

                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 text-sm font-medium truncate">
                        {uploadedFile.metadata.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>
                          {formatFileSize(uploadedFile.metadata.size)}
                        </span>
                        <span>•</span>
                        <span className="capitalize">
                          {uploadedFile.metadata.type}
                        </span>
                        {hasError && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1 text-red-400">
                              <AlertCircle className="w-3 h-3" />
                              <span>Error</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onFileRemove(uploadedFile.id)}
                    disabled={isProcessingThis}
                    className="flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>

                {/* Processing Progress */}
                {isProcessingThis && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Processing...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {hasError && (
                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
                    {uploadedFile.metadata.error}
                  </div>
                )}

                {/* Content Preview (for text-based files) */}
                {!isProcessingThis &&
                  !hasError &&
                  uploadedFile.metadata.type !== "image" &&
                  uploadedFile.content && (
                    <div className="mt-2">
                      <details className="text-xs">
                        <summary className="text-slate-400 cursor-pointer hover:text-slate-300">
                          Preview content ({uploadedFile.content.length}{" "}
                          characters)
                        </summary>
                        <div className="mt-2 p-2 bg-slate-900/50 rounded text-slate-300 max-h-32 overflow-y-auto font-mono text-[10px] leading-relaxed">
                          {uploadedFile.content.slice(0, 500)}
                          {uploadedFile.content.length > 500 && "..."}
                        </div>
                      </details>
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
