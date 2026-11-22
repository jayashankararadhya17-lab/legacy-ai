import { useState, useEffect } from "react";
import { getArchitecture } from "../services/api";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
});

const sanitizeMermaidCode = (text) => {
  if (!text) {
    return 'graph TD\n    A["User Input"] --> B["Core Logic"]\n    B --> C["Output Result"]';
  }

  const match = text.match(/```mermaid([\s\S]*?)```/i);
  let raw = (match ? match[1] : text).trim();

  raw = raw
    .replace(/\r\n/g, "\n")
    .replace(/;\s*/g, "\n")
    .replace(/([^\n])(\bend\b)/g, "$1\n$2")
    .replace(/(\bend\b)([^\n\r;])/g, "$1\n$2")
    .replace(/([\]\)\}])\s*([A-Za-z0-9_]+\s*(?:-->|---|\-\.->|==>|--))/g, "$1\n$2")
    .replace(/\n{2,}/g, "\n");

  raw = raw.replace(/\[([^\]"]+)\]/g, (_, label) => {
    const clean = label.replace(/"/g, "'").trim();
    return `["${clean}"]`;
  });

  if (!/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram)\b/m.test(raw)) {
    raw = `graph TD\n${raw}`;
  }

  return raw.trim();
};

const cleanReportText = (text) => {
  if (!text) return "";
  return text.replace(/```mermaid[\s\S]*?```/gi, "").trim();
};

export default function Architecture({
  projectId,
  explanations = {},
  architectureData,
  setArchitectureData,
}) {
  const [localData, setLocalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("report");
  const [zoom, setZoom] = useState(1);

  const [diagramSvg, setDiagramSvg] = useState("");
  const [diagramError, setDiagramError] = useState("");
  const [diagramSource, setDiagramSource] = useState("");

  const data = architectureData ?? localData;

  useEffect(() => {
    let cancelled = false;

    const renderDiagram = async () => {
      if (activeSubTab !== "diagram" || !data) return;

      const code = sanitizeMermaidCode(data);
      setDiagramSource(code);
      setDiagramError("");

      try {
        const renderId = `mermaid-diagram-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const { svg } = await mermaid.render(renderId, code);
        if (!cancelled) {
          setDiagramSvg(svg);
        }
      } catch (err) {
        console.error("Mermaid render error:", err);
        if (!cancelled) {
          setDiagramSvg("");
          setDiagramError(err?.message || "Failed to parse Mermaid diagram syntax.");
        }
      }
    };

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [activeSubTab, data]);

  const handleAnalyze = async () => {
    if (!projectId || loading) {
      if (!projectId) alert("No Project ID found. Please upload a project first.");
      return;
    }
    setLoading(true);
    try {
      const res = await getArchitecture(projectId, explanations);
      setLocalData(res.architecture);
      setZoom(1);
      if (typeof setArchitectureData === "function") {
        setArchitectureData(res.architecture);
      }
    } catch (error) {
      alert(error.response?.data?.detail || "Architecture analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const handleZoomIn = () => setZoom((z) => Math.min(2.5, Number((z + 0.2).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, Number((z - 0.2).toFixed(2))));
  const handleZoomReset = () => setZoom(1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div
        className="surface-card"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 6px 0", color: "#ffffff" }}>
            System Architecture & Execution Flow
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#94a3b8" }}>
            <span>Active Project:</span>
            <span className="project-badge">{projectId || "None"}</span>
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading || !projectId}>
          {loading ? (
            <>
              <span className="spinner" />
              <span>Mapping Architecture...</span>
            </>
          ) : (
            <span>{data ? "Regenerate Architecture Map" : "Generate Architecture Map"}</span>
          )}
        </button>
      </div>

      <div className="surface-card" style={{ minHeight: "430px" }}>
        {loading ? (
          <div className="loader-panel" style={{ minHeight: "360px" }}>
            <div className="spinner-lg" />
            <div className="loader-panel-title">Synthesizing system architecture & execution flows...</div>
            <div className="loader-panel-sub">
              Identifying module boundaries, control flow paths, and Mermaid diagram relationships.
            </div>
          </div>
        ) : !data ? (
          <div className="loader-panel" style={{ minHeight: "360px" }}>
            <div className="loader-panel-title" style={{ color: "#94a3b8" }}>
              Architecture Map Not Generated Yet
            </div>
            <div className="loader-panel-sub">
              Click <strong>Generate Architecture Map</strong> to build a structured execution breakdown
              and interactive flow diagram.
            </div>
          </div>
        ) : (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "20px",
                borderBottom: "1px solid #1e293b",
                paddingBottom: "14px",
              }}
            >
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  className={`btn btn-sm ${activeSubTab === "report" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setActiveSubTab("report")}
                >
                  📄 Architectural Breakdown
                </button>
                <button
                  className={`btn btn-sm ${activeSubTab === "diagram" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setActiveSubTab("diagram")}
                >
                  📊 Execution Flow Diagram
                </button>
              </div>

              {activeSubTab === "diagram" && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                    title="Zoom Out"
                  >
                    −
                  </button>
                  <span
                    className="mono"
                    style={{
                      fontSize: "12px",
                      color: "#e2e8f0",
                      minWidth: "52px",
                      textAlign: "center",
                    }}
                  >
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleZoomIn}
                    disabled={zoom >= 2.5}
                    title="Zoom In"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleZoomReset}
                    disabled={zoom === 1}
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>

            {activeSubTab === "report" && (
              <div
                style={{
                  backgroundColor: "#0b111c",
                  border: "1px solid #1e293b",
                  borderRadius: "12px",
                  padding: "22px",
                  fontSize: "14px",
                  lineHeight: "1.75",
                  color: "#e2e8f0",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {cleanReportText(data)}
              </div>
            )}

            {activeSubTab === "diagram" && (
              <div
                style={{
                  backgroundColor: "#0b111c",
                  border: "1px solid #1e293b",
                  borderRadius: "12px",
                  padding: "28px",
                  minHeight: "380px",
                  maxHeight: "620px",
                  overflow: "auto",
                }}
              >
                {diagramError ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ color: "#fca5a5", fontSize: "13.5px", fontWeight: 600 }}>
                      Diagram could not be rendered ({diagramError})
                    </div>
                    <pre
                      className="mono"
                      style={{
                        margin: 0,
                        padding: "14px",
                        borderRadius: "8px",
                        backgroundColor: "#0f1623",
                        color: "#e2e8f0",
                        fontSize: "12.5px",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {diagramSource}
                    </pre>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "flex-start",
                      transform: `scale(${zoom})`,
                      transformOrigin: "top center",
                      transition: "transform 0.14s ease",
                    }}
                    dangerouslySetInnerHTML={{ __html: diagramSvg }}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}