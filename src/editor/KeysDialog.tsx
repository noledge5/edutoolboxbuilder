import { useEffect, useId } from 'react';

const KEYS: [string, string][] = [
  ['⌘Z / ⇧⌘Z', 'Rückgängig / Wiederholen'],
  ['⌘C / ⌘X', 'Bausteine in die Ablage / ausschneiden'],
  ['⌘V', 'Neuesten Eintrag der Ablage nach der Auswahl einfügen'],
  ['⌘D', 'Duplizieren'],
  ['⌘A', 'Alle Bausteine auswählen'],
  ['↑ / ↓', 'Vorheriger / nächster Baustein'],
  ['⌥↑ / ⌥↓', 'Baustein verschieben (auch auf die Seite davor oder danach)'],
  ['↵', 'Text des Bausteins auf dem Blatt bearbeiten'],
  ['1 / 2 / 3 / 0', 'Niveau G / M / E / keins'],
  ['⌫', 'Löschen'],
  ['⌘P', 'Drucken'],
  ['⌘K', 'Suchen'],
  ['Esc', 'Auswahl aufheben'],
  ['?', 'Diese Übersicht'],
];

/** The editor's keyboard shortcuts, opened with "?" or from the Datei menu. */
export function KeysDialog({ onClose }: { onClose(): void }) {
  const titleId = useId();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => (e.key === 'Escape' || e.key === '?') && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="dialog-backdrop" data-noprint="1" onClick={onClose}>
      <div className="dialog keys-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title" id={titleId}>
          Tastenkürzel
        </div>
        <dl className="keys-list">
          {KEYS.map(([k, what]) => (
            <div key={k}>
              <dt>
                <kbd>{k}</kbd>
              </dt>
              <dd>{what}</dd>
            </div>
          ))}
        </dl>
        <div className="dialog-actions">
          <button type="button" className="btn btn-primary ui-btn" onClick={onClose}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
