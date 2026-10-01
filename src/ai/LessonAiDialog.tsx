// "Stunde mit Claude": the whole lesson, the scaffold (teacher page) first or the sheets to it, or a revision, with
// the lesson's place in the year plan. With a key on this device Claude answers right here; without one the request
// is copied for the Claude project and the answer pasted back. Either way the result is shown before it is applied.
import { useEffect, useMemo, useState } from 'react';
import { Check, ClipboardCopy, ClipboardPaste, KeyRound, Sparkles, X } from 'lucide-react';
import { SegField } from '../editor/fields';
import { Icon } from '../icons';
import type { Competence, Lesson, Module } from '../library/types';
import { sheetNumbers } from '../model/ops';
import type { Doc, Page } from '../model/types';
import { BlockContent } from '../sheet/BlockContent';
import { CompetenceNamesContext } from '../sheet/competences';
import { PAGE_H, PAGE_W, SheetPage, taskNumbers } from '../sheet/SheetPage';
import { SheetModeContext, type SheetMode } from '../sheet/sheetMode';
import { AiSettingsDialog } from './AiSettingsDialog';
import { isTeacherPage, LESSON_TOKENS, lessonFromAnswer, lessonPrompt, lessonSystem, type LessonDraft, type LessonMode } from './lesson';
import { dollars } from './prices';
import { modelLabel } from './settings';
import { AiBusy, ChatPath, useAiJob } from './parts';
import { useAiSettings } from './useAi';

/** What the editor knows about the lesson's place in the library. */
export interface LessonAi {
  module: Module;
  lesson: Lesson;
  /** The lesson in its year plan, for Claude (`lessonContext`). */
  context(wishes: string): string;
  /** Before Claude's lesson is applied: keep the lesson as it was, add new competences to the module. */
  onApplied(added: Competence[]): void;
}

interface LessonAiDialogProps {
  doc: Doc;
  ai: LessonAi;
  onApply(draft: LessonDraft): void;
  onClose(): void;
}

const MODES: { v: LessonMode; l: string }[] = [
  { v: 'full', l: 'Ganze Stunde' },
  { v: 'scaffold', l: 'Erst das Gerüst' },
  { v: 'sheets', l: 'Blätter zum Gerüst' },
  { v: 'revise', l: 'Überarbeiten' },
];

const MODE_TEXT: Record<LessonMode, string> = {
  full: 'Claude schreibt die Seite „Für die Lehrkraft“ (Ziel, Einstieg, Verlauf, Erwartungshorizont, Abruffragen) und ein bis drei Schülerseiten.',
  scaffold: 'Claude schreibt nur die Seite „Für die Lehrkraft“. Du schaust sie durch, änderst, was du anders willst, und lässt dann mit „Blätter zum Gerüst“ die Schülerseiten bauen.',
  sheets: 'Claude baut die Schülerseiten so, wie der Stundenverlauf auf deiner Lehrkraft-Seite sie vorsieht. Die Lehrkraft-Seite bleibt, wie sie ist.',
  revise: 'Claude bekommt die Stunde, wie sie jetzt ist, und ändert sie nach deinen Wünschen.',
};

const SHOWN: SheetMode = { solutions: 'shown', bw: false };
const THUMB = 0.3;

const hasBlocks = (p: Page) => p.blocks.length > 0;

