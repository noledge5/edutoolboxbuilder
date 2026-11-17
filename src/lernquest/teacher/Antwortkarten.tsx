// Answer cards to print (Kartenfrage without devices): two per A4 page, to cut apart. Each child holds its card up
// with the chosen letter on top; the letters are small, so neighbours cannot read them from their seats.
// The cards carry only a number (no name), so one set serves every class; the class list (number and name) prints
// separately and stays with the teacher.
import { useState } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { Icon } from '../../icons';
import { ANTWORTEN, zellen } from '../karten/code';

/** The black square with the pattern of card `nummer`, upright (A on top). */
export function KartenMuster({ nummer, className }: { nummer: number; className?: string }) {
  const c = zellen(nummer);
  return (
    <svg className={className} viewBox="0 0 6 6" shapeRendering="crispEdges" aria-hidden="true">
      <rect width="6" height="6" fill="#000" />
      {c.flatMap((row, y) => row.map((weiss, x) => (weiss ? <rect key={`${x}-${y}`} x={x + 1} y={y + 1} width="1" height="1" fill="#fff" /> : null)))}
    </svg>
  );
}

export interface KartenKind {
  nummer: number;
  name: string;
  /** Lernquest child id (for the boss fight with cards). */
  id: string;
}

export function Antwortkarten({ titel, kinder, onClose }: { titel: string; kinder: KartenKind[]; onClose(): void }) {
  const [liste, setListe] = useState(false);
  const pages: KartenKind[][] = [];
  for (let i = 0; i < kinder.length; i += 2) pages.push(kinder.slice(i, i + 2));
  return (
    <div className="app lqt-print-app">
      <header className="topbar" data-noprint="1">
        <button type="button" className="iconbtn topbar-back" onClick={onClose} title="Zurück" aria-label="Zurück">
          <Icon icon={ArrowLeft} size={18} />
        </button>
        <div className="topbar-name">
          <div className="topbar-title">Antwortkarten: {titel}</div>
          <div className="topbar-place">
            {liste ? 'Klassenliste: Nummer und Name. Bleibt bei der Lehrkraft.' : 'Auf festes Papier drucken, in der Mitte durchschneiden. Auf den Karten steht nur die Nummer.'}
          </div>
        </div>
        <button type="button" className="btn ui-btn" onClick={() => setListe(!liste)}>
          {liste ? 'Karten zeigen' : 'Klassenliste zeigen'}
        </button>
        <button type="button" className="btn btn-primary ui-btn" onClick={() => window.print()}>
          <Icon icon={Printer} />
          Drucken / PDF
        </button>
      </header>
      <main className="lqt-print-pages">
        {liste && (
          <div className="lqt-sheet lqt-karten-liste">
            <h1>Antwortkarten: {titel}</h1>
            <ol>
              {kinder.map((k) => (
                <li key={k.nummer}>
                  <b>{k.nummer}</b>
                  {k.name}
                </li>
              ))}
            </ol>
          </div>
        )}
        {!liste && pages.map((page, p) => (
          <div key={p} className="lqt-sheet lqt-karten-blatt">
            {page.map((k) => (
              <div key={k.nummer} className="lqt-antwortkarte">
                <KartenMuster nummer={k.nummer} className="lqt-antwortkarte-muster" />
                {ANTWORTEN.map((a, i) => (
                  <span key={a} className={`lqt-antwortkarte-buchstabe is-${i}`}>
                    {a}
                  </span>
                ))}
                <span className="lqt-antwortkarte-name">Nr. {k.nummer}</span>
              </div>
            ))}
          </div>
        ))}
      </main>
    </div>
  );
}
