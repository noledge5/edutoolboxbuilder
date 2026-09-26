// Start page: choose subject and grade, then a module; recently edited lessons for quick access.
import { useState, type DragEvent } from 'react';
import { Blocks, CalendarRange, FolderSync, Plus, Settings as SettingsIcon, Sparkles, X } from 'lucide-react';
import { Icon } from '../icons';
import { topicIcon } from '../topicIcons';
import { ClaudeDialog } from './ClaudeDialog';
import { lastChange, lessonsOf, modulesOf, subjectsOf } from './model';
import type { Lesson, Library, Module, SchoolYear, Settings } from './types';
import { readSchoolYear } from './read';
import { BW_2026_27, holidaysText } from './yearplan';
import { GRADES } from './types';

interface OverviewProps {
  lib: Library;
  subject?: string;
  grade?: number;
  onPick(subject: string, grade: number): void;
  onOpenModule(m: Module): void;
  onOpenLesson(l: Lesson): void;
  onAddModule(subject: string, grade: number): void;
  onAddSubject(name: string): void;
  onRemoveSubject(name: string): void;
  onSettings(s: Settings): void;
  /** Changes not yet in a backup file on this device. */
  pending: number;
  onSync(): void;
  /** A file opened or dropped here: Stundenpaket, library backup or worksheet. */
  onOpenFile(file: File): void;
  onOpenPlan(subject: string, grade: number): void;
}

