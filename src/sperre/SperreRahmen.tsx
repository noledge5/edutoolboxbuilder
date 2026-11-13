// The lock screen over the Baukasten (sperre.ts): the app keeps running behind it (nothing unsaved is lost), but is
// hidden and inert until the code is typed. Closes again after PAUSE_MINUTEN without a touch (not while presenting) and
// with „Sperren“ in the overview.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { Icon } from '../icons';
import { CODE_LAENGE, codeFehler, ladeSperre, loescheSperre, neueSperre, PAUSE_MINUTEN, pruefe, speichereSperre, type Sperre } from './sperre';
import './sperre.css';

interface SperreKontext {
  /** A code is set on this device. */
  aktiv: boolean;
  sperren(): void;
  /** Sets a new code (null removes the lock); `alt` is the current code when there is one. */
  aendern(alt: string, neu: string | null): Promise<string>;
}

const Kontext = createContext<SperreKontext>({ aktiv: false, sperren: () => {}, aendern: async () => '' });
export const useSperre = () => useContext(Kontext);

const praesentiert = () => typeof document !== 'undefined' && !!document.querySelector('.sl-present');

export function SperreRahmen({ children }: { children: ReactNode }) {
  /** undefined: still loading (nothing shows yet); null: no code on this device. */
  const [sperre, setSperre] = useState<Sperre | null | undefined>(undefined);
  const [zu, setZu] = useState(true);
  const zuletzt = useRef(Date.now());

  useEffect(() => {
    ladeSperre()
      .then((s) => setSperre(s))
      .catch(() => setSperre(null));
  }, []);

  // Every touch, click or key counts as use; the check runs every 20 s and when the page comes back.
  useEffect(() => {
    if (!sperre || zu) return;
    const benutzt = () => (zuletzt.current = Date.now());
    const pruefen = () => {
      if (praesentiert()) zuletzt.current = Date.now();
      else if (Date.now() - zuletzt.current > PAUSE_MINUTEN * 60_000) setZu(true);
    };
    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
    for (const e of events) window.addEventListener(e, benutzt, { passive: true, capture: true });
    document.addEventListener('visibilitychange', pruefen);
    const id = window.setInterval(pruefen, 20_000);
    return () => {
      for (const e of events) window.removeEventListener(e, benutzt, { capture: true });
      document.removeEventListener('visibilitychange', pruefen);
      window.clearInterval(id);
    };
  }, [sperre, zu]);

  const sperren = useCallback(() => setZu(true), []);
  const aendern = useCallback(
    async (alt: string, neu: string | null) => {
      if (sperre) {
        const r = await pruefe(sperre, alt);
        await speichereSperre(r.sperre);
        setSperre(r.sperre);
        if (r.ergebnis !== 'ok') return r.ergebnis === 'warten' ? 'Zu viele falsche Versuche. Bitte warte kurz.' : 'Der bisherige Code stimmt nicht.';
      }
      if (neu === null) {
        await loescheSperre();
        setSperre(null);
        return '';
      }
      const f = codeFehler(neu);
      if (f) return f;
      const s = await neueSperre(neu);
      await speichereSperre(s);
      setSperre(s);
      // Just set by the teacher: stays open until the next pause or „Sperren“.
      setZu(false);
      zuletzt.current = Date.now();
      return '';
    },
    [sperre],
  );

  if (sperre === undefined) return null;
  const gesperrt = !!sperre && zu;
  return (
    <Kontext.Provider value={{ aktiv: !!sperre, sperren, aendern }}>
      <div className={gesperrt ? 'sperre-dahinter' : undefined} inert={gesperrt || undefined} aria-hidden={gesperrt || undefined}>
        {children}
      </div>
      {gesperrt && (
        <Sperrbild
          sperre={sperre}
          onStand={setSperre}
          onAuf={() => {
            zuletzt.current = Date.now();
            setZu(false);
          }}
        />
      )}
    </Kontext.Provider>
  );
}

