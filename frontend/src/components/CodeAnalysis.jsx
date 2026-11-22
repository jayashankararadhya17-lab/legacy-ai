import { useEffect, useState } from "react";
import {
  scanProject,
  explainFile,
  getSuggestedAnalysisQuestions,
  chatAnalysis,
} from "../services/api";

export default function CodeAnalysis({
  projectId,
  scanData,
  setScanData,
  selectedFile,
  setSelectedFile,
  explanations,
  setExplanations,
  messages,
  setMessages,
  onProceedToArchitecture,
}) {
  const [loading, setLoading] = useState(false);
  const [explaining, setExplaining] = useState(false);

  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [questionInput, setQuestionInput] = useState("");
  const [asking, setAsking] = useState(false);

  const fetchSuggestions = async (currentExplanations = explanations) => {
    if (!projectId || !scanData) return;
    setLoadingSuggestions(true);
    try {
      const data = await getSuggestedAnalysisQuestions(projectId, currentExplanations);
      if (Array.isArray(data.suggested_questions)) {
        setSuggestedQuestions(data.suggested_questions);
      }
    } catch {
      setSuggestedQuestions([
        "What are the primary inputs, outputs, and control loops?",
        "Which core business calculations or rules happen in this code?",
        "What edge cases, error paths, or external dependencies exist?",
      ]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    if (projectId && scanData) {
      fetchSuggestions(explanations);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, scanData]);

  const handleScan = async () => {
    if (!projectId || loading) {
      if (!projectId) alert("No Project ID found. Please upload a project first.");
      return;
    }

    setLoading(true);
    try {
      const data = await scanProject(projectId);
      setScanData(data);
    } catch (error) {
      alert(error.response?.data?.detail || "Repository scan failed");
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = async (filePath) => {
    if (explaining) return;
    setSelectedFile(filePath);

    if (!explanations[filePath]) {
      setExplaining(true);
      try {
        const data = await explainFile(projectId, filePath);
        const updated = {
          ...explanations,
          [filePath]: data.explanation,
        };
        setExplanations(updated);
        fetchSuggestions(updated);
      } catch (error) {
        alert(error.response?.data?.detail || "File explanation failed");
      } finally {
        setExplaining(false);
      }
    }
  };

  const sendQuestion = async (rawQuestion, clearInput = false) => {
    const trimmed = (rawQuestion ?? questionInput).trim();
    if (!trimmed || asking) return;
    if (!projectId || !scanData) {
      alert("Run a repository scan first so the assistant has codebase context.");
      return;
    }

    if (clearInput) {
      setQuestionInput("");
    }

    const nextHistory = [...messages, { role: "user", content: trimmed }];
    setMessages(nextHistory);
    setAsking(true);

    try {
      const historyForApi = nextHistory
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-6);

      const data = await chatAnalysis(projectId, {
        question: trimmed,
        explanations,
        history: historyForApi,
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer || "No answer returned." },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${error.response?.data?.detail || "Unable to answer question."}`,
        },
      ]);
    } finally {
      setAsking(false);
    }
  };

  const handleAskSubmit = (e) => {
    e.preventDefault();
    sendQuestion(questionInput, true);
  };

  const currentExplanation = selectedFile ? explanations[selectedFile] : null;

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
            Repository Scanner & File Inspector
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#94a3b8" }}>
            <span>Active Project:</span>
            <span className="project-badge">{projectId || "None (Upload first)"}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={handleScan} disabled={loading || !projectId}>
            {loading ? (
              <>
                <span className="spinner" />
                <span>Scanning Repository...</span>
              </>
            ) : (
              <span>{scanData ? "Re-run Repository Scan" : "Run Repository Scan"}</span>
            )}
          </button>

          {scanData && (
            <button className="btn btn-success" onClick={onProceedToArchitecture}>
              Next: Architecture →
            </button>
          )}
        </div>
      </div>

      {loading && !scanData && (
        <div className="surface-card">
          <div className="loader-panel">
            <div className="spinner-lg" />
            <div className="loader-panel-title">Scanning repository files and detecting languages...</div>
            <div className="loader-panel-sub">
              Indexing source files, computing language distribution, and preparing codebase context.
            </div>
          </div>
        </div>
      )}

      {scanData && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "330px 1fr",
              gap: "24px",
              alignItems: "start",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", minWidth: 0 }}>
              <div className="surface-card" style={{ padding: "20px" }}>
                <h3 className="section-label">Repository Overview</h3>
                <div style={{ fontSize: "30px", fontWeight: 700, color: "#ffffff", marginBottom: "14px" }}>
                  {scanData.statistics.total_files}{" "}
                  <span style={{ fontSize: "13.5px", fontWeight: 500, color: "#94a3b8" }}>
                    Source File(s)
                  </span>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {scanData.statistics.languages.map((lang, idx) => (
                    <span
                      key={idx}
                      style={{
                        backgroundColor: "#151e2e",
                        border: "1px solid #334155",
                        color: "#c7d2fe",
                        padding: "4px 10px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: 500,
                      }}
                    >
                      {lang.language}: {lang.files} ({lang.percentage}%)
                    </span>
                  ))}
                </div>
              </div>

              <div className="surface-card" style={{ padding: "20px" }}>
                <h3 className="section-label">Detected Files</h3>

                <div
                  style={{
                    maxHeight: "390px",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {scanData.files.map((file, idx) => {
                    const isAnalyzed = Boolean(explanations[file.file_path]);
                    const isSelected = selectedFile === file.file_path;
                    const isFileLoading = explaining && isSelected;

                    return (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: isSelected ? "rgba(79, 70, 229, 0.14)" : "#0b111c",
                          border: isSelected ? "1px solid #4f46e5" : "1px solid #1e293b",
                          borderRadius: "10px",
                          padding: "10px 12px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <span
                          className="mono"
                          title={file.file_path}
                          style={{
                            fontSize: "12px",
                            color: "#e2e8f0",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {isAnalyzed ? "✓ " : ""}
                          {file.file_path}
                        </span>

                        <button
                          className={`btn btn-sm ${isAnalyzed ? "btn-secondary" : "btn-primary"}`}
                          disabled={explaining}
                          onClick={() => handleExplain(file.file_path)}
                        >
                          {isFileLoading ? (
                            <>
                              <span className="spinner" style={{ width: "12px", height: "12px" }} />
                              <span>Analyzing</span>
                            </>
                          ) : isAnalyzed ? (
                            "View"
                          ) : (
                            "Explain"
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="surface-card" style={{ minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                  gap: "10px",
                }}
              >
                <h3 className="section-label" style={{ margin: 0 }}>
                  AI Code Analysis Output
                </h3>
                {selectedFile && <span className="project-badge">{selectedFile}</span>}
              </div>

              <div
                style={{
                  backgroundColor: "#0b111c",
                  border: "1px solid #1e293b",
                  borderRadius: "12px",
                  padding: "22px",
                  minHeight: "430px",
                  maxHeight: "560px",
                  overflowY: "auto",
                }}
              >
                {!selectedFile ? (
                  <div className="loader-panel" style={{ minHeight: "370px" }}>
                    <div className="loader-panel-title" style={{ color: "#94a3b8" }}>
                      No File Selected
                    </div>
                    <div className="loader-panel-sub">
                      Choose a file from the left panel and click <strong>Explain</strong> to inspect
                      its structure, inputs, business rules, and dependencies.
                    </div>
                  </div>
                ) : explaining ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "12px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#818cf8", fontSize: "13.5px", fontWeight: 600 }}>
                      <span className="spinner" style={{ borderTopColor: "#818cf8" }} />
                      <span>Analyzing {selectedFile} with AI engine...</span>
                    </div>
                    <div className="skeleton-line" style={{ width: "45%" }} />
                    <div className="skeleton-line" style={{ width: "92%" }} />
                    <div className="skeleton-line" style={{ width: "86%" }} />
                    <div className="skeleton-line" style={{ width: "74%" }} />
                    <div style={{ height: "10px" }} />
                    <div className="skeleton-line" style={{ width: "38%" }} />
                    <div className="skeleton-line" style={{ width: "95%" }} />
                    <div className="skeleton-line" style={{ width: "80%" }} />
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: "14px",
                      lineHeight: "1.75",
                      color: "#e2e8f0",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {currentExplanation}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="surface-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "14px",
              }}
            >
              <div>
                <h3 className="section-label" style={{ margin: "0 0 4px 0" }}>
                  Legacy Codebase Assistant
                </h3>
                <p style={{ margin: 0, fontSize: "12.5px", color: "#94a3b8" }}>
                  Grounded strictly in scanned source files and generated explanations.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => fetchSuggestions(explanations)}
                disabled={loadingSuggestions}
              >
                {loadingSuggestions ? (
                  <>
                    <span className="spinner" style={{ width: "12px", height: "12px" }} />
                    <span>Refreshing...</span>
                  </>
                ) : (
                  <span>Refresh Question Options</span>
                )}
              </button>
            </div>

            {suggestedQuestions.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="chip-button"
                    disabled={asking}
                    onClick={() => sendQuestion(q, false)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div className="chat-box">
              {messages.map((msg, idx) => (
                <div key={idx} className={`chat-bubble ${msg.role}`}>
                  {msg.content}
                </div>
              ))}
              {asking && (
                <div className="chat-bubble assistant">
                  <div className="typing-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleAskSubmit} style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                className="input-field"
                style={{ flex: 1 }}
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                placeholder="Ask a question about the legacy codebase..."
                disabled={asking}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={asking || !questionInput.trim()}
              >
                {asking ? (
                  <>
                    <span className="spinner" />
                    <span>Asking...</span>
                  </>
                ) : (
                  <span>Ask</span>
                )}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}