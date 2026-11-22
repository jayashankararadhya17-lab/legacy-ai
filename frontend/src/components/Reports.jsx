// import { useEffect, useState } from "react";

// export default function Reports({
//   projectId,
//   scanData,
//   explanations = {},
//   architectureData = null,
//   modernizationData = null,
//   autoGenerate = false,
//   onAutoGenerateConsumed,
// }) {
//   const [report, setReport] = useState(null);
//   const [copied, setCopied] = useState(false);

//   const isModernizationDone = Boolean(
//     modernizationData &&
//       typeof modernizationData.output === "string" &&
//       modernizationData.output.trim().length > 0 &&
//       modernizationData.targetLanguage
//   );

//   const getPrimaryLanguage = () => {
//     const langs = scanData?.statistics?.languages;
//     if (Array.isArray(langs) && langs.length > 0) {
//       return `${langs[0].language} (${langs[0].percentage}%)`;
//     }
//     if (Array.isArray(scanData?.files) && scanData.files.length > 0) {
//       return scanData.files[0].language || "Unknown";
//     }
//     return "Not scanned";
//   };

//   const buildReportMarkdown = (rep) => {
//     return [
//       `# LegacyAI Modernization Summary Report`,
//       ``,
//       `- **Project ID:** ${rep.projectId}`,
//       `- **Primary Source Language:** ${rep.primaryLanguage}`,
//       `- **Converted Target Language:** ${rep.targetLanguage}`,
//       `- **Total Files:** ${rep.totalFiles}`,
//       `- **Files Explained:** ${rep.explainedCount} / ${rep.totalFiles}`,
//       `- **Architecture Mapped:** ${rep.hasArchitecture ? "Yes" : "No"}`,
//       `- **Modernized At:** ${rep.completedAt}`,
//       `- **Report Generated At:** ${rep.generatedAt}`,
//       ``,
//       `## Language Breakdown`,
//       ...(rep.languages.length > 0
//         ? rep.languages.map(
//             (l) => `- **${l.language}:** ${l.files} file(s) (${l.percentage}%)`
//           )
//         : [`- No language statistics available`]),
//     ].join("\n");
//   };

//   const generateReportData = () => {
//     const totalFiles =
//       scanData?.statistics?.total_files ?? scanData?.files?.length ?? 0;
//     const languages = scanData?.statistics?.languages ?? [];
//     const explainedCount = Object.keys(explanations || {}).length;

//     setReport({
//       projectId: projectId || "N/A",
//       primaryLanguage: getPrimaryLanguage(),
//       targetLanguage: modernizationData.targetLanguage,
//       totalFiles,
//       explainedCount,
//       languages,
//       hasArchitecture: Boolean(architectureData),
//       completedAt: modernizationData.completedAt || "Completed",
//       generatedAt: new Date().toLocaleString(),
//     });
//     setCopied(false);
//   };

//   useEffect(() => {
//     if (autoGenerate && isModernizationDone) {
//       generateReportData();
//       if (typeof onAutoGenerateConsumed === "function") {
//         onAutoGenerateConsumed();
//       }
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [autoGenerate, isModernizationDone]);

//   const handleGenerateReport = () => {
//     if (!isModernizationDone) {
//       alert("Please complete code conversion first before generating a report.");
//       return;
//     }
//     generateReportData();
//   };

