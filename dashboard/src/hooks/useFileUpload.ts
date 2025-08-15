import { useState, useCallback } from "react";

interface FileMetadata {
  name: string;
  size: number;
  type: string;
  description: string;
  mimeType: string;
  lastModified: number;
  error?: string;
}

interface ProcessedFile {
  id: string;
  file: File;
  content: string;
  metadata: FileMetadata;
  processedAt: string;
}

interface ProcessingProgress {
  [key: string]: number;
}

export const useFileUpload = () => {
  const [uploadedFiles, setUploadedFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<ProcessingProgress>({});

  // Simple file type detection - only three categories
  const getFileType = (file: File): string => {
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    const mimeType = file.type.toLowerCase();

    // Images
    if (
      mimeType.startsWith("image/") ||
      [
        "png",
        "jpg",
        "jpeg",
        "gif",
        "bmp",
        "webp",
        "svg",
        "ico",
        "tiff",
      ].includes(extension)
    ) {
      return "image";
    }

    // PDFs
    if (mimeType === "application/pdf" || extension === "pdf") {
      return "pdf";
    }

    // Videos
    if (
      mimeType.startsWith("video/") ||
      ["mp4", "avi", "mkv", "mov", "wmv", "flv", "webm", "m4v", "3gp"].includes(
        extension
      )
    ) {
      return "video";
    }

    // Everything else is treated as text
    return "text";
  };

  // Get a user-friendly description of the file type
  const getFileDescription = (file: File): string => {
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    const type = getFileType(file);

    if (type === "image") return "Image";
    if (type === "pdf") return "PDF Document";
    if (type === "video") return "Video";

    // For text files, be more specific
    const textTypes: Record<string, string> = {
      js: "JavaScript",
      jsx: "React JSX",
      ts: "TypeScript",
      tsx: "React TypeScript",
      py: "Python",
      java: "Java",
      cpp: "C++",
      c: "C",
      h: "Header",
      css: "CSS",
      html: "HTML",
      php: "PHP",
      rb: "Ruby",
      go: "Go",
      rs: "Rust",
      swift: "Swift",
      kt: "Kotlin",
      scala: "Scala",
      sh: "Shell Script",
      bat: "Batch File",
      sql: "SQL",
      json: "JSON",
      xml: "XML",
      yaml: "YAML",
      yml: "YAML",
      md: "Markdown",
      txt: "Text",
      csv: "CSV Data",
      log: "Log File",
      conf: "Config",
      ini: "Settings",
      docx: "Word Document",
      doc: "Word Document",
      xlsx: "Excel Spreadsheet",
      xls: "Excel Spreadsheet",
      pptx: "PowerPoint",
      ppt: "PowerPoint",
    };

    return textTypes[extension] || "Text File";
  };

  // Process different file types
  const processFile = async (file: File): Promise<ProcessedFile> => {
    const fileType = getFileType(file);
    const fileDescription = getFileDescription(file);
    const fileId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    setProcessingProgress((prev) => ({ ...prev, [fileId]: 0 }));

    try {
      let content = "";
      let metadata: FileMetadata = {
        name: file.name,
        size: file.size,
        type: fileType,
        description: fileDescription,
        mimeType: file.type,
        lastModified: file.lastModified,
      };

      setProcessingProgress((prev) => ({ ...prev, [fileId]: 20 }));

      switch (fileType) {
        case "image":
          content = await processImage(file, fileId);
          break;
        case "pdf":
          content = await processPDF(file, fileId);
          break;
        case "video":
          content = await processVideo(file, fileId);
          break;
        case "text":
        default:
          content = await processText(file, fileId);
          break;
      }

      setProcessingProgress((prev) => ({ ...prev, [fileId]: 100 }));

      return {
        id: fileId,
        file,
        content,
        metadata,
        processedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);

      setProcessingProgress((prev) => ({ ...prev, [fileId]: 100 }));

      return {
        id: fileId,
        file,
        content: `[ERROR PROCESSING FILE: ${file.name}] - ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: {
          name: file.name,
          size: file.size,
          type: fileType,
          description: fileDescription,
          mimeType: file.type,
          lastModified: file.lastModified,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        processedAt: new Date().toISOString(),
      };
    }
  };

  // Process images - convert to base64
  const processImage = async (file: File, fileId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProcessingProgress((prev) => ({ ...prev, [fileId]: 80 }));
        const base64 = e.target?.result as string;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsDataURL(file);
    });
  };

  // Process PDFs - placeholder for now to avoid technical issues
  const processPDF = async (file: File, fileId: string): Promise<string> => {
    setProcessingProgress((prev) => ({ ...prev, [fileId]: 50 }));

    const fileName = file.name;
    const fileSize = (file.size / 1024).toFixed(2);

    setProcessingProgress((prev) => ({ ...prev, [fileId]: 80 }));

    return `[PDF DOCUMENT: ${fileName}]
File Size: ${fileSize} KB

This PDF has been attached to your prompt. Please describe what you'd like me to analyze or help you with regarding this PDF. I can:

• Help you understand PDF content if you describe it
• Provide guidance on PDF processing tools
• Suggest ways to extract text from PDFs
• Analyze PDF structure or formatting questions
• Assist with PDF-related workflows

What would you like me to help you with regarding this PDF?`;
  };

  // Process videos - placeholder
  const processVideo = async (file: File, fileId: string): Promise<string> => {
    setProcessingProgress((prev) => ({ ...prev, [fileId]: 50 }));

    const fileName = file.name;
    const fileSize = (file.size / 1024 / 1024).toFixed(2);

    setProcessingProgress((prev) => ({ ...prev, [fileId]: 80 }));

    return `[VIDEO FILE: ${fileName}]
File Size: ${fileSize} MB

This video has been attached to your prompt. I can help you with:

• Video analysis strategies
• Extracting frames or timestamps
• Video processing workflows  
• Transcription approaches
• Video format conversions
• Multimedia project planning

Please describe what you'd like to do with this video file.`;
  };

  // Process text files - this handles EVERYTHING else
  const processText = async (file: File, fileId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProcessingProgress((prev) => ({ ...prev, [fileId]: 80 }));
        const content = e.target?.result as string;

        // Add context header based on file extension
        let header = `[${getFileDescription(file).toUpperCase()}: ${
          file.name
        }]\n\n`;

        resolve(header + content);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));

      // Try reading as text first
      reader.readAsText(file);
    });
  };

  // Main upload handler
  const handleFileUpload = useCallback(async (files: File[]): Promise<ProcessedFile[]> => {
    setIsProcessing(true);
    const processedFiles: ProcessedFile[] = [];

    try {
      for (const file of files) {
        const processed = await processFile(file);
        processedFiles.push(processed);
      }

      setUploadedFiles((prev) => [...prev, ...processedFiles]);
    } catch (error) {
      console.error("Error during file upload:", error);
    } finally {
      setIsProcessing(false);

      // Clean up progress tracking
      setTimeout(() => {
        setProcessingProgress({});
      }, 2000);
    }

    return processedFiles;
  }, []);

  // Remove uploaded file
  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  // Clear all files
  const clearFiles = useCallback(() => {
    setUploadedFiles([]);
    setProcessingProgress({});
  }, []);

  // Get formatted content for AI model
  const getFormattedContent = useCallback((): string => {
    if (uploadedFiles.length === 0) return "";

    let formatted = "--- ATTACHED FILES ---\n";

    uploadedFiles.forEach((uploadedFile, index) => {
      const { content, metadata } = uploadedFile;

      formatted += `\n--- UPLOADED FILE ${index + 1}: ${metadata.name} ---\n`;
      formatted += `File Type: ${metadata.description}\n`;
      formatted += `Size: ${(metadata.size / 1024).toFixed(2)} KB\n\n`;

      if (metadata.type === "image") {
        formatted += `Content: [IMAGE - Base64 encoded for AI vision models]\n`;
        formatted += `Image Data: ${content}\n`;
      } else {
        formatted += `Content:\n${content}\n`;
      }

      formatted += `\n--- END FILE ${index + 1} ---\n`;
    });

    formatted += "\n--- END ATTACHED FILES ---";

    return formatted;
  }, [uploadedFiles]);

  return {
    uploadedFiles,
    isProcessing,
    processingProgress,
    handleFileUpload,
    removeFile,
    clearFiles,
    getFormattedContent,
  };
};
