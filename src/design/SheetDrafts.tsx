// Stage 5 of the redesign (26.11.2026): three designs for the worksheets beside the current one, on real lessons of
// the library, to choose from (#/entwuerfe). Temporary: once one is chosen it replaces src/sheet/faecher.css and this
// page goes (docs/roadmap.md).
import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Icon } from '../icons';
import { PagePreview } from '../ai/LessonAiDialog';
import { usePageFit } from '../library/ModulePrint';
import { docForLesson, isWorkedOut, lessonsOf } from '../library/model';
import type { Library } from '../library/types';
import type { Doc } from '../model/types';
import { SheetModeContext } from '../sheet/sheetMode';
import '../library/board.css';
import './drafts.css';

const DRAFTS = [
  { key: 'now', name: 'Jetzt', note: 'Das ruhige Blatt seit November, zum Vergleich.' },
  { key: 'a', name: 'A  Etikett', note: 'Wie der Baukasten selbst: Kopf mit feinem Rahmen, das Symbol auf einem Plättchen der Fachfarbe, Nummern als kleine Tasten, ruhige Kästen.' },
  {
    key: 'b',
    name: 'B  Lineal',
    note: 'Linien statt Flächen, wie ein gutes Schulbuch: kräftige Linie unter dem Kopf, große Nummern, Hinweise mit einer Linie am Rand. Spart Toner, klar auf jeder Kopie.',
  },
  { key: 'c', name: 'C  Heft', note: 'Freundlich und rund, auch für die Kleinen: das Fach als Reiter über dem Kopf, getönte Karten, runde Nummern, gepunktete Schreiblinien.' },
] as const;

interface Sample {
  label: string;
  doc: Doc;
  p: number;
}

/** One lesson per sheet form and age (Geographie, Englisch, Informatik, other subjects; grades 5–6 and 7–10), first pages with content. */
function samplesOf(lib: Library): Sample[] {
  const seen = new Set<string>();
  const out: Sample[] = [];
  const modules = [...lib.modules].sort((a, b) => a.subject.localeCompare(b.subject) || b.grade - a.grade || a.number - b.number);
  for (const m of modules) {
    for (const l of lessonsOf(lib, m.id).filter(isWorkedOut)) {
      const doc = docForLesson(m, l);
      const key = `${doc.sheet?.form}-${doc.sheet?.age}`;
      const p = doc.pages.findIndex((pg) => pg.type !== 'lehrkraft' && pg.blocks.length > 0);
      if (p < 0 || seen.has(key)) continue;
      seen.add(key);
      out.push({ label: `${m.subject} ${m.grade}: ${l.title}`, doc, p });
      // A second page of the same lesson with other blocks, where there is one.
      const q = doc.pages.findIndex((pg, k) => k > p && pg.type !== 'lehrkraft' && pg.blocks.length > 0 && !pg.back);
      if (q > 0) out.push({ label: `${m.subject} ${m.grade}: ${doc.pages[q].title}`, doc, p: q });
      break;
    }
  }
  // The fullest page first: it shows the most of each design.
  return out.sort((a, b) => b.doc.pages[b.p].blocks.length - a.doc.pages[a.p].blocks.length).slice(0, 8);
}

function DraftSheet({ doc, p }: { doc: Doc; p: number }) {
  const [ref, scale] = usePageFit();
  return (
    <div ref={ref} className="draft-sheet">
      <PagePreview doc={doc} p={p} scale={scale} />
    </div>
  );
}

export function SheetDrafts({ lib, onBack }: { lib: Library; onBack(): void }) {
  const samples = useMemo(() => samplesOf(lib), [lib]);
  const [at, setAt] = useState(0);
  const [solution, setSolution] = useState(false);
  const [bw, setBw] = useState(false);
  const [big, setBig] = useState(false);
  const sample = samples[Math.min(at, samples.length - 1)];
  const keys = <V,>(label: string, value: V, options: { v: V; l: string }[], pick: (v: V) => void) => (
    <div className="drafts-control">
      <span id={'dc-' + label}>{label}</span>
      <div className="seg-pills" role="radiogroup" aria-labelledby={'dc-' + label}>
        {options.map((o) => (
          <button key={o.l} type="button" role="radio" aria-checked={o.v === value} className={'seg-pill' + (o.v === value ? ' is-on' : '')} onClick={() => pick(o.v)}>
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <div className="board">
      <main className="board-main">
        <header className="board-band">
          <div className="board-band-text">
            <p className="board-kicker">Neues Aussehen, Stufe 5</p>
            <h1 className="board-title">Entwürfe für die Arbeitsblätter</h1>
            <p className="draft-note" style={{ marginTop: 12 }}>
              Drei Gestaltungen neben dem jetzigen Blatt, an echten Stunden. Text, Schrift und Größen bleiben gleich, kein Blatt bricht anders um. Die Folien folgen danach im gewählten Stil.
            </p>
          </div>
          <div className="board-actions">
            <button type="button" className="btn btn-secondary ui-btn" onClick={onBack}>
              <Icon icon={ArrowLeft} />
              Zurück
            </button>
          </div>
        </header>
        {sample ? (
          <>
            <div className="drafts-controls">
              {keys(
                'Beispiel',
                at,
                samples.map((s, i) => ({ v: i, l: s.label })),
                setAt,
              )}
              {keys(
                'Fassung',
                solution,
                [
                  { v: false, l: 'Schülerblatt' },
                  { v: true, l: 'Lösung' },
                ],
                setSolution,
              )}
              {keys(
                'Druck',
                bw,
                [
                  { v: false, l: 'Farbe' },
                  { v: true, l: 'Schwarz-weiß' },
                ],
                setBw,
              )}
              {keys(
                'Größe',
                big,
                [
                  { v: false, l: 'Nebeneinander' },
                  { v: true, l: 'Groß' },
                ],
                setBig,
              )}
            </div>
            <SheetModeContext.Provider value={{ solutions: solution ? 'shown' : 'hidden', bw }}>
              <div className={'drafts-grid' + (big ? ' is-big' : '')}>
                {DRAFTS.map((d) => (
                  <section key={d.key} className={'draft' + (d.key === 'now' ? ' is-now' : '')} aria-labelledby={'draft-' + d.key}>
                    <div className="draft-head">
                      <h2 id={'draft-' + d.key} className="draft-name">
                        {d.name}
                      </h2>
                      <p className="draft-note">{d.note}</p>
                    </div>
                    <div className={'wsd-' + d.key}>
                      <DraftSheet doc={sample.doc} p={sample.p} />
                    </div>
                  </section>
                ))}
              </div>
            </SheetModeContext.Provider>
          </>
        ) : (
          <div className="board-empty">
            <p>Für die Entwürfe braucht es mindestens eine ausgearbeitete Stunde.</p>
          </div>
        )}
      </main>
    </div>
  );
}
