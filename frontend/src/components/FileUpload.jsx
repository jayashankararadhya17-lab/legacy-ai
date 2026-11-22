import { useState } from "react";
import { uploadProject } from "../services/api";

export default function FileUpload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileSelect = (selected) => {
    setErrorMsg("");
    setResult(null);
    setFile(selected || null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || loading) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const data = await uploadProject(file);
      setResult(data);
      if (onUploadSuccess) {
        onUploadSuccess(data.project_id);
      }
    } catch (error) {
      setErrorMsg(
        error.response?.data?.detail ||
          error.message ||
          "Upload failed. Please verify the backend server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div style={{ maxWidth: "740px", margin: "0 auto" }}>
      <div className="surface-card">
        <p className="section-label">Step 1 · Source Repository Upload</p>
        <h2 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: 700, color: "#ffffff" }}>
          Upload Legacy Codebase
        </h2>
        <p style={{ margin: "0 0 22px 0", fontSize: "13.5px", color: "#94a3b8", lineHeight: 1.6 }}>
          Select a <code style={{ color: "#c7d2fe" }}>.zip</code> archive or single legacy source file
          (COBOL, Java, C/C++, Python, JS/TS, or text) to initialize a workspace session.
        </p>

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "42px 24px",
            borderRadius: "14px",
            border: dragActive ? "2px dashed #6366f1" : "2px dashed #334155",
            backgroundColor: dragActive ? "rgba(79, 70, 229, 0.1)" : "#0b111c",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.16s ease",
            textAlign: "center",
          }}
        >
          <input
            type="file"
            disabled={loading}
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
            style={{ display: "none" }}
          />

          <div
            style={{
              width: "46px",
              height: "46px",
              borderRadius: "12px",
              backgroundColor: "rgba(99, 102, 241, 0.14)",
              color: "#818cf8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              marginBottom: "14px",
            }}
          >
            ⬆
          </div>

          {!file ? (
            <>
              <div style={{ fontSize: "14.5px", fontWeight: 600, color: "#f8fafc", marginBottom: "4px" }}>
                Click to browse or drag and drop your file here
              </div>
              <div style={{ fontSize: "12.5px", color: "#64748b" }}>
                Supports ZIP archives and standalone legacy source files
              </div>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <span className="project-badge">{file.name}</span>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>{formatSize(file.size)}</span>
            </div>
          )}
        </label>

        {errorMsg && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px 14px",
              borderRadius: "10px",
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              color: "#fca5a5",
              fontSize: "13px",
            }}
          >
            {errorMsg}
          </div>
        )}

        <div
          style={{
            marginTop: "22px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          {file && !loading ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleFileSelect(null)}
            >
              Clear Selection
            </button>
          ) : (
            <span />
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={!file || loading}
          >
            {loading ? (
              <>
                <span className="spinner" />
                <span>Uploading & Extracting...</span>
              </>
            ) : (
              <span>Upload & Proceed to Analysis →</span>
            )}
          </button>
        </div>

        {result && (
          <div
            style={{
              marginTop: "18px",
              padding: "12px 16px",
              borderRadius: "10px",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#6ee7b7",
              fontSize: "13px",
            }}
          >
            Project created successfully · ID: <strong className="mono">{result.project_id}</strong>
          </div>
        )}
      </div>
    </div>
  );
}