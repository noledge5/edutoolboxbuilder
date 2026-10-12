// "Stunde komplett mit Claude": wishes, then the steps one after the other with their state, then the result to take.
import { useEffect, useRef, useState } from 'react';
import { Check, CircleDashed, KeyRound, Loader2, Minus, Sparkles, X } from 'lucide-react';
import { Icon } from '../icons';
import { SLIDE_LAYOUTS, type Slide } from '../model/slides';
import type { Doc } from '../model/types';
import { AiSettingsDialog } from './AiSettingsDialog';
import { ClassNotesLine } from './ClassNotesDialog';
import { KINDS } from './check';
import { firstMode, runFullLesson, STEPS, type FullResult, type StepKey, type StepState } from './fullLesson';
import type { LessonAi } from './LessonAiDialog';
import { dollars } from './prices';
import { runAi, useAiSettings } from './useAi';

interface FullLessonDialogProps {
  doc: Doc;
  ai: LessonAi;
  onApply(r: FullResult): void;
  onClose(): void;
}

const STATE_ICON = { wait: CircleDashed, run: Loader2, done: Check, skip: Minus, fail: X };

export function FullLessonDialog({ doc, ai, onApply, onClose }: FullLessonDialogProps) {
  const settings = useAiSettings();
  const [wishes, setWishes] = useState('');
  const [steps, setSteps] = useState<Partial<Record<StepKey, StepState>> | null>(null);
  const [result, setResult] = useState<FullResult | null>(null);
  const [error, setError] = useState('');
  const [keyOpen, setKeyOpen] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const running = !!steps && !result && !error;
  const mode = firstMode(doc);

  const start = async () => {
    setError('');
    setResult(null);
    setSteps({});
    const ctrl = new AbortController();
    abort.current = ctrl;
    try {
      const r = await runFullLesson(
        {
          module: ai.module,
          lesson: ai.lesson,
          doc,
          context: ai.context,
          notes: ai.notes(),
          suggest: ai.suggestSlides,
          ask: (req) => runAi({ ...req, signal: ctrl.signal }),
          step: (key, s) => setSteps((all) => ({ ...all, [key]: s })),
        },
        wishes,
      );
      if (r) setResult(r);
      else setSteps(null);
    } catch (e) {
      setError(ctrl.signal.aborted ? 'Abgebrochen.' : e instanceof Error ? e.message : String(e));
    } finally {
      abort.current = null;
    }
  };
  const close = () => {
    if (running && !window.confirm('Claude arbeitet noch. Abbrechen und schließen?')) return;
    abort.current?.abort();
    onClose();
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !keyOpen && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  useEffect(() => () => abort.current?.abort(), []);

  const layouts = (slides: Slide[]) => {
    const n = new Map<string, number>();
    for (const s of slides) n.set(SLIDE_LAYOUTS[s.layout].label, (n.get(SLIDE_LAYOUTS[s.layout].label) ?? 0) + 1);
    return [...n].map(([l, k]) => `${k} × ${l}`).join(', ');
  };

  return (
    <>
      <div className="dialog-backdrop" onClick={() => !steps && close()}>
        <div className="dialog ai-dialog ai-check-dialog" role="dialog" aria-modal="true" aria-label="Stunde komplett mit Claude" onClick={(e) => e.stopPropagation()}>
          <div className="dialog-title">
            <Icon icon={Sparkles} /> Stunde komplett mit Claude
          </div>
          {!steps && (
            <>
              <p className="dialog-body">
                {mode === 'full' ? 'Claude arbeitet die Stunde aus,' : mode === 'sheets' ? 'Claude baut die Blätter zu deiner Lehrkraft-Seite,' : 'Die Stunde steht schon: Claude'} prüft sie, behebt, was nicht passt, und macht die Folien dazu. Du schaust am Ende einmal drüber und übernimmst. Dauert etwa 3 bis 6 Minuten.
              </p>
              <div className="field">
                <label htmlFor="ai-full">Wünsche (optional)</label>
                <textarea id="ai-full" className="input" rows={2} value={wishes} placeholder="z. B. Einstieg mit einem Bild, viel Partnerarbeit" onChange={(e) => setWishes(e.target.value)} />
              </div>
              <ClassNotesLine subject={ai.module.subject} grade={ai.module.grade} />
            </>
          )}
          {steps && (
            <ol className="full-steps">
              {STEPS.map(({ key, label }) => {
                const s = steps[key] ?? { state: 'wait' as const };
                return (
                  <li key={key} className={'is-' + s.state}>
                    <Icon icon={STATE_ICON[s.state]} size={18} />
                    <span>
                      {label}
                      {s.note && <small> · {s.note}</small>}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
          {result && (
            <div className="full-result">
              <p>
                <b>{result.doc.pages.filter((p) => p.blocks.length).length} Seiten</b> · <b>{result.slides.length} Folien</b> ({layouts(result.slides)})
              </p>
              {result.findings.length > 0 && (
                <details>
                  <summary>Behoben nach der Prüfung ({result.findings.length})</summary>
                  <ul className="check-list">
                    {result.findings.map((f, i) => (
                      <li key={i}>
                        <span className="check-kind">
                          {f.ref} · {KINDS[f.kind]}
                        </span>{' '}
                        {f.problem}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              {result.notes.length > 0 && <p className="ai-hint">{result.notes.join(' ')}</p>}
              <p className="ai-cost">Kosten etwa {dollars(result.usd)}</p>
            </div>
          )}
          {error && <p className="json-err">{error}</p>}
          <div className="dialog-actions">
            {settings === null && !steps && (
              <button type="button" className="btn btn-secondary ui-btn" onClick={() => setKeyOpen(true)} style={{ marginRight: 'auto' }}>
                <Icon icon={KeyRound} />
                Schlüssel einrichten …
              </button>
            )}
            <button type="button" className="btn btn-secondary ui-btn" onClick={close}>
              {result ? 'Verwerfen' : running ? 'Abbrechen' : 'Schließen'}
            </button>
            {result ? (
              <button type="button" className="btn btn-primary ui-btn" onClick={() => onApply(result)}>
                <Icon icon={Check} />
                Übernehmen
              </button>
            ) : (
              !running && (
                <button type="button" className="btn btn-primary ui-btn" onClick={start} disabled={!settings} title={settings ? undefined : 'Dafür braucht es einen KI-Schlüssel'}>
                  <Icon icon={Sparkles} />
                  {error ? 'Noch einmal' : 'Los'}
                </button>
              )
            )}
          </div>
        </div>
      </div>
      {keyOpen && <AiSettingsDialog onClose={() => setKeyOpen(false)} />}
    </>
  );
}
