import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './i18n/config.js';
import { App } from './App.js';

const rootEl = document.getElementById('root');
if (rootEl === null) {
  throw new Error('[GroundTruth] Root element #root not found in DOM');
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
