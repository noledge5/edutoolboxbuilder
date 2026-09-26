// Printable A4 pages of a module: content overview (Inhaltsübersicht) and competence grid (Kompetenzraster).
// They use the worksheet's header and footer bands, so they match the lesson material.
import type { ReactNode } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { Icon } from '../icons';
import type { Doc, Page } from '../model/types';
import { THEMES } from '../model/themes';
import { PAGE_H, PAGE_W, SheetPage } from '../sheet/SheetPage';
import { topicIcon } from '../topicIcons';
import { footerFor, moduleCode } from './model';
import type { Lesson, Module, Settings } from './types';

export type PrintKind = 'inhalt' | 'raster';

const LESSONS_PER_PAGE = 11;
const COMPETENCES_PER_PAGE = 5;

const chunk = <T,>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out.length ? out : [[]];
};

const LEVELS = [
  { key: 'g', short: 'G', label: 'grundlegend' },
  { key: 'm', short: 'M', label: 'mittel' },
  { key: 'e', short: 'E', label: 'erweitert' },
] as const;

interface ModulePagesProps {
  kind: PrintKind;
  module: Module;
  lessons: Lesson[];
  settings: Settings;
}

/** The A4 pages (as SheetPages) for one kind of module print. */
export function ModulePages({ kind, module: m, lessons, settings }: ModulePagesProps) {
  const doc: Doc = { icon: m.icon, footer: footerFor(settings, m.subject), code: moduleCode(m), pages: [] };
  const kicker = `Klasse ${m.grade} · ${m.subject} · Modul ${m.number}`;

  if (kind === 'inhalt') {
    const page: Page = { title: `Inhaltsübersicht: ${m.title}`, kicker, type: 'lehrkraft', form: 'allein', nameField: 'aus', blocks: [] };
    const pages = chunk(lessons, LESSONS_PER_PAGE);
    return (
      <>
        {pages.map((rows, i) => (
          <PrintFrame key={i}>
            <SheetPage doc={doc} page={page} index={i} editing={false} hideForm>
              <div className="ws-full">
                {i === 0 && m.description.trim() && <p className="ws-text ov-intro">{m.description}</p>}
                <div className="ov-table">
                  <div className="ov-row is-head">
                    <div>Stunde</div>
                    <div>Thema</div>
                    <div>Material</div>
                  </div>
                  {rows.map((l) => (
                    <div key={l.id} className="ov-row">
                      <div className="ov-num">{l.number}</div>
                      <div className="ov-title">{l.title}</div>
                      <div className="ov-pages">
                        {l.doc.pages.map((pg, k) => (
                          <span key={k} className="ov-page" style={{ background: THEMES[pg.type].band }}>
                            <span className="ov-page-type" style={{ background: THEMES[pg.type].pill, color: THEMES[pg.type].pillFg }}>
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
                {i === pages.length - 1 && m.competences.length > 0 && (
                  <div className="ov-comp">
                    <h3 className="ws-h3">Kompetenzen</h3>
                    {m.competences.map((c) => (
                      <div key={c.id} className="ov-comp-row">
                        <span>{c.area}</span>
                        {c.lessons.trim() && <span className="ov-comp-lessons">Stunde {c.lessons}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SheetPage>
          </PrintFrame>
        ))}
      </>
    );
  }

  const page: Page = { title: `Kompetenzraster: ${m.title}`, kicker, type: 'sicherung', form: 'allein', nameField: 'name', blocks: [] };
  const pages = chunk(m.competences, COMPETENCES_PER_PAGE);
  return (
    <>
      {pages.map((rows, i) => (
        <PrintFrame key={i}>
          <SheetPage doc={doc} page={page} index={i} editing={false} hideForm>
            <div className="ws-full">
              {i === 0 && <p className="ws-text kr-intro">Kreuze an, was du schon kannst. G = grundlegend, M = mittel, E = erweitert.</p>}
              <div className="kr-table">
                <div className="kr-row is-head">
                  <div>Kompetenz</div>
                  {LEVELS.map((lv) => (
                    <div key={lv.key} className={'kr-level is-' + lv.key}>
                      <b>{lv.short}</b> {lv.label}
                    </div>
                  ))}
                </div>
                {rows.map((c) => (
                  <div key={c.id} className="kr-row">
                    <div className="kr-area">
                      {c.area}
                      {c.lessons.trim() && <span className="kr-lessons">Stunde {c.lessons}</span>}
                    </div>
                    {LEVELS.map((lv) => (
                      <div key={lv.key} className="kr-cell">
                        <span>{c[lv.key]}</span>
                        <span className="ws-check kr-check" />
                      </div>
                    ))}
                  </div>
                ))}
                {m.competences.length === 0 && <div className="ov-empty">Noch keine Kompetenzen eingetragen.</div>}
              </div>
            </div>
          </SheetPage>
        </PrintFrame>
      ))}
    </>
  );
}

/** Same frame as the editor's pages, so print.css prints exactly one A4 page per sheet. */
function PrintFrame({ children }: { children: ReactNode }) {
  return (
    <div className="page-frame">
      <div className="page-scale" style={{ width: PAGE_W, height: PAGE_H }}>
        {children}
      </div>
    </div>
  );
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