export function Overview(p: OverviewProps) {
  const { lib } = p;
  const subjects = subjectsOf(lib);
  const subject = p.subject && subjects.includes(p.subject) ? p.subject : subjects[0];
  const gradesWithModules = GRADES.filter((g) => subject && modulesOf(lib, subject, g).length > 0);
  const grade = p.grade && (GRADES as readonly number[]).includes(p.grade) ? p.grade : (gradesWithModules[0] ?? GRADES[0]);
  const modules = subject ? modulesOf(lib, subject, grade) : [];
  const recent = [...lib.lessons].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4);
  const moduleOf = (l: Lesson) => lib.modules.find((m) => m.id === l.moduleId);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [claudeOpen, setClaudeOpen] = useState(false);
  const [dropping, setDropping] = useState(false);
  const hasFiles = (e: DragEvent) => e.dataTransfer.types.includes('Files');

  const addSubject = () => {
    const name = window.prompt('Name des Fachs, z. B. Biologie:')?.trim();
    if (name) p.onAddSubject(name);
  };

  return (
    <div
      className={'lib' + (dropping ? ' is-dropping' : '')}
      onDragOver={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        setDropping(true);
      }}
      onDragLeave={(e) => e.currentTarget === e.target && setDropping(false)}
      onDrop={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        setDropping(false);
        const f = e.dataTransfer.files[0];
        if (f) {
          setClaudeOpen(false);
          p.onOpenFile(f);
        }
      }}
    >
      <header className="topbar">
        <div className="topbar-icon">
          <Icon icon={Blocks} size={20} />
        </div>
        <div className="topbar-name">
          <div className="topbar-title">Arbeitsblatt-Baukasten</div>
          <div className="topbar-place">Übersicht</div>
        </div>
        <button type="button" className="btn btn-secondary ui-btn sync-btn" onClick={p.onSync} title={p.pending > 0 ? 'Änderungen noch nicht gesichert' : 'Alles gesichert'}>
          <Icon icon={FolderSync} />
          <span className="btn-label">Abgleich Mac/iPad</span>
          <span className={'sync-dot' + (p.pending > 0 ? ' is-open' : '')} aria-label={p.pending > 0 ? 'nicht gesichert' : 'gesichert'} />
        </button>
        <button type="button" className="btn btn-secondary ui-btn" title="Mit Claude erstellen" onClick={() => setClaudeOpen(true)}>
          <Icon icon={Sparkles} />
          <span className="btn-label">Mit Claude</span>
        </button>
        <button type="button" className="btn btn-secondary ui-btn lib-settings-btn" title="Einstellungen" onClick={() => setSettingsOpen(true)}>
          <Icon icon={SettingsIcon} />
          <span className="btn-label">Einstellungen</span>
        </button>
      </header>

      <main className="lib-main">
        {lastChange(lib) === 0 && (
          <div className="sync-banner is-welcome">
            <span>
              Neu auf diesem Gerät oder gerade als App installiert? Die App hat hier ihren eigenen Speicher. Öffne einmal deine Sicherung aus iCloud Drive, dann ist alles da.
            </span>
            <button type="button" className="btn btn-primary ui-btn" onClick={p.onSync}>
              Sicherung öffnen
            </button>
          </div>
        )}
        {p.pending > 0 && (
          <div className="sync-banner">
            <span>
              {p.pending} {p.pending === 1 ? 'Änderung ist' : 'Änderungen sind'} noch nicht in iCloud gesichert.
            </span>
            <button type="button" className="btn btn-primary ui-btn" onClick={p.onSync}>
              Jetzt abgleichen
            </button>
          </div>
        )}
        {recent.length > 0 && (
          <section className="lib-section">
            <h2 className="lib-h2">Zuletzt bearbeitet</h2>
            <div className="lib-recent">
              {recent.map((l) => {
                const m = moduleOf(l);
                if (!m) return null;
                return (
                  <button key={l.id} type="button" className="lib-recent-item" onClick={() => p.onOpenLesson(l)}>
                    <span className="lib-icon is-small">
                      <Icon icon={topicIcon(m.icon)} size={16} />
                    </span>
                    <span className="lib-recent-text">
                      <span className="lib-recent-title">
                        Stunde {l.number}: {l.title}
                      </span>
                      <span className="lib-recent-place">
                        {m.subject} · Klasse {m.grade} · {m.title}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className="lib-section">
          <h2 className="lib-h2">Fach</h2>
          <div className="lib-chips">
            {subjects.map((s) => {
              const empty = !lib.modules.some((m) => m.subject === s);
              return (
                <span key={s} className={'lib-chip' + (s === subject ? ' is-on' : '')}>
                  <button type="button" onClick={() => p.onPick(s, grade)}>
                    {s}
                  </button>
                  {empty && (
                    <button type="button" className="lib-chip-x" title={`${s} entfernen`} aria-label={`${s} entfernen`} onClick={() => p.onRemoveSubject(s)}>
                      <Icon icon={X} size={13} />
                    </button>
                  )}
                </span>
              );
            })}
            <button type="button" className="lib-chip is-add" onClick={addSubject}>
              <Icon icon={Plus} size={14} />
              Fach
            </button>
          </div>
        </section>

        {subject && (
          <section className="lib-section">
            <h2 className="lib-h2">Jahrgang</h2>
            <div className="lib-chips">
              {GRADES.map((g) => {
                const n = modulesOf(lib, subject, g).length;
                return (
                  <button key={g} type="button" className={'lib-chip' + (g === grade ? ' is-on' : '')} onClick={() => p.onPick(subject, g)}>
                    Klasse {g}
                    {n > 0 && <span className="lib-count">{n}</span>}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {subject ? (
          <section className="lib-section">
            <div className="lib-h2-row">
              <h2 className="lib-h2">
                Module · {subject} · Klasse {grade}
              </h2>
              <button type="button" className="btn btn-secondary ui-btn" onClick={() => p.onOpenPlan(subject, grade)}>
                <Icon icon={CalendarRange} />
                Jahresplan
              </button>
            </div>
            <div className="lib-grid">
              {modules.map((m) => {
                const lessons = lessonsOf(lib, m.id);
                return (
                  <button key={m.id} type="button" className="lib-card" onClick={() => p.onOpenModule(m)}>
                    <span className="lib-icon">
                      <Icon icon={topicIcon(m.icon)} size={22} />
                    </span>
                    <span className="lib-card-kicker">Modul {m.number}</span>
                    <span className="lib-card-title">{m.title}</span>
                    <span className="lib-card-meta">
                      {lessons.length} {lessons.length === 1 ? 'Stunde' : 'Stunden'} · {m.competences.length} {m.competences.length === 1 ? 'Kompetenz' : 'Kompetenzen'}
                    </span>
                  </button>
                );
              })}
              <button type="button" className="lib-card is-add" onClick={() => p.onAddModule(subject, grade)}>
                <span className="lib-icon is-add">
                  <Icon icon={Plus} size={22} />
                </span>
                <span className="lib-card-title">Neues Modul</span>
                <span className="lib-card-meta">
                  {subject} · Klasse {grade}
                </span>
              </button>
            </div>
          </section>
        ) : (
          <p className="lib-empty">Lege zuerst ein Fach an.</p>
        )}
      </main>

      {claudeOpen && (
        <ClaudeDialog
          onOpenFile={(f) => {
            setClaudeOpen(false);
            p.onOpenFile(f);
          }}
          onClose={() => setClaudeOpen(false)}
        />
      )}
      {settingsOpen && <SettingsDialog settings={lib.settings} onSave={p.onSettings} onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

export function SettingsDialog({ settings, onSave, onClose }: { settings: Settings; onSave(s: Settings): void; onClose(): void }) {
  const [footerBase, setFooterBase] = useState(settings.footerBase);
  const y = settings.schoolYear;
  const [yearName, setYearName] = useState(y?.name ?? '');
  const [start, setStart] = useState(y?.start ?? '');
  const [end, setEnd] = useState(y?.end ?? '');
  const [holidays, setHolidays] = useState(y ? holidaysText(y.holidays) : '');
  const fill = (v: SchoolYear) => {
    setYearName(v.name);
    setStart(v.start);
    setEnd(v.end);
    setHolidays(holidaysText(v.holidays));
  };
  const schoolYear = (): SchoolYear | null =>
    readSchoolYear({
      name: yearName.trim(),
      start,
      end,
      holidays: holidays
        .split('\n')
        .map((l) => l.split('|').map((x) => x.trim()))
        .filter(([name]) => name)
        .map(([name, from = '', to = '']) => ({ name, from, to })),
    });
  const incomplete = (start || end) && !schoolYear();
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog sync-dialog" role="dialog" aria-modal="true" aria-label="Einstellungen" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">Einstellungen</div>
        <div className="field">
          <label htmlFor="footer-base">Fußzeile neuer Arbeitsblätter (das Fach wird angehängt)</label>
          <input id="footer-base" className="input" value={footerBase} placeholder="Name · Schule" onChange={(e) => setFooterBase(e.target.value)} />
        </div>
        <div className="settings-year">
          <div className="panel-section-label">Schuljahr für den Jahresplan</div>
          <div className="settings-year-row">
            <div className="field">
              <label htmlFor="sy-name">Schuljahr</label>
              <input id="sy-name" className="input" value={yearName} placeholder="2026/27" onChange={(e) => setYearName(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="sy-start">Erster Schultag</label>
              <input id="sy-start" className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="sy-end">Letzter Schultag</label>
              <input id="sy-end" className="input" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="sy-holidays">Ferien und freie Tage (je Zeile: Name | von | bis, z. B. Herbstferien | 26.10.2026 | 31.10.2026)</label>
            <textarea id="sy-holidays" className="input" rows={6} value={holidays} onChange={(e) => setHolidays(e.target.value)} />
          </div>
          <div className="panel-row">
            <button type="button" className="btn btn-secondary ui-btn" onClick={() => fill(BW_2026_27)}>
              Baden-Württemberg {BW_2026_27.name} eintragen
            </button>
          </div>
          <p className="sync-tip">Bewegliche Ferientage legt jede Schule selbst fest: Trage sie als eigene Zeile ein.</p>
          {incomplete && <p className="json-err">Erster und letzter Schultag fehlen oder passen nicht zusammen.</p>}
        </div>
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary ui-btn" onClick={onClose}>
            Abbrechen
          </button>
          <button
            type="button"
            className="btn btn-primary ui-btn"
            disabled={!!incomplete}
            onClick={() => {
              onSave({ ...settings, footerBase: footerBase.trim(), schoolYear: schoolYear(), updatedAt: Date.now() });
              onClose();
            }}
          >
            Übernehmen
          </button>
        </div>
      </div>
    </div>
  );
}
