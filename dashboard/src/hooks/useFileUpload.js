// src/hooks/useFileUpload.js
import { useState, useCallback } from "react";
import * as mammoth from "mammoth";
import * as XLSX from "xlsx";

// Dynamic PDF.js imports to handle worker configuration properly
let getDocument = null;
let pdfjsLib = null;

// Initialize PDF.js only when needed
const initPDFJS = async () => {
  if (!pdfjsLib) {
    pdfjsLib = await import("pdfjs-dist");
    getDocument = pdfjsLib.getDocument;

    // Configure worker - use CDN for better compatibility
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }
  return { getDocument: pdfjsLib.getDocument };
};

export const useFileUpload = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({});

  // File type detection
  const getFileType = (file) => {
    const extension = file.name.split(".").pop().toLowerCase();
    const mimeType = file.type.toLowerCase();

    if (mimeType.startsWith("image/")) return "image";
    if (mimeType === "application/pdf") return "pdf";
    if (
      mimeType.includes("spreadsheet") ||
      ["xlsx", "xls", "csv"].includes(extension)
    )
      return "spreadsheet";
    if (mimeType.includes("document") || ["docx", "doc"].includes(extension))
      return "document";
    if (
      mimeType.startsWith("text/") ||
      ["txt", "md", "json", "xml", "html"].includes(extension)
    )
      return "text";
    if (mimeType.startsWith("audio/")) return "audio";
    if (mimeType.startsWith("video/")) return "video";

    return "unknown";
  };

  // Process different file types
  const processFile = async (file) => {
    const fileType = getFileType(file);
    const fileId = `${Date.now()}_${file.name}`;

    setProcessingProgress((prev) => ({ ...prev, [fileId]: 0 }));

    try {
      let content = "";
      let metadata = {
        name: file.name,
        size: file.size,
        type: fileType,
        mimeType: file.type,
        lastModified: file.lastModified,
      };

      switch (fileType) {
        case "image":
          content = await processImage(file, fileId);
          break;
        case "pdf":
          content = await processPDF(file, fileId);
          break;
        case "spreadsheet":
          content = await processSpreadsheet(file, fileId);
          break;
        case "document":
          content = await processDocument(file, fileId);
          break;
        case "text":
          content = await processText(file, fileId);
          break;
        case "audio":
          content = `[AUDIO FILE: ${file.name}] - Audio files require special processing. Consider transcription services.`;
          break;
        case "video":
          content = `[VIDEO FILE: ${file.name}] - Video files require special processing. Consider frame extraction or transcription.`;
          break;
        default:
          content = `[UNSUPPORTED FILE: ${file.name}] - This file type cannot be processed automatically.`;
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
      return {
        id: fileId,
        file,
        content: `[ERROR PROCESSING FILE: ${file.name}] - ${error.message}`,
        metadata: {
          name: file.name,
          size: file.size,
          type: fileType,
          mimeType: file.type,
          error: error.message,
        },
        processedAt: new Date().toISOString(),
      };
    }
  };

  // Process image files
  const processImage = async (file, fileId) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        setProcessingProgress((prev) => ({ ...prev, [fileId]: 50 }));

        // For AI models, we need to provide the image in base64 format
        // Most models expect the format: data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsDataURL(file);
    });
  };

  // Process PDF files
  const processPDF = async (file, fileId) => {
    // Initialize PDF.js dynamically
    const { getDocument } = await initPDFJS();

    const arrayBuffer = await file.arrayBuffer();
    setProcessingProgress((prev) => ({ ...prev, [fileId]: 20 }));

    const pdf = await getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    let fullText = "";

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      fullText += `\n--- Page ${i} ---\n${pageText}\n`;

      setProcessingProgress((prev) => ({
        ...prev,
        [fileId]: Math.round((i / numPages) * 80) + 20,
      }));
    }

    return fullText.trim();
  };

  // Process spreadsheet files
  const processSpreadsheet = async (file, fileId) => {
    const arrayBuffer = await file.arrayBuffer();
    setProcessingProgress((prev) => ({ ...prev, [fileId]: 30 }));

    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    let content = "";

    workbook.SheetNames.forEach((sheetName, index) => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      content += `\n--- Sheet: ${sheetName} ---\n`;

      // Convert to readable format
      jsonData.forEach((row, rowIndex) => {
        if (row.length > 0) {
          content += `Row ${rowIndex + 1}: ${row.join(" | ")}\n`;
        }
      });

      setProcessingProgress((prev) => ({
        ...prev,
        [fileId]:
          Math.round(((index + 1) / workbook.SheetNames.length) * 70) + 30,
      }));
    });

    return content.trim();
  };

  // Process document files (Word, etc.)
  const processDocument = async (file, fileId) => {
    if (file.name.toLowerCase().endsWith(".docx")) {
      const arrayBuffer = await file.arrayBuffer();
      setProcessingProgress((prev) => ({ ...prev, [fileId]: 50 }));

      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } else {
      // For other document types, try to read as text
      return await processText(file, fileId);
    }
  };

  // Process text files
  const processText = async (file, fileId) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProcessingProgress((prev) => ({ ...prev, [fileId]: 80 }));
        resolve(e.target.result);
      };
      reader.onerror = () => reject(new Error("Failed to read text file"));
      reader.readAsText(file);
    });
  };

  // Main upload handler
  const handleFileUpload = useCallback(async (files) => {
    setIsProcessing(true);
    const processedFiles = [];

    for (const file of files) {
      const processed = await processFile(file);
      processedFiles.push(processed);
    }

    setUploadedFiles((prev) => [...prev, ...processedFiles]);
    setIsProcessing(false);

    // Clean up progress tracking
    setTimeout(() => {
      setProcessingProgress({});
    }, 2000);

    return processedFiles;
  }, []);

  // Remove uploaded file
  const removeFile = useCallback((fileId) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  // Clear all files
  const clearFiles = useCallback(() => {
    setUploadedFiles([]);
    setProcessingProgress({});
  }, []);

  // Get formatted content for AI model
  const getFormattedContent = useCallback(() => {
    if (uploadedFiles.length === 0) return "";

    let formatted = "";

    uploadedFiles.forEach((uploadedFile, index) => {
      const { content, metadata } = uploadedFile;

      formatted += `\n--- UPLOADED FILE ${index + 1}: ${metadata.name} ---\n`;
      formatted += `File Type: ${metadata.type}\n`;
      formatted += `Size: ${(metadata.size / 1024).toFixed(2)} KB\n`;

      if (metadata.type === "image") {
        formatted += `Content: [IMAGE DATA - Base64 encoded image that can be processed by vision models]\n`;
        formatted += `Image Data: ${content}\n`;
      } else {
        formatted += `Content:\n${content}\n`;
      }

      formatted += `--- END FILE ${index + 1} ---\n\n`;
    });

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
