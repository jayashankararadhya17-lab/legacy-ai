import { useState } from "react";
import { modernizeProject, chatModernization } from "../services/api";

const TARGET_LANGUAGES = [
  "Python",
  "Java",
  "TypeScript",
  "Go",
  "C",
  "C++",
  "C#",
  "Rust",
  "Kotlin",
];

const STARTER_QUESTIONS = [
  "How does the modernized code preserve the original legacy behavior?",
  "Are there any edge cases, error handling gaps, or dependencies to verify?",
  "How can I run or test this modernized code locally?",
];

function extensionForLanguage(lang) {
  const map = {
    Python: ".py",
    Java: ".java",
    TypeScript: ".ts",
    JavaScript: ".js",
    Go: ".go",
    C: ".c",
    "C++": ".cpp",
    "C#": ".cs",
    Rust: ".rs",
    Kotlin: ".kt",
  };
  return map[lang] || "";
}

function splitTopLevelDeclarations(code, fallbackLang) {
  const trimmed = (code || "").trim();
  if (!trimmed) return [];

  // Match top-level class / interface / enum / struct declarations in Java, C#, TypeScript, C++, Rust, Go
  const declRegex =
    /^(?:public\s+|private\s+|protected\s+|internal\s+|final\s+|abstract\s+|export\s+|static\s+)*(?:class|interface|enum|struct)\s+([A-Za-z_][A-Za-z0-9_]*)/gm;

  const matches = [];
  let m;
  while ((m = declRegex.exec(trimmed)) !== null) {
    // Only treat as top-level if indentation before keyword is 0-2 spaces
    const lineStart = trimmed.lastIndexOf("\n", m.index - 1) + 1;
    const prefix = trimmed.slice(lineStart, m.index);
    if (prefix.length <= 2) {
      matches.push({
        name: m[1],
        index: lineStart,
      });
    }
  }

  if (matches.length <= 1) {
    return [];
  }

  const ext = extensionForLanguage(fallbackLang);
  const leadingHeader = trimmed.slice(0, matches[0].index).trim();
  const units = [];

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : trimmed.length;
    let chunk = trimmed.slice(start, end).trim();

    // Include leading imports/package only on the first unit if present
    if (i === 0 && leadingHeader) {
      chunk = `${leadingHeader}\n\n${chunk}`;
    }

    const className = matches[i].name;
    const fileTitle = ext ? `${className}${ext}` : className;

    units.push({
      id: `unit-${className}-${i}`,
      title: fileTitle,
      language: fallbackLang,
      content: chunk,
    });
  }

  return units;
}