//   const handleCopyReport = async () => {
//     if (!report) return;
//     await navigator.clipboard.writeText(buildReportMarkdown(report));
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   const handleDownloadReport = () => {
//     if (!report) return;
//     const blob = new Blob([buildReportMarkdown(report)], {
//       type: "text/markdown;charset=utf-8;",
//     });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement("a");
//     link.href = url;
//     link.download = `legacyai-report-${report.projectId || "project"}.md`;
//     link.click();
//     URL.revokeObjectURL(url);
//   };

//   return (
//     <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", color: "#f8fafc" }}>
//       {/* Header Card */}
//       <div
//         style={{
//           backgroundColor: "#0f172a",
//           border: "1px solid #1e293b",
//           borderRadius: "16px",
//           padding: "24px",
//           marginBottom: "24px",
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           flexWrap: "wrap",
//           gap: "16px",
//         }}
//       >
//         <div>
//           <h2 style={{ fontSize: "20px", fontWeight: "700", margin: "0 0 6px 0", color: "#ffffff" }}>
//             Modernization Summary Reports
//           </h2>
//           <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8" }}>
//             Active Project ID:{" "}
//             <span
//               style={{
//                 fontFamily: "monospace",
//                 color: "#818cf8",
//                 backgroundColor: "rgba(99, 102, 241, 0.1)",
//                 padding: "3px 8px",
//                 borderRadius: "6px",
//               }}
//             >
//               {projectId || "None"}
//             </span>
//           </p>
//         </div>

//         <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
//           <button
//             onClick={handleGenerateReport}
//             disabled={!isModernizationDone}
//             style={{
//               padding: "10px 20px",
//               borderRadius: "10px",
//               backgroundColor: !isModernizationDone ? "#334155" : "#4f46e5",
//               color: "#ffffff",
//               fontWeight: "600",
//               fontSize: "14px",
//               border: "none",
//               cursor: !isModernizationDone ? "not-allowed" : "pointer",
//             }}
//           >
//             Generate Report
//           </button>

//           {report && (
//             <>
//               <button
//                 onClick={handleCopyReport}
//                 style={{
//                   padding: "10px 16px",
//                   borderRadius: "10px",
//                   backgroundColor: "#1e293b",
//                   color: "#e2e8f0",
//                   fontWeight: "600",
//                   fontSize: "13px",
//                   border: "1px solid #334155",
//                   cursor: "pointer",
//                 }}
//               >
//                 {copied ? "Copied!" : "Copy Markdown"}
//               </button>
//               <button
//                 onClick={handleDownloadReport}
//                 style={{
//                   padding: "10px 16px",
//                   borderRadius: "10px",
//                   backgroundColor: "#059669",
//                   color: "#ffffff",
//                   fontWeight: "600",
//                   fontSize: "13px",
//                   border: "none",
//                   cursor: "pointer",
//                 }}
//               >
//                 Download .md
//               </button>
//             </>
//           )}
//         </div>
//       </div>

//       {/* Body Card */}
//       <div
//         style={{
//           backgroundColor: "#0f172a",
//           border: "1px solid #1e293b",
//           borderRadius: "16px",
//           padding: "24px",
//           minHeight: "320px",
//         }}
//       >
//         {!isModernizationDone ? (
//           <div style={{ textAlign: "center", color: "#64748b", padding: "100px 16px", fontSize: "14px" }}>
//             Complete code conversion in the <strong style={{ color: "#94a3b8" }}>Modernization</strong> tab first, then come here and click{" "}
//             <strong style={{ color: "#94a3b8" }}>"Generate Report"</strong>.
//           </div>
//         ) : !report ? (
//           <div style={{ textAlign: "center", color: "#94a3b8", padding: "100px 16px", fontSize: "14px" }}>
//             Modernization to <strong style={{ color: "#818cf8" }}>{modernizationData.targetLanguage}</strong> is complete. Click{" "}
//             <strong style={{ color: "#ffffff" }}>"Generate Report"</strong> above to view your summary.
//           </div>
//         ) : (
//           <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
//             {/* Key Metrics Grid */}
//             <div
//               style={{
//                 display: "grid",
//                 gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
//                 gap: "16px",
//               }}
//             >
//               <div style={{ backgroundColor: "#020617", border: "1px solid #1e293b", borderRadius: "12px", padding: "16px" }}>
//                 <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>PRIMARY LANGUAGE</div>
//                 <div style={{ fontSize: "18px", fontWeight: "700", color: "#f8fafc" }}>{report.primaryLanguage}</div>
//               </div>

//               <div style={{ backgroundColor: "#020617", border: "1px solid #1e293b", borderRadius: "12px", padding: "16px" }}>
//                 <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>CONVERTED LANGUAGE</div>
//                 <div style={{ fontSize: "18px", fontWeight: "700", color: "#34d399" }}>{report.targetLanguage}</div>
//               </div>

//               <div style={{ backgroundColor: "#020617", border: "1px solid #1e293b", borderRadius: "12px", padding: "16px" }}>
//                 <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>TOTAL FILES</div>
//                 <div style={{ fontSize: "18px", fontWeight: "700", color: "#f8fafc" }}>{report.totalFiles}</div>
//               </div>

//               <div style={{ backgroundColor: "#020617", border: "1px solid #1e293b", borderRadius: "12px", padding: "16px" }}>
//                 <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>FILES EXPLAINED</div>
//                 <div style={{ fontSize: "18px", fontWeight: "700", color: "#818cf8" }}>
//                   {report.explainedCount} / {report.totalFiles}
//                 </div>
//               </div>
//             </div>

//             {/* Language Breakdown & Metadata */}
//             <div style={{ backgroundColor: "#020617", border: "1px solid #1e293b", borderRadius: "12px", padding: "18px" }}>
//               <h3 style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", margin: "0 0 12px 0" }}>
//                 Project & Conversion Summary
//               </h3>
//               <div style={{ fontSize: "13px", color: "#e2e8f0", lineHeight: "1.8" }}>
//                 <div><strong>Project ID:</strong> <span style={{ fontFamily: "monospace" }}>{report.projectId}</span></div>
//                 <div><strong>Primary Language:</strong> {report.primaryLanguage}</div>
//                 <div><strong>Converted Language:</strong> {report.targetLanguage}</div>
//                 <div><strong>Total Files:</strong> {report.totalFiles}</div>
//                 <div><strong>Files Explained:</strong> {report.explainedCount} / {report.totalFiles}</div>
//                 <div><strong>Architecture Mapped:</strong> {report.hasArchitecture ? "Yes" : "No"}</div>
//                 <div><strong>Modernized At:</strong> {report.completedAt}</div>
//                 <div><strong>Report Generated At:</strong> {report.generatedAt}</div>
//                 <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
//                   {report.languages.map((lang, idx) => (
//                     <span
//                       key={idx}
//                       style={{
//                         backgroundColor: "#1e293b",
//                         color: "#a5b4fc",
//                         padding: "4px 10px",
//                         borderRadius: "8px",
//                         fontSize: "12px",
//                       }}
//                     >
//                       {lang.language}: {lang.files} ({lang.percentage}%)
//                     </span>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

import { useEffect, useState } from "react";

export default function Reports({
  projectId,
  scanData,
  explanations = {},
  architectureData = null,
  modernizationData = null,
  autoGenerate = false,
  onAutoGenerateConsumed,
}) {
  const [report, setReport] = useState(null);
  const [copied, setCopied] = useState(false);

  const isModernizationDone = Boolean(
    modernizationData &&
      typeof modernizationData.output === "string" &&
      modernizationData.output.trim().length > 0 &&
      modernizationData.targetLanguage
  );

  const getPrimaryLanguage = () => {
    const langs = scanData?.statistics?.languages;
    if (Array.isArray(langs) && langs.length > 0) {
      return `${langs[0].language} (${langs[0].percentage}%)`;
    }
    if (Array.isArray(scanData?.files) && scanData.files.length > 0) {
      return scanData.files[0].language || "Unknown";
    }
    return "Not scanned";
  };

  const buildReportMarkdown = (rep) => {
    return [
      `# LegacyAI Modernization Summary Report`,
      ``,
      `- **Project ID:** ${rep.projectId}`,
      `- **Primary Source Language:** ${rep.primaryLanguage}`,
      `- **Converted Target Language:** ${rep.targetLanguage}`,
      `- **Total Files:** ${rep.totalFiles}`,
      `- **Files Explained:** ${rep.explainedCount} / ${rep.totalFiles}`,
      `- **Architecture Mapped:** ${rep.hasArchitecture ? "Yes" : "No"}`,
      `- **Modernized At:** ${rep.completedAt}`,
      `- **Report Generated At:** ${rep.generatedAt}`,
      ``,
      `## Language Breakdown`,
      ...(rep.languages.length > 0
        ? rep.languages.map(
            (l) => `- **${l.language}:** ${l.files} file(s) (${l.percentage}%)`
          )
        : [`- No language statistics available`]),
    ].join("\n");
  };

  const generateReportData = () => {
    const totalFiles =
      scanData?.statistics?.total_files ?? scanData?.files?.length ?? 0;
    const languages = scanData?.statistics?.languages ?? [];
    const explainedCount = Object.keys(explanations || {}).length;

    setReport({
      projectId: projectId || "N/A",
      primaryLanguage: getPrimaryLanguage(),
      targetLanguage: modernizationData.targetLanguage,
      totalFiles,
      explainedCount,
      languages,
      hasArchitecture: Boolean(architectureData),
      completedAt: modernizationData.completedAt || "Completed",
      generatedAt: new Date().toLocaleString(),
    });
    setCopied(false);
  };

  useEffect(() => {
    if (autoGenerate && isModernizationDone) {
      generateReportData();
      if (typeof onAutoGenerateConsumed === "function") {
        onAutoGenerateConsumed();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenerate, isModernizationDone]);

  const handleGenerateReport = () => {
    if (!isModernizationDone) {
      alert("Please complete code conversion first before generating a report.");
      return;
    }
    generateReportData();
  };

  const handleCopyReport = async () => {
    if (!report) return;
    await navigator.clipboard.writeText(buildReportMarkdown(report));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReport = () => {
    if (!report) return;
    const blob = new Blob([buildReportMarkdown(report)], {
      type: "text/markdown;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `legacyai-report-${report.projectId || "project"}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header Card */}
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
            Modernization Summary Report
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#94a3b8" }}>
            <span>Active Project:</span>
            <span className="project-badge">{projectId || "None"}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            className="btn btn-primary"
            onClick={handleGenerateReport}
            disabled={!isModernizationDone}
          >
            Generate Report
          </button>

          {report && (
            <>
              <button className="btn btn-secondary" onClick={handleCopyReport}>
                {copied ? "✓ Copied" : "Copy Markdown"}
              </button>
              <button className="btn btn-success" onClick={handleDownloadReport}>
                Download .md
              </button>
            </>
          )}
        </div>
      </div>

      {/* Report Body */}
      <div className="surface-card" style={{ minHeight: "340px" }}>
        {!isModernizationDone ? (
          <div className="loader-panel" style={{ minHeight: "280px" }}>
            <div className="loader-panel-title" style={{ color: "#94a3b8" }}>
              Awaiting Modernization Completion
            </div>
            <div className="loader-panel-sub">
              Convert your repository in the <strong>Modernization</strong> tab first, then click{" "}
              <strong>Generate Report</strong> to compile project metrics.
            </div>
          </div>
        ) : !report ? (
          <div className="loader-panel" style={{ minHeight: "280px" }}>
            <div className="loader-panel-title">
              Conversion to {modernizationData.targetLanguage} Ready
            </div>
            <div className="loader-panel-sub">
              Click <strong>Generate Report</strong> above to view source/target language metrics and
              file coverage.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            <div className="stats-grid">
              <div
                style={{
                  backgroundColor: "#0b111c",
                  border: "1px solid #1e293b",
                  borderRadius: "12px",
                  padding: "18px",
                }}
              >
                <div className="section-label" style={{ marginBottom: "8px" }}>
                  Primary Language
                </div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#f8fafc" }}>
                  {report.primaryLanguage}
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#0b111c",
                  border: "1px solid #1e293b",
                  borderRadius: "12px",
                  padding: "18px",
                }}
              >
                <div className="section-label" style={{ marginBottom: "8px" }}>
                  Converted Language
                </div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#34d399" }}>
                  {report.targetLanguage}
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#0b111c",
                  border: "1px solid #1e293b",
                  borderRadius: "12px",
                  padding: "18px",
                }}
              >
                <div className="section-label" style={{ marginBottom: "8px" }}>
                  Total Files
                </div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#f8fafc" }}>
                  {report.totalFiles}
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#0b111c",
                  border: "1px solid #1e293b",
                  borderRadius: "12px",
                  padding: "18px",
                }}
              >
                <div className="section-label" style={{ marginBottom: "8px" }}>
                  Files Explained
                </div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#818cf8" }}>
                  {report.explainedCount} / {report.totalFiles}
                </div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#0b111c",
                border: "1px solid #1e293b",
                borderRadius: "12px",
                padding: "20px",
              }}
            >
              <h3 className="section-label">Project & Conversion Audit Details</h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "12px",
                  fontSize: "13.5px",
                  color: "#e2e8f0",
                }}
              >
                <div>
                  <span style={{ color: "#94a3b8" }}>Project ID: </span>
                  <span className="mono">{report.projectId}</span>
                </div>
                <div>
                  <span style={{ color: "#94a3b8" }}>Primary Language: </span>
                  <strong>{report.primaryLanguage}</strong>
                </div>
                <div>
                  <span style={{ color: "#94a3b8" }}>Converted Language: </span>
                  <strong style={{ color: "#34d399" }}>{report.targetLanguage}</strong>
                </div>
                <div>
                  <span style={{ color: "#94a3b8" }}>Architecture Mapped: </span>
                  <strong>{report.hasArchitecture ? "Yes" : "No"}</strong>
                </div>
                <div>
                  <span style={{ color: "#94a3b8" }}>Modernized At: </span>
                  <span>{report.completedAt}</span>
                </div>
                <div>
                  <span style={{ color: "#94a3b8" }}>Report Generated At: </span>
                  <span>{report.generatedAt}</span>
                </div>
              </div>

              {report.languages.length > 0 && (
                <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #1e293b" }}>
                  <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "8px" }}>
                    Language Composition
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {report.languages.map((lang, idx) => (
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
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}