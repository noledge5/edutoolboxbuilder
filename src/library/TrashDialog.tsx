// The trash: deleted modules and lessons stay on this device for TRASH_DAYS days and can come back.
import { useEffect } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { Icon } from '../icons';
import { lessonSize, trashDaysLeft, TRASH_DAYS } from './model';
import type { Module, TrashEntry } from './types';
import { daysAgo } from './when';

interface TrashDialogProps {
  trash: TrashEntry[];
  /** Modules of the library, to name the module of a single lesson. */
  modules: Module[];
  onRestore(id: string): void;
  onPurge(id: string): void;
  onEmpty(): void;
  onClose(): void;
}

export function TrashDialog({ trash, modules, onRestore, onPurge, onEmpty, onClose }: TrashDialogProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const now = Date.now();
  const moduleName = (id: string) => {
    const m = modules.find((x) => x.id === id) ?? trash.find((e) => e.module?.id === id)?.module;
    return m ? `Modul ${m.number}: ${m.title}` : 'gelöschtes Modul';
  };
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog trash-dialog" role="dialog" aria-modal="true" aria-label="Papierkorb" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">Papierkorb</div>
        <p className="dialog-body">Gelöschte Module und Stunden bleiben {TRASH_DAYS} Tage hier (nur auf diesem Gerät) und lassen sich wiederherstellen, mit allen Seiten, Folien und Bildern.</p>
        {trash.length === 0 ? (
          <p className="dialog-body lib-empty">Der Papierkorb ist leer.</p>
        ) : (
          <ul className="trash-list">
            {[...trash]
              .sort((a, b) => b.at - a.at)
              .map((e) => (
                <li key={e.id} className="trash-item">
                  <div className="trash-text">
                    <b>{e.module ? `Modul ${e.module.number}: ${e.module.title}` : `Stunde ${e.lessons[0].number}: ${e.lessons[0].title}`}</b>
                    <span>
                      {e.module
                        ? `${e.module.subject} · Klasse ${e.module.grade} · ${e.lessons.length} ${e.lessons.length === 1 ? 'Stunde' : 'Stunden'}`
                        : `${moduleName(e.lessons[0].moduleId)} · ${lessonSize(e.lessons[0])}`}
                    </span>
                    <span className="trash-when">
                      gelöscht {daysAgo(e.at, now)} · noch {trashDaysLeft(e, now)} {trashDaysLeft(e, now) === 1 ? 'Tag' : 'Tage'}
                    </span>
                  </div>
                  <button type="button" className="btn btn-secondary ui-btn" onClick={() => onRestore(e.id)}>
                    <Icon icon={RotateCcw} />
                    Wiederherstellen
                  </button>
                  <button type="button" className="iconbtn is-danger" title="Endgültig löschen" aria-label="Endgültig löschen" onClick={() => onPurge(e.id)}>
                    <Icon icon={Trash2} />
                  </button>
                </li>
              ))}
          </ul>
        )}
        <div className="dialog-actions">
          {trash.length > 0 && (
            <button type="button" className="btn btn-secondary ui-btn is-danger" onClick={onEmpty}>
              Papierkorb leeren …
            </button>
          )}
          <button type="button" className="btn btn-primary ui-btn" onClick={onClose}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
