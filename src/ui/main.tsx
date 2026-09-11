/**
 * Browser entry point (ticket 04; restyled in ticket 08): mounts the
 * one-screen chat UI. Libre Franklin is self-hosted via
 * @fontsource-variable/libre-franklin (no fonts.gstatic.com round-trip); the
 * Latin subset file is preloaded so the swap-in is fast.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import latinFontUrl from '@fontsource-variable/libre-franklin/files/libre-franklin-latin-wght-normal.woff2?url';
import '@fontsource-variable/libre-franklin/wght.css';
import './styles/reset.css';
import './styles/tokens.css';
import App from './App.js';

const preload = document.createElement('link');
preload.rel = 'preload';
preload.as = 'font';
preload.type = 'font/woff2';
preload.href = latinFontUrl;
preload.crossOrigin = 'anonymous';
document.head.appendChild(preload);

const rootEl = document.getElementById('root');
if (rootEl == null) {
  throw new Error('main.tsx: #root element missing from index.html');
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
