// Boss fight with answer cards: the teacher's scan device (iPad or iPhone with the Baukasten). The projector shows the
// fight (Beamer view, its own window or device); here the teacher scans the cards and steps the fight. Each read card
// goes to the server (lq_boss_karten) as child id → option; the last scan counts until „Auflösen“. The server reckons
// damage, hearts, chests and class points. Without network the scanning stops (no queue, docs/lernquest.md).
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, Camera, CameraOff, Check, ChevronRight, Eye, EyeOff, Swords } from 'lucide-react';
import { Icon } from '../../icons';
import { ANTWORTEN, type Antwort } from '../karten/code';
import { useKartenScan } from '../karten/useKartenScan';
import { bossBeamer, bossBeenden, bossKarten, bossWeiter, lqText, type BossBeamerStand } from '../server';
import type { KartenKind } from './Antwortkarten';

/** How often the fight is asked for and read cards are sent. */
const TAKT_MS = 1000;
const SENDEN_MS = 400;

interface Props {
  keys: string[];
  id: string;
  titel: string;
  kinder: KartenKind[];
  onClose(): void;
}

export function BossScan({ keys, id, titel, kinder, onClose }: Props) {
  const [s, setS] = useState<BossBeamerStand | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [scannen, setScannen] = useState(false);
  const [namen, setNamen] = useState(false);
  /** Card number → answer read for the current question (shown here, sent to the server). */
  const [antworten, setAntworten] = useState<Record<number, Antwort>>({});
  /** Child id → option not yet sent. */
  const offen = useRef(new Map<string, number>());
  const frageRef = useRef(-1);
  /** Set below once the scanner exists: forgets what was counted, so the same answer counts again in a new question. */
  const vergessen = useRef<() => void>(() => {});

  const holen = useCallback(async () => {
    try {
      setS(await bossBeamer(keys, id));
      setMsg((m) => (m.startsWith('Keine Verbindung') ? '' : m));
    } catch (e) {
      setMsg(e instanceof TypeError ? 'Keine Verbindung. Scannen angehalten.' : lqText(e));
      if (e instanceof TypeError) setScannen(false);
    }
  }, [keys, id]);

  useEffect(() => {
    void holen();
    if (s?.phase === 'ende') return;
    const t = window.setInterval(() => void holen(), TAKT_MS);
    return () => window.clearInterval(t);
  }, [holen, s?.phase]);

  // A new question: clear what was read.
  const frage = s?.frage ?? -1;
  const phase = s?.phase;
  useEffect(() => {
    if (frageRef.current !== frage) {
      frageRef.current = frage;
      offen.current.clear();
      setAntworten({});
      vergessen.current();
    }
  }, [frage]);
  useEffect(() => {
    if (phase !== 'frage') setScannen(false);
  }, [phase]);

  const senden = useCallback(async () => {
    if (!offen.current.size || frageRef.current < 0) return;
    const teil = Object.fromEntries(offen.current);
    const f = frageRef.current;
    offen.current.clear();
    try {
      await bossKarten(keys, id, f, teil);
    } catch (e) {
      // Not sent: keep them unless a newer scan replaced them, then stop (no queue without network).
      for (const [k, v] of Object.entries(teil)) if (!offen.current.has(k) && frageRef.current === f) offen.current.set(k, v);
      setScannen(false);
      setMsg(e instanceof TypeError ? 'Keine Verbindung. Scannen angehalten.' : lqText(e));
    }
  }, [keys, id]);

  useEffect(() => {
    if (!scannen) return;
    const t = window.setInterval(() => void senden(), SENDEN_MS);
    return () => window.clearInterval(t);
  }, [scannen, senden]);

  const nachNummer = new Map(kinder.map((k) => [k.nummer, k]));
  const scan = useKartenScan(scannen && phase === 'frage', (n: number, a: Antwort) => {
    const kind = nachNummer.get(n);
    const wahl = ANTWORTEN.indexOf(a);
    if (!s || s.phase !== 'frage' || !kind || wahl < 0 || wahl >= s.optionen.length) return;
    offen.current.set(kind.id, wahl);
    setAntworten((x) => (x[n] === a ? x : { ...x, [n]: a }));
  });

  vergessen.current = scan.neu;

  const weiter = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (s?.phase === 'frage') await senden();
      setScannen(false);
      setS(await bossWeiter(keys, id));
      setMsg('');
    } catch (e) {
      setMsg(e instanceof TypeError ? 'Keine Verbindung.' : lqText(e));
    } finally {
      setBusy(false);
    }
  };

  const beenden = async () => {
    if (!window.confirm('Den Bosskampf beenden? Es gibt dann keine Truhe.')) return;
    try {
      setS(await bossBeenden(keys, id));
    } catch (e) {
      setMsg(lqText(e));
    }
  };

  const gelesen = Object.keys(antworten).length;
  const aufgeloest = s?.phase === 'aufloesung' || s?.phase === 'ende';
  const richtig = s?.richtig ?? -1;

  return (
    <div className="app lqt-runde">
      <header className="topbar">
        <button type="button" className="iconbtn topbar-back" onClick={onClose} title="Zurück" aria-label="Zurück zur Klasse">
          <Icon icon={ArrowLeft} size={18} />
        </button>
        <div className="topbar-name">
          <div className="topbar-title">Bosskampf mit Karten · {titel}</div>
          <div className="topbar-place">
            {!s
              ? 'Einen Moment …'
              : s.phase === 'warten'
                ? 'Bereit. Die Fragen stehen am Beamer.'
                : s.phase === 'ende'
                  ? s.sieg
                    ? 'Gewonnen!'
                    : 'Der Boss ist entkommen.'
                  : `Frage ${s.frage + 1} von ${s.fragen} · Boss ${s.lp} / ${s.lpMax} · ${s.herzen} Herzen`}
          </div>
        </div>
        <button type="button" className="btn btn-ghost ui-btn" onClick={() => setNamen(!namen)} aria-pressed={namen}>
          <Icon icon={namen ? EyeOff : Eye} />
          {namen ? 'Namen verbergen' : 'Namen zeigen'}
        </button>
      </header>
      <main className="lqt-runde-main">
        <section className="lqt-runde-buehne" aria-live="polite">
          {s && s.phase !== 'warten' && s.frage >= 0 && (
            <>
              <p className="lqt-runde-auftrag">{s.text}</p>
              {s.aussage && <p className="lqt-runde-aussage">{s.aussage}</p>}
              <ol className="lqt-runde-optionen">
                {s.optionen.map((o, k) => (
                  <li key={k} className={`lqt-runde-option ${aufgeloest && k === richtig ? 'is-richtig' : ''} ${aufgeloest && k !== richtig ? 'is-falsch' : ''}`}>
                    <span className="lqt-runde-buchstabe">{ANTWORTEN[k]}</span>
                    <span className="lqt-runde-text">{o}</span>
                    {aufgeloest && k === richtig && <Icon icon={Check} size={22} />}
                    {aufgeloest && s.verteilung && <Balken n={s.verteilung[k] ?? 0} von={s.verteilung.reduce((x, y) => x + y, 0)} />}
                  </li>
                ))}
              </ol>
            </>
          )}
          {s?.phase === 'warten' && (
            <p className="lqt-hint">
              Am Beamer steht der Boss. „Los geht’s!“ zeigt die erste Frage; dann halten die Kinder ihre Karten hoch und du scannst. Wer erkannt ist, tritt bei und wird am Beamer grün.
            </p>
          )}
          {s?.phase === 'ende' && (
            <p className="lqt-runde-ergebnis">
              {s.sieg ? (s.truhen ? `${s.truhen} ${s.truhen === 1 ? 'Truhe' : 'Truhen'} verteilt.` : 'Gewonnen – diesen Boss hatte die Klasse schon besiegt, keine neue Truhe.') : 'Nicht geschafft. Übt die Region und versucht es noch einmal.'}
            </p>
          )}
          {msg && (
            <p className="lqt-error" role="alert">
              {msg}
            </p>
          )}
          <div className="lqt-runde-knoepfe">
            {s && s.phase !== 'ende' ? (
              <>
                <button type="button" className="btn btn-secondary ui-btn" onClick={() => void beenden()}>
                  Beenden
                </button>
                <button type="button" className="btn btn-primary ui-btn" onClick={() => void weiter()} disabled={busy} aria-busy={busy}>
                  <Icon icon={s.phase === 'warten' ? Swords : s.phase === 'frage' ? Check : ChevronRight} />
                  {busy ? 'Einen Moment …' : s.phase === 'warten' ? 'Los geht’s!' : s.phase === 'frage' ? 'Auflösen' : 'Nächste Frage'}
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-primary ui-btn" onClick={onClose}>
                Fertig
              </button>
            )}
          </div>
        </section>

        <aside className="lqt-runde-seite">
          <div className="lqt-runde-kamera">
            {scannen ? (
              <>
                <video ref={scan.video} playsInline muted />
                {scan.bild && (
                  <svg className="lqt-runde-umrisse" viewBox={`0 0 ${scan.bild.w} ${scan.bild.h}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                    {scan.bild.treffer.map((t) => (
                      <polygon key={t.nummer} points={t.ecken.map((p) => p.join(',')).join(' ')} className={nachNummer.has(t.nummer) ? '' : 'is-fremd'} />
                    ))}
                  </svg>
                )}
              </>
            ) : (
              <p>{phase === 'frage' ? 'Die Kinder halten ihre Karten hoch, der gewählte Buchstabe oben. Dann scannen.' : aufgeloest ? 'Aufgelöst.' : 'Scannen geht, sobald eine Frage steht.'}</p>
            )}
          </div>
          {scan.fehler && (
            <p className="lqt-error" role="alert">
              {scan.fehler}
            </p>
          )}
          {phase === 'frage' && (
            <button
              type="button"
              className={`btn ui-btn ${scannen ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => {
                setMsg('');
                setScannen(!scannen);
              }}
            >
              <Icon icon={scannen ? CameraOff : Camera} />
              {scannen ? 'Scannen anhalten' : 'Scannen'}
            </button>
          )}
          <p className="lqt-runde-zaehler">
            <strong>{gelesen}</strong> von {kinder.length} Karten
          </p>
          <ul className="lqt-runde-karten" aria-label="Karten">
            {kinder.map((k) => {
              const a = antworten[k.nummer];
              const r = aufgeloest && a && richtig >= 0 ? (ANTWORTEN.indexOf(a) === richtig ? 'is-richtig' : 'is-falsch') : '';
              return (
                <li key={k.nummer} className={`${a ? 'is-da' : ''} ${r}`} title={namen ? k.name : `Karte ${k.nummer}`}>
                  {namen ? k.name : k.nummer}
                  {a && <small> {a}</small>}
                </li>
              );
            })}
          </ul>
        </aside>
      </main>
    </div>
  );
}

function Balken({ n, von }: { n: number; von: number }) {
  const anteil = von ? Math.round((n / von) * 100) : 0;
  return (
    <span className="lqt-runde-balken" style={{ '--anteil': `${anteil}%` } as CSSProperties}>
      <span>
        {n} · {anteil} %
      </span>
    </span>
  );
}
