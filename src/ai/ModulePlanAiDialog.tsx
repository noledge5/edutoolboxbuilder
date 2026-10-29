// "Modul mit Claude planen": Claude plans a unit from its end (competence grid, way there as planned lessons with
// role and competences). A preview first; applying keeps the worked-out lessons and replaces the planned ones.
import { useEffect, useMemo, useState } from 'react';
import { Check, ClipboardPaste, Sparkles } from 'lucide-react';
import { NumberField } from '../editor/fields';
import { Icon } from '../icons';
import { lessonsOf } from '../library/model';
import { roleLabel } from '../library/planning';
import type { Library, Module } from '../library/types';
import { ClassNotesLine } from './ClassNotesDialog';
import { hoursOf, MODULE_ENDS, moduleContext, modulePlanFromAnswer, modulePlanPrompt, type ModuleEnd, type ModulePlan } from './moduleplan';
import { ChatPath, useAiJob } from './parts';

interface ModulePlanAiDialogProps {
  lib: Library;
  module: Module;
  onApply(plan: ModulePlan): void;
  onClose(): void;
}

const STATUS: Record<'neu' | 'geändert' | 'bleibt', string> = { neu: 'Neu', geändert: 'Neu geplant', bleibt: 'Bleibt' };

export function ModulePlanAiDialog({ lib, module: m, onApply, onClose }: ModulePlanAiDialogProps) {
  const job = useAiJob();
  const { error } = job;
  const lessons = useMemo(() => lessonsOf(lib, m.id), [lib, m.id]);
  const [hours, setHours] = useState(() => hoursOf(m, lessons));
  const [end, setEnd] = useState<ModuleEnd>('');
  const [wishes, setWishes] = useState('');
  const [plan, setPlan] = useState<ModulePlan | null>(null);
  const [pasted, setPasted] = useState('');

  const context = useMemo(() => moduleContext(lib, m, { hours, end, wishes }), [lib, m, hours, end, wishes]);
  const prompt = (chat: boolean) => modulePlanPrompt(m, context, chat);
  const read = (raw: unknown) => setPlan(modulePlanFromAnswer(raw, m, lessons));
  const names = useMemo(() => new Map((plan?.competences ?? m.competences).map((c) => [c.id, c.area || c.g])), [plan, m.competences]);

  const close = () => {
    onClose();
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });


  return (
    <>
      <div className="dialog-backdrop" onClick={() => !plan && close()}>
        <div className="dialog ai-dialog" role="dialog" aria-modal="true" aria-label="Mit KI bauen: Modul" onClick={(e) => e.stopPropagation()}>
          <div className="dialog-title">
            <Icon icon={Sparkles} /> Mit KI bauen: Modul
          </div>
          <p className="dialog-body ai-where">
            Modul {m.number}: <b>{m.title}</b> · {m.subject} · Klasse {m.grade}
            {m.weeks > 0 ? ` · ${m.weeks} ${m.weeks === 1 ? 'Woche' : 'Wochen'}` : ''}
          </p>

          {!plan && (
            <>
              <p className="ai-hint">
                Die KI plant das Modul vom Ende her: was die Klasse am Ende kann und woran man es sieht, das Kompetenzraster und den Weg dorthin als geplante Stunden mit Rolle und Kompetenzen. Ausgearbeitete Stunden bleiben,
                geplante werden ersetzt. Danach arbeitest du die Stunden einzeln im Arbeitsblatt mit „KI“ → „Mit KI bauen“ aus.
              </p>
              <div className="ai-plan-row">
                <NumberField label="Stunden pro Woche" value={hours} min={1} max={8} onChange={setHours} />
                <div className="field">
                  <label htmlFor="ai-mod-end">Abschluss des Moduls</label>
                  <select id="ai-mod-end" className="input" value={end} onChange={(e) => setEnd(e.target.value as ModuleEnd)}>
                    {MODULE_ENDS.map((x) => (
                      <option key={x.v} value={x.v}>
                        {x.l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field">
                <label htmlFor="ai-mod-wishes">Schwerpunkte und Wünsche (freiwillig)</label>
                <textarea
                  id="ai-mod-wishes"
                  className="input"
                  rows={3}
                  value={wishes}
                  placeholder={m.lang === 'en' ? 'z. B. Lernaufgabe: eine E-Mail an eine Brieffreundin, Grammatik simple past, viel Sprechen' : 'z. B. Fallbeispiel Rhein, Klimadiagramme üben, am Ende ein Lernplakat'}
                  onChange={(e) => setWishes(e.target.value)}
                />
              </div>
              <ClassNotesLine subject={m.subject} grade={m.grade} />
              <details className="ai-context">
                <summary>Was die KI über das Modul erfährt</summary>
                <pre>{context}</pre>
              </details>
            </>
          )}

          {error && <p className="json-err">{error}</p>}

          {plan && (
            <div className="ai-result">
              {plan.description && <p className="ai-hint">{plan.description}</p>}
              <div className="panel-section-label">
                Kompetenzraster · {plan.competences.length} {plan.competences.length === 1 ? 'Kompetenz' : 'Kompetenzen'}
              </div>
              <ul className="ai-comps">
                {plan.competences.map((c) => (
                  <li key={c.id}>
                    <b>{c.area || 'Kompetenz'}</b>
                    {plan.added.includes(c.id) && m.competences.length > 0 && <span className="ai-plan-tag is-new">Neu</span>}
                    <small>{c.m}</small>
                  </li>
                ))}
              </ul>
              <div className="panel-section-label">
                Lernweg · {plan.lessons.length} {plan.lessons.length === 1 ? 'Stunde' : 'Stunden'}
              </div>
              <ol className="ai-way">
                {plan.lessons.map((l) => (
                  <li key={l.number} className={l.status === 'bleibt' ? 'is-kept' : undefined}>
                    <span className="ai-way-num">{l.number}</span>
                    <span className="ai-way-main">
                      <b>{l.title}</b>
                      {l.role && <span className="ai-way-role">{roleLabel(l.role)}</span>}
                      {l.plan && <small>{l.plan}</small>}
                      {l.competences.length > 0 && <small className="ai-way-comps">{l.competences.map((id) => names.get(id)).filter(Boolean).join(' · ')}</small>}
                    </span>
                    <span className={'ai-plan-tag' + (l.status === 'neu' ? ' is-new' : '')}>{STATUS[l.status]}</span>
                  </li>
                ))}
              </ol>
              {plan.dropped.length > 0 && (
                <p className="ai-hint is-warn">
                  Entfällt aus der alten Planung (in den Papierkorb): {plan.dropped.map((l) => `Stunde ${l.number} „${l.title}“`).join(', ')}.
                </p>
              )}
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
            </div>
          )}

          {!plan && (
            <ChatPath request={() => prompt(true)} what="Er enthält das Modul, seine Stunden, das Kompetenzraster und die Module davor und danach." pasted={pasted} onPaste={setPasted} onError={job.setError} />
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
                <button type="button" className="btn btn-secondary ui-btn" onClick={close}>
                  Abbrechen
                </button>
                <button type="button" className="btn btn-primary ui-btn" onClick={() => job.paste(pasted, read)} disabled={!pasted.trim()}>
                  <Icon icon={ClipboardPaste} />
                  Antwort einlesen
                </button>

              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
