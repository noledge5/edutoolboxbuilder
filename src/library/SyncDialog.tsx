// Mac ↔ iPad: the automatic sync through the server (set up with a pairing code), and the way without a server:
// save the whole library as one file in iCloud Drive, and sync with the file from the other device.
import { useEffect, useRef, useState } from 'react';
import { CloudUpload, FolderSync } from 'lucide-react';
import { Icon } from '../icons';
import { AutoSyncPanel } from '../sync/AutoSyncPanel';
import type { SyncStatus } from '../sync/engine';
import { createLibraryBackup, downloadBlob, LIBRARY_FILE_NAME } from '../storage/backup';
import { changedSince, lastChange } from './model';
import type { Library } from './types';

const fmt = (t: number) =>
  new Date(t).toLocaleString('de-DE', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** iPad and iPhone: the share sheet has "In Dateien sichern", which can save straight into iCloud Drive. */
const canShareFiles = (file: File) => navigator.maxTouchPoints > 1 && !!navigator.canShare?.({ files: [file] });

interface SyncDialogProps {
  lib: Library;
  inSyncUntil: number;
  /** The file was saved; everything changed up to `t` is in it. */
  onSaved(t: number): void;
  onOpenFile(file: File): void;
  onClose(): void;
  auto: {
    status: SyncStatus;
    code: string;
    /** A code from a pairing link. */
    joinCode?: string;
    onStart(code: string): void;
    onStop(): void;
    onRunNow(): void;
  };
}

export function SyncDialog({ lib, inSyncUntil, onSaved, onOpenFile, onClose, auto }: SyncDialogProps) {
  const autoOn = auto.status.kind !== 'aus';
  const [ready, setReady] = useState<{ file: File; at: number } | null>(null);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const pending = changedSince(lib, inSyncUntil);
  const never = inSyncUntil === 0 && lastChange(lib) > 0;

  // Build the file right away: sharing must happen directly in the tap, without waiting for the images.
  useEffect(() => {
    let alive = true;
    const at = Date.now();
    createLibraryBackup(lib)
      .then((b) => alive && setReady({ file: new File([JSON.stringify(b)], LIBRARY_FILE_NAME, { type: 'application/json' }), at }))
      .catch((e) => alive && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      alive = false;
    };
  }, [lib]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const save = () => {
    if (!ready) return;
    if (canShareFiles(ready.file)) {
      navigator.share({ files: [ready.file], title: 'Arbeitsblatt-Baukasten' }).then(
        () => onSaved(ready.at),
        (e: unknown) => {
          if (!(e instanceof DOMException && e.name === 'AbortError')) {
            downloadBlob(ready.file, LIBRARY_FILE_NAME);
            onSaved(ready.at);
          }
        },
      );
    } else {
      downloadBlob(ready.file, LIBRARY_FILE_NAME);
      onSaved(ready.at);
    }
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog sync-dialog" role="dialog" aria-modal="true" aria-label="Mac und iPad abgleichen" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">Mac und iPad abgleichen</div>
        <AutoSyncPanel {...auto} />
        <details className="sync-file" open={!autoOn}>
          <summary>{autoOn ? 'Ohne Server: mit einer Sicherungsdatei abgleichen' : 'Oder mit einer Sicherungsdatei in iCloud Drive'}</summary>
          <p className={'sync-status' + (pending > 0 || never ? ' is-open' : '')}>
            {never
              ? 'Auf diesem Gerät wurde noch nie gesichert.'
              : pending > 0
                ? `${pending} ${pending === 1 ? 'Änderung' : 'Änderungen'} seit der letzten Sicherung (${fmt(inSyncUntil)}).`
                : `Alles gesichert${inSyncUntil ? ` (${fmt(inSyncUntil)})` : ''}.`}
          </p>

          <div className="sync-step">
            <div className="sync-step-num">1</div>
            <div className="sync-step-text">
              <b>Hier sichern.</b> Speichere die Datei „{LIBRARY_FILE_NAME}“ in iCloud Drive, am besten immer in denselben Ordner, z. B. „Baukasten“. Auf dem iPad über
              „In Dateien sichern“, auf dem Mac landet sie im Download-Ordner.
            </div>
            <button type="button" className="btn btn-primary ui-btn" disabled={!ready} onClick={save}>
              <Icon icon={CloudUpload} />
              {ready ? 'Sicherung speichern' : 'Wird vorbereitet …'}
            </button>
          </div>

          <div className="sync-step">
            <div className="sync-step-num">2</div>
            <div className="sync-step-text">
              <b>Auf dem anderen Gerät abgleichen.</b> Dort die Datei aus iCloud Drive öffnen. Von jeder Stunde und jedem Modul bleibt die neuere Fassung, Gelöschtes bleibt gelöscht.
            </div>
            <button type="button" className="btn btn-secondary ui-btn" onClick={() => input.current?.click()}>
              <Icon icon={FolderSync} />
              Sicherung öffnen und abgleichen …
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

          <p className="sync-tip">
            Tipp für den Mac: In Safari unter Einstellungen → Allgemein → „Speicherort für Downloads“ einen Ordner in iCloud Drive wählen, dann liegt jede Sicherung sofort auch auf dem iPad.
          </p>
        </details>
        {error && <p className="json-err">Die Sicherung konnte nicht vorbereitet werden: {error}</p>}
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary ui-btn" onClick={onClose}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
