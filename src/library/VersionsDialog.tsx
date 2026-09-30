// Earlier versions of a lesson: kept on this device while working (about every half hour) and before a sync,
// an import or new slides. A version comes back in place (the current state is kept as a version first) or as a copy.
import { useEffect, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { Icon } from '../icons';
import { loadVersions } from '../storage/library';
import { lessonSize, MAX_VERSIONS, VERSION_DAYS } from './model';
import type { Lesson, LessonVersion } from './types';
import { whenText } from './when';

interface VersionsDialogProps {
  lesson: Lesson;
  onRestore(v: LessonVersion): void;
  onCopy(v: LessonVersion): void;
  onClose(): void;
}

export function VersionsDialog({ lesson, onRestore, onCopy, onClose }: VersionsDialogProps) {
  const [versions, setVersions] = useState<LessonVersion[] | null>(null);
  useEffect(() => {
    let alive = true;
    loadVersions(lesson.id)
      .then((v) => alive && setVersions(v.sort((a, b) => b.at - a.at)))
      .catch(() => alive && setVersions([]));
    return () => {
      alive = false;
    };
  }, [lesson.id]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog trash-dialog" role="dialog" aria-modal="true" aria-label="Frühere Fassungen" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">Frühere Fassungen</div>
        <p className="dialog-body">
          Stunde {lesson.number}: {lesson.title}. Beim Arbeiten merkt sich der Baukasten etwa jede halbe Stunde, wie die Stunde vorher aussah, dazu vor jedem Abgleich, Import und neuen Folien. Die
          letzten {MAX_VERSIONS} Fassungen bleiben {VERSION_DAYS} Tage auf diesem Gerät.
        </p>
        {versions === null ? (
          <p className="dialog-body">Einen Moment …</p>
        ) : versions.length === 0 ? (
          <p className="dialog-body lib-empty">Noch keine früheren Fassungen. Sie entstehen, sobald du die Stunde bearbeitest.</p>
        ) : (
          <ul className="trash-list">
            {versions.map((v) => (
              <li key={v.at} className="trash-item">
                <div className="trash-text">
                  <b>
                    {whenText(v.at)}
                    {v.reason ? ` · ${v.reason}` : ''}
                  </b>
                  <span>
                    {v.lesson.title !== lesson.title ? `„${v.lesson.title}“ · ` : ''}
                    {lessonSize(v.lesson)}
                  </span>
                </div>
                <button type="button" className="btn btn-secondary ui-btn" onClick={() => onCopy(v)} title="Als neue Stunde neben der jetzigen">
                  <Icon icon={Copy} />
                  Als Kopie
                </button>
                <button type="button" className="btn btn-secondary ui-btn" onClick={() => onRestore(v)} title="Die jetzige Fassung bleibt als frühere Fassung erhalten">
                  <Icon icon={RotateCcw} />
                  Wiederherstellen
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="dialog-actions">
          <button type="button" className="btn btn-primary ui-btn" onClick={onClose}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
