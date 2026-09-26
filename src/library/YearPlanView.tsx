// Year plan of a subject and grade: the modules (units) laid out on the school weeks, with holidays; printable on A4.
import { useState, type CSSProperties } from 'react';
import { ArrowLeft, CalendarRange, PackageOpen, Printer } from 'lucide-react';
import { NumberField } from '../editor/fields';
import { Icon } from '../icons';
import type { Doc, Page } from '../model/types';
import { SheetPage } from '../sheet/SheetPage';
import { topicIcon } from '../topicIcons';
import { PrintFrame } from './ModulePrint';
import { footerFor, lessonsOf, modulesOf } from './model';
import { SettingsDialog } from './Overview';
import type { Library, Module, Settings } from './types';
import { BW_2026_27, dayText, planModules, schoolWeekCount, schoolWeeks, type PlannedModule, type PlanWeek } from './yearplan';

const lessonCount = (n: number) => `${n} ${n === 1 ? 'Stunde' : 'Stunden'}`;

const MODULE_COLORS = ['accent-3', 'accent', 'accent-2', 'accent-4', 'accent-5', 'accent-6', 'accent-7'];
const moduleVars = (k: number) => {
  const r = MODULE_COLORS[k % MODULE_COLORS.length];
  return { '--m-bg': `var(--color-${r}-100)`, '--m-dot': `var(--color-${r}-600)`, '--m-fg': `var(--color-${r}-800)` } as CSSProperties;
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
}

/** Which planned modules cover a week. */
const modulesInWeek = (planned: PlannedModule[], i: number, weeks: PlanWeek[]) => (weeks[i].holiday ? [] : planned.filter((p) => p.first <= i && i <= p.last));

const period = (p: PlannedModule, weeks: PlanWeek[]) => {
  const a = weeks[p.first];
  const b = weeks[p.last];
  return `KW ${a.kw}–${b.kw} · ${dayText(a.monday)}–${dayText(addFriday(b.monday))}`;
};
const addFriday = (monday: string) => {
  const t = Date.parse(monday + 'T00:00:00Z') + 4 * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
};

