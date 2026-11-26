// The app's navigation (26.11.2026): subjects, the open subject's classes, the open class's modules and year plan,
// then the tools. Always in the same place on the library screens, so the way back is never more than one click.
import { useContext, useState } from 'react';
import { Blocks, CalendarRange, FolderSync, Lock, Map as MapIcon, Plus, Search, Settings as SettingsIcon, Sparkles, Trash2, X } from 'lucide-react';
import { Icon } from '../icons';
import { ClaudeDialog } from '../library/ClaudeDialog';
import { modulesOf, subjectsOf } from '../library/model';
import { go, type Route } from '../library/router';
import { SearchContext } from '../library/SearchDialog';
import { subjectColor, subjectTint } from '../library/subjectColor';
import { GRADES, type Library, type Settings } from '../library/types';
import { useSperre } from '../sperre/SperreRahmen';
import { statusText } from '../sync/AutoSyncPanel';
import type { SyncStatus } from '../sync/engine';
import { placeOf } from './place';
import { SettingsDialog } from './SettingsDialog';

interface SidebarProps {
  lib: Library;
  route: Route;
  trashCount: number;
  /** Changes not yet in a backup file on this device (without the automatic sync). */
  pending: number;
  autoSync: SyncStatus;
  onSync(): void;
  onOpenTrash(): void;
  onAddSubject(name: string): void;
  onRemoveSubject(name: string): void;
  onSettings(s: Settings): void;
  /** A file from "Mit KI bauen": Stundenpaket, backup or worksheet. */
  onOpenFile(file: File): void;
  /** After a click that changes the screen (closes the drawer on a narrow window). */
  onNavigate(): void;
}

