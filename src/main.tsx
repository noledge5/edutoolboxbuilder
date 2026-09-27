import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/caprasimo/400.css';
import '@fontsource/figtree/400.css';
import '@fontsource/figtree/600.css';
import '@fontsource/figtree/700.css';
import '@fontsource/noto-sans/latin-400.css';
import '@fontsource/noto-sans/latin-ext-400.css';
import './styles/tokens.css';
import './sheet/sheet.css';
import './slides/slides.css';
import './styles/app.css';
import './library/library.css';
import './styles/print.css';
import { App } from './App';

// Offline support and "Zum Home-Bildschirm" (only in the built app, not while developing).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`./sw.js?v=${__BUILD_ID__}`).catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
