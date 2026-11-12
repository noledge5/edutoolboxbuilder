// Entry of the figure workshop (lernquest/werkstatt.html). Not in the production build: see Werkstatt.tsx.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import './werkstatt.css';
import { Werkstatt } from './Werkstatt';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Werkstatt />
  </StrictMode>,
);