function parseModernizedFiles(rawText, fallbackLang) {
  if (!rawText || typeof rawText !== "string") return [];

  const text = rawText.trim();
  const blocks = [];

  const fenceRegex =
    /(?:^|\n)(?:(?:#+|\*\*|File:|Filename:|Path:)?\s*([^\n`]+?)\s*(?:\*\*|:)?\s*\n)?```([a-zA-Z0-9#+_-]*)\n([\s\S]*?)```/g;
  let match;

  while ((match = fenceRegex.exec(text)) !== null) {
    const rawHeader = (match[1] || "").trim();
    const langTag = (match[2] || fallbackLang || "Code").trim();
    const codeContent = (match[3] || "").trim();
    if (!codeContent) continue;

    const fileMatch = rawHeader.match(
      /([A-Za-z0-9_./-]+\.(?:py|java|ts|tsx|js|jsx|go|c|h|cpp|hpp|cc|cs|rs|kt|sql|json|yaml|yml|md|txt))/i
    );

    const splitClasses = splitTopLevelDeclarations(codeContent, fallbackLang);
    if (splitClasses.length > 1) {
      splitClasses.forEach((u) => blocks.push(u));
      continue;
    }

    const title = fileMatch
      ? fileMatch[1]
      : rawHeader && !rawHeader.startsWith("```")
        ? rawHeader.replace(/^[#*\-\s]+|[*]+$/g, "").trim()
        : `${fallbackLang} File ${blocks.length + 1}`;

    blocks.push({
      id: `${title}-${blocks.length}`,
      title,
      language: langTag || fallbackLang,
      content: codeContent,
    });
  }

  if (blocks.length === 0) {
    const splitClasses = splitTopLevelDeclarations(text, fallbackLang);
    if (splitClasses.length > 1) {
      return splitClasses;
    }
  }

  return blocks;
}

export default function Modernization({
  projectId,
  explanations = {},
  modernizationState,
  setModernizationState,
  onGoToReport,
}) {
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [questionInput, setQuestionInput] = useState("");
  const [asking, setAsking] = useState(false);

  const targetLang = modernizationState?.targetLang || "Python";
  const data = modernizationState?.output || null;
  const completedAt = modernizationState?.completedAt || null;
  const messages = modernizationState?.messages || [];

  const parsedFiles = data ? parseModernizedFiles(data, targetLang) : [];

  const handleTargetLangChange = (newLang) => {
    setModernizationState((prev) => ({
      ...prev,
      targetLang: newLang,
    }));
  };

  const handleModernize = async () => {
    if (!projectId || loading) {
      if (!projectId) alert("No Project ID found. Please upload a project first.");
      return;
    }
    setLoading(true);
    try {
      const res = await modernizeProject(projectId, targetLang, explanations);
      const outputText = res?.modernized_output ?? "";
      const timestamp = new Date().toLocaleString();

      setModernizationState((prev) => ({
        ...prev,
        targetLang,
        output: outputText,
        completedAt: timestamp,
        messages: [
          {
            role: "assistant",
            content: `Converted project to ${targetLang}. Ask me anything about this ${targetLang} implementation or how it maps back to the legacy code.`,
          },
        ],
      }));
    } catch (error) {
      alert(error.response?.data?.detail || "Modernization failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBlock = async (blockId, textToCopy) => {
    if (!textToCopy) return;
    await navigator.clipboard.writeText(textToCopy);
    setCopiedId(blockId);
    setTimeout(() => {
      setCopiedId((prev) => (prev === blockId ? null : prev));
    }, 2000);
  };

  const handleGenerateReportClick = () => {
    if (!data) return;
    const payload = {
      targetLanguage: targetLang,
      output: data,
      completedAt: completedAt || new Date().toLocaleString(),
    };
    if (typeof onGoToReport === "function") {
      onGoToReport(payload);
    }
  };

  const sendQuestion = async (rawQuestion) => {
    const trimmed = (rawQuestion ?? questionInput).trim();
    if (!trimmed || asking) return;
    if (!projectId || !data) {
      alert("Convert the code first so I can answer questions about the modernized output.");
      return;
    }

    setQuestionInput("");

    const nextHistory = [...messages, { role: "user", content: trimmed }];
    setModernizationState((prev) => ({
      ...prev,
      messages: nextHistory,
    }));
    setAsking(true);

    try {
      const historyForApi = nextHistory
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-6);

      const res = await chatModernization(projectId, {
        question: trimmed,
        modernized_output: data,
        target_language: targetLang,
        include_legacy_context: true,
        explanations,
        history: historyForApi,
      });

      setModernizationState((prev) => ({
        ...prev,
        messages: [
          ...(prev.messages || []),
          { role: "assistant", content: res.answer || "No answer returned." },
        ],
      }));
    } catch (error) {
      setModernizationState((prev) => ({
        ...prev,
        messages: [
          ...(prev.messages || []),
          {
            role: "assistant",
            content: `Error: ${error.response?.data?.detail || "Could not answer question."}`,
          },
        ],
      }));
    } finally {
      setAsking(false);
    }
  };

  const handleAskSubmit = (e) => {
    e.preventDefault();
    sendQuestion(questionInput);
  };

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
            Code Modernization Engine
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#94a3b8" }}>
            <span>Active Project:</span>
            <span className="project-badge">{projectId || "None"}</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
            backgroundColor: "#0b111c",
            border: "1px solid #1e293b",
            padding: "8px 12px",
            borderRadius: "12px",
          }}
        >
          <label
            htmlFor="target-lang-select"
            style={{
              fontSize: "13px",
              color: "#e2e8f0",
              fontWeight: 600,
              display: "inline-block",
            }}
          >
            Target Language:
          </label>
          <select
            id="target-lang-select"
            className="select-field"
            value={targetLang}
            disabled={loading}
            onChange={(e) => handleTargetLangChange(e.target.value)}
            style={{ minWidth: "130px" }}
          >
            {TARGET_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>

          <button
            className="btn btn-primary"
            onClick={handleModernize}
            disabled={loading || !projectId}
          >
            {loading ? (
              <>
                <span className="spinner" />
                <span>Converting to {targetLang}...</span>
              </>
            ) : (
              <span>Convert to {targetLang}</span>
            )}
          </button>

          {data && !loading && (
            <button type="button" className="btn btn-success" onClick={handleGenerateReportClick}>
              Generate Report →
            </button>
          )}
        </div>
      </div>

      <div className="surface-card" style={{ minHeight: "360px" }}>
        {loading ? (
          <div className="loader-panel" style={{ minHeight: "310px" }}>
            <div className="spinner-lg" />
            <div className="loader-panel-title">Translating legacy logic into {targetLang}...</div>
            <div className="loader-panel-sub">
              Preserving business rules, control structures, and data types in clean {targetLang} syntax.
            </div>
          </div>
        ) : !data ? (
          <div className="loader-panel" style={{ minHeight: "310px" }}>
            <div className="loader-panel-title" style={{ color: "#94a3b8" }}>
              Ready to Modernize
            </div>
            <div className="loader-panel-sub">
              Select your target language above and click <strong>Convert to {targetLang}</strong> to
              generate production-ready code.
            </div>
          </div>
        ) : parsedFiles.length > 1 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <span className="section-label" style={{ margin: 0 }}>
                Converted {targetLang} Files ({parsedFiles.length} Separate File Boxes)
              </span>
            </div>

            {parsedFiles.map((fileBlock) => (
              <div
                key={fileBlock.id}
                style={{
                  backgroundColor: "#0b111c",
                  border: "1px solid #1e293b",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#151e2e",
                    borderBottom: "1px solid #1e293b",
                    padding: "10px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                    <span className="mono" style={{ fontSize: "13px", fontWeight: 600, color: "#f8fafc" }}>
                      {fileBlock.title}
                    </span>
                    <span className="project-badge">{fileBlock.language}</span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleCopyBlock(fileBlock.id, fileBlock.content)}
                  >
                    {copiedId === fileBlock.id ? "✓ Copied File" : "Copy"}
                  </button>
                </div>

                <pre
                  className="mono"
                  style={{
                    margin: 0,
                    padding: "18px",
                    fontSize: "13px",
                    lineHeight: "1.65",
                    color: "#e2e8f0",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    maxHeight: "460px",
                    overflowY: "auto",
                  }}
                >
                  {fileBlock.content}
                </pre>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
              }}
            >
              <span className="section-label" style={{ margin: 0 }}>
                {parsedFiles[0]?.title || `Converted ${targetLang} Output`}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() =>
                  handleCopyBlock("single-output", parsedFiles[0]?.content || data)
                }
              >
                {copiedId === "single-output" ? "✓ Copied File" : "Copy"}
              </button>
            </div>

            <pre
              className="mono"
              style={{
                margin: 0,
                backgroundColor: "#0b111c",
                border: "1px solid #1e293b",
                borderRadius: "12px",
                padding: "20px",
                fontSize: "13px",
                lineHeight: "1.7",
                color: "#e2e8f0",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                maxHeight: "520px",
                overflowY: "auto",
              }}
            >
              {parsedFiles[0]?.content || data}
            </pre>
          </div>
        )}
      </div>

      {data && !loading && (
        <div className="surface-card">
          <div style={{ marginBottom: "14px" }}>
            <h3 className="section-label" style={{ margin: "0 0 4px 0" }}>
              Modernized {targetLang} Code Assistant
            </h3>
            <p style={{ margin: 0, fontSize: "12.5px", color: "#94a3b8" }}>
              Verify how legacy logic was translated, inspect assumptions, or ask how to run tests.
            </p>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
            {STARTER_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                type="button"
                className="chip-button"
                disabled={asking}
                onClick={() => sendQuestion(q)}
              >
                {q}
              </button>
            ))}
          </div>

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
              placeholder={`Ask about the converted ${targetLang} code...`}
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
      )}
    </div>
  );
}