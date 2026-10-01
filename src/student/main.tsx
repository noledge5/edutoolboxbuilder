// Entry of the student view (…/a/#<id>): only what students need, without the editor and the library.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/caprasimo/400.css';
import '@fontsource/figtree/400.css';
import '@fontsource/figtree/600.css';
import '@fontsource/figtree/700.css';
import '@fontsource/figtree/800.css';
import '@fontsource/noto-sans/latin-400.css';
import '../styles/tokens.css';
import '../sheet/sheet.css';
import './student.css';
import { StudentApp } from './StudentApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StudentApp />
  </StrictMode>,
);
