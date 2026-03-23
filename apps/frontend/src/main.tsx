import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// TODO Fase 6: import App from './App.js'
// TODO Fase 6: import './i18n/config.js'

const rootEl = document.getElementById('root');
if (rootEl === null) {
  throw new Error('[GroundTruth] Root element #root not found in DOM');
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <div className="min-h-screen bg-base-100 flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-primary">GroundTruth</h1>
        <p className="text-base-content/60">
          DePIN Agro Oracle on Solana — scaffold ready
        </p>
        <div className="badge badge-accent">Phase 0 ✓</div>
      </div>
    </div>
  </React.StrictMode>,
);
