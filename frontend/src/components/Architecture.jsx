import { useState, useEffect } from "react";
import { getArchitecture } from "../services/api";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: true,
  theme: "dark",
  securityLevel: "loose",
});

export default function Architecture({ projectId, explanations = {} }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("report"); // 'report' or 'diagram'

  useEffect(() => {
    if (activeTab === "diagram" && data) {
      setTimeout(() => {
        try {
          mermaid.contentLoaded();
        } catch (e) {
          console.error("Mermaid render error:", e);
        }
      }, 200);
    }
  }, [activeTab, data]);

  const handleAnalyze = async () => {
    if (!projectId) {
      alert("No Project ID found. Please upload a project first.");
      return;
    }
    setLoading(true);
    try {
      const res = await getArchitecture(projectId, explanations);
      setData(res.architecture);
    } catch (error) {
      alert(error.response?.data?.detail || "Architecture analysis failed");
    } finally {
      setLoading(false);
    }
  };

  // Helper to extract mermaid code block if present in AI response
  const extractMermaidCode = (text) => {
    if (!text) return "";
    const match = text.match(/```mermaid([\s\S]*?)```/);
    return match ? match[1].trim() : "graph TD;\n    A[User Input] --> B[Core Logic];\n    B --> C[Output Result];";
  };

  const cleanReportText = (text) => {
    if (!text) return "";
    return text.replace(/```mermaid[\s\S]*?```/g, "").trim();
  };

  return (
    <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", color: "#f8fafc" }}>
      {/* Top Header Card */}
      <div style={{
        backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "16px",
        padding: "24px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px"
      }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", margin: "0 0 6px 0", color: "#ffffff" }}>
            System Architecture & Flow Mapper
          </h2>
          <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8" }}>
            Active Project ID: <span style={{ fontFamily: "monospace", color: "#818cf8", backgroundColor: "rgba(99, 102, 241, 0.1)", padding: "3px 8px", borderRadius: "6px" }}>{projectId || "None"}</span>
          </p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || !projectId}
          style={{
            padding: "10px 20px", borderRadius: "10px", backgroundColor: loading || !projectId ? "#334155" : "#4f46e5",
            color: "#ffffff", fontWeight: "600", fontSize: "14px", border: "none", cursor: loading || !projectId ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Generating Architecture & Flows..." : "Generate Architecture Map"}
        </button>
      </div>

      {/* Main Content Card */}
      <div style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "16px", padding: "24px", minHeight: "450px" }}>
        {!data ? (
          <div style={{ textAlign: "center", color: "#64748b", padding: "120px 0", fontSize: "14px" }}>
            Click <strong style={{ color: "#94a3b8" }}>"Generate Architecture Map"</strong> to create plain English breakdowns, step execution lists, and live visual diagrams.
          </div>
        ) : (
          <div>
            {/* View Switcher Tabs */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px", borderBottom: "1px solid #1e293b", paddingBottom: "12px" }}>
              <button
                onClick={() => setActiveTab("report")}
                style={{
                  padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", border: "none", cursor: "pointer",
                  backgroundColor: activeTab === "report" ? "#4f46e5" : "#1e293b",
                  color: activeTab === "report" ? "#ffffff" : "#94a3b8"
                }}
              >
                📄 Plain English & Step Flow
              </button>
              <button
                onClick={() => setActiveTab("diagram")}
                style={{
                  padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", border: "none", cursor: "pointer",
                  backgroundColor: activeTab === "diagram" ? "#4f46e5" : "#1e293b",
                  color: activeTab === "diagram" ? "#ffffff" : "#94a3b8"
                }}
              >
                📊 Interactive Flow Diagram
              </button>
            </div>

            {/* Tab 1: Plain English + Steps */}
            {activeTab === "report" && (
              <div style={{ fontSize: "14px", lineHeight: "1.7", color: "#e2e8f0", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {cleanReportText(data)}
              </div>
            )}

            {/* Tab 2: Diagrammatic Flow View */}
            {activeTab === "diagram" && (
              <div style={{
                backgroundColor: "#020617", border: "1px solid #1e293b", borderRadius: "12px",
                padding: "30px", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "350px", overflowX: "auto"
              }}>
                <pre className="mermaid" style={{ background: "transparent", color: "#fff" }}>
                  {extractMermaidCode(data)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}