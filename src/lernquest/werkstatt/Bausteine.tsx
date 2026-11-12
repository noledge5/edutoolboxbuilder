// Small building blocks of the workshop: chip groups, code to copy, and the review form.
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Pruefung, Speicher, Status } from './pruefung';
import { pruefId } from './pruefung';

export function Gruppe({ titel, rechts, hinweis, children }: { titel: string; rechts?: ReactNode; hinweis?: ReactNode; children: ReactNode }) {
  return (
    <div className="ws-gruppe">
      <div className="ws-gruppe-kopf">
        <h3>{titel}</h3>
        {rechts}
      </div>
      <div className="ws-chips">{children}</div>
      {hinweis && <p className="ws-hinweis">{hinweis}</p>}
    </div>
  );
}

export function Chip({ an, onClick, children, klein = false, titel }: { an: boolean; onClick: () => void; children: ReactNode; klein?: boolean; titel?: string }) {
  return (
    <button type="button" className={`ws-chip${an ? ' an' : ''}${klein ? ' klein' : ''}`} aria-pressed={an} onClick={onClick} title={titel}>
      {children}
    </button>
  );
}

/** Code for Claude (or the repository), with a copy button that falls back to selecting the text. */
export function CodeKopieren({ code, titel = 'Code für Claude' }: { code: string; titel?: string }) {
  const [meldung, setMeldung] = useState('');
  const feld = useRef<HTMLTextAreaElement>(null);
  useEffect(() => setMeldung(''), [code]);
  const kopieren = () => {
    const markieren = () => {
      feld.current?.focus();
      feld.current?.select();
      setMeldung('Markiert: jetzt mit Strg+C oder lange tippen kopieren.');
    };
    try {
      navigator.clipboard.writeText(code).then(() => setMeldung('Kopiert.'), markieren);
    } catch {
      markieren();
    }
  };
  return (
    <div className="ws-code">
      <div className="ws-gruppe-kopf">
        <h3>{titel}</h3>
        <button type="button" className="ws-chip klein" onClick={kopieren}>
          Kopieren
        </button>
      </div>
      <textarea ref={feld} readOnly value={code} rows={Math.min(14, code.split('\n').length + 1)} spellCheck={false} aria-label={titel} />
      <p className="ws-hinweis" role="status">
        {meldung}
      </p>
    </div>
  );
}

const STATUS: { s: Status; text: string }[] = [
  { s: 'passt', text: 'Passt' },
  { s: 'aendern', text: 'Bitte ändern' },
  { s: 'offen', text: 'Noch offen' },
];

export function StatusMarke({ p }: { p?: Pruefung }) {
  const s = p?.status ?? 'offen';
  return <span className={`ws-status ${s}`}>{s === 'passt' ? '✓ Passt' : s === 'aendern' ? '✎ Ändern' : 'Offen'}</span>;
}

/** The teacher's verdict on one figure, item or move, with a note for Claude. */
export function PruefFormular({
  art,
  ziel,
  name,
  eintraege,
  speicher,
  speichern,
}: {
  art: Pruefung['art'];
  ziel: string;
  name: string;
  eintraege: Record<string, Pruefung>;
  speicher: Speicher;
  speichern: (p: Omit<Pruefung, 'geaendert'>) => Promise<void>;
}) {
  const alt = eintraege[pruefId(art, ziel)];
  const [status, setStatus] = useState<Status>(alt?.status ?? 'offen');
  const [notiz, setNotiz] = useState(alt?.notiz ?? '');
  const [meldung, setMeldung] = useState('');
  const [busy, setBusy] = useState(false);
  // A newer entry from someone else (or a reload) replaces the form while it is unchanged.
  useEffect(() => {
    setStatus(alt?.status ?? 'offen');
    setNotiz(alt?.notiz ?? '');
  }, [alt?.status, alt?.notiz, ziel]);
  const geaendert = status !== (alt?.status ?? 'offen') || notiz !== (alt?.notiz ?? '');
  const id = `ws-notiz-${art}-${ziel}`;
  return (
    <form
      className="ws-pruefen"
      onSubmit={(e) => {
        e.preventDefault();
        setBusy(true);
        setMeldung('');
        speichern({ art, ziel, name, status, notiz: notiz.trim() })
          .then(() => setMeldung('Gespeichert. Claude liest das in der nächsten Sitzung.'))
          .catch(() => setMeldung('Nicht gespeichert. Prüfe, ob du angemeldet bist, und versuche es nochmal.'))
          .finally(() => setBusy(false));
      }}
    >
      <div className="ws-gruppe-kopf">
        <h3>Deine Prüfung: {name}</h3>
        <StatusMarke p={alt} />
      </div>
      <div className="ws-chips" role="radiogroup" aria-label="Urteil">
        {STATUS.map(({ s, text }) => (
          <button key={s} type="button" role="radio" aria-checked={status === s} className={`ws-chip${status === s ? ' an' : ''} urteil-${s}`} onClick={() => setStatus(s)}>
            {text}
          </button>
        ))}
      </div>
      <label htmlFor={id}>Was soll anders werden? (Pose, Farbe, Detail …)</label>
      <textarea id={id} value={notiz} rows={3} onChange={(e) => setNotiz(e.target.value)} placeholder="z. B. Schwanz buschiger, beim Winken höher" />
      {speicher.zustand === 'bereit' ? (
        <button type="submit" className="ws-haupt" disabled={busy || !geaendert} aria-busy={busy}>
          {busy ? 'Speichert …' : 'Speichern'}
        </button>
      ) : (
        <p className="ws-hinweis">
          {speicher.zustand === 'laedt' ? 'Rückmeldungen werden geladen …' : `${speicher.grund} Kommentare im Artefakt (Sprechblase oben) gehen immer.`}
        </p>
      )}
      {meldung && (
        <p className="ws-hinweis" role="status">
          {meldung}
        </p>
      )}
    </form>
  );
}
