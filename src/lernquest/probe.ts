// Offene Übungen („Probe“): a fixed set of stations anyone can play from a public link, without signing in and
// without the server (`lernquest/#probe=<id>`). Nothing personal: progress stays in the browser of the device. The
// content lives in `proben/`. Pure, so it is tested without a browser.
import { gemischt } from './rules';
import { PAKET_FORMAT, type Paket, type Uebung } from './types';
import { ENGLISCH5 } from './proben/englisch5';

export interface Probe {
  id: string;
  titel: string;
  untertitel: string;
  fach: string;
  stationen: { titel: string; uebungen: Uebung[] }[];
}

/** Exercises in the mixed test at the end. */
export const TEST_GROESSE = 16;

export const PROBEN: Record<string, Probe> = { [ENGLISCH5.id]: ENGLISCH5 };

export const probeAusUrl = (hash = location.hash) => /^#probe=([a-z0-9-]{1,40})$/.exec(hash)?.[1] ?? '';

/** A station as a Lernpaket, so the round of the app plays it; `stunde` is `<probe>:<n>`. */
export function stationPaket(p: Probe, n: number): Paket {
  const s = p.stationen[n];
  return {
    format: PAKET_FORMAT,
    v: 1,
    stunde: `${p.id}:${n}`,
    nummer: n + 1,
    titel: s.titel,
    modul: { id: p.id, nummer: 1, titel: p.titel, icon: '' },
    fach: p.fach,
    lang: 'en',
    uebungen: s.uebungen,
  };
}

/** The mixed test: the same share from every station, mixed by `seed`; each exercise keeps its station. */
export function probeTest(p: Probe, seed: string, n = TEST_GROESSE): { u: Uebung; stunde: string }[] {
  const je = p.stationen.map((s, i) => gemischt(s.uebungen, `${seed}:${i}`).map((u) => ({ u, stunde: `${p.id}:${i}` })));
  const out: { u: Uebung; stunde: string }[] = [];
  for (let k = 0; out.length < n && je.some((x) => x.length > k); k++) for (const x of je) if (x[k] && out.length < n) out.push(x[k]);
  return gemischt(out, `${seed}:test`);
}

/** What the device keeps: best percent per station and round, best test result. */
export interface ProbeStand {
  bestwerte: Record<string, number[]>;
  test: number | null;
}

const KEY = (id: string) => `lernquest:probe:${id}`;

export function ladeProbe(id: string): ProbeStand {
  try {
    const x = JSON.parse(localStorage.getItem(KEY(id)) ?? 'null') as Partial<ProbeStand> | null;
    return { bestwerte: x?.bestwerte && typeof x.bestwerte === 'object' ? x.bestwerte : {}, test: typeof x?.test === 'number' ? x.test : null };
  } catch {
    return { bestwerte: {}, test: null };
  }
}

export function speichereProbe(id: string, s: ProbeStand) {
  try {
    localStorage.setItem(KEY(id), JSON.stringify(s));
  } catch {
    // Private mode: progress just is not kept.
  }
}

/** The stations whose exercises were answered wrong, for „Übe noch“ after the test. */
export function schwachePunkte(p: Probe, ergebnisse: { stunde: string; richtig: boolean }[]): string[] {
  const falsch = new Set(ergebnisse.filter((e) => !e.richtig).map((e) => e.stunde));
  return p.stationen.flatMap((s, i) => (falsch.has(`${p.id}:${i}`) ? [s.titel] : []));
}
