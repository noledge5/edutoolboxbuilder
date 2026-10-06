// "PDF einpflegen": a worksheet from elsewhere (colleagues, publishers, old own sheets) becomes Baukasten pages.
// The PDF is read here; Claude gets its pages as pictures and writes the blocks, the figures are cut out of the PDF.
// The result is shown before it goes into the worksheet (appended, or in place of an empty or replaced sheet).
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ClipboardCopy, ClipboardPaste, FileText, KeyRound, Sparkles, X } from 'lucide-react';
import { Icon } from '../icons';
import type { Competence } from '../library/types';
import type { Doc } from '../model/types';
import { CompetenceNamesContext } from '../sheet/competences';
import { SheetModeContext, type SheetMode } from '../sheet/sheetMode';
import { dataUrlToBlob } from '../storage/backup';
import { putImageAs } from '../storage/db';
import { cropFigure, MAX_PAGES, readPdf, type PdfRead } from '../storage/pdf';
import { AiSettingsDialog } from './AiSettingsDialog';
import { ClassNotesLine } from './ClassNotesDialog';
import { isTeacherPage, lessonFromAnswer, lessonSystem } from './lesson';
import type { LessonAi } from './LessonAiDialog';
import { PagePreview } from './LessonAiDialog';
import { AiBusy, ChatPath, useAiJob } from './parts';
import { figuresOf, pdfPrompt, placePages, titleOf, withFigures } from './pdfImport';
import { dollars } from './prices';
import { modelLabel } from './settings';
import { useAiSettings } from './useAi';

export interface PdfResult {
  doc: Doc;
  /** Claude's title of the worksheet. */
  title: string;
  added: Competence[];
}

interface PdfImportDialogProps {
  file: File;
  doc: Doc;
  ai: LessonAi;
  onApply(r: PdfResult): void;
  onClose(): void;
}

const SHOWN: SheetMode = { solutions: 'shown', bw: false };
const THUMB = 0.3;
const hasBlocks = (d: Doc) => d.pages.some((p) => p.blocks.length > 0);

interface Draft extends PdfResult {
  newPages: number[];
  figures: number;
  notes: string[];
}

