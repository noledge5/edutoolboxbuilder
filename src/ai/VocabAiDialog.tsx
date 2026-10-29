// "Vokabelliste mit Claude": the new words of a lesson's or a unit's worksheets in word fields, with a picture where
// one suits. Shown as a list to untick first; then the Vocabulary page(s) are made.
import { useEffect, useMemo, useState } from 'react';
import { BookA, Check, ClipboardPaste, Image as ImageIcon } from 'lucide-react';
import { Icon } from '../icons';
import type { Lang, Page } from '../model/types';
import { ChatPath, useAiJob } from './parts';
import { draftWords, vocabFromAnswer, vocabPages, vocabPrompt, vocabSystem, type VocabDraft, type VocabSource } from './vocab';

interface VocabAiDialogProps {
  scope: 'lesson' | 'module';
  grade: number;
  topic: string;
  lang: Lang;
  /** Line above the page title: "Class 5 · Unit 2". */
  kicker: string;
  sources: VocabSource[];
  /** English words the class already has in vocabulary lists. */
  known: string[];
  onApply(pages: Page[]): void;
  onClose(): void;
}

export function VocabAiDialog(p: VocabAiDialogProps) {
  const job = useAiJob();
  const { error } = job;
  const [wishes, setWishes] = useState('');
  const [draft, setDraft] = useState<VocabDraft | null>(null);
  /** Words left out ("field index:word index"). */
  const [off, setOff] = useState<Set<string>>(new Set());
  const [pasted, setPasted] = useState('');

  const request = useMemo(() => ({ grade: p.grade, topic: p.topic, scope: p.scope, sources: p.sources, known: p.known, wishes }), [p, wishes]);
  const read = (raw: unknown) => {
    setDraft(vocabFromAnswer(raw, p.known, p.topic));
    setOff(new Set());
  };
  const close = () => {
    p.onClose();
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const chosen: VocabDraft | null = draft && { ...draft, fields: draft.fields.map((f, i) => ({ ...f, words: f.words.filter((_, k) => !off.has(`${i}:${k}`)) })) };
  const toggle = (key: string) => setOff((s) => (s.has(key) ? new Set([...s].filter((x) => x !== key)) : new Set([...s, key])));
  const textLength = p.sources.reduce((n, s) => n + s.doc.pages.filter((pg) => pg.type !== 'lehrkraft').reduce((m, pg) => m + pg.blocks.length, 0), 0);

  return (
    <>
      <div className="dialog-backdrop" onClick={() => !draft && close()}>
        <div className="dialog ai-dialog" role="dialog" aria-modal="true" aria-label="Mit KI bauen: Vokabelliste" onClick={(e) => e.stopPropagation()}>
          <div className="dialog-title">
            <Icon icon={BookA} /> Mit KI bauen: Vokabelliste
          </div>
          <p className="dialog-body ai-where">
            {p.scope === 'lesson' ? 'Aus den Arbeitsblättern dieser Stunde' : `Aus allen Stunden der Unit (${p.sources.length})`} · {p.topic}
          </p>

          {!draft && (
            <>
              <p className="ai-hint">
                Die KI sucht die Wörter heraus, die für Klasse {p.grade} neu sind ({p.known.length ? `${p.known.length} Wörter aus euren Vokabellisten bleiben draußen` : 'noch keine Vokabellisten im Jahrgang'}), ordnet sie in Wortfelder, schreibt Lautschrift, Bedeutung und Beispielsatz und
                markiert, wo ein Bild passt. Daraus entsteht {p.scope === 'lesson' ? 'eine Seite „Vocabulary“ am Ende der Stunde' : 'eine eigene Stunde „Vocabulary“'}: je Wortfeld eine Liste mit Bildspalte und ein Wortnetz.
              </p>
              {textLength === 0 && <p className="ai-hint is-warn">Auf den Arbeitsblättern steht noch nichts. Die KI braucht ausgearbeitete Seiten.</p>}
              <div className="field">
                <label htmlFor="ai-vocab-wishes">Wünsche (freiwillig)</label>
                <input id="ai-vocab-wishes" className="input" value={wishes} placeholder="z. B. höchstens 20 Wörter, auch Wendungen aus dem Dialog, ohne Lautschrift" onChange={(e) => setWishes(e.target.value)} />
              </div>
            </>
          )}

          {error && <p className="json-err">{error}</p>}

          {draft && chosen && (
            <div className="ai-result">
              <p className="ai-hint">
                {draftWords(chosen)} von {draftWords(draft)} Wörtern in {chosen.fields.filter((f) => f.words.length).length} Wortfeldern. Tippe ein Wort an, um es wegzulassen.
              </p>
              <div className="ai-vocab">
                {draft.fields.map((f, i) => (
                  <section key={i} className="ai-vocab-field">
                    <b>{f.name}</b>
                    <ul>
                      {f.words.map((w, k) => {
                        const key = `${i}:${k}`;
                        const on = !off.has(key);
                        return (
                          <li key={k}>
                            <button type="button" className={'ai-vocab-word' + (on ? ' is-on' : '')} aria-pressed={on} onClick={() => toggle(key)}>
                              <span className="ai-vocab-check">{on && <Icon icon={Check} size={12} />}</span>
                              <span className="ai-vocab-en">{w.en}</span>
                              <span className="ai-vocab-de">{w.de}</span>
                              {w.picture && <Icon icon={ImageIcon} size={14} />}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
              <p className="sync-tip">
                Das Bildsymbol heißt: Das Wort bekommt ein Bildfeld. Bilder setzt du danach im Panel der Liste ein („Bilder zu den Wörtern“ → Suche) oder druckst das Feld leer zum Malen und Einkleben.
              </p>
            </div>
          )}

          {!draft && <ChatPath request={() => `${vocabSystem()}\n\n${vocabPrompt(request)}`} what="Er enthält die Texte der Arbeitsblätter und die schon gelernten Wörter." pasted={pasted} onPaste={setPasted} onError={job.setError} />}

          <div className="dialog-actions">
            {draft && chosen ? (
              <>
                <button type="button" className="btn btn-secondary ui-btn" onClick={() => setDraft(null)} style={{ marginRight: 'auto' }}>
                  Zurück
                </button>
                <button type="button" className="btn btn-secondary ui-btn" onClick={close}>
                  Verwerfen
                </button>
                <button type="button" className="btn btn-primary ui-btn" disabled={!draftWords(chosen)} onClick={() => p.onApply(vocabPages(chosen, { lang: p.lang, kicker: p.kicker }))}>
                  <Icon icon={Check} />
                  {p.scope === 'lesson' ? 'Seite anlegen' : 'Stunde anlegen'}
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
