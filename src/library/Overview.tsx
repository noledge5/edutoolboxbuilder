// The class board (start page): one class of one subject, its modules with their first real sheet, and the lessons
// edited last. Subjects and classes are chosen in the sidebar (src/shell/Sidebar.tsx).
import { memo, useState, type DragEvent } from 'react';
import { CalendarRange, Plus, Users } from 'lucide-react';
import { Icon } from '../icons';
import { topicIcon } from '../topicIcons';
import { PagePreview } from '../ai/LessonAiDialog';
import { ClassNotesDialog } from '../ai/ClassNotesDialog';
import { statusText } from '../sync/AutoSyncPanel';
import type { SyncStatus } from '../sync/engine';
import { docForLesson, isWorkedOut, lastChange, lessonCode, lessonsOf, modulesOf, progressOf } from './model';
import type { Lesson, Library, Module } from './types';
import type { Doc } from '../model/types';
import { subjectColor, subjectTint } from './subjectColor';
import { boardPlace } from '../shell/place';
import './board.css';

interface OverviewProps {
  lib: Library;
  subject?: string;
  grade?: number;
  /** Time of the last backup file saved or opened on this device (0: none yet). */
  savedAt: number;
  /** Changes not yet in a backup file on this device. */
  pending: number;
  /** The automatic sync; with it on, the reminders about backup files are not needed. */
  autoSync: SyncStatus;
  onSync(): void;
  onOpenModule(m: Module): void;
  onOpenLesson(l: Lesson): void;
  onAddModule(subject: string, grade: number): void;
  /** A file opened or dropped here: Stundenpaket, library backup or worksheet. */
  onOpenFile(file: File): void;
  onOpenPlan(subject: string, grade: number): void;
}

/** Scale of the worksheet thumbnails: on a module card and next to a recently edited lesson. */
const CARD_SCALE = 0.24;
const RECENT_SCALE = 0.075;

/** The page that stands for a module or lesson: the first filled page for the students, else the first page. */
function sheetOf(m: Module, lessons: Lesson[]): { doc: Doc; p: number } | null {
  const docs = lessons.filter(isWorkedOut).map((l) => docForLesson(m, l));
  for (const doc of docs) {
    const p = doc.pages.findIndex((page) => page.type !== 'lehrkraft' && page.blocks.length > 0);
    if (p >= 0) return { doc, p };
  }
  const doc = docs.find((d) => d.pages.length > 0);
  return doc ? { doc, p: 0 } : null;
}

/** The sheet of a module or lesson, drawn small. Memoised on the stored objects, which only change when edited, so a
 *  sync tick or a hover does not draw every page again. */
const SheetThumb = memo(
  function SheetThumb({ m, lessons, scale }: { m: Module; lessons: Lesson[]; scale: number }) {
    const sheet = sheetOf(m, lessons);
    return sheet ? <PagePreview doc={sheet.doc} p={sheet.p} scale={scale} /> : <Icon icon={topicIcon(m.icon)} size={scale > 0.1 ? 32 : 20} />;
  },
  (a, b) => a.m === b.m && a.scale === b.scale && a.lessons.length === b.lessons.length && a.lessons.every((l, i) => l === b.lessons[i]),
);

const count = (k: number, one: string, many: string) => `${k} ${k === 1 ? one : many}`;