export function PdfImportDialog({ file, doc, ai, onApply, onClose }: PdfImportDialogProps) {
  const settings = useAiSettings();
  const job = useAiJob();
  const { busy, error, answer } = job;
  const [pdf, setPdf] = useState<PdfRead | null>(null);
  const [readError, setReadError] = useState('');
  const filled = hasBlocks(doc);
  const hasTeacher = doc.pages.some((p) => p.blocks.length > 0 && isTeacherPage(p));
  const [teacher, setTeacher] = useState(!hasTeacher);
  const [replace, setReplace] = useState(false);
  const [wishes, setWishes] = useState('');
  const [cutting, setCutting] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [big, setBig] = useState<number | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [pasted, setPasted] = useState('');
  const [keyOpen, setKeyOpen] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    readPdf(file).then(
      (r) => alive.current && setPdf(r),
      (e) => alive.current && setReadError(e instanceof Error ? e.message : String(e)),
    );
    return () => {
      alive.current = false;
    };
  }, [file]);
  useEffect(() => () => pdf?.close(), [pdf]);

  const summary = pdf && { fileName: file.name, pages: pdf.pages, candidates: pdf.candidates, pageCount: pdf.pageCount };
  const context = useMemo(() => ai.context(''), [ai]);
  const prompt = (chat: boolean) => (summary ? pdfPrompt(ai.module, summary, context, { teacher, wishes }, chat) : '');
  const scans = pdf?.pages.filter((p) => p.scan).length ?? 0;
  const names = useMemo(() => new Map([...ai.module.competences, ...(draft?.added ?? [])].map((c) => [c.id, c.area])), [ai.module.competences, draft]);

  /** Cuts out the figures, stores them, reads the lesson. */
  const read = (raw: unknown) => {
    if (!pdf) return;
    setCutting(true);
    void (async () => {
      try {
        const { cuts, notes } = figuresOf(raw, pdf.candidates, pdf.pages.length);
        const images: Record<string, string> = {};
        for (const [id, c] of Object.entries(cuts)) images[id] = await cropFigure(pdf.doc, c.page, c.box);
        const lessonDraft = lessonFromAnswer(withFigures(raw, images), ai.module, ai.lesson, doc, 'full');
        // Stored now, so the preview shows them; unused ones go with the next clean-up.
        await Promise.all(Object.entries(lessonDraft.images).map(([id, url]) => putImageAs(id, dataUrlToBlob(url))));
        const next = placePages(doc, lessonDraft.made, replace);
        if (!alive.current) return;
        setDraft({
          doc: next,
          title: titleOf(raw) || lessonDraft.made.find((p) => !isTeacherPage(p))?.title || '',
          added: lessonDraft.added,
          newPages: next.pages.map((p, i) => (lessonDraft.made.includes(p) ? i : -1)).filter((i) => i >= 0),
          figures: Object.keys(cuts).length,
          notes: [...notes, ...lessonDraft.notes],
        });
      } catch (e) {
        job.setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (alive.current) setCutting(false);
      }
    })();
  };
  const run = () => {
    if (!pdf) return;
    setDraft(null);
    return job.run(
      {
        job: 'big',
        what: 'PDF einpflegen',
        system: lessonSystem(),
        user: prompt(false),
        images: pdf.pages.map((p) => ({ type: 'image/jpeg', data: p.jpeg })),
        maxTokens: 48000,
        effort: 'medium',
      },
      read,
    );
  };
  const close = () => {
    if ((busy || cutting) && !window.confirm('Claude arbeitet noch. Abbrechen und schließen?')) return;
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
      <div className="dialog-backdrop" onClick={() => !busy && !cutting && !draft && close()}>
        <div className="dialog ai-dialog" role="dialog" aria-modal="true" aria-label="PDF einpflegen" onClick={(e) => e.stopPropagation()}>
          <div className="dialog-title">
            <Icon icon={FileText} /> PDF einpflegen
          </div>
          <p className="dialog-body ai-where">
            „{file.name}“ → Stunde {ai.lesson.number}: <b>{ai.lesson.title}</b> · Modul {ai.module.number}: {ai.module.title}
          </p>

          {!pdf && !readError && (
            <div className="ai-busy" role="status">
              <span className="ai-spinner" />
              <span>Das PDF wird gelesen …</span>
            </div>
          )}
          {readError && <p className="json-err">{readError}</p>}

          {pdf && !draft && !busy && !cutting && (
            <>
              <div className="pdf-pages">
                {pdf.pages.map((p, i) => (
                  <img key={i} src={`data:image/jpeg;base64,${p.jpeg}`} alt={`Seite ${i + 1}`} />
                ))}
              </div>
              <p className="ai-hint">
                {pdf.pageCount} {pdf.pageCount === 1 ? 'Seite' : 'Seiten'}
                {pdf.candidates.length > 0 && ` · ${pdf.candidates.length} ${pdf.candidates.length === 1 ? 'Bild' : 'Bilder'} im PDF erkannt (rot umrandet)`}
                {scans > 0 && ` · ${scans === pdf.pages.length ? 'gescannt' : `${scans} gescannt`}: Claude schneidet die Abbildungen nach Augenmaß aus`}
                . Claude überträgt das Blatt treu in Bausteine, trägt Lösungen ein (aus dem PDF, sonst selbst) und schneidet die Abbildungen aus dem PDF.
              </p>
              {pdf.pageCount > MAX_PAGES && <p className="ai-hint is-warn">Nur die ersten {MAX_PAGES} Seiten werden eingelesen. Teile längere PDFs auf.</p>}
              <label className="check-row">
                <input type="checkbox" checked={teacher} disabled={hasTeacher && !replace} onChange={(e) => setTeacher(e.target.checked)} />
                Seite „Für die Lehrkraft“ ergänzen (Ziel, Einstieg, Verlauf, Erwartungshorizont, Abruffragen)
              </label>
              {filled && (
                <div className="seg-pills" role="radiogroup" aria-label="Wohin">
                  <button type="button" role="radio" aria-checked={!replace} className={'seg-pill' + (!replace ? ' is-on' : '')} onClick={() => setReplace(false)}>
                    Hinten anhängen
                  </button>
                  <button type="button" role="radio" aria-checked={replace} className={'seg-pill' + (replace ? ' is-on' : '')} onClick={() => (setReplace(true), setTeacher(true))}>
                    Blatt ersetzen
                  </button>
                </div>
              )}
              <div className="field">
                <label htmlFor="pdf-wishes">Hinweise für Claude (freiwillig)</label>
                <input id="pdf-wishes" className="input" value={wishes} placeholder="z. B. Seite 3 ist das Lösungsblatt; Aufgabe 5 weglassen" onChange={(e) => setWishes(e.target.value)} />
              </div>
              <ClassNotesLine subject={ai.module.subject} grade={ai.module.grade} />
            </>
          )}

          {busy && <AiBusy busy={busy} hint="Ein Blatt mit zwei, drei Seiten dauert meist ein bis drei Minuten." onStop={job.stop} />}
          {cutting && (
            <div className="ai-busy" role="status">
              <span className="ai-spinner" />
              <span>Die Abbildungen werden ausgeschnitten …</span>
            </div>
          )}
          {error && <p className="json-err">{error}</p>}

          {draft && (
            <div className="ai-result">
              {big === null ? (
                <div className="ai-pages">
                  {draft.doc.pages.map((p, i) => (
                    <button key={i} type="button" className={'ai-thumb' + (draft.newPages.includes(i) ? ' is-new' : '')} onClick={() => setBig(i)} title="Größer zeigen">
                      <CompetenceNamesContext.Provider value={names}>
                        <SheetModeContext.Provider value={SHOWN}>
                          <PagePreview doc={draft.doc} p={i} scale={THUMB} />
                        </SheetModeContext.Provider>
                      </CompetenceNamesContext.Provider>
                      <span>
                        {draft.newPages.includes(i) ? 'Neu' : 'Bleibt'} · {isTeacherPage(p) ? 'Lehrkraft' : p.title}
                      </span>
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
              <p className="ai-hint">
                Die Vorschau zeigt die Lösungsfassung. {draft.figures} {draft.figures === 1 ? 'Abbildung' : 'Abbildungen'} aus dem PDF übernommen; einen schiefen Ausschnitt ersetzt du danach im Panel der Abbildung („Bild wählen“).
                Prüfe die Lösungen, die Claude ergänzt hat.
              </p>
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

          {pdf && !draft && chatOpen && (
            <ChatPath
              request={() => prompt(true)}
              what="Häng im Chat zusätzlich das PDF an; der Auftrag nennt die Bilder, die der Baukasten darin gefunden hat."
              pasted={pasted}
              onPaste={setPasted}
              onError={job.setError}
            />
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
                  <button type="button" className="btn btn-secondary ui-btn" onClick={() => setChatOpen(true)} style={{ marginRight: 'auto' }} disabled={!pdf || !!busy || cutting}>
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
                  <button type="button" className="btn btn-primary ui-btn" onClick={() => job.paste(pasted, read)} disabled={!pasted.trim() || cutting}>
                    <Icon icon={ClipboardPaste} />
                    Antwort einlesen
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary ui-btn"
                    onClick={run}
                    disabled={!settings || !pdf || !!busy || cutting}
                    title={settings ? undefined : 'Erst einen KI-Schlüssel einrichten oder „Über den Chat“ nehmen'}
                  >
                    <Icon icon={Sparkles} />
                    Einpflegen
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
