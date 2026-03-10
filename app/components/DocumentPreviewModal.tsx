"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file?: File;
  filePath?: string;
  fileName?: string;
}

type FileType = "pdf" | "image" | "docx" | "unknown";

const getFileType = (file: File | string): FileType => {
  const name =
    typeof file === "string" ? file : file.name;
  const extension = name.split(".").pop()?.toLowerCase() || "";

  if (extension === "pdf") return "pdf";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) return "image";
  if (extension === "docx") return "docx";
  return "unknown";
};

const getFileUrl = (file: File | string): string => {
  if (typeof file === "string") return file;
  return URL.createObjectURL(file);
};

export default function DocumentPreviewModal({
  isOpen,
  onClose,
  file,
  filePath,
  fileName,
}: DocumentPreviewModalProps) {
  const [state, setState] = useState({
    fileUrl: "",
    fileType: "unknown" as FileType,
    error: "",
  });

  useEffect(() => {
    if (!isOpen) return;

    if (file) {
      try {
        const type = getFileType(file);
        const url = getFileUrl(file);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState({
          fileType: type,
          fileUrl: url,
          error: "",
        });
      } catch {
        setState({
          fileType: "unknown",
          fileUrl: "",
          error: "Failed to load file preview",
        });
      }
    } else if (filePath) {
      try {
        const type = getFileType(filePath);
        setState({
          fileType: type,
          fileUrl: filePath,
          error: "",
        });
      } catch {
        setState({
          fileType: "unknown",
          fileUrl: "",
          error: "Failed to load file preview",
        });
      }
    } else {
      setState({
        fileType: "unknown",
        fileUrl: "",
        error: "No file available for preview",
      });
    }

    return () => {
      if (file) {
        const url = getFileUrl(file);
        URL.revokeObjectURL(url);
      }
    };
  }, [isOpen, file, filePath]);

  if (!isOpen) return null;

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modalContent} onClick={(e) => e.stopPropagation()}>
        {/* 🔹 Header */}
        <div style={modalHeader}>
          <h3 style={modalTitle}>
            {fileName ? `Preview: ${fileName}` : "Document Preview"}
          </h3>
          <button style={closeBtn} onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        {/* 🔹 Content */}
        <div style={modalBody}>
          {state.error ? (
            <div style={errorBox}>
              <p>{state.error}</p>
            </div>
          ) : state.fileType === "pdf" ? (
            <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center" }}>
              <iframe
                src={state.fileUrl}
                style={iframeStyle}
                title="PDF Preview"
                frameBorder="0"
              />
            </div>
          ) : state.fileType === "image" ? (
            <div style={imageContainer}>
              <Image
                src={state.fileUrl}
                alt="Document Preview"
                width={800}
                height={600}
                style={imgStyle}
                unoptimized
              />
            </div>
          ) : state.fileType === "docx" ? (
            <div style={docxPlaceholder}>
              <div style={placeholderIcon}>📄</div>
              <p style={placeholderText}>
                Document preview for DOCX files is not directly supported in the browser.
              </p>
              <p style={placeholderSubtext}>
                Please download the file to view it using Microsoft Word or another compatible application.
              </p>
              {file && (
                <a
                  href={state.fileUrl}
                  download={file.name}
                  style={downloadLink}
                >
                  ⬇️ Download Document
                </a>
              )}
            </div>
          ) : (
            <div style={errorBox}>
              <p>Unsupported file format. Please download the file to view it.</p>
            </div>
          )}
        </div>

        {/* 🔹 Footer */}
        <div style={modalFooter}>
          {file && (
            <a
              href={state.fileUrl}
              download={file.name}
              style={downloadBtn}
            >
              ⬇️ Download
            </a>
          )}
          <button style={closeBtnFooter} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===================== STYLES ===================== */

const overlay = {
  position: "fixed" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalContent = {
  background: "#fff",
  borderRadius: 8,
  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
  width: "95vw",
  height: "90vh",
  maxWidth: 1200,
  display: "flex",
  flexDirection: "column" as const,
  overflow: "hidden",
} as const;

const modalHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 20px",
  borderBottom: "1px solid #e5e7eb",
};

const modalTitle = {
  margin: 0,
  fontSize: 16,
  fontWeight: 600,
  color: "#1f2937",
};

const closeBtn = {
  background: "none",
  border: "none",
  fontSize: 24,
  cursor: "pointer",
  color: "#6b7280",
  padding: 0,
  width: 32,
  height: 32,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "color 0.2s",
} as const;

const modalBody = {
  flex: 1,
  overflow: "auto",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "flex-start",
  background: "#f9fafb",
  padding: 16,
  width: "100%",
} as const;

const errorBox = {
  padding: 32,
  textAlign: "center" as const,
  color: "#dc2626",
};

const iframeStyle = {
  width: "95%",
  height: "100%",
  border: "none",
  borderRadius: 4,
} as const;

const imageContainer = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "100%",
  overflow: "auto",
} as const;

const imgStyle = {
  maxWidth: "100%",
  borderRadius: 4,
  objectFit: "contain" as const,
} as const;

const docxPlaceholder = {
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  padding: 40,
  textAlign: "center" as const,
};

const placeholderIcon = {
  fontSize: 64,
  marginBottom: 16,
};

const placeholderText = {
  fontSize: 16,
  fontWeight: 500,
  color: "#1f2937",
  marginBottom: 8,
};

const placeholderSubtext = {
  fontSize: 14,
  color: "#6b7280",
  marginBottom: 24,
};

const downloadLink = {
  display: "inline-block",
  padding: "8px 16px",
  background: "#3b82f6",
  color: "#fff",
  borderRadius: 6,
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
};

const modalFooter = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
  padding: "12px 20px",
  borderTop: "1px solid #e5e7eb",
  background: "#f9fafb",
};

const downloadBtn = {
  padding: "8px 16px",
  background: "#10b981",
  color: "#fff",
  borderRadius: 6,
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  display: "inline-block",
};

const closeBtnFooter = {
  padding: "8px 16px",
  background: "#e5e7eb",
  color: "#1f2937",
  border: "none",
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
};
