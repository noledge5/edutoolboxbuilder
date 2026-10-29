// "Mit KI bauen" in the worksheet: the whole lesson, one more sheet or a revision, with the lesson's place in the
// year plan; from here also the slides, "PDF einpflegen" and the vocabulary list. Two ways: with a key on this device Claude
// answers right here; without one the request is copied for a chat (Claude, ChatGPT …) and the answer pasted back.
// Either way the result is shown before it is applied.
import { useEffect, useMemo, useState } from 'react';
import { Check, ClipboardPaste, Sparkles, X } from 'lucide-react';
import { SegField } from '../editor/fields';
import { Icon } from '../icons';
import type { Competence, Lesson, Module } from '../library/types';
import { sheetNumbers } from '../model/ops';
import type { Doc } from '../model/types';
import { BlockContent } from '../sheet/BlockContent';
import { CompetenceNamesContext } from '../sheet/competences';
import { PAGE_H, PAGE_W, SheetPage, taskNumbers } from '../sheet/SheetPage';
import { SheetModeContext, type SheetMode } from '../sheet/sheetMode';
import { ClassNotesLine } from './ClassNotesDialog';
import { isTeacherPage, lessonFromAnswer, lessonPrompt, type LessonDraft, type LessonMode, hasBlocks } from './lesson';
import { ChatPath, useAiJob } from './parts';

/** What the editor knows about the lesson's place in the library. */
export interface LessonAi {
  module: Module;
  lesson: Lesson;
  /** The lesson in its year plan, for Claude (`lessonContext`). */
  context(wishes: string): string;
  /** Before Claude's lesson is applied: keep the lesson as it was, add new competences to the module. */
  onApplied(added: Competence[]): void;
  /** English words in the vocabulary lists of this subject and grade (for "Vokabelliste mit Claude"). */
  known(): string[];
  /** The class profile and the teacher's principles as Markdown for Claude ('' without). */
  notes(): string;
  /** Gives a lesson that has no name yet ("Neue Stunde") the title of what was brought in. */
  rename?(title: string): void;
}

interface LessonAiDialogProps {
  doc: Doc;
  ai: LessonAi;
  /** Opened from "Stunde prüfen" → "Beheben": the revision with the findings as wishes. */
  initial?: { mode: LessonMode; wishes: string };
  /** "PDF einpflegen": pick a PDF (the editor opens its dialog). */
  onPdf?(): void;
  /** "Vokabelliste" (English modules). */
  onVocab?(): void;
  /** "Folien": the slides view with "Mit KI bauen: Folien". */
  onSlides?(): void;
  onApply(draft: LessonDraft): void;
  onClose(): void;
}

type What = LessonMode | 'slides' | 'pdf' | 'vocab';

const MODES: { v: What; l: string }[] = [
  { v: 'full', l: 'Ganze Stunde' },
  { v: 'sheet', l: 'Ein Arbeitsblatt dazu' },
  { v: 'revise', l: 'Überarbeiten' },
  { v: 'slides', l: 'Folien' },
  { v: 'pdf', l: 'PDF einpflegen' },
  { v: 'vocab', l: 'Vokabelliste' },
];

const MODE_TEXT: Record<LessonMode, string> = {
  full: 'Die KI plant zuerst den Lernweg und schreibt dann die Seite „Für die Lehrkraft“ (Ziel, Einstieg, Lernweg, Verlauf, Erwartungshorizont, Abruffragen) und ein bis drei Schülerseiten mit Material (M1, M2 …) vor den Aufgaben.',
  sheet: 'Die KI baut ein weiteres Arbeitsblatt zu dieser Stunde nach deinem Wunsch, passend zu Lernweg und Material. Die vorhandenen Seiten bleiben.',
  revise: 'Die KI bekommt die Stunde, wie sie jetzt ist, und ändert sie nach deinen Wünschen.',
};

const SHOWN: SheetMode = { solutions: 'shown', bw: false };
const THUMB = 0.3;


/** A page as on the sheet, scaled down (read-only). */
export function PagePreview({ doc, p, scale }: { doc: Doc; p: number; scale: number }) {
  const page = doc.pages[p];
  const nums = taskNumbers(page);
  return (
    <div className="ai-page" style={{ width: PAGE_W * scale, height: PAGE_H * scale }}>
      <SheetPage doc={doc} page={page} index={p} number={sheetNumbers(doc)[p]} editing={false} style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}>
        {page.blocks.map((b, i) => (
          <div key={b.id} className="ed-block" style={{ gridColumn: `span ${b.span}` }}>
            <BlockContent block={b} taskNum={nums[i]} editing={false} />
          </div>
        ))}
      </SheetPage>
    </div>
  );
}

