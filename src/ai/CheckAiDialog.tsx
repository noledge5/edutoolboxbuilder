// "Stunde prüfen": Claude lists what would break the lesson in class; each finding jumps to its block or opens
// "Mit Anweisung neu machen" with Claude's fix as the instruction.
import { useEffect, useMemo, useState } from 'react';
import { ClipboardCopy, ClipboardPaste, KeyRound, ListChecks, Wand2 } from 'lucide-react';
import { Icon } from '../icons';
import type { Doc } from '../model/types';
import { AiSettingsDialog } from './AiSettingsDialog';
import { checkPrompt, checkSystem, findingsFromAnswer, KINDS, type CheckContext, type Finding } from './check';
import { ClassNotesLine } from './ClassNotesDialog';
import { AiBusy, ChatPath, useAiJob } from './parts';
import { dollars } from './prices';
import { modelLabel } from './settings';
import { useAiSettings } from './useAi';

interface CheckAiDialogProps {
  doc: Doc;
  context: CheckContext;
  /** Earlier findings, kept while the teacher fixes one after the other. */
  findings: Finding[] | null;
  onFindings(f: Finding[]): void;
  onShow(blockId: string): void;
  onFix(f: Finding): void;
  onClose(): void;
}

export function CheckAiDialog({ doc, context, findings, onFindings, onShow, onFix, onClose }: CheckAiDialogProps) {
  const settings = useAiSettings();
  const job = useAiJob();
  const { busy, error, answer } = job;
  const [chatOpen, setChatOpen] = useState(false);
  const [pasted, setPasted] = useState('');
  const [keyOpen, setKeyOpen] = useState(false);
  const prompt = useMemo(() => checkPrompt(doc, context), [doc, context]);
  const read = (raw: unknown) => onFindings(findingsFromAnswer(raw, doc));
  const run = () => job.run({ job: 'big', what: 'Stunde prüfen', system: checkSystem(), user: prompt, maxTokens: 8000, effort: 'medium' }, read);
  const close = () => {
    if (busy && !window.confirm('Claude arbeitet noch. Abbrechen und schließen?')) return;
    job.stop();
    onClose();
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !keyOpen && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <>
      <div className="dialog-backdrop" onClick={() => !busy && close()}>
        <div className="dialog ai-dialog ai-check-dialog" role="dialog" aria-modal="true" aria-label="Stunde prüfen" onClick={(e) => e.stopPropagation()}>
          <div className="dialog-title">
            <Icon icon={ListChecks} /> Stunde prüfen
          </div>
          <p className="dialog-body">Claude liest alle Seiten und sucht, was die Stunde scheitern lässt: Aufgaben ohne passendes Material, Wissen erst nach der Aufgabe, Aufgaben zu schwer oder zu leicht für die Klasse.</p>
          {!findings && <ClassNotesLine subject={context.subject} grade={context.grade} />}
          {busy && <AiBusy busy={busy} hint="Das dauert meist dreißig bis sechzig Sekunden." onStop={job.stop} />}
          {findings && !busy && (
            findings.length ? (
              <ol className="check-list">
                {findings.map((f, i) => (
                  <li key={i}>
                    <div className="check-head">
                      {f.blockId ? (
                        <button type="button" className="check-ref" onClick={() => onShow(f.blockId!)} title="Baustein zeigen">
                          {f.ref}
                        </button>
                      ) : (
                        <span className="check-ref">{f.ref || '–'}</span>
                      )}
                      <span className="check-kind">{KINDS[f.kind]}</span>
                    </div>
                    <p>{f.problem}</p>
                    {f.fix && (
                      <div className="check-fix">
                        <span>{f.fix}</span>
                        {f.blockId && (
                          <button type="button" className="btn btn-secondary ui-btn" onClick={() => onFix(f)}>
                            <Icon icon={Wand2} />
                            Beheben …
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="check-ok">Claude hat nichts gefunden, was die Stunde scheitern lässt.</p>
            )
          )}
          {error && <p className="json-err">{error}</p>}
          {answer && findings && (
            <p className="ai-cost">
              Kosten etwa {dollars(answer.usd)} · {modelLabel(answer.model)}
              {settings ? ` · diesen Monat ${dollars(settings.spent)}` : ''}
            </p>
          )}
          {chatOpen && <ChatPath request={() => `${checkSystem()}\n\n${prompt}`} what="Er enthält alle Seiten der Stunde." pasted={pasted} onPaste={setPasted} onError={job.setError} />}
          <div className="dialog-actions">
            {!chatOpen && (
              <button type="button" className="btn btn-secondary ui-btn" onClick={() => setChatOpen(true)} style={{ marginRight: 'auto' }} disabled={!!busy}>
                <Icon icon={ClipboardCopy} />
                Über den Chat
              </button>
            )}
            {settings === null && !chatOpen && (
              <button type="button" className="btn btn-secondary ui-btn" onClick={() => setKeyOpen(true)}>
                <Icon icon={KeyRound} />
                Schlüssel einrichten …
              </button>
            )}
            <button type="button" className="btn btn-secondary ui-btn" onClick={close}>
              Schließen
            </button>
            {chatOpen ? (
              <button type="button" className="btn btn-primary ui-btn" onClick={() => job.paste(pasted, read)} disabled={!pasted.trim()}>
                <Icon icon={ClipboardPaste} />
                Antwort einlesen
              </button>
            ) : (
              <button type="button" className="btn btn-primary ui-btn" onClick={run} disabled={!settings || !!busy} title={settings ? undefined : 'Erst einen KI-Schlüssel einrichten oder „Über den Chat“ nehmen'}>
                <Icon icon={ListChecks} />
                {findings ? 'Neu prüfen' : 'Prüfen'}
              </button>
            )}
          </div>
        </div>
      </div>
      {keyOpen && <AiSettingsDialog onClose={() => setKeyOpen(false)} />}
    </>
  );
}
