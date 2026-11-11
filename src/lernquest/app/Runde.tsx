// A round: every exercise once, then the missed ones again until they sit (`nachAntwort`). Only the first try of an
// exercise counts for the result, hearts and the repetition boxes; the second meeting is there to learn it. Leaving a
// round that has answers asks first, so a slip of the finger (or the phone's back key) does not throw them away.
import { useEffect, useRef, useState } from 'react';
import { heute, istRichtig, karteKey, karteNach, loesungText, nachAntwort, tagNummer, type Antwort } from '../rules';
import type { Avatar } from '../teile';
import type { Paket, Stand, Uebung } from '../types';
import { KopfBild } from './avatar';
import { Herzen } from './Held';
import { tonAn } from './speicher';
import { ton } from './ton';
import { Rich, UebungView, Vorlesen } from './Uebungen';
import { vorlesen } from './vorlesen';

const svg = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 3.4, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;
export const HakenIcon = () => (
  <svg {...svg} width={34} height={34} strokeWidth={3.2}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
export const KreuzIcon = () => (
  <svg {...svg}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export interface RundeProps {
  /** The exercises with the lesson each one is from (a round of „Wiederholen“ mixes lessons). */
  uebungen: { u: Uebung; stunde: string }[];
  stunde: string;
  runde: number;
  stand: Stand;
  /** Hearts at the start (3 + bonus): a first-try mistake costs one; they are worth coins, none left ends nothing. */
  herzen: number;
  /** Above the exercise: „Station 3 · Himmelsrichtungen“ or „Wiederholen“. */
  titel: string;
  /** The child's hero, who reacts to the answers; absent in the open exercises (nobody is signed in). */
  held?: Avatar;
  /** False for a test: every exercise once, mistakes do not come again (the test offers them afterwards). */
  wieder?: boolean;
  /** Counts up when the phone's back key is pressed: the round then asks before it goes. */
  zurueck?: number;
  onAbbruch: () => void;
  /** `ergebnisse` are the first tries, in the order of `uebungen`. */
  onFertig: (stunde: string, runde: number, ergebnisse: boolean[], leitner: Stand['leitner']) => void;
  /** The package of an exercise (its language and pictures). */
  paketVon?: (stunde: string) => Paket | undefined;
}

/** In English: the sentence a child hears after checking a gap or word order. */
function nachDemPruefen(u: Uebung): string {
  if (u.art === 'luecke') return u.teile.join('');
  if (u.art === 'reihenfolge') return u.loesung;
  return '';
}

/** Formats that check themselves with the last tap (no „Prüfen“). */
const prueftSelbst = (u: Uebung) => u.art === 'paare' || u.art === 'punkt';
/** Formats that show the solution on the exercise itself once it is checked; the others get „Richtig wäre: …“. */
const loesungSichtbar = (u: Uebung) => prueftSelbst(u) || u.art === 'bild';

export function Runde({ uebungen, stunde, runde, stand, herzen, titel: kicker, held, wieder = true, zurueck = 0, onAbbruch, onFertig, paketVon }: RundeProps) {
  /** Exercise indexes in the order played; a missed one is appended. */
  const [reihe, setReihe] = useState(() => uebungen.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [antwort, setAntwort] = useState<Antwort | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);
  const [ergebnisse, setErgebnisse] = useState<boolean[]>([]);
  const [leitner, setLeitner] = useState<Stand['leitner']>({});
  const [serie, setSerie] = useState(0);
  const [frage, setFrage] = useState(false);
  const [versuch] = useState(() => Date.now().toString(36));
  const n = uebungen.length;
  const item = uebungen[reihe[pos]];
  const nochmal = pos >= n;
  const paket = item && paketVon?.(item.stunde);
  const englisch = paket?.lang === 'en';
  const hoerSatz = englisch && item ? nachDemPruefen(item.u) : '';

  const abbrechen = () => (ergebnisse.length ? setFrage(true) : onAbbruch());
  const erstes = useRef(zurueck);
  useEffect(() => {
    if (zurueck !== erstes.current) abbrechen();
    // Only the back key counts up; `abbrechen` reads the newest answers on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zurueck]);

  const pruefen = (a = antwort) => {
    if (!a || ok !== null || !item) return;
    const right = istRichtig(item.u, a);
    ton(right ? 'richtig' : 'falsch');
    // Right in the tap, not later: an iPad lets a page speak only then.
    if (hoerSatz && tonAn()) vorlesen(hoerSatz);
    setOk(right);
    if (wieder) setReihe(nachAntwort(reihe, pos, right));
    if (nochmal) return;
    setSerie(right ? serie + 1 : 0);
    setErgebnisse([...ergebnisse, right]);
    const key = karteKey(item.stunde, item.u.id);
    setLeitner({ ...leitner, [key]: karteNach(leitner[key] ?? stand.leitner[key], right, tagNummer(heute())) });
  };

  const weiter = () => {
    if (pos + 1 >= reihe.length) return onFertig(stunde, runde, ergebnisse, leitner);
    setPos(pos + 1);
    setAntwort(null);
    setOk(null);
  };

  if (!item) {
    return (
      <main className="lq-app lq-ergebnis">
        <p>Hier gibt es gerade nichts zu tun.</p>
        <button type="button" className="lq-knopf" onClick={onAbbruch}>
          Zurück
        </button>
      </main>
    );
  }

  // The bar fills with what is done for good: right answers, and missed exercises that will not come again.
  const kommtWieder = ok === false && reihe.length > pos + 1 && reihe.indexOf(reihe[pos], pos + 1) > 0;
  const offen = new Set(reihe.slice(pos + (ok === null || kommtWieder ? 0 : 1))).size;
  const fehler = ergebnisse.filter((x) => !x).length;
  return (
    <main className="lq-app lq-spiel">
      <div className="lq-fortschritt">
        <button type="button" className="lq-x" aria-label="Runde beenden" onClick={abbrechen}>
          <KreuzIcon />
        </button>
        <span className="lq-balken" role="progressbar" aria-valuemin={0} aria-valuemax={n} aria-valuenow={n - offen} aria-label="Fortschritt in der Runde">
          <span style={{ width: `${(100 * (n - offen)) / n}%` }} />
        </span>
        <Herzen voll={Math.max(0, herzen - fehler)} von={herzen} />
      </div>
      <span className="lq-kicker">{nochmal ? 'Nochmal: das war vorhin falsch' : kicker}</span>
      <UebungView
        key={pos}
        u={item.u}
        seed={`${item.u.id}:${versuch}:${pos}`}
        locked={ok !== null}
        lang={paket?.lang}
        bilder={paket?.bilder}
        onChange={(a) => {
          setAntwort(a);
          if (a && prueftSelbst(item.u)) pruefen(a);
        }}
      />
      <footer className={`lq-fuss ${ok === true ? 'ok' : ok === false ? 'nein' : prueftSelbst(item.u) ? 'leer' : ''}`} aria-live="polite">
        {ok !== null && (
          <div className="lq-rueckmeldung">
            <strong>
              {held ? (
                <span className={`lq-held-kopf ${ok ? 'freut' : 'schuettelt'}`} aria-hidden>
                  <KopfBild avatar={{ ...held, mund: ok ? 'lachen' : 'staunen' }} />
                </span>
              ) : (
                <span className="lq-zeichen" aria-hidden>
                  {ok ? <HakenIcon /> : <KreuzIcon />}
                </span>
              )}
              {ok ? (nochmal ? 'Jetzt sitzt es!' : serie >= 3 ? `${serie} in Folge!` : 'Richtig!') : 'Nicht ganz.'}
            </strong>
            {!ok && !loesungSichtbar(item.u) && (
              <span>
                Richtig wäre: <Rich text={loesungText(item.u)} />
              </span>
            )}
            {!ok && item.u.erklaerung && (
              <span className="lq-erklaerung">
                <Rich text={item.u.erklaerung} />
              </span>
            )}
            {kommtWieder && <span className="lq-klein">Die Aufgabe kommt am Ende nochmal.</span>}
            {hoerSatz && <Vorlesen text={hoerSatz} />}
          </div>
        )}
        {ok === null ? (
          // Pairs and places check themselves with the last tap: a „Prüfen“ that never wakes up would only puzzle.
          !prueftSelbst(item.u) ? (
            <button type="button" className="lq-knopf" disabled={!antwort} onClick={() => pruefen()}>
              Prüfen
            </button>
          ) : null
        ) : (
          <button type="button" className="lq-knopf" onClick={weiter} autoFocus>
            Weiter
          </button>
        )}
      </footer>
      {frage && (
        <div className="lq-dialog-grund" role="dialog" aria-modal="true" aria-labelledby="lq-ende-titel">
          <div className="lq-dialog">
            <h2 id="lq-ende-titel">Runde beenden?</h2>
            <p>Was du in dieser Runde schon beantwortet hast, zählt dann nicht.</p>
            <button type="button" className="lq-knopf" autoFocus onClick={() => setFrage(false)}>
              Weiterspielen
            </button>
            <button type="button" className="lq-knopf lq-hell" onClick={onAbbruch}>
              Runde beenden
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
