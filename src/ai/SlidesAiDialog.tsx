// "Mit KI bauen: Folien": new slides from the whole lesson or the slides there are reworked, with a wish; through the
// chat or with a key. The answer is shown as a list before it replaces the old slides (undo brings those back).
import { useEffect, useMemo, useState } from 'react';
import { Check, ClipboardPaste, Sparkles } from 'lucide-react';
import { SegField } from '../editor/fields';
import { Icon } from '../icons';
import { SLIDE_LAYOUTS, type Slide } from '../model/slides';
import type { Doc } from '../model/types';
import { ClassNotesLine } from './ClassNotesDialog';
import { ChatPath, useAiJob } from './parts';
import { buildSlidesPrompt, slidesFromAnswer, slidesPrompt, slidesSystem, type SlidesAiContext, type SlidesAiMode } from './slides';

interface SlidesAiDialogProps {
  slides: Slide[];
  doc: Doc;
  context: SlidesAiContext;
  /** Start with this mode (default: rework when there are slides, else build). */
  initialMode?: SlidesAiMode;
  onApply(slides: Slide[]): void;
  onClose(): void;
}

const IDEAS = ['Mehr Bilder, weniger Text', 'Einstieg mit einem starken Bild', 'Für eine unruhige Klasse: kurz und klar', 'Mit einer Schätzfrage am Anfang'];

const MODES: { v: SlidesAiMode; l: string }[] = [
  { v: 'build', l: 'Neu aus Blatt und Lernweg' },
  { v: 'rework', l: 'Überarbeiten' },
];

export function SlidesAiDialog({ slides, doc, context, initialMode, onApply, onClose }: SlidesAiDialogProps) {
  const job = useAiJob();
  const { error } = job;
  const [mode, setMode] = useState<SlidesAiMode>(initialMode ?? (slides.length ? 'rework' : 'build'));
  const [wish, setWish] = useState('');
  const [made, setMade] = useState<Slide[] | null>(null);
  const [pasted, setPasted] = useState('');
  const prompt = useMemo(() => (mode === 'build' ? buildSlidesPrompt(doc, context, wish) : slidesPrompt(slides, doc, context, wish)), [mode, slides, doc, context, wish]);
  const read = (raw: unknown) => setMade(slidesFromAnswer(raw, slides, doc).slides);
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
      <div className="dialog-backdrop" onClick={() => !made && close()}>
        <div className="dialog ai-dialog ai-check-dialog" role="dialog" aria-modal="true" aria-label="Mit KI bauen: Folien" onClick={(e) => e.stopPropagation()}>
          <div className="dialog-title">
            <Icon icon={Sparkles} /> Mit KI bauen: Folien
          </div>
          {!made && (
            <>
              {slides.length > 0 && <SegField<SlidesAiMode> label="Was soll die KI tun?" value={mode} options={MODES} onPick={(v) => (setMode(v), job.setError(''))} />}
              <p className="dialog-body">
                {mode === 'build'
                  ? 'Die KI baut die Präsentation aus der ganzen Stunde: Sie folgt dem Lernweg und dem Stundenverlauf, zeigt das Material (M1, M2 …) groß, mit Aufträgen, Besprechung mit Lösungen und Merksatz. Bilder des Blatts übernimmt sie, für andere schreibt sie Suchwörter.'
                  : `Die KI überarbeitet die ${slides.length} Folien nach deinem Wunsch: passende Folienarten, starke Bilder mit Suchwörtern, Wortlaut für die Klasse. Ablauf, Aufgaben und Lösungen bleiben.`}
              </p>
              {mode === 'build' && slides.length > 0 && <p className="ai-hint is-warn">Die {slides.length === 1 ? 'Folie' : `${slides.length} Folien`} der Stunde werden ersetzt; Rückgängig (⌘Z) bringt sie zurück, solange die Folien offen sind.</p>}
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
          {!made && <ChatPath request={() => `${slidesSystem()}\n\n${prompt}`} what={mode === 'build' ? 'Er enthält die ganze Stunde mit Lernweg und Arbeitsblättern.' : 'Er enthält die Folien und das Arbeitsblatt.'} pasted={pasted} onPaste={setPasted} onError={job.setError} />}
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
