// Kartenfrage without devices (like Plickers): the question stands on the projector (this screen, mirrored), the
// children hold up their answer cards, the teacher scans the room with the iPad's back camera. Card numbers are
// shown, names only on request (the screen may be on the projector).
import { useCallback, useState, type CSSProperties } from 'react';
import { ArrowLeft, Camera, CameraOff, Check, ChevronRight, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { Icon } from '../../icons';
import type { BossFrage } from '../boss';
import { ANTWORTEN, type Antwort } from '../karten/code';
import { useKartenScan } from '../karten/useKartenScan';
import type { KartenKind } from './Antwortkarten';

/** A question without text: the teacher asks aloud, the cards answer A–D. */
const FREIE_FRAGE: BossFrage = { frage: 'Frage an die Klasse', aussage: '', optionen: ['', '', '', ''], richtig: -1 };

interface Props {
  titel: string;
  kinder: KartenKind[];
  /** Questions from the unlocked lessons, or null for free questions (asked aloud, as many as wanted). */
  fragen: BossFrage[] | null;
  onClose(): void;
}

type Antworten = Record<number, Antwort>;

export function Kartenrunde({ titel, kinder, fragen, onClose }: Props) {
  const [i, setI] = useState(0);
  const [antworten, setAntworten] = useState<Antworten>({});
  const [aufgeloest, setAufgeloest] = useState(false);
  const [scannen, setScannen] = useState(false);
  const [namen, setNamen] = useState(false);
  /** Finished questions with their answers, for the summary. */
  const [verlauf, setVerlauf] = useState<{ frage: BossFrage; antworten: Antworten }[]>([]);
  const [ende, setEnde] = useState(false);

  const frage = fragen ? fragen[i] : FREIE_FRAGE;
  const nummern = new Set(kinder.map((k) => k.nummer));
  const gueltig = (a: Antwort) => ANTWORTEN.indexOf(a) < frage.optionen.length;

  const onAntwort = useCallback(
    (n: number, a: Antwort) => {
      if (aufgeloest || !nummern.has(n)) return;
      setAntworten((x) => (x[n] === a ? x : { ...x, [n]: a }));
    },
    // The set is rebuilt each render; the class does not change during a round.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [aufgeloest, kinder],
  );
  const scan = useKartenScan(scannen && !ende, onAntwort);

  const zaehlbar = Object.entries(antworten).filter(([, a]) => gueltig(a));
  const zahl = (o: number) => zaehlbar.filter(([, a]) => a === ANTWORTEN[o]).length;
  const name = (n: number) => kinder.find((k) => k.nummer === n)?.name ?? '';

  const aufloesen = () => {
    setAufgeloest(true);
    setScannen(false);
  };
  const weiter = () => {
    const done = [...verlauf, { frage, antworten }];
    setVerlauf(done);
    setAntworten({});
    setAufgeloest(false);
    scan.neu();
    if (fragen && i + 1 >= fragen.length) {
      setEnde(true);
      setScannen(false);
    } else setI(i + 1);
  };
  const nochmal = () => {
    setAntworten({});
    setAufgeloest(false);
    scan.neu();
  };

  if (ende) return <Zusammenfassung titel={titel} kinder={kinder} verlauf={verlauf} namen={namen} setNamen={setNamen} onClose={onClose} />;

  return (
    <div className="app lqt-runde">
      <header className="topbar">
        <button type="button" className="iconbtn topbar-back" onClick={onClose} title="Beenden" aria-label="Kartenfrage beenden">
          <Icon icon={ArrowLeft} size={18} />
        </button>
        <div className="topbar-name">
          <div className="topbar-title">Kartenfrage · {titel}</div>
          <div className="topbar-place">{fragen ? `Frage ${i + 1} von ${fragen.length}` : `Freie Frage ${verlauf.length + 1}`}</div>
        </div>
        <button type="button" className="btn btn-ghost ui-btn" onClick={() => setNamen(!namen)} aria-pressed={namen}>
          <Icon icon={namen ? EyeOff : Eye} />
          {namen ? 'Namen verbergen' : 'Namen zeigen'}
        </button>
      </header>
      <main className="lqt-runde-main">
        <section className="lqt-runde-buehne" aria-live="polite">
          <p className="lqt-runde-auftrag">{frage.frage}</p>
          {frage.aussage && <p className="lqt-runde-aussage">{frage.aussage}</p>}
          <ol className="lqt-runde-optionen">
            {frage.optionen.map((o, k) => {
              const n = zahl(k);
              const anteil = zaehlbar.length ? Math.round((n / zaehlbar.length) * 100) : 0;
              const richtig = aufgeloest && k === frage.richtig;
              return (
                <li key={k} className={`lqt-runde-option ${richtig ? 'is-richtig' : ''} ${aufgeloest && frage.richtig >= 0 && !richtig ? 'is-falsch' : ''}`}>
                  <span className="lqt-runde-buchstabe">{ANTWORTEN[k]}</span>
                  <span className="lqt-runde-text">{o || (fragen ? '' : `Antwort ${ANTWORTEN[k]}`)}</span>
                  {richtig && <Icon icon={Check} size={22} />}
                  {aufgeloest && (
                    <span className="lqt-runde-balken" style={{ '--anteil': `${anteil}%` } as CSSProperties}>
                      <span>
                        {n} · {anteil} %
                      </span>
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
          {aufgeloest && frage.richtig >= 0 && zaehlbar.length > 0 && (
            <p className="lqt-runde-ergebnis">
              {zahl(frage.richtig)} von {zaehlbar.length} richtig ({Math.round((zahl(frage.richtig) / zaehlbar.length) * 100)} %)
            </p>
          )}
          <div className="lqt-runde-knoepfe">
            {!aufgeloest ? (
              <button type="button" className="btn btn-primary ui-btn" onClick={aufloesen} disabled={!zaehlbar.length}>
                <Icon icon={Check} />
                Auflösen
              </button>
            ) : (
              <>
                <button type="button" className="btn btn-secondary ui-btn" onClick={nochmal}>
                  <Icon icon={RotateCcw} />
                  Noch einmal fragen
                </button>
                <button type="button" className="btn btn-primary ui-btn" onClick={weiter}>
                  <Icon icon={ChevronRight} />
                  {fragen && i + 1 >= fragen.length ? 'Zur Auswertung' : 'Nächste Frage'}
                </button>
              </>
            )}
            {!fragen && verlauf.length > 0 && !aufgeloest && (
              <button type="button" className="btn btn-ghost ui-btn" onClick={() => setEnde(true)}>
                Auswertung
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
                      <polygon key={t.nummer} points={t.ecken.map((p) => p.join(',')).join(' ')} className={nummern.has(t.nummer) ? '' : 'is-fremd'} />
                    ))}
                  </svg>
                )}
              </>
            ) : (
              <p>{aufgeloest ? 'Aufgelöst.' : 'Die Kinder halten ihre Karten hoch, der gewählte Buchstabe oben. Dann scannen.'}</p>
            )}
          </div>
          {scan.fehler && (
            <p className="lqt-error" role="alert">
              {scan.fehler}
            </p>
          )}
          {!aufgeloest && (
            <button type="button" className={`btn ui-btn ${scannen ? 'btn-secondary' : 'btn-primary'}`} onClick={() => setScannen(!scannen)}>
              <Icon icon={scannen ? CameraOff : Camera} />
              {scannen ? 'Scannen anhalten' : 'Scannen'}
            </button>
          )}
          <p className="lqt-runde-zaehler">
            <strong>{zaehlbar.length}</strong> von {kinder.length} Karten
          </p>
          <ul className="lqt-runde-karten" aria-label="Karten">
            {kinder.map((k) => {
              const a = antworten[k.nummer];
              const da = a && gueltig(a);
              const r = aufgeloest && da && frage.richtig >= 0 ? (ANTWORTEN.indexOf(a) === frage.richtig ? 'is-richtig' : 'is-falsch') : '';
              return (
                <li key={k.nummer} className={`${da ? 'is-da' : ''} ${r}`} title={namen ? k.name : `Karte ${k.nummer}`}>
                  {namen ? k.name : k.nummer}
                  {aufgeloest && da && namen && <small> {a}</small>}
                </li>
              );
            })}
          </ul>
          {namen && !aufgeloest && zaehlbar.length < kinder.length && (
            <p className="lqt-hint">Fehlt noch: {kinder.filter((k) => !antworten[k.nummer]).map((k) => name(k.nummer)).join(', ')}</p>
          )}
        </aside>
      </main>
    </div>
  );
}

function Zusammenfassung({
  titel,
  kinder,
  verlauf,
  namen,
  setNamen,
  onClose,
}: {
  titel: string;
  kinder: KartenKind[];
  verlauf: { frage: BossFrage; antworten: Antworten }[];
  namen: boolean;
  setNamen(x: boolean): void;
  onClose(): void;
}) {
  const bewertet = verlauf.filter((v) => v.frage.richtig >= 0);
  const richtig = (n: number) => bewertet.filter((v) => v.antworten[n] === ANTWORTEN[v.frage.richtig]).length;
  const beantwortet = (n: number) => verlauf.filter((v) => v.antworten[n]).length;
  return (
    <div className="app lqt-runde">
      <header className="topbar">
        <button type="button" className="iconbtn topbar-back" onClick={onClose} title="Zurück" aria-label="Zurück">
          <Icon icon={ArrowLeft} size={18} />
        </button>
        <div className="topbar-name">
          <div className="topbar-title">Auswertung · {titel}</div>
          <div className="topbar-place">
            {verlauf.length} {verlauf.length === 1 ? 'Frage' : 'Fragen'}. Nur auf diesem Bildschirm, nichts wird gespeichert.
          </div>
        </div>
        <button type="button" className="btn btn-ghost ui-btn" onClick={() => setNamen(!namen)} aria-pressed={namen}>
          <Icon icon={namen ? EyeOff : Eye} />
          {namen ? 'Namen verbergen' : 'Namen zeigen'}
        </button>
      </header>
      <main className="lqt-main">
        <section className="lqt-card">
          <h2>Je Frage</h2>
          <ol className="lqt-runde-liste">
            {verlauf.map((v, k) => {
              const da = Object.keys(v.antworten).length;
              const r = v.frage.richtig >= 0 ? Object.values(v.antworten).filter((a) => a === ANTWORTEN[v.frage.richtig]).length : null;
              return (
                <li key={k}>
                  <span>{v.frage.aussage || v.frage.frage}</span>
                  <small>{r === null ? `${da} Antworten` : `${r} von ${da} richtig`}</small>
                </li>
              );
            })}
          </ol>
        </section>
        <section className="lqt-card">
          <h2>Je Kind</h2>
          <div className="ev-table-wrap">
            <table className="ev-table lqt-table">
              <thead>
                <tr>
                  <th>{namen ? 'Name' : 'Karte'}</th>
                  <th>Beantwortet</th>
                  {bewertet.length > 0 && <th>Richtig</th>}
                </tr>
              </thead>
              <tbody>
                {kinder.map((k) => (
                  <tr key={k.nummer}>
                    <th>{namen ? k.name : k.nummer}</th>
                    <td>
                      {beantwortet(k.nummer)} von {verlauf.length}
                    </td>
                    {bewertet.length > 0 && (
                      <td>
                        {richtig(k.nummer)} von {bewertet.length}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
