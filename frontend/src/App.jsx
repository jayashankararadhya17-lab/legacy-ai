import { useEffect, useState } from 'react';
import FileUpload from './components/FileUpload';
import CodeAnalysis from './components/CodeAnalysis';
import Architecture from './components/Architecture';
import Modernization from './components/Modernization';
import Reports from './components/Reports';
import './App.css';

const STORAGE_PREFIX = 'legacyai_session_';

const DEFAULT_ANALYSIS_MESSAGES = [
  {
    role: 'assistant',
    content:
      'Scan the repository or explain a file, then ask any question about inputs, business rules, loops, or dependencies.',
  },
];

const DEFAULT_MODERNIZATION_STATE = {
  targetLang: 'Python',
  output: null,
  completedAt: null,
  messages: [
    {
      role: 'assistant',
      content:
        'Once conversion completes, ask any question about the modernized code, edge cases, or behavioral parity.',
    },
  ],
};

const TAB_META = {
  dashboard: {
    title: 'Executive Workspace',
    subtitle: 'Monitor legacy repository ingestion, analysis progress, and modernization readiness.',
  },
  upload: {
    title: 'Project Ingestion',
    subtitle: 'Upload a legacy source archive (.zip) or individual source file for inspection.',
  },
  analysis: {
    title: 'Code Analysis & Discovery',
    subtitle: 'Scan repository structure, inspect file logic, and query unfamiliar legacy code.',
  },
  architecture: {
    title: 'System Architecture & Flows',
    subtitle: 'Generate high-level component breakdowns and interactive execution diagrams.',
  },
  modernization: {
    title: 'Code Modernization Engine',
    subtitle: 'Translate legacy business logic into clean, modern target languages.',
  },
  reports: {
    title: 'Modernization Summary Report',
    subtitle: 'Review conversion metrics and export formal documentation.',
  },
};

