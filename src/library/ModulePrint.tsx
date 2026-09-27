// Printable A4 pages of a module: content overview (Inhaltsübersicht) and competence grid (Kompetenzraster).
// They use the worksheet's header and footer bands, so they match the lesson material.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { Icon } from '../icons';
import type { Doc, Page } from '../model/types';
import { THEMES } from '../model/themes';
import { PAGE_H, PAGE_W, SheetPage } from '../sheet/SheetPage';
import { topicIcon } from '../topicIcons';
import { competenceLessons, competenceLinks, footerFor, moduleCode } from './model';
import type { Competence, Lesson, Module, Settings } from './types';

export type PrintKind = 'inhalt' | 'raster';

const LEVELS = [
  { key: 'g', short: 'G', label: 'grundlegend', stars: 1 },
  { key: 'm', short: 'M', label: 'mittel', stars: 2 },
  { key: 'e', short: 'E', label: 'erweitert', stars: 3 },
] as const;

interface ModulePagesProps {
  kind: PrintKind;
  module: Module;
  lessons: Lesson[];
  settings: Settings;
  /** Size on screen (1 = A4 at 100 %); printing always uses the full size. */
  scale?: number;
}

/** The A4 pages (as SheetPages) for one kind of module print. */
export function ModulePages({ kind, module: m, lessons, settings, scale = 1 }: ModulePagesProps) {
  // Module prints are for the teacher and the German competence grid: always German labels.
  const doc: Doc = {
    icon: m.icon,
    lang: 'de',
    help: false,
    footer: footerFor(settings, m.subject),
    code: moduleCode(m),
    pages: [],
  };
  const kicker = `Klasse ${m.grade} · ${m.subject} · Modul ${m.number}`;
  const links = competenceLinks(lessons);

  if (kind === 'inhalt') {
    const page: Page = {
      title: `Inhaltsübersicht: ${m.title}`,
      kicker,
      type: 'lehrkraft',
      form: 'allein',
      nameField: 'aus',
      blocks: [],
    };
    const items: OverviewRow[] = [
      ...lessons.map((l) => ({ kind: 'lesson' as const, key: l.id, l })),
      ...(m.competences.length ? [{ kind: 'heading' as const, key: 'kompetenzen' }] : []),
      ...m.competences.map((c, i) => ({
        kind: 'comp' as const,
        key: c.id || `c${i}`,
        c,
      })),
    ];
    return (
      <MeasuredPages
        items={items}
        estimate={(r) => (r.kind === 'lesson' ? 44 + 26 * Math.ceil(r.l.doc.pages.length / 2) : 40)}
        heading={(r) => r.kind === 'heading'}
        fallback={[640, 820]}
        scale={scale}
        render={(rows, i) => {
          const lessonRows = rows.flatMap((r) => (r.kind === 'lesson' ? [r] : []));
          const compRows = rows.filter((r) => r.kind !== 'lesson');
          return (
            <SheetPage doc={doc} page={page} index={i} editing={false} hideForm>
              <div className="ws-full">
                {i === 0 && m.description.trim() && <p className="ws-text ov-intro">{m.description}</p>}
                {i === 0 && m.textbook.trim() && (
                  <p className="ws-text ov-book">
                    <b>Lehrwerk:</b> {m.textbook}
                  </p>
                )}
                {(i === 0 || lessonRows.length > 0) && (
                  <div className="ov-table" data-rows="">
                    <div className="ov-row is-head">
                      <div>Stunde</div>
                      <div>Thema</div>
                      <div>Material</div>
                    </div>
                    {lessonRows.map(({ l }) => (
                      <div key={l.id} className="ov-row" data-row="">
                        <div className="ov-num">{l.number}</div>
                        <div className="ov-title">
                          {l.title}
                          {l.textbook.trim() && <span className="ov-lesson-book">{l.textbook}</span>}
                        </div>
                        <div className="ov-pages">
                          {l.doc.pages.map((pg, k) => (
                            <span key={k} className="ov-page" style={{ background: THEMES[pg.type].band }}>
                              <span
                                className="ov-page-type"
                                style={{
                                  background: THEMES[pg.type].pill,
                                  color: THEMES[pg.type].pillFg,
                                }}
                              >
                                {THEMES[pg.type].label}
                              </span>
                              {pg.title}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                    {lessons.length === 0 && <div className="ov-empty">Noch keine Stunden in diesem Modul.</div>}
                  </div>
                )}
                {compRows.length > 0 && (
                  <div className="ov-comp">
                    {compRows.map((r) =>
                      r.kind === 'heading' ? (
                        <h3 key={r.key} className="ws-h3" data-row="">
                          Kompetenzen
                        </h3>
                      ) : r.kind === 'comp' ? (
                        <div key={r.key} className="ov-comp-row" data-row="">
                          <span>{r.c.area}</span>
                          {competenceLessons(r.c, links.get(r.c.id)) && <span className="ov-comp-lessons">Stunde {competenceLessons(r.c, links.get(r.c.id))}</span>}
                        </div>
                      ) : null,
                    )}
                  </div>
                )}
              </div>
            </SheetPage>
          );
        }}
      />
    );
  }

  const page: Page = {
    title: `Kompetenzraster: ${m.title}`,
    kicker,
    type: 'sicherung',
    form: 'allein',
    nameField: 'name',
    blocks: [],
  };
  return (
    <MeasuredPages
      items={rasterRows(m.competences)}
      estimate={rowHeight}
      heading={(r) => r.kind === 'domain'}
      fallback={[740, 800]}
      scale={scale}
      render={(rows, i) => (
        <SheetPage doc={doc} page={page} index={i} editing={false} hideForm>
          <div className="ws-full">
            {i === 0 && (
              <p className="ws-text kr-intro">
                Kreuze an, was du schon kannst. Die Sterne an den Aufgaben zeigen dir das Niveau: <b>★ G</b> grundlegend, <b>★★ M</b> mittel, <b>★★★ E</b> erweitert.
              </p>
            )}
            <div className="kr-table" data-rows="">
              <div className="kr-row is-head">
                <div>Ich kann …</div>
                {LEVELS.map((lv) => (
                  <div key={lv.key} className={'kr-level is-' + lv.key}>
                    <span className="kr-stars">{'★'.repeat(lv.stars)}</span> <b>{lv.short}</b> {lv.label}
                  </div>
                ))}
              </div>
              {rows.map((r) =>
                r.kind === 'domain' ? (
                  <div key={r.key} className="kr-domain-row" data-row="">
                    {r.label}
                  </div>
                ) : (
                  <div key={r.key} className="kr-row" data-row="">
                    <div className="kr-area">
                      {r.c.area}
                      {competenceLessons(r.c, links.get(r.c.id)) && <span className="kr-lessons">Stunde {competenceLessons(r.c, links.get(r.c.id))}</span>}
                    </div>
                    {LEVELS.map((lv) => (
                      <div key={lv.key} className="kr-cell">
                        <span>{r.c[lv.key]}</span>
                        <span className="ws-check kr-check" />
                      </div>
                    ))}
                  </div>
                ),
              )}
              {m.competences.length === 0 && <div className="ov-empty">Noch keine Kompetenzen eingetragen.</div>}
            </div>
          </div>
        </SheetPage>
      )}
    />
  );
}

type OverviewRow = { kind: 'lesson'; key: string; l: Lesson } | { kind: 'heading'; key: string } | { kind: 'comp'; key: string; c: Competence };

export type RasterRow = { kind: 'domain'; key: string; label: string } | { kind: 'comp'; key: string; c: Competence };

/** Competences with a heading row wherever the area (Bereich) changes. */
export function rasterRows(cs: Competence[]): RasterRow[] {
  const out: RasterRow[] = [];
  let last = '';
  cs.forEach((c, i) => {
    const d = c.domain.trim();
    if (d && d !== last) out.push({ kind: 'domain', key: `d${i}`, label: d });
    last = d;
    out.push({ kind: 'comp', key: c.id || `c${i}`, c });
  });
  return out;
}

/** Lines a text needs when about `per` characters fit on a line (words are not split). */
const lineCount = (text: string, per: number) => {
  let lines = 1;
  let used = 0;
  for (const w of text.split(/\s+/).filter(Boolean)) {
    if (used > 0 && used + 1 + w.length > per) {
      lines++;
      used = w.length;
    } else used += (used > 0 ? 1 : 0) + w.length;
  }
  return lines;
};

/** Estimated height of a row before it could be measured. */
function rowHeight(r: RasterRow): number {
  if (r.kind === 'domain') return 30;
  const cells = Math.max(lineCount(r.c.g, 19), lineCount(r.c.m, 19), lineCount(r.c.e, 19)) * 18.2;
  return 20 + Math.max(cells, lineCount(r.c.area, 22) * 21.7 + 20);
}

/**
 * Splits rows into pages. `space` is the room for rows on the first and on the following pages.
 * A page never ends with a heading row. Returns the row indexes of each page.
 */
export function paginate(heights: number[], [first, next]: [number, number], heading: (i: number) => boolean = () => false): number[][] {
  const pages: number[][] = [[]];
  let left = first;
  heights.forEach((h, i) => {
    const page = pages[pages.length - 1];
    if (h > left && page.length > 0) {
      const carry = page.length > 1 && heading(page[page.length - 1]) ? [page.pop()!] : [];
      pages.push(carry);
      left = next - carry.reduce((n, k) => n + heights[k], 0);
    }
    pages[pages.length - 1].push(i);
    left -= h;
  });
  return pages;
}

interface Measure {
  rows: number[];
  space: [number, number];
}

const round = (n: number) => Math.round(n * 10) / 10;

/**
 * A4 pages filled with rows. All rows are first laid out in a hidden full-size page and measured,
 * because line breaks depend on the fonts of the device (Mac, iPad). Rows carry `data-row`
 * (a row's height reaches to the next row, so gaps count), the first table `data-rows`.
 */
function MeasuredPages<T>(p: { items: T[]; estimate(item: T): number; heading?(item: T): boolean; fallback: [number, number]; scale: number; render(rows: T[], index: number): ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [measure, setMeasure] = useState<Measure | null>(null);

  const run = useCallback(() => {
    const el = box.current;
    const body = el?.querySelector('.ws-body')?.getBoundingClientRect();
    const full = el?.querySelector('.ws-full')?.getBoundingClientRect();
    const table = el?.querySelector('[data-rows]')?.getBoundingClientRect();
    if (!el || !body || !full || !table) return;
    const rowEls = [...el.querySelectorAll('[data-row]')].map((r) => r.getBoundingClientRect());
    // Rows start below the table head; 2 px bottom border and a little air above the footer.
    const start = rowEls.length ? rowEls[0].top : table.bottom;
    const first = body.bottom - start - 6;
    const next: Measure = {
      rows: rowEls.map((r, k) => round((k + 1 < rowEls.length ? rowEls[k + 1].top : r.bottom) - r.top)),
      space: [round(first), round(first + table.top - full.top)],
    };
    setMeasure((prev) => (prev && JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }, []);

  // After every render (the content may have changed) and once the web fonts are loaded.
  useLayoutEffect(run);
  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => alive && run());
    return () => {
      alive = false;
    };
  }, [run]);

  const measured = measure !== null && measure.rows.length === p.items.length;
  const heights = measured ? measure.rows : p.items.map(p.estimate);
  const pages = paginate(heights, measured ? measure.space : p.fallback, (i) => p.heading?.(p.items[i]) ?? false);
  return (
    <>
      <div className="measure-page" ref={box} aria-hidden="true">
        {p.render(p.items, 0)}
      </div>
      {pages.map((rows, i) => (
        <PrintFrame key={i} scale={p.scale}>
          {p.render(
            rows.map((k) => p.items[k]),
            i,
          )}
        </PrintFrame>
      ))}
    </>
  );
}

/** Same frame as the editor's pages, so print.css prints exactly one A4 page per sheet. */
export function PrintFrame({ children, scale = 1 }: { children: ReactNode; scale?: number }) {
  return (
    <div className="page-frame">
      <div
        className={'page-scale' + (scale !== 1 ? ' is-fit' : '')}
        style={
          {
            width: PAGE_W * scale,
            height: PAGE_H * scale,
            '--fit': scale,
          } as CSSProperties
        }
      >
        {children}
      </div>
    </div>
  );
}

/** Scale that fits an A4 page into the width of the element (never above 100 %). */
export function usePageFit(): [RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1, Math.max(0.3, el.clientWidth / PAGE_W)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, scale];
}

interface ModulePrintProps extends ModulePagesProps {
  onClose(): void;
}

/** Full-screen print preview of a module overview page, with "Drucken / PDF". */
export function ModulePrint({ onClose, ...pages }: ModulePrintProps) {
  const title = pages.kind === 'inhalt' ? 'Inhaltsübersicht' : 'Kompetenzraster';
  return (
    <div className="app is-preview">
      <header className="topbar" data-noprint="1">
        <button type="button" className="iconbtn topbar-back" onClick={onClose} title="Zurück zum Modul" aria-label="Zurück zum Modul">
          <Icon icon={ArrowLeft} size={18} />
        </button>
        <div className="topbar-icon">
          <Icon icon={topicIcon(pages.module.icon)} size={20} />
        </div>
        <div className="topbar-name">
          <div className="topbar-title">{title}</div>
          <div className="topbar-place">
            {pages.module.subject} · Klasse {pages.module.grade} · Modul {pages.module.number}: {pages.module.title}
          </div>
        </div>
        <button type="button" className="btn btn-primary ui-btn" onClick={() => window.print()}>
          <Icon icon={Printer} />
          <span className="btn-label">Drucken / PDF</span>
        </button>
      </header>
      <div className="workspace">
        <main className="canvas">
          <div className="pages">
            <ModulePages {...pages} />
          </div>
        </main>
      </div>
    </div>
  );
}
