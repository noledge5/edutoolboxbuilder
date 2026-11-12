// The teacher's review in the workshop artifact: per figure and item „passt“ / „ändern“ and a note, stored with the
// artifact's `db` capability (collection `pruefung`), so Claude can read it (ArtifactData) in the next session.
// Locally (npm run spieltest) there is no store: the page says so and still works.
import { useCallback, useEffect, useState } from 'react';

export type Status = 'offen' | 'passt' | 'aendern';

export interface Pruefung {
  art: 'figur' | 'item' | 'bewegung' | 'gelaende';
  ziel: string;
  name: string;
  status: Status;
  notiz: string;
  geaendert: string;
}

export const pruefId = (art: Pruefung['art'], ziel: string) => `${art}--${ziel}`;

interface DocSnap {
  id: string;
  data(): Record<string, unknown> | undefined;
}
interface Db {
  collection(path: string): {
    onSnapshot(next: (s: { docs: DocSnap[] }) => void, error?: (e: { code?: string; message?: string }) => void): () => void;
    doc(id: string): { set(data: Record<string, unknown>): Promise<void> };
  };
}
declare global {
  interface Window {
    claude?: { use?: (name: string) => Promise<unknown> };
  }
}

export type Speicher = { zustand: 'laedt' } | { zustand: 'aus'; grund: string } | { zustand: 'bereit' };

export function usePruefungen() {
  const [db, setDb] = useState<Db | null>(null);
  const [speicher, setSpeicher] = useState<Speicher>({ zustand: 'laedt' });
  const [eintraege, setEintraege] = useState<Record<string, Pruefung>>({});

  useEffect(() => {
    let ab: (() => void) | undefined;
    let aus = false;
    const timer = setTimeout(() => !aus && setSpeicher((s) => (s.zustand === 'laedt' ? { zustand: 'aus', grund: 'Die Rückmeldungen antworten nicht.' } : s)), 10_000);
    const use = window.claude?.use;
    if (!use) {
      clearTimeout(timer);
      setSpeicher({ zustand: 'aus', grund: 'Diese Ansicht ist nicht das Artefakt auf claude.ai.' });
      return;
    }
    use('db')
      .then((d) => {
        if (aus) return;
        if (!d) {
          clearTimeout(timer);
          setSpeicher({ zustand: 'aus', grund: 'Speichern geht nur, wenn du bei claude.ai angemeldet bist.' });
          return;
        }
        const dbx = d as Db;
        setDb(dbx);
        ab = dbx.collection('pruefung').onSnapshot(
          (snap) => {
            clearTimeout(timer);
            const neu: Record<string, Pruefung> = {};
            for (const doc of snap.docs) {
              const x = doc.data();
              if (x) neu[doc.id] = x as unknown as Pruefung;
            }
            setEintraege(neu);
            setSpeicher({ zustand: 'bereit' });
          },
          (e) => {
            clearTimeout(timer);
            setSpeicher({ zustand: 'aus', grund: `Rückmeldungen konnten nicht geladen werden (${e.code ?? 'Fehler'}).` });
          },
        );
      })
      .catch(() => {
        clearTimeout(timer);
        setSpeicher({ zustand: 'aus', grund: 'Rückmeldungen sind hier nicht verfügbar.' });
      });
    return () => {
      aus = true;
      clearTimeout(timer);
      ab?.();
    };
  }, []);

  const speichern = useCallback(
    async (p: Omit<Pruefung, 'geaendert'>) => {
      if (!db) throw new Error('kein Speicher');
      await db.collection('pruefung').doc(pruefId(p.art, p.ziel)).set({ ...p, geaendert: new Date().toISOString() });
    },
    [db],
  );

  return { speicher, eintraege, speichern };
}
