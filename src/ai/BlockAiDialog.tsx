// A helper at a block: Claude rewrites it, makes a level version or adds the solution and a tip. Before and after
// side by side; the change is applied in one undo step (a level version goes in after the block, or replaces it).
import { useEffect, useMemo, useState } from 'react';
import { Check, ClipboardPaste, KeyRound, RotateCcw, Sparkles } from 'lucide-react';
import { Icon } from '../icons';
import { BLOCK_TYPES } from '../model/blockTypes';
import type { Block, Doc } from '../model/types';
import { BlockContent } from '../sheet/BlockContent';
import { SheetDocContext } from '../sheet/lang';
import { SheetModeContext, type SheetMode } from '../sheet/sheetMode';
import { themeVars } from '../sheet/SheetPage';
import { THEMES } from '../model/themes';
import { AiSettingsDialog } from './AiSettingsDialog';
import { blockFromAnswer, helperPrompt, helperSystem, HELPERS, isLevelHelper, type BlockContext, type HelperKind } from './helpers';
import { AiBusy, ChatPath, useAiJob } from './parts';
import { dollars } from './prices';
import { modelLabel } from './settings';
import { useAiSettings } from './useAi';

interface BlockAiDialogProps {
  block: Block;
  doc: Doc;
  kind: HelperKind;
  context: BlockContext;
  /** `insert`: the new block goes after the old one (level versions); else the block is replaced. */
  onApply(next: Block, insert: boolean): void;
  onClose(): void;
}

const SHOWN: SheetMode = { solutions: 'shown', bw: false };

/** One block as on the sheet, at half size. */
export function BlockPreview({ block, doc }: { block: Block; doc: Doc }) {
  return (
    <SheetDocContext.Provider value={doc}>
      <SheetModeContext.Provider value={SHOWN}>
        <div className="ws-page ai-block-page" style={themeVars(THEMES.uebung)} lang={doc.lang}>
          <div className="ws-body">
            <div className="ed-block" style={{ gridColumn: 'span 12' }}>
              <BlockContent block={block} taskNum={BLOCK_TYPES[block.type].task ? 1 : null} editing={false} />
            </div>
          </div>
        </div>
      </SheetModeContext.Provider>
    </SheetDocContext.Provider>
  );
}

export function BlockAiDialog({ block, doc, kind, context, onApply, onClose }: BlockAiDialogProps) {
  const settings = useAiSettings();
  const job = useAiJob();
  const { busy, error, answer } = job;
  const [next, setNext] = useState<Block | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [pasted, setPasted] = useState('');
  const [keyOpen, setKeyOpen] = useState(false);
  const helper = HELPERS.find((h) => h.v === kind)!;
  const prompt = useMemo(() => helperPrompt(kind, block, context), [kind, block, context]);
  const read = (raw: unknown) => setNext(blockFromAnswer(raw, block, kind));
  const run = () => {
    setNext(null);
    return job.run({ job: 'small', what: helper.what, system: helperSystem(), user: prompt, maxTokens: 8000, effort: 'low' }, read);
  };

  // With a key, Claude starts at once.
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (settings && !started) {
      setStarted(true);
      run();
    }
  });

  const close = () => {
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
      <div className="dialog-backdrop" onClick={() => !busy && close()}>
        <div className="dialog ai-dialog ai-block-dialog" role="dialog" aria-modal="true" aria-label="Baustein mit Claude" onClick={(e) => e.stopPropagation()}>
          <div className="dialog-title">
            <Icon icon={Sparkles} /> {BLOCK_TYPES[block.type].label}: {isLevelHelper(kind) ? `Fassung für Niveau ${kind}` : helper.what.replace('Umformulieren: ', 'Umformulieren, ')}
          </div>
          <div className="ai-compare">
            <div>
              <div className="panel-section-label">Vorher</div>
              <BlockPreview block={block} doc={doc} />
            </div>
            <div>
              <div className="panel-section-label">{isLevelHelper(kind) ? 'Neue Fassung' : 'Nachher'}</div>
              {next ? (
                <BlockPreview block={next} doc={doc} />
              ) : busy ? (
                <AiBusy busy={busy} hint="Das dauert meist zehn bis zwanzig Sekunden." onStop={job.stop} />
              ) : !settings && !chatOpen ? (
                <p className="ai-hint">Für die Helfer braucht Claude einen KI-Schlüssel auf diesem Gerät. Ohne Schlüssel geht es über den Chat.</p>
              ) : null}
              {!next && chatOpen && (
                <ChatPath request={() => `${helperSystem()}\n\n${prompt}`} what="Er enthält den Baustein und seine Felder." pasted={pasted} onPaste={setPasted} onError={job.setError} />
              )}
            </div>
          </div>
          {error && <p className="json-err">{error}</p>}
          {next && answer && (
            <p className="ai-cost">
              Kosten etwa {dollars(answer.usd)} · {modelLabel(answer.model)}
              {settings ? ` · diesen Monat ${dollars(settings.spent)}` : ''}
            </p>
          )}
          <div className="dialog-actions">
            {!settings && !next && !chatOpen && (
              <>
                <button type="button" className="btn btn-secondary ui-btn" onClick={() => setChatOpen(true)} style={{ marginRight: 'auto' }}>
                  Über den Chat
                </button>
                <button type="button" className="btn btn-secondary ui-btn" onClick={() => setKeyOpen(true)}>
                  <Icon icon={KeyRound} />
                  Schlüssel einrichten …
                </button>
              </>
            )}
            {settings && !busy && (next || error) && (
              <button type="button" className="btn btn-secondary ui-btn" onClick={run} style={{ marginRight: 'auto' }}>
                <Icon icon={RotateCcw} />
                Noch einmal
              </button>
            )}
            <button type="button" className="btn btn-secondary ui-btn" onClick={close}>
              {next ? 'Verwerfen' : 'Abbrechen'}
            </button>
            {!next && chatOpen && (
              <button type="button" className="btn btn-primary ui-btn" onClick={() => job.paste(pasted, read)} disabled={!pasted.trim()}>
                <Icon icon={ClipboardPaste} />
                Antwort einlesen
              </button>
            )}
            {next && isLevelHelper(kind) && (
              <button type="button" className="btn btn-secondary ui-btn" onClick={() => onApply({ ...next, id: block.id }, false)}>
                Ersetzen
              </button>
            )}
            {next && (
              <button type="button" className="btn btn-primary ui-btn" onClick={() => onApply(next, isLevelHelper(kind))}>
                <Icon icon={Check} />
                {isLevelHelper(kind) ? 'Dahinter einfügen' : 'Übernehmen'}
              </button>
            )}
          </div>
        </div>
      </div>
      {keyOpen && <AiSettingsDialog onClose={() => setKeyOpen(false)} />}
    </>
  );
}
