// Start page: choose subject and grade, then a module; recently edited lessons for quick access.
import { useState, type DragEvent } from 'react';
import { Blocks, CalendarRange, FolderSync, Plus, Settings as SettingsIcon, Sparkles, Trash2, X } from 'lucide-react';
import { Icon } from '../icons';
import { topicIcon } from '../topicIcons';
import { ClaudeDialog } from './ClaudeDialog';
import { isWorkedOut, lastChange, lessonsOf, modulesOf, progressOf, progressText, subjectsOf } from './model';
import type { Lesson, Library, Module, SchoolYear, Settings } from './types';
import { readSchoolYear } from './read';
import { SUBJECT_COLORS, subjectColor, subjectVars, swatch } from './subjectColor';
import { BW_2026_27, holidaysText } from './yearplan';
import { GRADES } from './types';

interface OverviewProps {
  lib: Library;
  /** Entries in the trash; 0 hides the button. */
  trashCount: number;
  /** Time of the last backup file saved or opened on this device (0: none yet). */
  savedAt: number;
  onOpenTrash(): void;
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
  // Safari (not installed as an app) clears stored data after 7 days without a visit: say so, until dismissed.
  const [safariTab, setSafariTab] = useState(() => {
    try {
      const standalone = window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
      const ua = navigator.userAgent;
      const webkit = /iPad|iPhone|Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|Chromium|Edg|Firefox|OPR/.test(ua);
      const dismissed = Number(localStorage.getItem('baukasten-hinweis-safari')) || 0;
      return !standalone && webkit && Date.now() - dismissed > 30 * 86_400_000;
    } catch {
      return false;
    }
  });
  const dismissSafari = () => {
    try {
      localStorage.setItem('baukasten-hinweis-safari', String(Date.now()));
    } catch {
      // Private mode: the hint just comes back next time.
    }
    setSafariTab(false);
  };
  const backupAge = p.savedAt ? Math.floor((Date.now() - p.savedAt) / 86_400_000) : null;

  const { lib } = p;
  const subjects = subjectsOf(lib);
  const subject = p.subject && subjects.includes(p.subject) ? p.subject : subjects[0];
  const gradesWithModules = GRADES.filter((g) => subject && modulesOf(lib, subject, g).length > 0);
  const grade = p.grade && (GRADES as readonly number[]).includes(p.grade) ? p.grade : (gradesWithModules[0] ?? GRADES[0]);
  const modules = subject ? modulesOf(lib, subject, grade) : [];
  // Planned lessons from the year plan were imported, not edited.
  const recent = lib.lessons
    .filter(isWorkedOut)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 4);
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
        {safariTab && (
          <div className="sync-banner is-welcome">
            <span>
              <b>Tipp:</b> Installiere den Baukasten als App (iPad: Teilen → Zum Home-Bildschirm, Mac: Ablage → Zum Dock hinzufügen) und öffne dort einmal deine Sicherung. Im Safari-Tab löscht Safari
              die gespeicherten Daten, wenn du die Seite 7 Tage lang nicht öffnest.
            </span>
            <button type="button" className="btn btn-secondary ui-btn" onClick={dismissSafari}>
              Verstanden
            </button>
          </div>
        )}
        {p.pending > 0 && (
          <div className={'sync-banner' + (backupAge === null || backupAge >= 7 ? ' is-urgent' : '')}>
            <span>
              {p.pending} {p.pending === 1 ? 'Änderung ist' : 'Änderungen sind'} noch nicht in iCloud gesichert.
              {backupAge === null ? ' Auf diesem Gerät gibt es noch keine Sicherung.' : backupAge >= 7 ? ` Die letzte Sicherung ist ${backupAge} Tage her.` : ''}
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
                  <button key={l.id} type="button" className="lib-recent-item" style={subjectVars(subjectColor(lib.settings, m.subject))} onClick={() => p.onOpenLesson(l)}>
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
                    <span className="lib-chip-dot" style={{ background: swatch(subjectColor(lib.settings, s)) }} />
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
                const progress = progressOf(lessons);
                const planned = progress.done === 0;
                return (
                  <button key={m.id} type="button" className={'lib-card' + (planned ? ' is-planned' : '')} onClick={() => p.onOpenModule(m)}>
                    <span className="lib-icon">
                      <Icon icon={topicIcon(m.icon)} size={22} />
                    </span>
                    <span className="lib-card-kicker">
                      Modul {m.number}
                      {planned && <span className="lib-planned-badge">{progress.total ? 'Geplant' : 'Noch leer'}</span>}
                    </span>
                    <span className="lib-card-title">{m.title}</span>
                    <span className="lib-card-meta">
                      {progressText(progress)} · {m.competences.length} {m.competences.length === 1 ? 'Kompetenz' : 'Kompetenzen'}
                    </span>
                    {progress.done > 0 && progress.done < progress.total && (
                      <span className="lib-progress-bar is-card" aria-hidden="true">
                        <span style={{ width: `${(100 * progress.done) / progress.total}%` }} />
                      </span>
                    )}
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
        {p.trashCount > 0 && (
          <div className="lib-trash-row">
            <button type="button" className="btn btn-secondary ui-btn" onClick={p.onOpenTrash}>
              <Icon icon={Trash2} />
              Papierkorb · {p.trashCount}
            </button>
          </div>
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
      {settingsOpen && <SettingsDialog settings={lib.settings} subjects={subjects} onSave={p.onSettings} onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

export function SettingsDialog({ settings, subjects, onSave, onClose }: { settings: Settings; subjects: string[]; onSave(s: Settings): void; onClose(): void }) {
  const [footerBase, setFooterBase] = useState(settings.footerBase);
  const [colors, setColors] = useState(settings.subjectColors);
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
      <div className="dialog sync-dialog settings-dialog" role="dialog" aria-modal="true" aria-label="Einstellungen" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">Einstellungen</div>
        <div className="field">
          <label htmlFor="footer-base">Fußzeile neuer Arbeitsblätter (das Fach wird angehängt)</label>
          <input id="footer-base" className="input" value={footerBase} placeholder="Name · Schule" onChange={(e) => setFooterBase(e.target.value)} />
        </div>
        {subjects.length > 0 && (
          <div className="settings-colors">
            <div className="panel-section-label">Farbe je Fach</div>
            {subjects.map((s) => {
              const current = subjectColor({ ...settings, subjectColors: colors }, s);
              return (
                <div key={s} className="settings-color-row">
                  <span className="settings-color-name">{s}</span>
                  <div className="swatches" role="radiogroup" aria-label={`Farbe für ${s}`}>
                    {SUBJECT_COLORS.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        role="radio"
                        aria-checked={current === c.key}
                        className={'swatch' + (current === c.key ? ' is-on' : '')}
                        style={{ background: swatch(c.key) }}
                        title={c.label}
                        aria-label={c.label}
                        onClick={() => setColors({ ...colors, [s]: c.key })}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
            <p className="sync-tip">Die Farbe gilt für Knöpfe und Symbole im Baukasten, damit du die Fächer auseinanderhältst. Die gedruckten Blätter bleiben, wie sie sind.</p>
          </div>
        )}
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
              onSave({ ...settings, footerBase: footerBase.trim(), schoolYear: schoolYear(), subjectColors: colors, updatedAt: Date.now() });
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
