// Year plan of a subject and grade: the school year as a strip of weeks with the modules on it, the modules with their
// weeks and start, and every week in a list; printable on A4. Redesigned 26.11.2026 (Dose, stage 3).
import { useState, type CSSProperties } from 'react';
import { ArrowLeft, CalendarPlus, CalendarRange, ChevronRight, MoreHorizontal, PackageOpen, Printer, Settings2, Sparkles } from 'lucide-react';
import { YearPlanAiDialog } from '../ai/YearPlanAiDialog';
import { NumberField } from '../editor/fields';
import { Menu } from '../editor/TopBar';
import { Icon } from '../icons';
import type { Doc, Page } from '../model/types';
import { SheetPage } from '../sheet/SheetPage';
import { topicIcon } from '../topicIcons';
import { PrintFrame } from './ModulePrint';
import { footerFor, lessonsOf, modulesOf, progressOf, progressText, subjectsOf } from './model';
import type { ParsedPackage } from './package';
import { PlanImportDialog } from './PlanImportDialog';
import { SettingsDialog } from '../shell/SettingsDialog';
import type { Library, Module, Settings } from './types';
import { addDays, BW_2026_27, dayText, planModules, schoolWeekCount, schoolWeeks, type PlannedModule, type PlanWeek } from './yearplan';
import './board.css';
import './module.css';

// The printed plan keeps its colours per module; on screen a module is its code and the subject's tint.
const MODULE_COLORS = ['accent-3', 'accent', 'accent-2', 'accent-4', 'accent-5', 'accent-6', 'accent-7'];
const moduleVars = (k: number) => {
  const r = MODULE_COLORS[k % MODULE_COLORS.length];
  return {
    '--m-bg': `var(--color-${r}-100)`,
    '--m-dot': `var(--color-${r}-600)`,
    '--m-fg': `var(--color-${r}-800)`,
  } as CSSProperties;
};

interface YearPlanViewProps {
  lib: Library;
  subject: string;
  grade: number;
  onBack(): void;
  onChangeModule(m: Module): void;
  onOpenModule(m: Module): void;
  onSetSchoolYear(): void;
  onSaveSettings(s: Settings): void;
  onExport(): void;
  onImport(pkg: ParsedPackage): void;
}

/** Which planned modules cover a week. */
const modulesInWeek = (planned: PlannedModule[], i: number, weeks: PlanWeek[]) => (weeks[i].holiday ? [] : planned.filter((p) => p.first <= i && i <= p.last));

const addFriday = (monday: string) => {
  const t = Date.parse(monday + 'T00:00:00Z') + 4 * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
};

const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
/** The month a week belongs to: the month of its Thursday. */
const monthOf = (w: PlanWeek) => Number(addDays(w.monday, 3).slice(5, 7)) - 1;