export function Overview(p: OverviewProps) {
  const [notesOpen, setNotesOpen] = useState(false);
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
  const auto = p.autoSync.kind !== 'aus';
  const backupAge = p.savedAt ? Math.floor((Date.now() - p.savedAt) / 86_400_000) : null;
  const [dropping, setDropping] = useState(false);
  const hasFiles = (e: DragEvent) => e.dataTransfer.types.includes('Files');

  const { lib } = p;
  const place = boardPlace(lib, p.subject, p.grade);
  const modules = place ? modulesOf(lib, place.subject, place.grade) : [];
  const lessonsByModule = new Map(modules.map((m) => [m.id, lessonsOf(lib, m.id)]));
  const worked = modules.reduce((k, m) => k + (lessonsByModule.get(m.id) ?? []).filter(isWorkedOut).length, 0);
  const planned = modules.reduce((k, m) => k + (lessonsByModule.get(m.id) ?? []).filter((l) => !isWorkedOut(l)).length, 0);
  // Planned lessons from the year plan were imported, not edited.
  const recent = lib.lessons
    .filter(isWorkedOut)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 4);
  const moduleOf = (l: Lesson) => lib.modules.find((m) => m.id === l.moduleId);

  return (
    <div
      className={'board' + (dropping ? ' is-dropping' : '')}
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
        if (f) p.onOpenFile(f);
      }}
    >
      <main className="board-main">
        {lastChange(lib) === 0 && (
          <div className="sync-banner is-welcome">
            <span>
              Neu auf diesem Gerät oder gerade als App installiert? Die App hat hier ihren eigenen Speicher. Verbinde das Gerät unter „Abgleich Mac/iPad“ mit deinem Kopplungscode, oder öffne
              deine Sicherung aus iCloud Drive, dann ist alles da.
            </span>
            <button type="button" className="btn btn-primary ui-btn" onClick={p.onSync}>
              Abgleichen
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
        {p.autoSync.kind === 'fehler' && (
          <div className="sync-banner is-urgent">
            <span>{statusText(p.autoSync)}</span>
            <button type="button" className="btn btn-primary ui-btn" onClick={p.onSync}>
              Ansehen
            </button>
          </div>
        )}
        {!auto && p.pending > 0 && (
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
          <section className="board-recent" aria-labelledby="board-recent-h">
            <h2 id="board-recent-h" className="board-h2">
              Zuletzt bearbeitet
            </h2>
            <div className="board-recent-list">
              {recent.map((l) => {
                const m = moduleOf(l);
                if (!m) return null;
                return (
                  <button key={l.id} type="button" className="rcard" style={subjectTint(subjectColor(lib.settings, m.subject))} onClick={() => p.onOpenLesson(l)}>
                    <span className="rcard-sheet" aria-hidden="true">
                      <SheetThumb m={m} lessons={[l]} scale={RECENT_SCALE} />
                    </span>
                    <span className="rcard-text">
                      <span className="rcard-code">{lessonCode(m, l.number)}</span>
                      <span className="rcard-title">{l.title}</span>
                      <span className="rcard-place">
                        {m.subject}, {m.title}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {place ? (
          <section className="board-class" style={subjectTint(subjectColor(lib.settings, place.subject))} aria-labelledby="board-title">
            <header className="board-band">
              <div className="board-band-text">
                <p className="board-kicker">{place.subject}</p>
                <h1 id="board-title" className="board-title">
                  Klasse {place.grade}
                </h1>
                <p className="board-meta">
                  <span>{count(modules.length, 'Modul', 'Module')}</span>
                  {worked > 0 && <span>{count(worked, 'Stunde ausgearbeitet', 'Stunden ausgearbeitet')}</span>}
                  {planned > 0 && <span>{count(planned, 'Stunde geplant', 'Stunden geplant')}</span>}
                </p>
              </div>
              <div className="board-actions">
                <button type="button" className="btn btn-secondary ui-btn" onClick={() => setNotesOpen(true)}>
                  <Icon icon={Users} />
                  Klasse und Grundsätze
                </button>
                <button type="button" className="btn btn-secondary ui-btn" onClick={() => p.onOpenPlan(place.subject, place.grade)}>
                  <Icon icon={CalendarRange} />
                  Jahresplan
                </button>
                <button type="button" className="btn btn-primary ui-btn" onClick={() => p.onAddModule(place.subject, place.grade)}>
                  <Icon icon={Plus} />
                  Neues Modul
                </button>
              </div>
              {notesOpen && <ClassNotesDialog subject={place.subject} grade={place.grade} onClose={() => setNotesOpen(false)} />}
            </header>

            {modules.length > 0 ? (
              <div className="board-modules">
                {modules.map((m) => {
                  const lessons = lessonsByModule.get(m.id) ?? [];
                  const progress = progressOf(lessons);
                  const state = lessons.length === 0 ? 'leer' : progress.done === 0 ? 'geplant' : '';
                  return (
                    <button key={m.id} type="button" className={'mcard' + (state ? ' is-' + state : '')} onClick={() => p.onOpenModule(m)}>
                      <span className="mcard-tray" aria-hidden="true">
                        <SheetThumb m={m} lessons={lessons} scale={CARD_SCALE} />
                        {state && <span className="mcard-stamp">{state === 'leer' ? 'noch leer' : 'geplant'}</span>}
                      </span>
                      <span className="mcard-body">
                        <span className="mcard-code">
                          <Icon icon={topicIcon(m.icon)} size={16} />M{m.number}
                        </span>
                        <span className="mcard-title">{m.title}</span>
                        <span className="mcard-meta">
                          <span>{progress.total ? `${progress.done} von ${progress.total} Stunden` : 'noch keine Stunden'}</span>
                          <span>{count(m.competences.length, 'Kompetenz', 'Kompetenzen')}</span>
                        </span>
                        {progress.total > 0 && (
                          <span className="mcard-progress" aria-hidden="true">
                            <span style={{ transform: `scaleX(${progress.done / progress.total})` }} />
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="board-empty">
                <p>
                  Für {place.subject} in Klasse {place.grade} gibt es noch keine Module.
                </p>
                <button type="button" className="btn btn-primary ui-btn" onClick={() => p.onAddModule(place.subject, place.grade)}>
                  <Icon icon={Plus} />
                  Erstes Modul anlegen
                </button>
              </div>
            )}
          </section>
        ) : (
          <div className="board-empty">
            <p>Lege zuerst links ein Fach an.</p>
          </div>
        )}
      </main>
    </div>
  );
}