function loadSession(projectId) {
  if (!projectId) return null;
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${projectId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(projectId, payload) {
  if (!projectId) return;
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${projectId}`, JSON.stringify(payload));
  } catch (err) {
    console.warn('Session storage save failed:', err);
  }
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [projectId, setProjectId] = useState(null);

  const [scanData, setScanData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [explanations, setExplanations] = useState({});
  const [analysisMessages, setAnalysisMessages] = useState(DEFAULT_ANALYSIS_MESSAGES);

  const [architectureData, setArchitectureData] = useState(null);

  const [modernizationState, setModernizationState] = useState(DEFAULT_MODERNIZATION_STATE);
  const [autoGenerateReport, setAutoGenerateReport] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    const saved = loadSession(projectId);
    if (saved) {
      setScanData(saved.scanData ?? null);
      setSelectedFile(saved.selectedFile ?? null);
      setExplanations(saved.explanations ?? {});
      setAnalysisMessages(
        Array.isArray(saved.analysisMessages) && saved.analysisMessages.length > 0
          ? saved.analysisMessages
          : DEFAULT_ANALYSIS_MESSAGES
      );
      setArchitectureData(saved.architectureData ?? null);
      setModernizationState(
        saved.modernizationState && typeof saved.modernizationState === 'object'
          ? {
              ...DEFAULT_MODERNIZATION_STATE,
              ...saved.modernizationState,
              messages:
                Array.isArray(saved.modernizationState.messages) &&
                saved.modernizationState.messages.length > 0
                  ? saved.modernizationState.messages
                  : DEFAULT_MODERNIZATION_STATE.messages,
            }
          : DEFAULT_MODERNIZATION_STATE
      );
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    saveSession(projectId, {
      scanData,
      selectedFile,
      explanations,
      analysisMessages,
      architectureData,
      modernizationState,
    });
  }, [
    projectId,
    scanData,
    selectedFile,
    explanations,
    analysisMessages,
    architectureData,
    modernizationState,
  ]);

  const analyzedCount = Object.keys(explanations).length;
  const totalFilesCount = scanData?.statistics?.total_files || 0;
  const modernizationCount = modernizationState?.output ? 1 : 0;
  const currentHeader = TAB_META[activeTab] || TAB_META.dashboard;

  const modernizationDataForReport = modernizationState?.output
    ? {
        targetLanguage: modernizationState.targetLang,
        output: modernizationState.output,
        completedAt: modernizationState.completedAt,
      }
    : null;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">⚡</div>
          <div className="brand-text">
            <h2>Code-Lingo</h2>
            <span>Modernization Suite</span>
          </div>
        </div>

        <p className="menu-label">Workspace</p>
        <nav>
          <div
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="nav-item-left">▦ Dashboard</span>
          </div>

          <div
            className={`nav-item ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <span className="nav-item-left">⬆ Upload Project</span>
            {projectId && <span className="nav-step-dot" title="Project Loaded" />}
          </div>

          <div
            className={`nav-item ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => setActiveTab('analysis')}
          >
            <span className="nav-item-left">🔍 Code Analysis</span>
            {scanData && <span className="nav-step-dot" title="Scanned" />}
          </div>

          <div
            className={`nav-item ${activeTab === 'architecture' ? 'active' : ''}`}
            onClick={() => setActiveTab('architecture')}
          >
            <span className="nav-item-left">🏗 Architecture</span>
            {architectureData && <span className="nav-step-dot" title="Mapped" />}
          </div>

          <div
            className={`nav-item ${activeTab === 'modernization' ? 'active' : ''}`}
            onClick={() => setActiveTab('modernization')}
          >
            <span className="nav-item-left">🔄 Modernization</span>
            {modernizationState?.output && <span className="nav-step-dot" title="Converted" />}
          </div>

          <div
            className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <span className="nav-item-left">📄 Reports</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          {projectId ? (
            <div>
              <div style={{ marginBottom: '4px', color: '#94a3b8', fontWeight: 500 }}>Active Session</div>
              <div className="mono" style={{ fontSize: '11px', color: '#818cf8' }}>
                {projectId.slice(0, 18)}...
              </div>
            </div>
          ) : (
            <span>No active repository</span>
          )}
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-title">
            <h1>{currentHeader.title}</h1>
            <p>{currentHeader.subtitle}</p>
          </div>
          <div className="topbar-right">
            {projectId && <span className="project-badge">ID: {projectId.slice(0, 8)}</span>}
            <span className="status-pill">
              <span className="status-dot" />
              AI Engine Ready
            </span>
          </div>
        </header>

        <div className="workspace-body">
          {activeTab === 'dashboard' && (
            <>
              <section className="hero-banner">
                <div>
                  <h2>Enterprise Legacy Modernization Workspace</h2>
                  <p>
                    Ingest legacy repositories, map system architecture, interrogate unfamiliar business
                    logic with grounded AI assistants, and convert codebases with full audit visibility.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={() => setActiveTab('upload')}>
                    + Upload New Project
                  </button>
                  {projectId && (
                    <button className="btn btn-secondary" onClick={() => setActiveTab('analysis')}>
                      Resume Analysis →
                    </button>
                  )}
                </div>
              </section>

              <section className="stats-grid">
                <div className="stat-card">
                  <p className="stat-card-label">Active Projects</p>
                  <h2 className="stat-card-value">{projectId ? 1 : 0}</h2>
                  <div className="stat-card-sub">
                    {projectId ? 'Repository staged in workspace' : 'Upload a project to begin'}
                  </div>
                </div>

                <div className="stat-card">
                  <p className="stat-card-label">Detected Files</p>
                  <h2 className="stat-card-value">{totalFilesCount}</h2>
                  <div className="stat-card-sub">
                    {scanData?.statistics?.languages?.[0]
                      ? `Primary: ${scanData.statistics.languages[0].language}`
                      : 'Awaiting repository scan'}
                  </div>
                </div>

                <div className="stat-card">
                  <p className="stat-card-label">Files Explained</p>
                  <h2 className="stat-card-value">{analyzedCount}</h2>
                  <div className="stat-card-sub">
                    {totalFilesCount > 0
                      ? `${Math.round((analyzedCount / totalFilesCount) * 100)}% coverage`
                      : 'No files explained yet'}
                  </div>
                </div>

                <div className="stat-card">
                  <p className="stat-card-label">Conversions Completed</p>
                  <h2 className="stat-card-value">{modernizationCount}</h2>
                  <div className="stat-card-sub">
                    {modernizationState?.output
                      ? `Target: ${modernizationState.targetLang}`
                      : 'Pending modernization run'}
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === 'upload' && (
            <FileUpload
              onUploadSuccess={(id) => {
                setProjectId(id);
                setScanData(null);
                setSelectedFile(null);
                setExplanations({});
                setAnalysisMessages(DEFAULT_ANALYSIS_MESSAGES);
                setArchitectureData(null);
                setModernizationState(DEFAULT_MODERNIZATION_STATE);
                setAutoGenerateReport(false);
                setActiveTab('analysis');
              }}
            />
          )}

          {activeTab === 'analysis' && (
            <CodeAnalysis
              projectId={projectId}
              scanData={scanData}
              setScanData={setScanData}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              explanations={explanations}
              setExplanations={setExplanations}
              messages={analysisMessages}
              setMessages={setAnalysisMessages}
              onProceedToArchitecture={() => setActiveTab('architecture')}
            />
          )}

          {activeTab === 'architecture' && (
            <Architecture
              projectId={projectId}
              explanations={explanations}
              architectureData={architectureData}
              setArchitectureData={setArchitectureData}
            />
          )}

          {activeTab === 'modernization' && (
            <Modernization
              projectId={projectId}
              explanations={explanations}
              modernizationState={modernizationState}
              setModernizationState={setModernizationState}
              onGoToReport={(result) => {
                if (result) {
                  setModernizationState((prev) => ({
                    ...prev,
                    targetLang: result.targetLanguage,
                    output: result.output,
                    completedAt: result.completedAt,
                  }));
                }
                setAutoGenerateReport(true);
                setActiveTab('reports');
              }}
            />
          )}

          {activeTab === 'reports' && (
            <Reports
              projectId={projectId}
              scanData={scanData}
              explanations={explanations}
              architectureData={architectureData}
              modernizationData={modernizationDataForReport}
              autoGenerate={autoGenerateReport}
              onAutoGenerateConsumed={() => setAutoGenerateReport(false)}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;