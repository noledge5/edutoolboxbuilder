// "Folien mit Claude": the teacher may add a wish; Claude answers with the reworked slides, shown as a list
// before they replace the old ones (undo brings those back).
import { useEffect, useMemo, useState } from 'react';
import { Check, ClipboardCopy, ClipboardPaste, KeyRound, Sparkles } from 'lucide-react';
import { Icon } from '../icons';
import { SLIDE_LAYOUTS, type Slide } from '../model/slides';
import type { Doc } from '../model/types';
import { AiSettingsDialog } from './AiSettingsDialog';
import { ClassNotesLine } from './ClassNotesDialog';
import { AiBusy, ChatPath, useAiJob } from './parts';
import { dollars } from './prices';
import { modelLabel } from './settings';
import { slidesFromAnswer, slidesPrompt, slidesSystem, type SlidesAiContext } from './slides';
import { useAiSettings } from './useAi';

interface SlidesAiDialogProps {
  slides: Slide[];
  doc: Doc;
  context: SlidesAiContext;
  onApply(slides: Slide[]): void;
  onClose(): void;
}

const IDEAS = ['Mehr Bilder, weniger Text', 'Einstieg mit einem starken Bild', 'Für eine unruhige Klasse: kurz und klar', 'Mit einer Schätzfrage am Anfang'];

export function SlidesAiDialog({ slides, doc, context, onApply, onClose }: SlidesAiDialogProps) {
  const settings = useAiSettings();
  const job = useAiJob();
  const { busy, error, answer } = job;
  const [wish, setWish] = useState('');
  const [made, setMade] = useState<Slide[] | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [pasted, setPasted] = useState('');
  const [keyOpen, setKeyOpen] = useState(false);
  const prompt = useMemo(() => slidesPrompt(slides, doc, context, wish), [slides, doc, context, wish]);
  const read = (raw: unknown) => setMade(slidesFromAnswer(raw, slides).slides);
  const run = () => {
    setMade(null);
    return job.run({ job: 'big', what: 'Folien überarbeiten', system: slidesSystem(), user: prompt, maxTokens: 24000, effort: 'medium' }, read);
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

  return (
    <>
      <div className="dialog-backdrop" onClick={() => !busy && !made && close()}>
        <div className="dialog ai-dialog ai-check-dialog" role="dialog" aria-modal="true" aria-label="Folien mit Claude" onClick={(e) => e.stopPropagation()}>
          <div className="dialog-title">
            <Icon icon={Sparkles} /> Folien mit Claude
          </div>
          <p className="dialog-body">Claude macht die {slides.length} Folien abwechslungsreicher: passende Folienarten, starke Bilder mit Suchwörtern, Wortlaut für die Klasse. Ablauf, Aufgaben und Lösungen bleiben.</p>
          {!made && !busy && (
            <>
              <div className="field">
                <label htmlFor="ai-slides">Wunsch (optional)</label>
                <textarea id="ai-slides" className="input" rows={2} value={wish} placeholder="z. B. Mehr Bilder, weniger Text" onChange={(e) => setWish(e.target.value)} />
              </div>
              <div className="ai-ideas">
                {IDEAS.map((t) => (
                  <button key={t} type="button" className="seg-pill" onClick={() => setWish(t)}>
                    {t}
                  </button>
                ))}
              </div>
              <ClassNotesLine subject={context.subject} grade={context.grade} />
            </>
          )}
          {busy && <AiBusy busy={busy} hint="Das dauert meist ein bis zwei Minuten." onStop={job.stop} />}
          {made && (
            <ol className="check-list">
              {made.map((s) => (
                <li key={s.id}>
                  <span className="check-kind">{SLIDE_LAYOUTS[s.layout].label}</span> {s.title || s.text}
                  {!s.image && (s.search || s.describe) && <span className="check-kind"> · Bild: {s.search || s.describe}</span>}
                </li>
              ))}
            </ol>
          )}
          {made?.some((s) => !s.image && (s.search || s.describe)) && <p className="ai-hint">Bilder setzt du danach in der Folie ein: „Im Internet suchen“ oder „Mit KI erzeugen“ (Suchwörter und Beschreibung sind schon eingetragen).</p>}
          {error && <p className="json-err">{error}</p>}
          {made && answer && (
            <p className="ai-cost">
              Kosten etwa {dollars(answer.usd)} · {modelLabel(answer.model)}
              {settings ? ` · diesen Monat ${dollars(settings.spent)}` : ''}
            </p>
          )}
          {!made && chatOpen && <ChatPath request={() => `${slidesSystem()}\n\n${prompt}`} what="Er enthält die Folien und das Arbeitsblatt." pasted={pasted} onPaste={setPasted} onError={job.setError} />}
          <div className="dialog-actions">
            {made ? (
              <>
                <button type="button" className="btn btn-secondary ui-btn" onClick={close}>
                  Verwerfen
                </button>
                <button type="button" className="btn btn-primary ui-btn" onClick={() => onApply(made)}>
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
