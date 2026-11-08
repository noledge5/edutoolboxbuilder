// Answer cards to print (Kartenfrage without devices): two per A4 page, to cut apart. Each child holds its card up
// with the chosen letter on top; the letters are small, so neighbours cannot read them from their seats.
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
}

export function Antwortkarten({ titel, kinder, onClose }: { titel: string; kinder: KartenKind[]; onClose(): void }) {
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
          <div className="topbar-place">Auf festes Papier drucken, in der Mitte durchschneiden. Jedes Kind behält seine Karte.</div>
        </div>
        <button type="button" className="btn btn-primary ui-btn" onClick={() => window.print()}>
          <Icon icon={Printer} />
          Drucken / PDF
        </button>
      </header>
      <main className="lqt-print-pages">
        {pages.map((page, p) => (
          <div key={p} className="lqt-sheet lqt-karten-blatt">
            {page.map((k) => (
              <div key={k.nummer} className="lqt-antwortkarte">
                <KartenMuster nummer={k.nummer} className="lqt-antwortkarte-muster" />
                {ANTWORTEN.map((a, i) => (
                  <span key={a} className={`lqt-antwortkarte-buchstabe is-${i}`}>
                    {a}
                  </span>
                ))}
                <span className="lqt-antwortkarte-name">
                  {k.nummer} · {k.name}
                </span>
              </div>
            ))}
          </div>
        ))}
      </main>
    </div>
  );
}
