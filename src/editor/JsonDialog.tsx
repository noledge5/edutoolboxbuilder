import { useEffect, useId, useState } from 'react';
import { parseDocJson } from '../model/normalize';
import type { Doc } from '../model/types';

interface JsonDialogProps {
  doc: Doc;
  onApply(doc: Doc): void;
  onClose(): void;
}

/** "Daten": the whole document as JSON, to copy out or to paste new data in (e.g. made by Claude from a PDF). */
export function JsonDialog({ doc, onApply, onClose }: JsonDialogProps) {
  const [text, setText] = useState(() => JSON.stringify(doc, null, 2));
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);
  const titleId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const apply = () => {
    try {
      onApply(parseDocJson(text));
    } catch (e) {
      setErr('Die Daten konnten nicht gelesen werden: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const copy = () => {
    navigator.clipboard?.writeText(text).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  };

  return (
    <div className="dialog-backdrop" data-noprint="1" onClick={onClose}>
      <div className="dialog json-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title" id={titleId}>
          Arbeitsblatt als Daten
        </div>
        <div className="dialog-body">Kopiere die Daten, um das Blatt zu speichern, oder füge neue Daten ein, z.&nbsp;B. von Claude aus einem PDF erzeugt.</div>
        <textarea
          className="input json-text"
          rows={16}
          value={text}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          onChange={(e) => {
            setText(e.target.value);
            setCopied(false);
          }}
        />
        {err && <div className="json-err">{err}</div>}
        <div className="dialog-actions">
          <button type="button" className="btn btn-ghost ui-btn json-copy" onClick={copy}>
            {copied ? 'Kopiert' : 'Alles kopieren'}
          </button>
          <button type="button" className="btn btn-secondary ui-btn" onClick={onClose}>
            Abbrechen
          </button>
          <button type="button" className="btn btn-primary ui-btn" onClick={apply}>
            Übernehmen
          </button>
        </div>
      </div>
    </div>
  );
}
