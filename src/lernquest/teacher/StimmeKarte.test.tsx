import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StimmeKarte } from './StimmeKarte';

const speicher = new Map<string, string>();
afterEach(() => {
  speicher.clear();
  vi.unstubAllGlobals();
});
const lokal = () =>
  vi.stubGlobal('localStorage', { getItem: (k: string) => speicher.get(k) ?? null, setItem: (k: string, v: string) => speicher.set(k, v), removeItem: (k: string) => speicher.delete(k) });

describe('Karte „Vorlesen mit guter Stimme“', () => {
  it('fragt ohne Schlüssel nach dem Google-Schlüssel', () => {
    lokal();
    const html = renderToStaticMarkup(<StimmeKarte busy={false} />);
    expect(html).toContain('Vorlesen mit guter Stimme');
    expect(html).toContain('type="password"');
    expect(html).not.toContain('Probe anhören');
  });
  it('bietet mit Schlüssel Probe und Entfernen an und zeigt den Schlüssel nicht', () => {
    lokal();
    speicher.set('lernquest:google-stimme', 'AIza-geheim');
    const html = renderToStaticMarkup(<StimmeKarte busy={false} />);
    expect(html).toContain('Probe anhören');
    expect(html).toContain('Schlüssel entfernen');
    expect(html).not.toContain('AIza-geheim');
  });
});
