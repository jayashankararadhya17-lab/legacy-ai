import { useState } from "react";
import { modernizeProject } from "../services/api";

export default function Modernization({ projectId, explanations = {} }) {
  const [targetLang, setTargetLang] = useState("Python");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleModernize = async () => {
    if (!projectId) {
      alert("No Project ID found. Please upload a project first.");
      return;
    }
    setLoading(true);
    try {
      const res = await modernizeProject(projectId, targetLang, explanations);
      setData(res.modernized_output);
    } catch (error) {
      alert(error.response?.data?.detail || "Modernization failed");
    } finally {
      setLoading(false);
    }
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
            Code Modernization Engine
          </h2>
          <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8" }}>
            Active Project ID: <span style={{ fontFamily: "monospace", color: "#818cf8", backgroundColor: "rgba(99, 102, 241, 0.1)", padding: "3px 8px", borderRadius: "6px" }}>{projectId || "None"}</span>
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <label style={{ fontSize: "14px", color: "#94a3b8", fontWeight: "500" }}>Target Language:</label>
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            style={{
              backgroundColor: "#1e293b", color: "#ffffff", border: "1px solid #334155",
              padding: "8px 12px", borderRadius: "8px", fontSize: "14px", outline: "none", cursor: "pointer"
            }}
          >
            <option value="Python">Python</option>
            <option value="Java">Java</option>
            <option value="TypeScript">TypeScript</option>
            <option value="Go">Go</option>
          </select>

          <button
            onClick={handleModernize}
            disabled={loading || !projectId}
            style={{
              padding: "10px 20px", borderRadius: "10px", backgroundColor: loading || !projectId ? "#334155" : "#4f46e5",
              color: "#ffffff", fontWeight: "600", fontSize: "14px", border: "none", cursor: loading || !projectId ? "not-allowed" : "pointer"
            }}
          >
            {loading ? `Translating to ${targetLang}...` : `Convert to ${targetLang}`}
          </button>
        </div>
      </div>

      {/* Main Output Card */}
      <div style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "16px", padding: "24px", minHeight: "450px" }}>
        {!data ? (
          <div style={{ textAlign: "center", color: "#64748b", padding: "120px 0", fontSize: "14px" }}>
            Select a target language above and click <strong style={{ color: "#94a3b8" }}>"Convert"</strong> to rewrite legacy files into modern code using Ollama.
          </div>
        ) : (
          <div style={{ fontSize: "14px", lineHeight: "1.7", color: "#e2e8f0", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {data}
          </div>
        )}
      </div>
    </div>
  );
}