// Pictures of parts uploaded on the teacher page (supabase/migrations/20261117_lernquest_bilder.sql). They go before the
// built-in pictures (teilBilder.ts). The device keeps them in IndexedDB by part and version, so they show after a reload
// and offline; a new version replaces the old one, a deleted picture goes away (then the built-in one or the drawing
// shows again). The parts made on the teacher page come with them (`eigeneLaden`), kept in localStorage for offline.
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { createStore, del, entries, set, type UseStore } from 'idb-keyval';
import { bildDaten, bilderListe, frisurenEigen, teileEigen, teileWerte } from '../server';
import { eigeneFrisuren, eigeneTeile, readEigene, readEigeneFrisuren, readWerte, setzeEigene, setzeEigeneFrisuren, setzeWerte, type Frisur, type Teil } from '../teile';
import { BilderNeuLaden, EigeneFrisuren, EigeneTeile, HochgeladeneBilder } from './bilderKontext';

const K_EIGENE = 'lernquest:eigeneTeile';
const K_FRISUREN = 'lernquest:eigeneFrisuren';
const lesen = <T,>(key: string, read: (x: unknown) => T[]): T[] => {
  try {
    return read(JSON.parse(localStorage.getItem(key) ?? '[]'));
  } catch {
    return [];
  }
};
const merken = (key: string, liste: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(liste));
  } catch {
    // Storage full or blocked: only for now.
  }
};
// Known at once, also offline.
if (typeof localStorage !== 'undefined') {
  if (!eigeneTeile().length) setzeEigene(lesen(K_EIGENE, readEigene));
  if (!eigeneFrisuren().length) setzeEigeneFrisuren(lesen(K_FRISUREN, readEigeneFrisuren));
}

const K_WERTE = 'lernquest:teilWerte';
if (typeof localStorage !== 'undefined') setzeWerte(readWerte(lesen(K_WERTE, (x) => (Array.isArray(x) ? x : []))));

/** The teacher's values of all parts and hairstyles (rarity, where from, bonuses; offline: as last kept on the device). */
export async function werteLaden(server = teileWerte): Promise<void> {
  try {
    const raw = await server();
    if (Array.isArray(raw)) merken(K_WERTE, raw);
    setzeWerte(readWerte(raw));
  } catch {
    // Offline or an older server: keep what there is.
  }
}

/** The hair made on the teacher page from the server (offline: as last kept on the device). */
export async function frisurenLaden(server = frisurenEigen): Promise<Frisur[]> {
  try {
    const liste = readEigeneFrisuren(await server());
    merken(K_FRISUREN, liste);
    setzeEigeneFrisuren(liste);
  } catch {
    // Offline or an older server: keep what there is.
  }
  return eigeneFrisuren();
}

/** The parts made on the teacher page from the server (offline: as last kept on the device). */
export async function eigeneLaden(server = teileEigen): Promise<Teil[]> {
  try {
    const liste = readEigene(await server());
    merken(K_EIGENE, liste);
    setzeEigene(liste);
  } catch {
    // Offline or an older server: keep what there is.
  }
  return eigeneTeile();
}

export interface Gespeichert {
  version: number;
  typ: string;
  daten: ArrayBuffer;
}

let store: UseStore | undefined;
const speicher = () => (store ??= createStore('lernquest-bilder', 'bilder'));

/** What to fetch and what to drop, given the pictures kept on the device and the server's list. */
export function abgleich(
  da: Record<string, number>,
  liste: Record<string, number>,
): { holen: string[]; weg: string[] } {
  return {
    holen: Object.keys(liste).filter((id) => da[id] !== liste[id]),
    weg: Object.keys(da).filter((id) => !(id in liste)),
  };
}

export const ausBase64 = (s: string): ArrayBuffer => {
  const b = atob(s);
  const out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out.buffer;
};

