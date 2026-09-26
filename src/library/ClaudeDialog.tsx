// Working with Claude: download the instructions, then open (or paste) the Stundenpaket Claude made.
import { useEffect, useRef, useState } from 'react';
import { ClipboardPaste, Download, FolderOpen } from 'lucide-react';
import { Icon } from '../icons';
import { claudeInstructions, INSTRUCTIONS_FILE_NAME } from '../claude/instructions';
import { downloadBlob } from '../storage/backup';

interface ClaudeDialogProps {
  onOpenFile(file: File): void;
  onClose(): void;
}

/** Claude's answer copied from the chat may carry a ```json fence or text around the object. */
export function jsonFromPaste(text: string): string {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  return start >= 0 && end > start ? text.slice(start, end + 1) : text;
}

export function ClaudeDialog({ onOpenFile, onClose }: ClaudeDialogProps) {
  const input = useRef<HTMLInputElement>(null);
  const [pasted, setPasted] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const download = () => downloadBlob(new Blob([claudeInstructions()], { type: 'text/markdown;charset=utf-8' }), INSTRUCTIONS_FILE_NAME);

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog sync-dialog" role="dialog" aria-modal="true" aria-label="Mit Claude erstellen" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">Mit Claude erstellen</div>

        <div className="sync-step">
          <div className="sync-step-num">1</div>
          <div className="sync-step-text">
            <b>Anleitung laden.</b> Sie beschreibt Claude das Dateiformat, alle Bausteine und ein vollständiges Beispiel.
          </div>
          <button type="button" className="btn btn-secondary ui-btn" onClick={download}>
            <Icon icon={Download} />
            Anleitung für Claude laden
          </button>
        </div>

        <div className="sync-step">
          <div className="sync-step-num">2</div>
          <div className="sync-step-text">
            <b>In Claude einrichten.</b> Lege auf claude.ai ein Projekt „Arbeitsblätter“ an und lade die Anleitung dort unter „Projektwissen“ hoch. Dann im Projekt z. B. schreiben: „Erstelle ein
            Stundenpaket für Englisch Klasse 5, Green Line Unit 1, drei Stunden.“ oder „Erstelle den Jahresplan für Englisch Klasse 5.“ Du kannst PDFs, Fotos alter Arbeitsblätter, Lehrwerksseiten oder
            ein Stundenpaket aus dem Baukasten anhängen. Hast du die Anleitung früher schon hochgeladen, ersetze sie durch die neue.
          </div>
        </div>

        <div className="sync-step">
          <div className="sync-step-num">3</div>
          <div className="sync-step-text">
            <b>Paket öffnen.</b> Die Datei, die Claude erstellt, hier öffnen oder auf die Übersicht ziehen. Daraus wird ein neues Modul.
          </div>
          <button type="button" className="btn btn-primary ui-btn" onClick={() => input.current?.click()}>
            <Icon icon={FolderOpen} />
            Stundenpaket öffnen …
          </button>
          <input
            ref={input}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) onOpenFile(f);
            }}
          />
        </div>

        <div className="field claude-paste">
          <label htmlFor="claude-paste">Oder den JSON-Text aus dem Chat hier einfügen</label>
          <textarea id="claude-paste" className="input" rows={4} value={pasted} placeholder='{ "format": "arbeitsblatt-baukasten-paket", … }' onChange={(e) => setPasted(e.target.value)} />
          <button
            type="button"
            className="btn btn-secondary ui-btn"
            disabled={!pasted.trim()}
            onClick={() => onOpenFile(new File([jsonFromPaste(pasted)], 'Eingefügt.json', { type: 'application/json' }))}
          >
            <Icon icon={ClipboardPaste} />
            Eingefügtes Paket importieren
          </button>
        </div>

        <p className="sync-tip">
          Ein vorhandenes Modul gibst du Claude zum Überarbeiten über „Modul“ → „Als Stundenpaket sichern“, einen ganzen Jahrgang über „Jahresplan“ → „Als Stundenpaket sichern“.
        </p>
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary ui-btn" onClick={onClose}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
