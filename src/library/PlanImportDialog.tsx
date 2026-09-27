// Importing a year plan: a Stundenpaket from Claude (file or pasted JSON) or a plan typed elsewhere
// (Word, Excel, notes) as text. Shows beforehand which modules are new and which get completed.
import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarPlus, FolderOpen } from 'lucide-react';
import { errorText } from '../editor/Editor';
import { Icon } from '../icons';
import { jsonFromPaste } from './ClaudeDialog';
import { addPackage, readPackage, type ImportResult, type ParsedPackage } from './package';
import { readPlanText } from './plantext';
import type { Library } from './types';

interface PlanImportDialogProps {
  lib: Library;
  subject: string;
  grade: number;
  onImport(pkg: ParsedPackage): void;
  onClose(): void;
}

const EXAMPLE = `Modul 1: Hello, school! | 5 Wochen | Sich vorstellen, Schule
- Stunde 1: Hello, I'm … | Begrüßen und vorstellen
- Stunde 2: My classroom | Schulsachen benennen
Modul 2: My family and me | 6 Wochen
Modul 3: A day in my life | 6 Wochen | ab 11.01.2027`;

const n = (k: number, one: string, many: string) => `${k} ${k === 1 ? one : many}`;

/** The text as a package: JSON from Claude, or else a plan written as lines. */
function parse(text: string, subject: string, grade: number): ParsedPackage {
  const t = text.trim();
  if (t.startsWith('{') || t.startsWith('```')) return readPackage(JSON.parse(jsonFromPaste(t)));
  return readPlanText(t, subject, grade);
}

export function PlanImportDialog({ lib, subject, grade, onImport, onClose }: PlanImportDialogProps) {
  const [text, setText] = useState('');
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const parsed = useMemo((): { pkg: ParsedPackage; preview: ImportResult[] } | { error: string } | null => {
    if (!text.trim()) return null;
    try {
      const pkg = parse(text, subject, grade);
      return { pkg, preview: addPackage(lib, pkg).results };
    } catch (e) {
      return { error: e instanceof SyntaxError ? 'Der JSON-Text ist unvollständig oder fehlerhaft. Am besten die Datei von Claude öffnen.' : errorText(e) };
    }
  }, [text, subject, grade, lib]);

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog sync-dialog plan-dialog" role="dialog" aria-modal="true" aria-label="Jahresplan importieren" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">Jahresplan importieren</div>
        <p className="sync-step-text">
          <b>Von Claude:</b> im Projekt „Arbeitsblätter“ z. B. schreiben: „Erstelle den Jahresplan für {subject} Klasse {grade} mit den geplanten Stunden.“ Die Datei von Claude hier öffnen oder den
          Text einfügen.
        </p>
        <p className="sync-step-text">
          <b>Aus deiner eigenen Planung</b> (Word, Excel, Notizen): eine Zeile pro Modul, darunter die Stunden mit „-“. Wochen, Beginn und Schwerpunkte mit „|“ trennen. Tabellen aus Excel gehen auch.
        </p>
        <button type="button" className="btn btn-secondary ui-btn plan-open" onClick={() => input.current?.click()}>
          <Icon icon={FolderOpen} />
          Datei öffnen …
        </button>
        <input
          ref={input}
          type="file"
          accept=".json,.txt,.csv,.tsv,.md,application/json,text/plain,text/csv"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) setText(await f.text());
          }}
        />
        <div className="field">
          <label htmlFor="plan-text">Jahresplan als Text</label>
          <textarea id="plan-text" className="input plan-text" rows={7} value={text} placeholder={EXAMPLE} onChange={(e) => setText(e.target.value)} />
        </div>

        {parsed && 'error' in parsed && <p className="json-err">{parsed.error}</p>}
        {parsed && 'pkg' in parsed && (
          <div className="plan-preview" aria-live="polite">
            {parsed.preview.length === 0 && <p className="lib-empty">Kein Modul erkannt. Jede Zeile ohne „-“ wird ein Modul.</p>}
            {parsed.preview.map((r, i) => (
              <div key={i} className={'plan-row' + (r.action === 'neu' ? '' : ' is-merge')}>
                <span className="plan-action">{r.action === 'neu' ? 'Neu' : 'Ergänzt'}</span>
                <span className="plan-title">
                  {r.module.subject !== subject || r.module.grade !== grade ? `${r.module.subject} ${r.module.grade} · ` : ''}Modul {r.module.number}: {r.module.title}
                </span>
                <span className="plan-meta">
                  {[
                    r.module.weeks ? n(r.module.weeks, 'Woche', 'Wochen') : '',
                    r.added ? n(r.added, 'Stunde neu', 'Stunden neu') : '',
                    r.changed ? n(r.changed, 'Stunde ergänzt', 'Stunden ergänzt') : '',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </div>
            ))}
            {parsed.pkg.notes.length > 0 && <p className="sync-tip">Beim Lesen wurde einiges angepasst ({n(parsed.pkg.notes.length, 'Hinweis', 'Hinweise')}); sie erscheinen nach dem Import.</p>}
            {parsed.preview.some((r) => r.action === 'ergänzt') && (
              <p className="sync-tip">„Ergänzt“: Das Modul mit dieser Nummer gibt es schon. Ausgearbeitete Stunden bleiben, wie sie sind; fehlende Stunden kommen als geplant dazu.</p>
            )}
          </div>
        )}

        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary ui-btn" onClick={onClose}>
            Abbrechen
          </button>
          <button
            type="button"
            className="btn btn-primary ui-btn"
            disabled={!parsed || !('pkg' in parsed) || parsed.preview.length === 0}
            onClick={() => parsed && 'pkg' in parsed && onImport(parsed.pkg)}
          >
            <Icon icon={CalendarPlus} />
            Importieren
          </button>
        </div>
      </div>
    </div>
  );
}
