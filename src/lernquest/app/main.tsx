// Entry of Lernquest (…/lernquest/#<Klassencode>): the children's learning app, without the editor and the library.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/fredoka/latin-ext-600.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-ext-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/nunito/latin-ext-800.css';
import './lernquest.css';
import { LernquestApp } from './LernquestApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LernquestApp />
  </StrictMode>,
);