/** The pictures on the device, brought up to date with the server when it answers (offline: as they are). */
export async function bilderLaden(server = { liste: bilderListe, daten: bildDaten }): Promise<Record<string, Gespeichert>> {
  const da: Record<string, Gespeichert> = {};
  try {
    for (const [k, v] of await entries<string, Gespeichert>(speicher())) da[k] = v;
  } catch {
    // No IndexedDB (private window): only what the server gives now.
  }
  let liste: Record<string, number>;
  try {
    liste = await server.liste();
  } catch {
    return da;
  }
  const { holen, weg } = abgleich(Object.fromEntries(Object.entries(da).map(([k, v]) => [k, v.version])), liste);
  for (const id of weg) {
    delete da[id];
    await del(id, speicher()).catch(() => undefined);
  }
  for (let i = 0; i < holen.length; i += 10) {
    let teil;
    try {
      teil = await server.daten(holen.slice(i, i + 10));
    } catch {
      break; // the rest next time
    }
    for (const b of teil) {
      const g: Gespeichert = { version: b.version, typ: b.typ, daten: ausBase64(b.daten) };
      da[b.teil] = g;
      await set(b.teil, g, speicher()).catch(() => undefined);
    }
  }
  return da;
}

const URLS = new Map<string, { version: number; url: string }>();

/** One object URL per part and version, freed when the version changes or the picture is gone. */
export function alsUrls(bilder: Record<string, Gespeichert>): Record<string, string> {
  for (const [id, u] of URLS)
    if (bilder[id]?.version !== u.version) {
      URL.revokeObjectURL(u.url);
      URLS.delete(id);
    }
  const out: Record<string, string> = {};
  for (const [id, b] of Object.entries(bilder)) {
    let u = URLS.get(id);
    if (!u) URLS.set(id, (u = { version: b.version, url: URL.createObjectURL(new Blob([b.daten], { type: b.typ })) }));
    out[id] = u.url;
  }
  return out;
}

/** Keeps the uploaded pictures current: on start, and when the page comes back after 10 minutes or more. A new
 *  `stand` loads again at once (the teacher page after an upload). */
export function useHochgeladen(stand = 0): { bilder: Record<string, string>; teile: Teil[]; frisuren: Frisur[] } {
  const [stand2, setStand2] = useState<{ bilder: Record<string, string>; teile: Teil[]; frisuren: Frisur[] }>({
    bilder: {},
    teile: eigeneTeile(),
    frisuren: eigeneFrisuren(),
  });
  useEffect(() => {
    let aus = false;
    let zuletzt = 0;
    const laden = () => {
      zuletzt = Date.now();
      void Promise.all([bilderLaden(), eigeneLaden(), frisurenLaden(), werteLaden()]).then(([b, teile, frisuren]) => {
        // New arrays, so pages listing parts render again (the values may have changed even if the lists did not).
        if (!aus) setStand2({ bilder: alsUrls(b), teile: [...teile], frisuren: [...frisuren] });
      });
    };
    const sichtbar = () => {
      if (document.visibilityState === 'visible' && Date.now() - zuletzt > 10 * 60_000) laden();
    };
    laden();
    document.addEventListener('visibilitychange', sichtbar);
    return () => {
      aus = true;
      document.removeEventListener('visibilitychange', sichtbar);
    };
  }, [stand]);
  return stand2;
}

/** Gives the uploaded pictures to every hero below it. */
export function BilderRahmen({ children }: { children: ReactNode }) {
  const [stand, setStand] = useState(0);
  const { bilder, teile, frisuren } = useHochgeladen(stand);
  const neu = useCallback(() => setStand((s) => s + 1), []);
  return (
    <BilderNeuLaden.Provider value={neu}>
      <EigeneTeile.Provider value={teile}>
        <EigeneFrisuren.Provider value={frisuren}>
          <HochgeladeneBilder.Provider value={bilder}>{children}</HochgeladeneBilder.Provider>
        </EigeneFrisuren.Provider>
      </EigeneTeile.Provider>
    </BilderNeuLaden.Provider>
  );
}
