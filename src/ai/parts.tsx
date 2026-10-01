// What the dialogs with Claude share: a request with progress and Abbrechen, and the way through the chat (copy the
// request, paste the answer back).
import { useEffect, useRef, useState } from 'react';
import { Check, ClipboardCopy } from 'lucide-react';
import { Icon } from '../icons';
import { jsonOf, type AiAnswer, type AiRequest } from './client';
import { runAi } from './useAi';

export interface AiJob {
  /** Claude is at work: characters written so far, seconds since the start. */
  busy: { chars: number; seconds: number } | null;
  error: string;
  setError(e: string): void;
  /** The last answer from the API (for its cost); null after a pasted answer. */
  answer: AiAnswer | null;
  /** Asks Claude and hands the JSON of the answer to `use` (which may throw a German error). */
  run(r: Omit<AiRequest, 'signal' | 'onText'>, use: (json: unknown) => void): Promise<void>;
  /** The same for an answer pasted from the chat. */
  paste(text: string, use: (json: unknown) => void): void;
  stop(): void;
}

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function useAiJob(): AiJob {
  const [busy, setBusy] = useState<{ chars: number; since: number } | null>(null);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState('');
  const [answer, setAnswer] = useState<AiAnswer | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!busy) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [busy]);
  useEffect(() => () => abort.current?.abort(), []);

  return {
    busy: busy && { chars: busy.chars, seconds: Math.max(0, Math.round((now - busy.since) / 1000)) },
    error,
    setError,
    answer,
    async run(r, use) {
      setError('');
      setAnswer(null);
      const ctrl = new AbortController();
      abort.current = ctrl;
      setBusy({ chars: 0, since: Date.now() });
      setNow(Date.now());
      try {
        const a = await runAi({ ...r, signal: ctrl.signal, onText: (chars) => setBusy((b) => b && { ...b, chars }) });
        if (!a) return;
        setAnswer(a);
        use(jsonOf(a.text));
      } catch (e) {
        setError(message(e));
      } finally {
        setBusy(null);
        abort.current = null;
      }
    },
    paste(text, use) {
      setError('');
      setAnswer(null);
      try {
        use(jsonOf(text));
      } catch (e) {
        setError(message(e));
      }
    },
    stop: () => abort.current?.abort(),
  };
}

/** Claude at work: spinner, characters, minutes, Abbrechen. */
export function AiBusy({ busy, hint, onStop }: { busy: { chars: number; seconds: number }; hint: string; onStop(): void }) {
  const s = busy.seconds;
  return (
    <div className="ai-busy" role="status">
      <span className="ai-spinner" />
      <span>
        Claude {busy.chars ? `schreibt … ${busy.chars.toLocaleString('de-DE')} Zeichen` : 'denkt nach …'} · {Math.floor(s / 60)}:{String(s % 60).padStart(2, '0')} Min.
        <br />
        <small>{hint}</small>
      </span>
      <button type="button" className="btn btn-secondary ui-btn" onClick={onStop}>
        Abbrechen
      </button>
    </div>
  );
}

/** The way without a key: copy the request for the Claude project, paste the answer here. */
export function ChatPath({ request, what, pasted, onPaste, onError }: { request(): string; what: string; pasted: string; onPaste(t: string): void; onError(e: string): void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(request());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      onError('Kopieren ging nicht. Erlaube dem Baukasten den Zugriff auf die Zwischenablage.');
    }
  };
  return (
    <div className="ai-chat">
      <ol className="share-steps">
        <li>
          <button type="button" className="btn btn-secondary ui-btn" onClick={copy}>
            <Icon icon={copied ? Check : ClipboardCopy} />
            {copied ? 'Kopiert' : 'Auftrag kopieren'}
          </button>{' '}
          {what}
        </li>
        <li>In deinem Claude-Projekt „Arbeitsblätter“ (mit der Anleitung im Projektwissen) einfügen und senden.</li>
        <li>Claudes Antwort (den JSON-Block) kopieren und hier einfügen:</li>
      </ol>
      <textarea className="input" rows={4} value={pasted} placeholder='{ "format": "arbeitsblatt-baukasten-paket", … }' onChange={(e) => onPaste(e.target.value)} aria-label="Antwort aus dem Chat" />
    </div>
  );
}
