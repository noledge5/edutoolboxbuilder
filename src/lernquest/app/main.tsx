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
import { BilderRahmen } from './hochgeladen';
import { ruhigAn, setzeRuhig } from './speicher';

setzeRuhig(ruhigAn());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BilderRahmen>
      <LernquestApp />
    </BilderRahmen>
  </StrictMode>,
);

// A new link in the same tab (another class code, `#probe=…`) only changes the hash: start over with it, or the page
// would stay on what it showed before.
window.addEventListener('hashchange', () => location.reload());
