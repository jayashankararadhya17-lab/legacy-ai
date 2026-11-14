import { useState } from 'react';
import FileUpload from './components/FileUpload';
import CodeAnalysis from './components/CodeAnalysis';
import Architecture from './components/Architecture';
import Modernization from './components/Modernization';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [projectId, setProjectId] = useState(null);
  
  const [scanData, setScanData] = useState(null);
  const [explanations, setExplanations] = useState({});

  const analyzedCount = Object.keys(explanations).length;

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>⚡ LegacyAI</h2>
        <p className="menu-label">WORKSPACE</p>
        <nav>
          <div className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
            ▦ Dashboard
          </div>
          <div>📁 Projects</div>
          <div className={activeTab === 'upload' ? 'active' : ''} onClick={() => setActiveTab('upload')}>
            ⬆ Upload Project
          </div>
          <div className={activeTab === 'analysis' ? 'active' : ''} onClick={() => setActiveTab('analysis')}>
            🔍 Code Analysis
          </div>
          <div className={activeTab === 'architecture' ? 'active' : ''} onClick={() => setActiveTab('architecture')}>
            🏗 Architecture
          </div>
          <div className={activeTab === 'modernization' ? 'active' : ''} onClick={() => setActiveTab('modernization')}>
            🔄 Modernization
          </div>
          <div className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>
            📄 Reports
          </div>
        </nav>
      </aside>

      <main className="main">
        <header>
          <div>
            <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
            <p>Understand, analyze and modernize legacy systems.</p>
          </div>
          <span className="status">● Local AI Ready</span>
        </header>

        {activeTab === 'dashboard' && (
          <>
            <section className="welcome">
              <h2>Welcome to LegacyAI 👋</h2>
              <p>Your intelligent legacy modernization workspace.</p>
              <button onClick={() => setActiveTab('upload')}>+ Upload Project</button>
            </section>
            <section className="stats">
              <div className="stat-card"><p>Total Projects</p><h2>{projectId ? 1 : 0}</h2></div>
              <div className="stat-card"><p>Files Analyzed</p><h2>{analyzedCount}</h2></div>
              <div className="stat-card"><p>Detected Files</p><h2>{scanData?.statistics?.total_files || 0}</h2></div>
              <div className="stat-card"><p>Modernization Plans</p><h2>{analyzedCount > 0 ? 1 : 0}</h2></div>
            </section>
          </>
        )}

        {activeTab === 'upload' && (
          <FileUpload 
            onUploadSuccess={(id) => {
              setProjectId(id);
              setScanData(null);
              setExplanations({});
              setActiveTab('analysis');
            }} 
          />
        )}

        {activeTab === 'analysis' && (
          <CodeAnalysis 
            projectId={projectId} 
            scanData={scanData}
            setScanData={setScanData}
            explanations={explanations}
            setExplanations={setExplanations}
            onProceedToArchitecture={() => setActiveTab('architecture')}
          />
        )}

        {activeTab === 'architecture' && (
          <Architecture 
            projectId={projectId} 
            scanData={scanData}
            explanations={explanations}
          />
        )}

        {activeTab === 'modernization' && (
          <Modernization 
            projectId={projectId} 
            explanations={explanations} 
          />
        )}

        {activeTab === 'reports' && (
          <div style={{ color: '#94a3b8', padding: '40px', textAlign: 'center', background: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b' }}>
            <h2>📄 Reports Module</h2>
            <p>Export full project analysis, architecture overview, and audit summaries into downloadable documentation.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;