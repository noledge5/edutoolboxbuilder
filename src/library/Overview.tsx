// Start page: choose subject and grade, then a module; recently edited lessons for quick access.
import { useState } from 'react';
import { Blocks, FolderSync, Plus, Settings as SettingsIcon, X } from 'lucide-react';
import { Icon } from '../icons';
import { topicIcon } from '../topicIcons';
import { lastChange, lessonsOf, modulesOf, subjectsOf } from './model';
import type { Lesson, Library, Module, Settings } from './types';
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

  const addSubject = () => {
    const name = window.prompt('Name des Fachs, z. B. Biologie:')?.trim();
    if (name) p.onAddSubject(name);
  };

  return (
    <div className="lib">
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
        <button type="button" className="btn btn-secondary ui-btn" onClick={() => setSettingsOpen(true)}>
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
            <h2 className="lib-h2">
              Module · {subject} · Klasse {grade}
            </h2>
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

      {settingsOpen && <SettingsDialog settings={lib.settings} onSave={p.onSettings} onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

function SettingsDialog({ settings, onSave, onClose }: { settings: Settings; onSave(s: Settings): void; onClose(): void }) {
  const [footerBase, setFooterBase] = useState(settings.footerBase);
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label="Einstellungen" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">Einstellungen</div>
        <div className="field">
          <label htmlFor="footer-base">Fußzeile neuer Arbeitsblätter (das Fach wird angehängt)</label>
          <input id="footer-base" className="input" value={footerBase} placeholder="Name · Schule" onChange={(e) => setFooterBase(e.target.value)} />
        </div>
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary ui-btn" onClick={onClose}>
            Abbrechen
          </button>
          <button
            type="button"
            className="btn btn-primary ui-btn"
            onClick={() => {
              onSave({ ...settings, footerBase: footerBase.trim(), updatedAt: Date.now() });
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