export function LessonAiDialog({ doc, ai, initial, onPdf, onVocab, onSlides, onApply, onClose }: LessonAiDialogProps) {
  const filled = doc.pages.filter(hasBlocks);
  const [mode, setMode] = useState<LessonMode>(initial?.mode ?? 'full');
  const [wishes, setWishes] = useState(initial?.wishes ?? '');
  const job = useAiJob();
  const [draft, setDraft] = useState<LessonDraft | null>(null);
  const [pasted, setPasted] = useState('');
  const [big, setBig] = useState<number | null>(null);
  const { error } = job;

  const modes = MODES.filter((x) => (x.v === 'sheet' || x.v === 'revise' ? filled.length > 0 : x.v === 'slides' ? !!onSlides && filled.length > 0 : x.v === 'pdf' ? !!onPdf : x.v === 'vocab' ? !!onVocab : true));
  const pick = (v: What) => {
    job.setError('');
    if (v === 'slides') onSlides?.();
    else if (v === 'pdf') onPdf?.();
    else if (v === 'vocab') onVocab?.();
    else setMode(v);
  };
  const context = useMemo(() => ai.context(wishes), [ai, wishes]);
  const lessonNow = useMemo(() => ({ ...ai.lesson, doc }), [ai.lesson, doc]);
  const prompt = (chat: boolean) => lessonPrompt(ai.module, lessonNow, context, mode, chat);

  const close = () => {
    onClose();
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (big !== null) setBig(null);
      else close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const read = (raw: unknown) => {
    setDraft(lessonFromAnswer(raw, ai.module, lessonNow, doc, mode));
    setBig(null);
  };

  const names = useMemo(() => new Map([...ai.module.competences, ...(draft?.added ?? [])].map((c) => [c.id, c.area])), [ai.module.competences, draft]);
  const madeAt = draft ? draft.doc.pages.map((p, i) => (draft.made.includes(p) ? i : -1)).filter((i) => i >= 0) : [];

  return (
    <>
    <div className="dialog-backdrop" onClick={() => !draft && close()}>
      <div className="dialog ai-dialog" role="dialog" aria-modal="true" aria-label="Mit KI bauen" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">
          <Icon icon={Sparkles} /> Mit KI bauen
        </div>
        <p className="dialog-body ai-where">
          Stunde {ai.lesson.number}: <b>{ai.lesson.title}</b> · Modul {ai.module.number}: {ai.module.title}
        </p>

        {!draft && (
          <>
            <SegField<What> label="Was soll die KI bauen?" value={mode} options={modes} onPick={pick} />
            <p className="ai-hint">{MODE_TEXT[mode]}</p>
            <ClassNotesLine subject={ai.module.subject} grade={ai.module.grade} />
            {(mode === 'full' || mode === 'revise') && filled.length > 0 && (
              <p className="ai-hint is-warn">Die jetzige Fassung wird ersetzt. Sie bleibt unter „Datei“ → „Frühere Fassungen“, und Rückgängig geht auch.</p>
            )}
            <div className="field">
              <label htmlFor="ai-wishes">{mode === 'revise' ? 'Was soll anders werden?' : mode === 'sheet' ? 'Was für ein Blatt?' : 'Wünsche (freiwillig)'}</label>
              <textarea
                id="ai-wishes"
                className="input"
                rows={3}
                value={wishes}
                placeholder={mode === 'revise' ? 'z. B. Aufgabe 2 leichter, mehr Bilder, eine Partnerarbeit statt Einzelarbeit' : mode === 'sheet' ? 'z. B. Übungsblatt für Schnelle, Lesetext mit Fragen, Wiederholung für die Klassenarbeit' : 'z. B. Einstieg mit einem Bild, eine Partnerarbeit, Lehrbuch S. 34–35, viel Differenzierung'}
                onChange={(e) => setWishes(e.target.value)}
              />
            </div>
            <details className="ai-context">
              <summary>Was die KI über die Stunde erfährt</summary>
              <pre>{context}</pre>
            </details>
          </>
        )}

        {error && <p className="json-err">{error}</p>}

        {draft && (
          <div className="ai-result">
            {big === null ? (
              <div className="ai-pages">
                {draft.doc.pages.map((p, i) => (
                  <button key={i} type="button" className={'ai-thumb' + (madeAt.includes(i) ? ' is-new' : '')} onClick={() => setBig(i)} title="Größer zeigen">
                    <CompetenceNamesContext.Provider value={names}>
                      <SheetModeContext.Provider value={SHOWN}>
                        <PagePreview doc={draft.doc} p={i} scale={THUMB} />
                      </SheetModeContext.Provider>
                    </CompetenceNamesContext.Provider>
                    <span>{madeAt.includes(i) ? 'Neu' : 'Bleibt'} · {isTeacherPage(p) ? 'Lehrkraft' : p.title}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="ai-big">
                <button type="button" className="btn btn-secondary ui-btn" onClick={() => setBig(null)}>
                  <Icon icon={X} /> Alle Seiten
                </button>
                <CompetenceNamesContext.Provider value={names}>
                  <SheetModeContext.Provider value={SHOWN}>
                    <PagePreview doc={draft.doc} p={big} scale={0.72} />
                  </SheetModeContext.Provider>
                </CompetenceNamesContext.Provider>
              </div>
            )}
            {draft.added.length > 0 && (
              <p className="ai-hint">
                <b>Neu im Kompetenzraster:</b> {draft.added.map((c) => c.area).join(' · ')}
              </p>
            )}
            {draft.notes.length > 0 && (
              <details className="ai-context">
                <summary>{draft.notes.length === 1 ? 'Ein Hinweis' : `${draft.notes.length} Hinweise`} beim Einlesen</summary>
                <ul>
                  {draft.notes.map((n, k) => (
                    <li key={k}>{n}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        {!draft && (
          <ChatPath request={() => prompt(true)} what="Er enthält die Stunde im Jahresplan und die Stunden davor und danach." pasted={pasted} onPaste={setPasted} onError={job.setError} />
        )}

        <div className="dialog-actions">
          {draft ? (
            <>
              <button type="button" className="btn btn-secondary ui-btn" onClick={() => setDraft(null)} style={{ marginRight: 'auto' }}>
                Zurück
              </button>
              <button type="button" className="btn btn-secondary ui-btn" onClick={close}>
                Verwerfen
              </button>
              <button type="button" className="btn btn-primary ui-btn" onClick={() => onApply(draft)}>
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