/** A page as on the sheet, scaled down (read-only). */
function PagePreview({ doc, p, scale }: { doc: Doc; p: number; scale: number }) {
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

export function LessonAiDialog({ doc, ai, onApply, onClose }: LessonAiDialogProps) {
  const settings = useAiSettings();
  const filled = doc.pages.filter(hasBlocks);
  const hasTeacher = filled.some(isTeacherPage);
  const hasSheets = filled.some((p) => !isTeacherPage(p));
  const [mode, setMode] = useState<LessonMode>(hasTeacher && !hasSheets ? 'sheets' : 'full');
  const [wishes, setWishes] = useState('');
  const job = useAiJob();
  const [draft, setDraft] = useState<LessonDraft | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [pasted, setPasted] = useState('');
  const [keyOpen, setKeyOpen] = useState(false);
  const [big, setBig] = useState<number | null>(null);
  const { busy, error, answer } = job;

  const modes = MODES.filter((x) => (x.v === 'sheets' ? hasTeacher : x.v === 'revise' ? filled.length > 0 : true));
  const context = useMemo(() => ai.context(wishes), [ai, wishes]);
  const lessonNow = useMemo(() => ({ ...ai.lesson, doc }), [ai.lesson, doc]);
  const prompt = (chat: boolean) => lessonPrompt(ai.module, lessonNow, context, mode, chat);

  const close = () => {
    if (busy && !window.confirm('Claude arbeitet noch. Abbrechen und schließen?')) return;
    job.stop();
    onClose();
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || keyOpen) return;
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
  const run = () => {
    setDraft(null);
    return job.run(
      {
        job: 'big',
        what: mode === 'scaffold' ? 'Gerüst einer Stunde' : mode === 'sheets' ? 'Blätter zum Gerüst' : mode === 'revise' ? 'Stunde überarbeiten' : 'Stunde ausarbeiten',
        system: lessonSystem(),
        user: prompt(false),
        maxTokens: LESSON_TOKENS[mode],
        effort: mode === 'scaffold' ? 'medium' : 'high',
      },
      read,
    );
  };

  const names = useMemo(() => new Map([...ai.module.competences, ...(draft?.added ?? [])].map((c) => [c.id, c.area])), [ai.module.competences, draft]);
  const madeAt = draft ? draft.doc.pages.map((p, i) => (draft.made.includes(p) ? i : -1)).filter((i) => i >= 0) : [];

  return (
    <>
    <div className="dialog-backdrop" onClick={() => !busy && !draft && close()}>
      <div className="dialog ai-dialog" role="dialog" aria-modal="true" aria-label="Stunde mit Claude" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">
          <Icon icon={Sparkles} /> Stunde mit Claude
        </div>
        <p className="dialog-body ai-where">
          Stunde {ai.lesson.number}: <b>{ai.lesson.title}</b> · Modul {ai.module.number}: {ai.module.title}
        </p>

        {!draft && (
          <>
            <SegField<LessonMode> label="Was soll Claude tun?" value={mode} options={modes} onPick={(v) => (setMode(v), job.setError(''))} />
            <p className="ai-hint">{MODE_TEXT[mode]}</p>
            {(mode === 'full' || mode === 'revise') && filled.length > 0 && (
              <p className="ai-hint is-warn">Die jetzige Fassung wird ersetzt. Sie bleibt unter „Datei“ → „Frühere Fassungen“, und Rückgängig geht auch.</p>
            )}
            <div className="field">
              <label htmlFor="ai-wishes">{mode === 'revise' ? 'Was soll anders werden?' : 'Wünsche (freiwillig)'}</label>
              <textarea
                id="ai-wishes"
                className="input"
                rows={3}
                value={wishes}
                placeholder={mode === 'revise' ? 'z. B. Aufgabe 2 leichter, mehr Bilder, eine Partnerarbeit statt Einzelarbeit' : 'z. B. Einstieg mit einem Bild, eine Partnerarbeit, Lehrbuch S. 34–35, viel Differenzierung'}
                onChange={(e) => setWishes(e.target.value)}
              />
            </div>
            <details className="ai-context">
              <summary>Was Claude über die Stunde erfährt</summary>
              <pre>{context}</pre>
            </details>
          </>
        )}

        {busy && <AiBusy busy={busy} hint="Eine ganze Stunde dauert meist zwei bis vier Minuten." onStop={job.stop} />}
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
            {answer && (
              <p className="ai-cost">
                Kosten etwa {dollars(answer.usd)} · {modelLabel(answer.model)}
                {settings ? ` · diesen Monat ${dollars(settings.spent)}` : ''}
              </p>
            )}
          </div>
        )}

        {!draft && chatOpen && (
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
                  {mode === 'scaffold' ? 'Gerüst schreiben' : mode === 'sheets' ? 'Blätter bauen' : mode === 'revise' ? 'Überarbeiten' : 'Ausarbeiten'}
                </button>
              )}
            </>
          )}
        </div>
        {!draft && !chatOpen && settings === null && (
          <p className="sync-tip">Ohne eigenen KI-Schlüssel geht es über den Chat: Auftrag kopieren, im Claude-Projekt einfügen, Antwort hier einlesen.</p>
        )}
      </div>
    </div>
    {keyOpen && <AiSettingsDialog onClose={() => setKeyOpen(false)} />}
    </>
  );
}