/** Runs of weeks that belong together: months for the head of the strip, holidays for its hatched columns. */
function runs<T>(weeks: PlanWeek[], key: (w: PlanWeek) => T | null): { key: T; first: number; last: number }[] {
  const out: { key: T; first: number; last: number }[] = [];
  weeks.forEach((w, i) => {
    const k = key(w);
    if (k === null) return;
    const prev = out.at(-1);
    if (prev && prev.key === k && prev.last === i - 1) prev.last = i;
    else out.push({ key: k, first: i, last: i });
  });
  return out;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

export function YearPlanView(p: YearPlanViewProps) {
  const [printing, setPrinting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [claudeOpen, setClaudeOpen] = useState(false);
  const year = p.lib.settings.schoolYear;
  const modules = modulesOf(p.lib, p.subject, p.grade);
  const weeks = year ? schoolWeeks(year) : [];
  const planned = planModules(modules, weeks);
  const colorOf = new Map(modules.map((m, k) => [m.id, k]));
  const total = schoolWeekCount(weeks);
  const used = modules.reduce((n, m) => n + m.weeks, 0);
  const planCount = modules.filter((m) => m.weeks > 0).length;
  const progress = new Map(modules.map((m) => [m.id, progressOf(lessonsOf(p.lib, m.id))]));
  const onlyPlanned = (m: Module) => progress.get(m.id)!.done === 0;

  if (printing && year) return <YearPlanPrint {...p} weeks={weeks} planned={planned} colorOf={colorOf} onlyPlanned={onlyPlanned} onClose={() => setPrinting(false)} />;

  return (
    <div className="board mod yp">
      <main className="board-main mod-main">
        <header className="board-band mod-band">
          <div className="mod-band-head">
            <span className="mod-icon" aria-hidden="true">
              <Icon icon={CalendarRange} size={28} />
            </span>
            <div className="board-band-text">
              <nav className="mod-crumbs" aria-label="Pfad">
                <span>{p.subject}</span>
                <Icon icon={ChevronRight} size={14} />
                <button type="button" onClick={p.onBack}>
                  Klasse {p.grade}
                </button>
                <Icon icon={ChevronRight} size={14} />
                <span aria-current="page">Jahresplan</span>
              </nav>
              <h1 className="board-title mod-title">{year ? `Schuljahr ${year.name}` : 'Jahresplan'}</h1>
            </div>
          </div>
          <div className="mod-band-foot">
            {year && (
              <p className="board-meta">
                <span>
                  {total} Schulwochen vom {dayText(year.start, true)} bis {dayText(year.end, true)}
                </span>
                <span>
                  verplant: {used} {used === 1 ? 'Woche' : 'Wochen'} in {planCount} {planCount === 1 ? 'Modul' : 'Modulen'}
                </span>
                <span className={used > total ? 'is-over' : undefined}>{used > total ? `${used - total} Wochen zu viel` : `frei: ${total - used}`}</span>
              </p>
            )}
            <div className="board-actions">
              <button type="button" className="btn btn-secondary ui-btn" title="Schuljahr und Ferien" onClick={() => setSettingsOpen(true)}>
                <Icon icon={Settings2} />
                <span className="btn-label">Schuljahr und Ferien</span>
              </button>
              <button type="button" className="btn btn-secondary ui-btn" onClick={() => setClaudeOpen(true)} title="Claude entwirft den Jahresplan mit Modulen, Kompetenzen und geplanten Stunden">
                <Icon icon={Sparkles} />
                <span className="btn-label">Mit KI bauen</span>
              </button>
              <Menu
                label="Mehr"
                icon={MoreHorizontal}
                items={[
                  {
                    label: 'Importieren …',
                    icon: CalendarPlus,
                    onClick: () => setImportOpen(true),
                  },
                  {
                    label: 'Als Stundenpaket sichern',
                    icon: PackageOpen,
                    onClick: p.onExport,
                  },
                ]}
              />
              <button type="button" className="btn btn-primary ui-btn" disabled={!year} onClick={() => setPrinting(true)}>
                <Icon icon={Printer} />
                Drucken
              </button>
            </div>
          </div>
        </header>

        {!year && (
          <div className="mod-empty">
            <p>Für den Jahresplan fehlt noch das Schuljahr mit den Ferien.</p>
            <div className="mod-empty-actions">
              <button type="button" className="btn btn-primary ui-btn" onClick={p.onSetSchoolYear}>
                Schuljahr {BW_2026_27.name} (Baden-Württemberg) eintragen
              </button>
              <button type="button" className="btn btn-secondary ui-btn" onClick={() => setSettingsOpen(true)}>
                Selbst eintragen …
              </button>
            </div>
          </div>
        )}

        {year && modules.length > 0 && <YearStrip weeks={weeks} modules={modules} planned={planned} onlyPlanned={onlyPlanned} onOpenModule={p.onOpenModule} />}

        <section className="mod-section" aria-labelledby="yp-modules-h">
          <h2 id="yp-modules-h" className="mod-h2">
            Module
          </h2>
          {modules.length > 0 ? (
            <>
              <p className="mod-hint">
                Trage für jedes Modul die Dauer in Schulwochen ein. Die Module folgen in der Reihenfolge ihrer Nummer aufeinander; Ferienwochen werden übersprungen. Ein Beginn legt fest, ab wann ein
                Modul läuft. Module, die erst geplant und noch nicht ausgearbeitet sind, erscheinen blasser.
              </p>
              <div className="yp-table-wrap">
                <table className="yp-table">
                  <thead>
                    <tr>
                      <th scope="col">Modul</th>
                      <th scope="col">Stunden</th>
                      <th scope="col">Wochen</th>
                      <th scope="col">Beginn</th>
                      <th scope="col">Zeitraum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((m) => {
                      const pl = planned.find((x) => x.module.id === m.id);
                      return (
                        <tr key={m.id} className={onlyPlanned(m) ? 'is-planned' : undefined}>
                          <th scope="row">
                            <button type="button" className="yp-module-link" onClick={() => p.onOpenModule(m)}>
                              <Icon icon={topicIcon(m.icon)} size={16} />
                              <span className="yp-code">M{m.number}</span>
                              <span className="yp-module-name">{m.title}</span>
                            </button>
                            {m.textbook && <span className="yp-book">{m.textbook}</span>}
                          </th>
                          <td className="yp-progress" data-label="Stunden">
                            {progressText(progress.get(m.id)!)}
                          </td>
                          <td className="yp-weeks-cell" data-label="Wochen">
                            <NumberField
                              label="Wochen"
                              value={m.weeks}
                              min={0}
                              max={40}
                              onChange={(weeks) =>
                                p.onChangeModule({
                                  ...m,
                                  weeks,
                                  updatedAt: Date.now(),
                                })
                              }
                            />
                          </td>
                          <td className="yp-start" data-label="Beginn">
                            <input
                              className="input"
                              type="date"
                              aria-label={`Beginn von Modul ${m.number}`}
                              value={m.start}
                              onChange={(e) =>
                                p.onChangeModule({
                                  ...m,
                                  start: e.target.value,
                                  updatedAt: Date.now(),
                                })
                              }
                            />
                          </td>
                          <td className="yp-period" data-label="Zeitraum">
                            {pl && weeks.length ? (
                              <>
                                <span className="yp-kw-range">
                                  KW {weeks[pl.first].kw} bis {weeks[pl.last].kw}
                                </span>
                                <span className="yp-days">
                                  {dayText(weeks[pl.first].monday)} bis {dayText(addFriday(weeks[pl.last].monday))}
                                </span>
                                {pl.short && <span className="yp-warn">passt nicht mehr ganz ins Schuljahr</span>}
                              </>
                            ) : m.weeks ? (
                              ''
                            ) : (
                              <span className="yp-unplanned">nicht eingeplant</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="mod-empty">
              <p>In diesem Jahrgang gibt es noch keine Module.</p>
              <div className="mod-empty-actions">
                <button type="button" className="btn btn-secondary ui-btn" onClick={() => setImportOpen(true)}>
                  <Icon icon={CalendarPlus} />
                  Jahresplan importieren
                </button>
                <button type="button" className="btn btn-secondary ui-btn" onClick={() => setClaudeOpen(true)}>
                  <Icon icon={Sparkles} />
                  Mit KI bauen
                </button>
              </div>
            </div>
          )}
        </section>

        {year && (
          <section className="mod-section" aria-labelledby="yp-weeks-h">
            <h2 id="yp-weeks-h" className="mod-h2">
              Woche für Woche
            </h2>
            <div className="yp-table-wrap">
              <table className="ypw">
                <thead>
                  <tr>
                    <th scope="col">KW</th>
                    <th scope="col">Datum</th>
                    <th scope="col">Unterricht</th>
                  </tr>
                </thead>
                <tbody>
                  {weeks.map((w, i) => {
                    const here = modulesInWeek(planned, i, weeks);
                    return (
                      <tr key={w.monday} className={w.holiday ? 'is-holiday' : undefined}>
                        <td className="ypw-kw">{w.kw}</td>
                        <td className="ypw-dates">
                          {dayText(w.monday)} bis {dayText(addFriday(w.monday))}
                        </td>
                        <td className="ypw-what">
                          {w.holiday ? (
                            <span className="ypw-holiday">{w.holiday}</span>
                          ) : (
                            here.map((x) => (
                              <span key={x.module.id} className={'ypw-chip' + (onlyPlanned(x.module) ? ' is-planned' : '')}>
                                <span className="yp-code">M{x.module.number}</span>
                                {x.module.title}
                              </span>
                            ))
                          )}
                          {!w.holiday && w.days < 5 && w.days > 0 && <span className="ypw-short">{w.days} Schultage</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
      {settingsOpen && <SettingsDialog settings={p.lib.settings} subjects={subjectsOf(p.lib)} onSave={p.onSaveSettings} onClose={() => setSettingsOpen(false)} />}
      {importOpen && (
        <PlanImportDialog
          lib={p.lib}
          subject={p.subject}
          grade={p.grade}
          onImport={(pkg) => {
            setImportOpen(false);
            p.onImport(pkg);
          }}
          onClose={() => setImportOpen(false)}
        />
      )}
      {claudeOpen && (
        <YearPlanAiDialog
          lib={p.lib}
          subject={p.subject}
          grade={p.grade}
          onApply={(pkg) => {
            setClaudeOpen(false);
            p.onImport(pkg);
          }}
          onClose={() => setClaudeOpen(false)}
        />
      )}
    </div>
  );
}

/** The school year as a strip: a column per week, the months on top, holidays hatched, one row per module with its
 *  weeks as a bar, and a line at this week. */
function YearStrip({
  weeks,
  modules,
  planned,
  onlyPlanned,
  onOpenModule,
}: {
  weeks: PlanWeek[];
  modules: Module[];
  planned: PlannedModule[];
  onlyPlanned(m: Module): boolean;
  onOpenModule(m: Module): void;
}) {
  const months = runs(weeks, monthOf);
  const holidays = runs(weeks, (w) => w.holiday || null);
  const today = todayIso();
  const now = weeks.findIndex((w) => w.monday <= today && today < addDays(w.monday, 7));
  const col = (i: number) => i + 2;
  return (
    <section className="mod-section" aria-labelledby="yp-strip-h">
      <h2 id="yp-strip-h" className="mod-h2">
        Das Jahr im Überblick
      </h2>
      <div className="yp-strip-wrap">
        <div
          className="yp-strip"
          style={
            {
              '--weeks': weeks.length,
              '--rows': modules.length,
            } as CSSProperties
          }
        >
          <span className="yp-ticks" aria-hidden="true" />
          {months.map((r) => (
            <span key={r.first} className="yp-month" style={{ gridColumn: `${col(r.first)} / ${col(r.last) + 1}` }}>
              {r.last - r.first >= 1 && (
                <>
                  <span className="yp-month-name">{MONTHS[r.key]}</span>
                  {r.last - r.first >= 2 && <span className="yp-month-kw">KW {weeks[r.first].kw}</span>}
                </>
              )}
            </span>
          ))}
          {holidays.map((r) => (
            <span
              key={r.first}
              className="yp-off"
              style={{ gridColumn: `${col(r.first)} / ${col(r.last) + 1}` }}
              title={`${r.key}: KW ${weeks[r.first].kw}${r.last > r.first ? ' bis ' + weeks[r.last].kw : ''}`}
            >
              {modules.length >= 3 && r.last > r.first && <span className="yp-off-name">{r.key}</span>}
            </span>
          ))}
          {now >= 0 && (
            <span className="yp-now" style={{ gridColumn: col(now) }}>
              <span className="yp-now-label">heute</span>
            </span>
          )}
          {modules.map((m, k) => {
            const pl = planned.find((x) => x.module.id === m.id);
            const row = k + 2;
            return (
              <div key={m.id} className="yp-row" style={{ gridRow: row }}>
                <button type="button" className="yp-row-label" style={{ gridRow: row }} onClick={() => onOpenModule(m)} title={`Modul ${m.number}: ${m.title}`}>
                  <span className="yp-code">M{m.number}</span>
                  <span className="yp-row-name">{m.title}</span>
                </button>
                {pl ? (
                  <>
                    <span
                      className={'yp-bar' + (onlyPlanned(m) ? ' is-planned' : '') + (pl.short ? ' is-short' : '')}
                      style={{
                        gridRow: row,
                        gridColumn: `${col(pl.first)} / ${col(pl.last) + 1}`,
                      }}
                      title={`Modul ${m.number}: KW ${weeks[pl.first].kw} bis ${weeks[pl.last].kw}${pl.short ? ', passt nicht mehr ganz ins Schuljahr' : ''}`}
                    />
                    <span className="yp-bar-label" style={{ gridRow: row, gridColumnStart: col(pl.first) }} aria-hidden="true">
                      M{m.number}
                    </span>
                  </>
                ) : (
                  <span className="yp-none" style={{ gridRow: row }}>
                    nicht eingeplant
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// One school year (about 46 weeks) fits on one A4 page.
const WEEKS_PER_PAGE = 48;

function YearPlanPrint(
  p: YearPlanViewProps & {
    weeks: PlanWeek[];
    planned: PlannedModule[];
    colorOf: Map<string, number>;
    onlyPlanned(m: Module): boolean;
    onClose(): void;
  },
) {
  const year = p.lib.settings.schoolYear!;
  const doc: Doc = {
    icon: 'calendar',
    lang: 'de',
    help: false,
    footer: footerFor(p.lib.settings, p.subject),
    code: `K${p.grade} · Jahresplan`,
    pages: [],
  };
  const page: Page = {
    title: `Jahresplan ${p.subject}`,
    kicker: `Klasse ${p.grade} · Schuljahr ${year.name}`,
    type: 'lehrkraft',
    form: 'allein',
    nameField: 'aus',
    blocks: [],
  };
  const chunks: number[][] = [];
  for (let i = 0; i < p.weeks.length; i += WEEKS_PER_PAGE) chunks.push(p.weeks.slice(i, i + WEEKS_PER_PAGE).map((_, k) => i + k));
  return (
    <div className="app is-preview">
      <header className="topbar" data-noprint="1">
        <button type="button" className="iconbtn topbar-back" onClick={p.onClose} title="Zurück zum Jahresplan" aria-label="Zurück zum Jahresplan">
          <Icon icon={ArrowLeft} size={18} />
        </button>
        <div className="topbar-icon">
          <Icon icon={CalendarRange} size={20} />
        </div>
        <div className="topbar-name">
          <div className="topbar-title">Jahresplan drucken</div>
          <div className="topbar-place">
            {p.subject} · Klasse {p.grade} · {year.name}
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
            {chunks.map((rows, k) => (
              <PrintFrame key={k}>
                <SheetPage doc={doc} page={page} index={k} editing={false} hideForm>
                  <div className="ws-full yp-print">
                    {rows.map((i) => {
                      const w = p.weeks[i];
                      const here = modulesInWeek(p.planned, i, p.weeks);
                      return (
                        <div key={w.monday} className={'yp-prow' + (w.holiday ? ' is-holiday' : '')}>
                          <span className="yp-kw">KW {w.kw}</span>
                          <span className="yp-dates">
                            {dayText(w.monday)}–{dayText(addFriday(w.monday))}
                          </span>
                          <span className="yp-what">
                            {w.holiday ? (
                              <span className="yp-holiday">{w.holiday}</span>
                            ) : (
                              here.map((x) => (
                                <span key={x.module.id} className={'yp-chip' + (p.onlyPlanned(x.module) ? ' is-planned' : '')} style={moduleVars(p.colorOf.get(x.module.id) ?? 0)}>
                                  {x.first === i ? `Modul ${x.module.number}: ${x.module.title}${x.module.textbook ? ` · ${x.module.textbook}` : ''}` : `Modul ${x.module.number}`}
                                </span>
                              ))
                            )}
                          </span>
                          <span className="yp-notes" />
                        </div>
                      );
                    })}
                  </div>
                </SheetPage>
              </PrintFrame>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
