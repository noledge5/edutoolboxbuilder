// "Automatisch abgleichen" in the sync dialog: set it up on the first device (a pairing code with QR code), connect
// the other device (scan or type the code), see how it goes, sync now, show the code again, stop on this device.
import { useEffect, useState } from 'react';
import { Camera, Check, CloudOff, Link2, LoaderCircle, RefreshCw, TriangleAlert } from 'lucide-react';
import { Icon } from '../icons';
import { qrCode } from '../sheet/parts';
import type { SyncStatus } from './engine';
import { newCode, pairLink, readCode } from './keys';
import { QrScanner } from './QrScanner';

interface AutoSyncPanelProps {
  status: SyncStatus;
  /** The pairing code of this device ('' when off). */
  code: string;
  /** A code from a link (scanned with the camera app). */
  joinCode?: string;
  onStart(code: string): void;
  onStop(): void;
  onRunNow(): void;
}

/** "gerade eben", "vor 5 Min.", "vor 2 Std.", else the date. */
export function agoText(t: number, now = Date.now()): string {
  if (!t) return 'noch nie';
  const min = Math.round((now - t) / 60000);
  if (min < 1) return 'gerade eben';
  if (min < 60) return `vor ${min} Min.`;
  if (min < 24 * 60) return `vor ${Math.round(min / 60)} Std.`;
  return new Date(t).toLocaleString('de-DE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function statusText(s: SyncStatus): string {
  switch (s.kind) {
    case 'aus':
      return 'Automatischer Abgleich ist aus.';
    case 'laeuft':
      return s.text;
    case 'ok':
      return `Abgeglichen ${agoText(s.last)}.`;
    case 'offline':
      return `Offline: Der Abgleich läuft, sobald das Gerät wieder online ist (zuletzt ${agoText(s.last)}).`;
    case 'fehler':
      return `Der Abgleich klappt gerade nicht: ${s.message}`;
  }
}

function CodeCard({ code }: { code: string }) {
  const qr = qrCode(pairLink(code));
  return (
    <div className="pair-card">
      {qr && qr !== 'error' && (
        <svg className="pair-qr" viewBox={`-2 -2 ${qr.size + 4} ${qr.size + 4}`} role="img" aria-label="QR-Code zum Koppeln">
          <rect x={-2} y={-2} width={qr.size + 4} height={qr.size + 4} fill="#fff" />
          <path d={qr.d} fill="#000" />
        </svg>
      )}
      <div className="pair-text">
        <div className="pair-code">{code}</div>
        <p>
          Auf dem anderen Gerät: „Abgleich Mac/iPad“ → „Mit Code verbinden“ → „Code scannen“ (oder den Code abtippen). <b>Schreib den Code auf</b> und bewahre ihn gut auf: Mit ihm holst du
          deine Daten auch auf ein neues Gerät. Wer ihn hat, kann sie lesen; ohne ihn kommt niemand an sie heran, auch der Server nicht.
        </p>
      </div>
    </div>
  );
}

export function AutoSyncPanel({ status, code, joinCode, onStart, onStop, onRunNow }: AutoSyncPanelProps) {
  const on = status.kind !== 'aus';
  const [mode, setMode] = useState<'start' | 'join' | 'scan' | null>(joinCode ? 'join' : null);
  const [typed, setTyped] = useState(joinCode ?? '');
  const [error, setError] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [, tick] = useState(0);

  // "vor 2 Min." stays true while the dialog is open.
  useEffect(() => {
    const t = window.setInterval(() => tick((n) => n + 1), 30000);
    return () => window.clearInterval(t);
  }, []);

  const join = async (text: string) => {
    const c = await readCode(text);
    if (!c) {
      setError('Der Code stimmt nicht. Prüfe ihn noch einmal (24 Zeichen, Bindestriche sind egal).');
      setMode('join');
      return;
    }
    setError('');
    setMode(null);
    onStart(c);
  };

  if (!on)
    return (
      <section className="auto-sync">
        <div className="auto-sync-head">
          <b>Automatisch abgleichen</b>
          <span>Mac und iPad bleiben von selbst gleich: nach jeder Änderung, beim Öffnen und alle paar Minuten. Alles wird auf dem Gerät verschlüsselt; der Server in Frankfurt sieht nur Zeichensalat.</span>
        </div>
        {mode === null && (
          <div className="auto-sync-actions">
            <button
              type="button"
              className="btn btn-primary ui-btn"
              onClick={async () => {
                const c = await newCode();
                setShowCode(true);
                onStart(c);
              }}
            >
              <Icon icon={RefreshCw} />
              Auf diesem Gerät einrichten
            </button>
            <button type="button" className="btn btn-secondary ui-btn" onClick={() => setMode('join')}>
              <Icon icon={Link2} />
              Mit Code verbinden …
            </button>
          </div>
        )}
        {mode === 'join' && (
          <div className="auto-sync-join">
            <p className="ai-hint">Auf dem Gerät, auf dem der Abgleich schon läuft, steht der Code unter „Weiteres Gerät koppeln“. Die Daten beider Geräte werden zusammengeführt; von jeder Stunde bleibt die neuere Fassung.</p>
            <div className="auto-sync-row">
              <input className="input pair-input" value={typed} placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX" autoCapitalize="characters" autoCorrect="off" spellCheck={false} onChange={(e) => setTyped(e.target.value)} aria-label="Kopplungscode" />
              <button type="button" className="btn btn-secondary ui-btn" onClick={() => (setError(''), setMode('scan'))}>
                <Icon icon={Camera} />
                Code scannen
              </button>
              <button type="button" className="btn btn-primary ui-btn" disabled={!typed.trim()} onClick={() => void join(typed)}>
                Verbinden
              </button>
            </div>
          </div>
        )}
        {mode === 'scan' && (
          <div className="auto-sync-join">
            <QrScanner
              onText={(t) => void join(t)}
              onError={(m) => {
                setError(m);
                setMode('join');
              }}
            />
            <button type="button" className="btn btn-secondary ui-btn" onClick={() => setMode('join')}>
              Abbrechen
            </button>
          </div>
        )}
        {error && <p className="json-err">{error}</p>}
      </section>
    );

  const icon = status.kind === 'laeuft' ? LoaderCircle : status.kind === 'offline' ? CloudOff : status.kind === 'fehler' ? TriangleAlert : Check;
  return (
    <section className="auto-sync is-on">
      <p className={`auto-sync-status is-${status.kind}`}>
        <span className={status.kind === 'laeuft' ? 'is-spinning' : undefined}>
          <Icon icon={icon} />
        </span>
        {statusText(status)}
      </p>
      <div className="auto-sync-actions">
        <button type="button" className="btn btn-secondary ui-btn" onClick={onRunNow} disabled={status.kind === 'laeuft'}>
          <Icon icon={RefreshCw} />
          Jetzt abgleichen
        </button>
        <button type="button" className="btn btn-secondary ui-btn" onClick={() => setShowCode((s) => !s)}>
          <Icon icon={Link2} />
          {showCode ? 'Code ausblenden' : 'Weiteres Gerät koppeln'}
        </button>
        <button
          type="button"
          className="btn btn-secondary ui-btn"
          style={{ marginLeft: 'auto' }}
          onClick={() => window.confirm('Den automatischen Abgleich auf diesem Gerät beenden? Deine Daten hier bleiben; das andere Gerät gleicht weiter mit dem Server ab.') && onStop()}
        >
          Auf diesem Gerät beenden
        </button>
      </div>
      {showCode && code && <CodeCard code={code} />}
    </section>
  );
}
