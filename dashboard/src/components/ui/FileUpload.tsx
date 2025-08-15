import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  FileText,
  Image,
  File,
  AlertCircle,
  Code,
  Video,
} from "lucide-react";
import { Button } from "./Button";
import { FILE_SIZES, UI } from "../../constants";

interface FileMetadata {
  name: string;
  size: number;
  type: string;
  description?: string;
  error?: string;
}

interface UploadedFile {
  id: string;
  metadata: FileMetadata;
  content?: string;
}

interface ProcessingProgress {
  [key: string]: number;
}

interface FileUploadProps {
  uploadedFiles?: UploadedFile[];
  onFileUpload: (files: File[]) => void;
  onFileRemove: (fileId: string) => void;
  onClearFiles: () => void;
  isProcessing?: boolean;
  processingProgress?: ProcessingProgress;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  uploadedFiles = [],
  onFileUpload,
  onFileRemove,
  onClearFiles,
  isProcessing = false,
  processingProgress = {},
  className = "",
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFileUpload(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFileUpload(files);
    }
    // Reset input value to allow re-selecting the same file
    if (e.target) {
      e.target.value = "";
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // Get appropriate icon for file type
  const getFileIcon = (metadata: FileMetadata) => {
    switch (metadata.type) {
      case "image":
        return <Image className="w-4 h-4 text-blue-400" />;
      case "pdf":
        return <FileText className="w-4 h-4 text-red-400" />;
      case "video":
        return <Video className="w-4 h-4 text-purple-400" />;
      case "text":
        // Different icons for different text file types
        const ext = metadata.name.split(".").pop()?.toLowerCase();
        if (
          ext && [
            "js",
            "jsx",
            "ts",
            "tsx",
            "py",
            "java",
            "cpp",
            "c",
            "php",
            "rb",
          ].includes(ext)
        ) {
          return <Code className="w-4 h-4 text-green-400" />;
        }
        return <FileText className="w-4 h-4 text-gray-400" />;
      default:
        return <File className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = FILE_SIZES.KB;
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
              Supports: Code, Documents, Images, PDFs, Videos, and more
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
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-slate-300">
              Uploaded Files ({uploadedFiles.length})
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFiles}
              className="text-slate-400 hover:text-red-400"
            >
              Clear All
            </Button>
          </div>

          {uploadedFiles.map((uploadedFile) => {
            const progress = processingProgress[uploadedFile.id] || UI.PROGRESS.COMPLETE;
            const isProcessingThis = progress < UI.PROGRESS.COMPLETE;
            const hasError = uploadedFile.metadata?.error;

            return (
              <div
                key={uploadedFile.id}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileIcon(uploadedFile.metadata)}

                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 text-sm font-medium truncate">
                        {uploadedFile.metadata.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>
                          {formatFileSize(uploadedFile.metadata.size)}
                        </span>
                        <span>•</span>
                        <span>{uploadedFile.metadata.description}</span>
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
                      <span>Processing {uploadedFile.metadata.type}...</span>
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

                {/* Content Preview (for text-based files only) */}
                {!isProcessingThis &&
                  !hasError &&
                  uploadedFile.metadata.type === "text" &&
                  uploadedFile.content && (
                    <div className="mt-2">
                      <details className="text-xs">
                        <summary className="text-slate-400 cursor-pointer hover:text-slate-300">
                          Preview content ({uploadedFile.content.length}{" "}
                          characters)
                        </summary>
                        <div className={`mt-2 p-2 bg-slate-900/50 rounded text-slate-300 max-h-${UI.HEIGHTS.MAX_SMALL} overflow-y-auto font-mono ${UI.TEXT_SIZES.EXTRA_SMALL} leading-relaxed`}>
                                                      {uploadedFile.content.slice(0, UI.CONTENT_LIMITS.PREVIEW_CHARS)}
                            {uploadedFile.content.length > UI.CONTENT_LIMITS.PREVIEW_CHARS && "..."}
                        </div>
                      </details>
                    </div>
                  )}

                {/* Special indicators for non-text files */}
                {!isProcessingThis &&
                  !hasError &&
                  uploadedFile.metadata.type === "image" && (
                    <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-400">
                      📸 Image ready for AI vision analysis
                    </div>
                  )}

                {!isProcessingThis &&
                  !hasError &&
                  uploadedFile.metadata.type === "pdf" && (
                    <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
                      📄 PDF attached - describe what you need help with
                    </div>
                  )}

                {!isProcessingThis &&
                  !hasError &&
                  uploadedFile.metadata.type === "video" && (
                    <div className="mt-2 p-2 bg-purple-500/10 border border-purple-500/20 rounded text-xs text-purple-400">
                      🎥 Video attached - describe your analysis needs
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
