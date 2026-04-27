// ═════════════════════════════════════════════════════════════════════════
// Browser polyfills — MUST run before any @react-pdf/renderer or buffer
// dependency is evaluated. Keep at the very top.
// ═════════════════════════════════════════════════════════════════════════
import { Buffer } from 'buffer';
(globalThis as any).Buffer = Buffer;
(globalThis as any).global = globalThis;
if (typeof (globalThis as any).process === 'undefined') {
  (globalThis as any).process = { env: {}, version: '', platform: 'browser' };
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

if (import.meta.env.DEV) {
  window.addEventListener('unhandledrejection', (e) => {
    console.warn('[unhandledrejection]', e.reason);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