export function Sidebar(p: SidebarProps) {
  const { lib } = p;
  const openSearch = useContext(SearchContext);
  const sperre = useSperre();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [claudeOpen, setClaudeOpen] = useState(false);
  const [moreGrades, setMoreGrades] = useState(false);
  const place = placeOf(lib, p.route);
  const subjects = subjectsOf(lib);
  const auto = p.autoSync.kind !== 'aus';
  const nav = (r: Route) => {
    go(r);
    p.onNavigate();
  };
  const addSubject = () => {
    const name = window.prompt('Name des Fachs, z. B. Biologie:')?.trim();
    if (name) p.onAddSubject(name);
  };
  const syncTitle = auto ? statusText(p.autoSync) : p.pending > 0 ? 'Änderungen noch nicht gesichert' : 'Alles gesichert';

  return (
    <nav className="side" aria-label="Baukasten">
      <div className="side-brand">
        <Icon icon={Blocks} size={20} />
        <span>Arbeitsblatt-Baukasten</span>
      </div>
      {openSearch && (
        <button type="button" className="side-search" onClick={openSearch} title="Suchen (⌘K)">
          <Icon icon={Search} size={16} />
          <span>Suchen</span>
          <kbd>⌘K</kbd>
        </button>
      )}

      <div className="side-section">
        <div className="side-label">
          <span>Fächer</span>
          <button type="button" className="side-add" onClick={addSubject} title="Fach anlegen" aria-label="Fach anlegen">
            <Icon icon={Plus} size={16} />
          </button>
        </div>
        <ul className="side-tree">
          {subjects.map((s) => {
            const here = place?.subject === s;
            const grades = GRADES.filter((g) => modulesOf(lib, s, g).length > 0 || (here && g === place.grade));
            const others = GRADES.filter((g) => !grades.includes(g));
            const empty = !lib.modules.some((m) => m.subject === s);
            return (
              <li key={s} className={'side-subject' + (here ? ' is-here' : '')} style={subjectTint(subjectColor(lib.settings, s))}>
                <div className="side-subject-row">
                  <button type="button" className="side-row" aria-current={here && p.route.view === 'overview' && !place?.moduleId ? 'page' : undefined} onClick={() => nav({ view: 'overview', subject: s })}>
                    <span className="side-tab" aria-hidden="true" />
                    <span className="side-text">{s}</span>
                  </button>
                  {empty && (
                    <button type="button" className="side-x" title={`${s} entfernen`} aria-label={`${s} entfernen`} onClick={() => p.onRemoveSubject(s)}>
                      <Icon icon={X} size={14} />
                    </button>
                  )}
                </div>
                {here && (
                  <ul className="side-grades">
                    {grades.map((g) => {
                      const mods = modulesOf(lib, s, g);
                      const open = place.grade === g;
                      return (
                        <li key={g}>
                          <button
                            type="button"
                            className={'side-row side-grade' + (open ? ' is-open' : '')}
                            aria-current={open && p.route.view === 'overview' ? 'page' : undefined}
                            onClick={() => nav({ view: 'overview', subject: s, grade: g })}
                          >
                            <span className="side-text">Klasse {g}</span>
                            {mods.length > 0 && <span className="side-count">{mods.length}</span>}
                          </button>
                          {open && (
                            <ul className="side-modules">
                              {mods.map((m) => (
                                <li key={m.id}>
                                  <button type="button" className="side-row side-module" aria-current={place.moduleId === m.id ? 'page' : undefined} onClick={() => nav({ view: 'module', id: m.id })}>
                                    <span className="side-num">M{m.number}</span>
                                    <span className="side-text">{m.title}</span>
                                  </button>
                                </li>
                              ))}
                              <li>
                                <button type="button" className="side-row side-module" aria-current={p.route.view === 'plan' ? 'page' : undefined} onClick={() => nav({ view: 'plan', subject: s, grade: g })}>
                                  <Icon icon={CalendarRange} size={16} />
                                  <span className="side-text">Jahresplan</span>
                                </button>
                              </li>
                            </ul>
                          )}
                        </li>
                      );
                    })}
                    {others.length > 0 && (
                      <li className="side-more">
                        {moreGrades ? (
                          <div className="side-more-grades" role="group" aria-label="Weitere Klassen">
                            {others.map((g) => (
                              <button key={g} type="button" className="side-chip" aria-label={`Klasse ${g}`} onClick={() => { setMoreGrades(false); nav({ view: 'overview', subject: s, grade: g }); }}>
                                {g}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <button type="button" className="side-row side-quiet" onClick={() => setMoreGrades(true)}>
                            <Icon icon={Plus} size={16} />
                            <span className="side-text">Klasse</span>
                          </button>
                        )}
                      </li>
                    )}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="side-section">
        <div className="side-label">
          <span>Werkzeuge</span>
        </div>
        <button type="button" className="side-row" aria-current={p.route.view === 'lernquest' ? 'page' : undefined} onClick={() => nav({ view: 'lernquest' })}>
          <Icon icon={MapIcon} size={16} />
          <span className="side-text">Lernquest</span>
        </button>
        <button type="button" className="side-row" onClick={() => setClaudeOpen(true)}>
          <Icon icon={Sparkles} size={16} />
          <span className="side-text">Mit KI bauen</span>
        </button>
      </div>

      <div className="side-foot">
        <button type="button" className="side-row" onClick={p.onSync} title={syncTitle}>
          <Icon icon={FolderSync} size={16} />
          <span className="side-text">Abgleich Mac/iPad</span>
          {auto ? (
            <span className={`sync-dot is-auto is-${p.autoSync.kind}`} aria-label={statusText(p.autoSync)} />
          ) : (
            <span className={'sync-dot' + (p.pending > 0 ? ' is-open' : '')} aria-label={p.pending > 0 ? 'nicht gesichert' : 'gesichert'} />
          )}
        </button>
        {p.trashCount > 0 && (
          <button type="button" className="side-row" onClick={p.onOpenTrash}>
            <Icon icon={Trash2} size={16} />
            <span className="side-text">Papierkorb</span>
            <span className="side-count">{p.trashCount}</span>
          </button>
        )}
        {sperre.aktiv && (
          <button type="button" className="side-row" title="Baukasten sperren, bevor du das Gerät aus der Hand gibst" onClick={sperre.sperren}>
            <Icon icon={Lock} size={16} />
            <span className="side-text">Sperren</span>
          </button>
        )}
        <button type="button" className="side-row" onClick={() => setSettingsOpen(true)}>
          <Icon icon={SettingsIcon} size={16} />
          <span className="side-text">Einstellungen</span>
        </button>
      </div>

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
    </nav>
  );
}
