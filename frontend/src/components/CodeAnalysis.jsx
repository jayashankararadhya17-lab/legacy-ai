import { useState } from "react";
import { scanProject, explainFile } from "../services/api";

export default function CodeAnalysis({
  projectId,
  scanData,
  setScanData,
  explanations,
  setExplanations,
  onProceedToArchitecture
}) {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [explaining, setExplaining] = useState(false);

  const handleScan = async () => {
    if (!projectId) {
      alert("No Project ID found. Please upload a project first.");
      return;
    }

    setLoading(true);
    try {
      const data = await scanProject(projectId);
      setScanData(data);
    } catch (error) {
      alert(error.response?.data?.detail || "Scan failed");
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = async (filePath) => {
    setSelectedFile(filePath);
    
    // Use cached explanation if already analyzed
    if (explanations[filePath]) return;

    setExplaining(true);
    try {
      const data = await explainFile(projectId, filePath);
      setExplanations((prev) => ({
        ...prev,
        [filePath]: data.explanation
      }));
    } catch (error) {
      alert(error.response?.data?.detail || "Explanation failed");
    } finally {
      setExplaining(false);
    }
  };

  const currentExplanation = selectedFile ? explanations[selectedFile] : null;

  return (
    <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", color: "#f8fafc" }}>
      {/* Top Header Card */}
      <div style={{
        backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "16px",
        padding: "24px", marginBottom: "24px", display: "flex", justifyContent: "space-between",
        alignItems: "center", flexWrap: "wrap", gap: "16px"
      }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", margin: "0 0 6px 0", color: "#ffffff" }}>
            Code Analysis & Repository Scan
          </h2>
          <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8" }}>
            Active Project ID:{" "}
            <span style={{
              fontFamily: "monospace", color: "#818cf8", backgroundColor: "rgba(99, 102, 241, 0.1)",
              padding: "3px 8px", borderRadius: "6px", border: "1px solid rgba(99, 102, 241, 0.2)"
            }}>
              {projectId || "None (Upload first)"}
            </span>
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={handleScan}
            disabled={loading || !projectId}
            style={{
              padding: "10px 20px", borderRadius: "10px",
              backgroundColor: loading || !projectId ? "#334155" : "#4f46e5",
              color: "#ffffff", fontWeight: "600", fontSize: "14px", border: "none",
              cursor: loading || !projectId ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Scanning Files..." : "Run Repository Scan"}
          </button>

          {scanData && (
            <button
              onClick={onProceedToArchitecture}
              style={{
                padding: "10px 20px", borderRadius: "10px", backgroundColor: "#059669",
                color: "#ffffff", fontWeight: "600", fontSize: "14px", border: "none", cursor: "pointer"
              }}
            >
              Next: Architecture →
            </button>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      {scanData && (
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "24px", alignItems: "start" }}>
          {/* Left Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", minWidth: 0 }}>
            <div style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "16px", padding: "20px" }}>
              <h3 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", margin: "0 0 12px 0" }}>
                Repository Stats
              </h3>
              <div style={{ fontSize: "28px", fontWeight: "800", color: "#ffffff", marginBottom: "14px" }}>
                {scanData.statistics.total_files}{" "}
                <span style={{ fontSize: "14px", fontWeight: "400", color: "#94a3b8" }}>Total Files</span>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {scanData.statistics.languages.map((lang, idx) => (
                  <span key={idx} style={{ backgroundColor: "#1e293b", color: "#a5b4fc", padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: "500" }}>
                    {lang.language}: {lang.files} ({lang.percentage}%)
                  </span>
                ))}
              </div>
            </div>

            <div style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "16px", padding: "20px" }}>
              <h3 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", margin: "0 0 12px 0" }}>
                Detected Files
              </h3>

              <div style={{ maxHeight: "360px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                {scanData.files.map((file, idx) => {
                  const isAnalyzed = Boolean(explanations[file.file_path]);
                  return (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: selectedFile === file.file_path ? "#1e1b4b" : "#020617",
                        border: selectedFile === file.file_path ? "1px solid #4f46e5" : "1px solid #1e293b",
                        borderRadius: "10px", padding: "10px 12px", display: "flex",
                        justifyContent: "space-between", alignItems: "center", gap: "8px"
                      }}
                    >
                      <span title={file.file_path} style={{ fontFamily: "monospace", fontSize: "12px", color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {isAnalyzed ? "✅ " : ""}{file.file_path}
                      </span>

                      <button
                        onClick={() => handleExplain(file.file_path)}
                        style={{
                          padding: "5px 10px", fontSize: "12px", fontWeight: "500",
                          backgroundColor: isAnalyzed ? "#1e293b" : "#2563eb",
                          color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", flexShrink: 0
                        }}
                      >
                        {isAnalyzed ? "View" : "Explain"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "16px", padding: "24px", minWidth: 0 }}>
            <h3 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>AI Code Analysis Engine</span>
              {selectedFile && (
                <span style={{ color: "#818cf8", fontFamily: "monospace", textTransform: "none", backgroundColor: "rgba(99, 102, 241, 0.1)", padding: "2px 8px", borderRadius: "6px" }}>
                  {selectedFile}
                </span>
              )}
            </h3>

            <div style={{ backgroundColor: "#020617", border: "1px solid #1e293b", borderRadius: "12px", padding: "20px", minHeight: "420px", maxHeight: "550px", overflowY: "auto" }}>
              {!selectedFile ? (
                <div style={{ height: "380px", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: "14px", textAlign: "center" }}>
                  Select a file from the left panel and click <strong style={{ color: "#94a3b8", margin: "0 4px" }}>"Explain"</strong> to analyze it with Ollama.
                </div>
              ) : explaining ? (
                <div style={{ height: "380px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#818cf8", fontSize: "14px" }}>
                  Analyzing legacy code structure with qwen2.5-coder...
                </div>
              ) : (
                <div style={{ fontSize: "14px", lineHeight: "1.7", color: "#e2e8f0", whiteSpace: "pre-wrap", wordBreak: "break-word", textAlign: "left" }}>
                  {currentExplanation}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}