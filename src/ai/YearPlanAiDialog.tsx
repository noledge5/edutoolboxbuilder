// "Jahresplan mit Claude": Claude plans the school year of a subject and grade (modules with weeks, competences and
// planned lessons) around the modules already there. Shown first as a preview, then added like an imported package.
import { useEffect, useMemo, useState } from 'react';
import { Check, ClipboardCopy, ClipboardPaste, KeyRound, Sparkles } from 'lucide-react';
import { NumberField } from '../editor/fields';
import { Icon } from '../icons';
import { claudeInstructions } from '../claude/instructions';
import { defaultLang, modulesOf } from '../library/model';
import type { ParsedPackage } from '../library/package';
import type { Library } from '../library/types';
import { AiSettingsDialog } from './AiSettingsDialog';
import { AiBusy, ChatPath, useAiJob } from './parts';
import { dollars } from './prices';
import { modelLabel } from './settings';
import { useAiSettings } from './useAi';
import { planPreview, yearPlanContext, yearPlanFromAnswer, yearPlanPrompt } from './yearplan';

interface YearPlanAiDialogProps {
  lib: Library;
  subject: string;
  grade: number;
  onApply(p: ParsedPackage): void;
  onClose(): void;
}

export function YearPlanAiDialog({ lib, subject, grade, onApply, onClose }: YearPlanAiDialogProps) {
  const settings = useAiSettings();
  const job = useAiJob();
  const { busy, error, answer } = job;
  const [hours, setHours] = useState(defaultLang(subject) === 'en' ? 4 : 2);
  const [textbook, setTextbook] = useState(() => modulesOf(lib, subject, grade).find((m) => m.textbook)?.textbook.replace(/,.*$/, '') ?? '');
  const [wishes, setWishes] = useState('');
  const [plan, setPlan] = useState<ParsedPackage | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [pasted, setPasted] = useState('');
  const [keyOpen, setKeyOpen] = useState(false);

  const context = useMemo(() => yearPlanContext(lib, subject, grade, { hours, textbook, wishes }), [lib, subject, grade, hours, textbook, wishes]);
  const prompt = (chat: boolean) => yearPlanPrompt(subject, grade, context, chat);
  const preview = useMemo(() => (plan ? planPreview(lib, subject, grade, plan) : null), [lib, subject, grade, plan]);
  const read = (raw: unknown) => setPlan(yearPlanFromAnswer(raw, subject, grade));

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

  const run = () => {
    setPlan(null);
    return job.run({ job: 'big', what: 'Jahresplan', system: claudeInstructions(), user: prompt(false), maxTokens: 64000, effort: 'high' }, read);
  };

  return (
    <>
      <div className="dialog-backdrop" onClick={() => !busy && !plan && close()}>
        <div className="dialog ai-dialog" role="dialog" aria-modal="true" aria-label="Jahresplan mit Claude" onClick={(e) => e.stopPropagation()}>
          <div className="dialog-title">
            <Icon icon={Sparkles} /> Jahresplan mit Claude
          </div>
          <p className="dialog-body ai-where">
            {subject} · Klasse {grade}
            {lib.settings.schoolYear ? ` · Schuljahr ${lib.settings.schoolYear.name}` : ' · ohne Schuljahr (trag es in den Einstellungen ein, dann plant Claude mit den Ferien)'}
          </p>

          {!plan && (
            <>
              <p className="ai-hint">
                Claude plant die Module des Schuljahrs mit Wochen, Kompetenzraster und allen Stunden als geplante Stunden. Module, die es schon gibt, bleiben und werden nur ergänzt. Danach arbeitest du jede Stunde im
                Arbeitsblatt mit „Claude“ → „Stunde mit Claude“ aus.
              </p>
              <div className="ai-plan-row">
                <NumberField label="Stunden pro Woche" value={hours} min={1} max={8} onChange={setHours} />
                <div className="field">
                  <label htmlFor="ai-textbook">Lehrwerk (freiwillig)</label>
                  <input id="ai-textbook" className="input" value={textbook} placeholder={defaultLang(subject) === 'en' ? 'z. B. Green Line 1' : 'z. B. Diercke Praxis 9'} onChange={(e) => setTextbook(e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="ai-plan-wishes">Schwerpunkte und Wünsche (freiwillig)</label>
                <textarea
                  id="ai-plan-wishes"
                  className="input"
                  rows={3}
                  value={wishes}
                  placeholder="z. B. Reihenfolge wie im Buch, vor Weihnachten ein Projekt, drei Klassenarbeiten, im Sommer Exkursion"
                  onChange={(e) => setWishes(e.target.value)}
                />
              </div>
              <details className="ai-context">
                <summary>Was Claude über den Jahrgang erfährt</summary>
                <pre>{context}</pre>
              </details>
            </>
          )}

          {busy && <AiBusy busy={busy} hint="Ein ganzer Jahresplan dauert meist drei bis sechs Minuten." onStop={job.stop} />}
          {error && <p className="json-err">{error}</p>}

          {plan && preview && (
            <div className="ai-result">
              <p className={'ai-hint' + (preview.total && preview.used > preview.total ? ' is-warn' : '')}>
                {preview.total ? `${preview.used} von ${preview.total} Schulwochen verplant.` : `${preview.used} Wochen verplant.`} {plan.modules.reduce((n, m) => n + m.lessons.length, 0)} Stunden in {plan.modules.length}{' '}
                {plan.modules.length === 1 ? 'Modul' : 'Modulen'}.
              </p>
              <ul className="ai-plan">
                {preview.rows.map((r) => (
                  <li key={r.number}>
                    <details>
                      <summary>
                        <b>
                          Modul {r.number}: {r.title}
                        </b>
                        <span>
                          {r.weeks} {r.weeks === 1 ? 'Woche' : 'Wochen'}
                          {r.when && ` · ${r.when}`}
                          {r.short && ' · passt nicht mehr ins Schuljahr'} · {r.lessons} {r.lessons === 1 ? 'Stunde' : 'Stunden'} · {r.competences} {r.competences === 1 ? 'Kompetenz' : 'Kompetenzen'}
                        </span>
                        <span className={'ai-plan-tag' + (r.action === 'neu' ? ' is-new' : '')}>{r.action === 'neu' ? 'Neu' : 'Ergänzt'}</span>
                      </summary>
                      <ol>
                        {r.lessonTitles.map((t) => (
                          <li key={t}>{t.replace(/^\d+\.\s*/, '')}</li>
                        ))}
                      </ol>
                    </details>
                  </li>
                ))}
              </ul>
              {plan.notes.length > 0 && (
                <details className="ai-context">
                  <summary>{plan.notes.length === 1 ? 'Ein Hinweis' : `${plan.notes.length} Hinweise`} beim Einlesen</summary>
                  <ul>
                    {plan.notes.map((n, k) => (
                      <li key={k}>{n}</li>
                    ))}
                  </ul>
                </details>
              )}
              {answer && (
                <p className="ai-cost">
                  Kosten etwa {dollars(answer.usd)} · {modelLabel(answer.model)}
                  {settings ? ` · diesen Monat ${dollars(settings.spent)}` : ''}
                </p>
              )}
            </div>
          )}

          {!plan && chatOpen && (
            <ChatPath request={() => prompt(true)} what="Er enthält Schuljahr, Ferien und die Module, die es schon gibt." pasted={pasted} onPaste={setPasted} onError={job.setError} />
          )}

          <div className="dialog-actions">
            {plan ? (
              <>
                <button type="button" className="btn btn-secondary ui-btn" onClick={() => setPlan(null)} style={{ marginRight: 'auto' }}>
                  Zurück
                </button>
                <button type="button" className="btn btn-secondary ui-btn" onClick={close}>
                  Verwerfen
                </button>
                <button type="button" className="btn btn-primary ui-btn" onClick={() => onApply(plan)}>
                  <Icon icon={Check} />
                  Übernehmen
                </button>
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
                  <button type="button" className="btn btn-primary ui-btn" onClick={() => job.paste(pasted, read)} disabled={!pasted.trim()}>
                    <Icon icon={ClipboardPaste} />
                    Antwort einlesen
                  </button>
                ) : (
                  <button type="button" className="btn btn-primary ui-btn" onClick={run} disabled={!settings || !!busy} title={settings ? undefined : 'Erst einen KI-Schlüssel einrichten oder „Über den Chat“ nehmen'}>
                    <Icon icon={Sparkles} />
                    Jahresplan entwerfen
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
