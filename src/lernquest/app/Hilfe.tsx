// Help for weaker children (Stufe E, Lehrkraft 12.11.2026): the station's help cards („So geht's“) before the first
// round and on demand, and a tip per exercise. Nothing here gives an answer away; it shows the rule and how to start.
import { useState } from 'react';
import type { Lernkarte } from '../types';
import { FuchsSagt } from './Fuchs';
import { Rich } from './Uebungen';

/** The help cards of a station, one under the other. */
export function HilfeKarten({ karten }: { karten: Lernkarte[] }) {
  return (
    <div className="lq-hilfe-karten">
      {karten.map((k, i) => (
        <section key={i} className="lq-hilfe-karte">
          <h2>{k.titel}</h2>
          <p>
            <Rich text={k.text} />
          </p>
          {k.beispiele && (
            <ul>
              {k.beispiele.map((b, j) => (
                <li key={j}>
                  <Rich text={b} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

/** The „So geht's“ page before a station's first round: the fox explains, then the round starts. */
export function HilfeSeite({ titel, karten, knopf, onWeiter, onZurueck }: { titel: string; karten: Lernkarte[]; knopf: string; onWeiter: () => void; onZurueck?: () => void }) {
  return (
    <main className="lq-app lq-hilfe-seite">
      {onZurueck && (
        <button type="button" className="lq-link" onClick={onZurueck}>
          ← Zurück
        </button>
      )}
      <span className="lq-kicker">So geht’s · {titel}</span>
      <FuchsSagt pose="denken">
        <p>Lies dir das kurz durch. Du kannst es in der Runde jederzeit wieder aufmachen – mit dem Knopf „Hilfe“.</p>
      </FuchsSagt>
      <HilfeKarten karten={karten} />
      <div className="lq-platz" />
      <button type="button" className="lq-knopf" onClick={onWeiter} autoFocus>
        {knopf}
      </button>
    </main>
  );
}

/** The tip of an exercise: closed behind a button, or open from the start (`offen`, in a station's first round). */
export function Tipp({ text, offen = false }: { text: string; offen?: boolean }) {
  const [auf, setAuf] = useState(offen);
  if (!auf)
    return (
      <button type="button" className="lq-tipp-knopf" onClick={() => setAuf(true)}>
        <GluehbirneIcon /> Tipp
      </button>
    );
  return (
    <p className="lq-tipp" role="note">
      <GluehbirneIcon />
      <span>
        <strong>Tipp: </strong>
        <Rich text={text} />
      </span>
    </p>
  );
}

export const GluehbirneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" />
  </svg>
);