function Sperrbild({ sperre, onStand, onAuf }: { sperre: Sperre; onStand(s: Sperre): void; onAuf(): void }) {
  const [code, setCode] = useState('');
  const [meldung, setMeldung] = useState('');
  const [arbeitet, setArbeitet] = useState(false);
  const [jetzt, setJetzt] = useState(Date.now());
  const feld = useRef<HTMLInputElement>(null);
  const warten = Math.max(0, Math.ceil((sperre.bis - jetzt) / 1000));

  useEffect(() => {
    if (!warten) return;
    const id = window.setInterval(() => setJetzt(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [warten]);
  useEffect(() => feld.current?.focus(), [warten]);

  const senden = async (c: string) => {
    if (arbeitet || c.length !== CODE_LAENGE) return;
    setArbeitet(true);
    try {
      const r = await pruefe(sperre, c);
      await speichereSperre(r.sperre);
      onStand(r.sperre);
      setJetzt(Date.now());
      setCode('');
      if (r.ergebnis === 'ok') onAuf();
      else setMeldung(r.ergebnis === 'warten' ? '' : 'Der Code stimmt nicht.');
    } finally {
      setArbeitet(false);
      // The field was disabled while checking, which drops the focus.
      window.setTimeout(() => feld.current?.focus(), 0);
    }
  };

  return (
    <div className="sperre" role="dialog" aria-modal="true" aria-labelledby="sperre-titel">
      <form
        className="sperre-karte"
        onSubmit={(e) => {
          e.preventDefault();
          void senden(code);
        }}
      >
        <div className="sperre-icon">
          <Icon icon={Lock} />
        </div>
        <h1 id="sperre-titel">Baukasten gesperrt</h1>
        <p>Gib deinen Code ein ({CODE_LAENGE} Ziffern).</p>
        <input
          ref={feld}
          className="input sperre-code"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={CODE_LAENGE}
          value={code}
          disabled={warten > 0 || arbeitet}
          aria-label="Code"
          onChange={(e) => {
            const c = e.target.value.replace(/\D/g, '').slice(0, CODE_LAENGE);
            setCode(c);
            setMeldung('');
            if (c.length === CODE_LAENGE) void senden(c);
          }}
        />
        {warten > 0 ? (
          <p className="sperre-meldung" role="status">
            Zu viele falsche Versuche. Nächster Versuch in {warten >= 60 ? `${Math.ceil(warten / 60)} Min.` : `${warten} s`}.
          </p>
        ) : (
          meldung && (
            <p className="sperre-meldung" role="alert">
              {meldung}
            </p>
          )
        )}
        <details className="sperre-vergessen">
          <summary>Code vergessen?</summary>
          <p>
            Der Code liegt nur auf diesem Gerät. Lösche in den Einstellungen des Browsers die Website-Daten dieser Seite und hole danach alles über „Abgleich Mac/iPad“ vom anderen Gerät zurück. Was nur hier
            gespeichert und noch nicht abgeglichen war, geht dabei verloren.
          </p>
        </details>
      </form>
    </div>
  );
}

/** The section in the settings: set, change or remove the code of this device. */
export function SperreEinstellung() {
  const { aktiv, aendern } = useSperre();
  const [alt, setAlt] = useState('');
  const [neu, setNeu] = useState('');
  const [nochmal, setNochmal] = useState('');
  const [meldung, setMeldung] = useState('');
  const [arbeitet, setArbeitet] = useState(false);
  const nur = (s: string) => s.replace(/\D/g, '').slice(0, CODE_LAENGE);
  const los = async (entfernen: boolean) => {
    if (!entfernen && neu !== nochmal) return setMeldung('Die beiden neuen Codes sind verschieden.');
    setArbeitet(true);
    try {
      const f = await aendern(alt, entfernen ? null : neu);
      setMeldung(f || (entfernen ? 'Die Sperre ist aus.' : 'Gespeichert. Der Baukasten fragt ab jetzt nach dem Code.'));
      if (!f) {
        setAlt('');
        setNeu('');
        setNochmal('');
      }
    } finally {
      setArbeitet(false);
    }
  };
  const feld = (id: string, label: string, v: string, set: (s: string) => void) => (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} className="input" type="password" inputMode="numeric" autoComplete="off" maxLength={CODE_LAENGE} value={v} onChange={(e) => set(nur(e.target.value))} />
    </div>
  );
  return (
    <div className="settings-sperre">
      <div className="panel-section-label">Sperre auf diesem Gerät</div>
      <p className="sync-tip">
        {aktiv
          ? `Der Baukasten fragt beim Öffnen und nach ${PAUSE_MINUTEN} Minuten ohne Berührung nach deinem Code. Seiten für Kinder (Lernquest, Beamer, Aufgaben per Link) bleiben offen.`
          : `Mit einem Code (${CODE_LAENGE} Ziffern) kommen Kinder an deinem iPad oder am Beamer-Laptop nicht in Stunden, Klassen und PINs. Jedes Gerät bekommt seinen eigenen Code.`}
      </p>
      <div className="settings-year-row">
        {aktiv && feld('sp-alt', 'Bisheriger Code', alt, setAlt)}
        {feld('sp-neu', aktiv ? 'Neuer Code' : 'Code', neu, setNeu)}
        {feld('sp-nochmal', 'Noch einmal', nochmal, setNochmal)}
      </div>
      <div className="settings-sperre-knoepfe">
        <button type="button" className="btn btn-secondary ui-btn" disabled={arbeitet || neu.length !== CODE_LAENGE || (aktiv && alt.length !== CODE_LAENGE)} onClick={() => void los(false)}>
          {aktiv ? 'Code ändern' : 'Sperre einschalten'}
        </button>
        {aktiv && (
          <button type="button" className="btn btn-secondary ui-btn" disabled={arbeitet || alt.length !== CODE_LAENGE} onClick={() => void los(true)}>
            Sperre ausschalten
          </button>
        )}
      </div>
      {meldung && (
        <p className="sync-tip" role="status">
          {meldung}
        </p>
      )}
    </div>
  );
}