export function YearPlanView(p: YearPlanViewProps) {
  const [printing, setPrinting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const year = p.lib.settings.schoolYear;
  const modules = modulesOf(p.lib, p.subject, p.grade);
  const weeks = year ? schoolWeeks(year) : [];
  const planned = planModules(modules, weeks);
  const colorOf = new Map(modules.map((m, k) => [m.id, k]));
  const total = schoolWeekCount(weeks);
  const used = modules.reduce((n, m) => n + m.weeks, 0);
  const planCount = modules.filter((m) => m.weeks > 0).length;

  if (printing && year) return <YearPlanPrint {...p} weeks={weeks} planned={planned} colorOf={colorOf} onClose={() => setPrinting(false)} />;

  return (
    <div className="lib">
      <header className="topbar">
        <button type="button" className="iconbtn topbar-back" onClick={p.onBack} title="Zur Übersicht" aria-label="Zur Übersicht">
          <Icon icon={ArrowLeft} size={18} />
        </button>
        <div className="topbar-icon">
          <Icon icon={CalendarRange} size={20} />
        </div>
        <div className="topbar-name">
          <div className="topbar-title">Jahresplan</div>
          <div className="topbar-place">
            {p.subject} · Klasse {p.grade}
            {year ? ` · Schuljahr ${year.name}` : ''}
          </div>
        </div>
        <button type="button" className="btn btn-secondary ui-btn" onClick={p.onExport} title="Alle Module dieses Jahrgangs mit Schuljahr als Stundenpaket, z. B. für Claude">
          <Icon icon={PackageOpen} />
          <span className="btn-label">Als Stundenpaket sichern</span>
        </button>
        <button type="button" className="btn btn-primary ui-btn" disabled={!year} onClick={() => setPrinting(true)}>
          <Icon icon={Printer} />
          <span className="btn-label">Drucken</span>
        </button>
      </header>

      <main className="lib-main">
        {!year ? (
          <div className="sync-banner is-welcome">
            <span>Für den Jahresplan fehlt noch das Schuljahr mit den Ferien.</span>
            <button type="button" className="btn btn-primary ui-btn" onClick={p.onSetSchoolYear}>
              Schuljahr {BW_2026_27.name} (Baden-Württemberg) eintragen
            </button>
            <button type="button" className="btn btn-secondary ui-btn" onClick={() => setSettingsOpen(true)}>
              Selbst eintragen …
            </button>
          </div>
        ) : (
          <p className={'sync-status yp-summary' + (used > total ? ' is-open' : '')}>
            {total} Schulwochen vom {dayText(year.start, true)} bis {dayText(year.end, true)} · verplant: {used} {used === 1 ? 'Woche' : 'Wochen'} in {planCount}{' '}
            {planCount === 1 ? 'Modul' : 'Modulen'} · {used > total ? `${used - total} Wochen zu viel` : `frei: ${total - used}`}
            <button type="button" className="yp-edit-year" onClick={() => setSettingsOpen(true)}>
              Schuljahr und Ferien ändern
            </button>
          </p>
        )}

        <section className="lib-section">
          <h2 className="lib-h2">Module</h2>
          <p className="lib-help">
            Trage für jedes Modul die Dauer in Schulwochen ein. Die Module folgen in der Reihenfolge ihrer Nummer aufeinander; Ferienwochen werden übersprungen. Ein Beginn legt fest, ab wann ein Modul
            läuft.
          </p>
          <div className="yp-modules">
            {modules.map((m) => {
              const pl = planned.find((x) => x.module.id === m.id);
              return (
                <div key={m.id} className="yp-module" style={moduleVars(colorOf.get(m.id) ?? 0)}>
                  <span className="lib-icon is-small yp-dot">
                    <Icon icon={topicIcon(m.icon)} size={16} />
                  </span>
                  <div className="yp-module-main">
                    <button type="button" className="yp-module-title" onClick={() => p.onOpenModule(m)}>
                      Modul {m.number}: {m.title}
                    </button>
                    <div className="yp-module-meta">
                      {[
                        m.textbook,
                        lessonCount(lessonsOf(p.lib, m.id).length),
                        pl && weeks.length ? period(pl, weeks) + (pl.short ? ' · passt nicht mehr ganz ins Schuljahr' : '') : m.weeks ? '' : 'nicht eingeplant',
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </div>
                  <NumberField label="Wochen" value={m.weeks} min={0} max={40} onChange={(weeks) => p.onChangeModule({ ...m, weeks, updatedAt: Date.now() })} />
                  <div className="field">
                    <label htmlFor={'s' + m.id}>Beginn</label>
                    <input id={'s' + m.id} className="input" type="date" value={m.start} onChange={(e) => p.onChangeModule({ ...m, start: e.target.value, updatedAt: Date.now() })} />
                  </div>
                </div>
              );
            })}
            {modules.length === 0 && <p className="lib-empty">In diesem Jahrgang gibt es noch keine Module.</p>}
          </div>
        </section>

        {year && (
          <section className="lib-section">
            <h2 className="lib-h2">Wochen</h2>
            <div className="yp-weeks">
              {weeks.map((w, i) => {
                const here = modulesInWeek(planned, i, weeks);
                return (
                  <div key={w.monday} className={'yp-week' + (w.holiday ? ' is-holiday' : '')}>
                    <span className="yp-kw">KW {w.kw}</span>
                    <span className="yp-dates">
                      {dayText(w.monday)}–{dayText(addFriday(w.monday))}
                    </span>
                    <span className="yp-what">
                      {w.holiday ? (
                        <span className="yp-holiday">{w.holiday}</span>
                      ) : (
                        here.map((x) => (
                          <span key={x.module.id} className="yp-chip" style={moduleVars(colorOf.get(x.module.id) ?? 0)}>
                            Modul {x.module.number}: {x.module.title}
                          </span>
                        ))
                      )}
                      {!w.holiday && w.days < 5 && w.days > 0 && <span className="yp-short">{w.days} Schultage</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
      {settingsOpen && <SettingsDialog settings={p.lib.settings} onSave={p.onSaveSettings} onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

// One school year (about 46 weeks) fits on one A4 page.
const WEEKS_PER_PAGE = 48;

function YearPlanPrint(p: YearPlanViewProps & { weeks: PlanWeek[]; planned: PlannedModule[]; colorOf: Map<string, number>; onClose(): void }) {
  const year = p.lib.settings.schoolYear!;
  const doc: Doc = { icon: 'calendar', lang: 'de', help: false, footer: footerFor(p.lib.settings, p.subject), code: `K${p.grade} · Jahresplan`, pages: [] };
  const page: Page = { title: `Jahresplan ${p.subject}`, kicker: `Klasse ${p.grade} · Schuljahr ${year.name}`, type: 'lehrkraft', form: 'allein', nameField: 'aus', blocks: [] };
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
                                <span key={x.module.id} className="yp-chip" style={moduleVars(p.colorOf.get(x.module.id) ?? 0)}>
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
