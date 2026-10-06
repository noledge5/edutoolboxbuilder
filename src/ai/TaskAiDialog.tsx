// "Aufgabe mit Claude": the teacher's instruction for a task, in her own words. Claude may change the task's type or
// make up to three blocks; before and after are shown, then they replace the block, go after it, or in as new.
import { useEffect, useMemo, useState } from 'react';
import { Check, ClipboardCopy, ClipboardPaste, KeyRound, RotateCcw, Sparkles } from 'lucide-react';
import { Icon } from '../icons';
import { BLOCK_TYPES } from '../model/blockTypes';
import type { Block, Doc } from '../model/types';
import { AiSettingsDialog } from './AiSettingsDialog';
import { ClassNotesLine } from './ClassNotesDialog';
import { BlockPreview } from './BlockAiDialog';
import { AiBusy, ChatPath, useAiJob } from './parts';
import { dollars } from './prices';
import { modelLabel } from './settings';
import { blocksFromAnswer, taskPrompt, taskSystem, type TaskContext } from './task';
import { useAiSettings } from './useAi';

interface TaskAiDialogProps {
  doc: Doc;
  context: TaskContext;
  /** The block it is about; absent for a new task. */
  block?: Block;
  onApply(blocks: Block[], how: 'replace' | 'after' | 'new'): void;
  onClose(): void;
}

const IDEAS_EXISTING = ['Mach daraus eine Zuordnung mit Bildern, 6 Paare', 'Als Rätsel für Klasse 5', 'Schwieriger, mit Begründung', 'Mit Bezug zum Text auf der Seite', 'Teile sie in a) und b) auf'];
const IDEAS_NEW = ['Eine Aufgabe zum Lesetext mit 5 Fragen', 'Ein Bildimpuls mit Leitfrage', 'Ein Lückentext zum Merksatz', 'Ein Bingo mit den neuen Wörtern', 'Eine Partneraufgabe zum Sprechen'];

export function TaskAiDialog({ doc, context, block, onApply, onClose }: TaskAiDialogProps) {
  const settings = useAiSettings();
  const job = useAiJob();
  const { busy, error, answer } = job;
  const [instruction, setInstruction] = useState('');
  const [made, setMade] = useState<Block[] | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [pasted, setPasted] = useState('');
  const [keyOpen, setKeyOpen] = useState(false);
  const prompt = useMemo(() => taskPrompt(instruction, context, block), [instruction, context, block]);
  const read = (raw: unknown) => setMade(blocksFromAnswer(raw, context.competences, block));
  const run = () => {
    setMade(null);
    return job.run({ job: 'small', what: block ? 'Aufgabe neu (Anweisung)' : 'Neue Aufgabe', system: taskSystem(), user: prompt, maxTokens: 12000, effort: 'medium' }, read);
  };
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
  const ideas = block ? IDEAS_EXISTING : IDEAS_NEW;

  return (
    <>
      <div className="dialog-backdrop" onClick={() => !busy && !made && close()}>
        <div className="dialog ai-dialog ai-block-dialog" role="dialog" aria-modal="true" aria-label="Aufgabe mit Claude" onClick={(e) => e.stopPropagation()}>
          <div className="dialog-title">
            <Icon icon={Sparkles} /> {block ? `${BLOCK_TYPES[block.type].label} mit Claude neu` : 'Neue Aufgabe mit Claude'}
          </div>
          <p className="dialog-body ai-where">
            {context.subject} · Klasse {context.grade} · Seite „{context.page.title}“
          </p>
          {!made && (
            <>
              <div className="field">
                <label htmlFor="ai-task">Was soll Claude tun?</label>
                <textarea
                  id="ai-task"
                  className="input"
                  rows={3}
                  autoFocus
                  value={instruction}
                  placeholder={block ? 'z. B. Mach daraus eine Zuordnung mit Bildern, 6 Paare, für Niveau G' : 'z. B. Eine Aufgabe, in der die Kinder die Himmelsrichtungen auf einer Karte eintragen'}
                  onChange={(e) => setInstruction(e.target.value)}
                />
              </div>
              <ClassNotesLine subject={context.subject} grade={context.grade} />
              <div className="ai-ideas">
                {ideas.map((t) => (
                  <button key={t} type="button" className="seg-pill" onClick={() => setInstruction(t)}>
                    {t}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="ai-compare">
            {block && (
              <div>
                <div className="panel-section-label">Vorher</div>
                <BlockPreview block={block} doc={doc} />
              </div>
            )}
            {(made || busy) && (
              <div>
                <div className="panel-section-label">{block ? 'Nachher' : 'Neu'}</div>
                {busy && <AiBusy busy={busy} hint="Das dauert meist zwanzig bis vierzig Sekunden." onStop={job.stop} />}
                {made?.map((b) => <BlockPreview key={b.id} block={b} doc={doc} />)}
              </div>
            )}
          </div>
          {made?.some((b) => b.type === 'image' || b.type === 'hook' || b.type === 'picvocab') && (
            <p className="ai-hint">Bilder setzt du danach im Panel ein: „Im Internet suchen“ oder „Mit KI erzeugen“ (Claudes Bildbeschreibung ist schon eingetragen).</p>
          )}
          {error && <p className="json-err">{error}</p>}
          {made && answer && (
            <p className="ai-cost">
              Kosten etwa {dollars(answer.usd)} · {modelLabel(answer.model)}
              {settings ? ` · diesen Monat ${dollars(settings.spent)}` : ''}
            </p>
          )}
          {!made && chatOpen && <ChatPath request={() => `${taskSystem()}\n\n${prompt}`} what="Er enthält die Anweisung, den Baustein und die Seite." pasted={pasted} onPaste={setPasted} onError={job.setError} />}
          <div className="dialog-actions">
            {made ? (
              <>
                <button type="button" className="btn btn-secondary ui-btn" onClick={() => setMade(null)} style={{ marginRight: 'auto' }}>
                  <Icon icon={RotateCcw} />
                  Anweisung ändern
                </button>
                <button type="button" className="btn btn-secondary ui-btn" onClick={close}>
                  Verwerfen
                </button>
                {block ? (
                  <>
                    <button type="button" className="btn btn-secondary ui-btn" onClick={() => onApply(made, 'after')}>
                      Dahinter einfügen
                    </button>
                    <button type="button" className="btn btn-primary ui-btn" onClick={() => onApply(made, 'replace')}>
                      <Icon icon={Check} />
                      Ersetzen
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn btn-primary ui-btn" onClick={() => onApply(made, 'new')}>
                    <Icon icon={Check} />
                    Einfügen
                  </button>
                )}
              </>
            ) : (
              <>
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
                  Abbrechen
                </button>
                {chatOpen ? (
                  <button type="button" className="btn btn-primary ui-btn" onClick={() => job.paste(pasted, read)} disabled={!pasted.trim() || !instruction.trim()}>
                    <Icon icon={ClipboardPaste} />
                    Antwort einlesen
                  </button>
                ) : (
                  <button type="button" className="btn btn-primary ui-btn" onClick={run} disabled={!settings || !!busy || !instruction.trim()} title={settings ? undefined : 'Erst einen KI-Schlüssel einrichten oder „Über den Chat“ nehmen'}>
                    <Icon icon={Sparkles} />
                    Los
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {keyOpen && <AiSettingsDialog onClose={() => setKeyOpen(false)} />}
    </>
  );
}
