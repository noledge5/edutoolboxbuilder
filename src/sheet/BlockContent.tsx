// Printed content of one block. Pure rendering: editor chrome (selection, drag, toolbar) lives in the editor.
import { useContext, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Frown, Lightbulb, Meh, Smile, Star } from 'lucide-react';
import { Icon, BLOCK_ICONS } from '../icons';
import { FLOW_COLORS } from '../model/themes';
import { cellRows, choices, flowSteps, lines, matchNumbers, num, rows, str } from '../model/text';
import type { Block, Variant } from '../model/types';
import { Editable } from './inlineEdit';
import { answerClass, GapText, ImageBox, Marked, qrCode, variantVars } from './parts';
import { SheetModeContext, type SolutionView } from './sheetMode';
import { CompetenceNamesContext } from './competences';
import { BLOCK_TYPES, HOOK_KINDS, LEVEL_NAMES } from '../model/blockTypes';
import type { BlockType } from '../model/types';
import { typo, useSheetDoc, useSheetLang, useSheetText } from './lang';
import { LanguageBlock, LanguageTaskBody } from './LanguageBlocks';

/** Block types drawn by LanguageBlocks.tsx. */
const LANGUAGE_BLOCKS = new Set<BlockType>([
  'vocab',
  'foldtest',
  'picvocab',
  'wordweb',
  'grammar',
  'forms',
  'jumble',
  'transform',
  'syntax',
  'listening',
  'reading',
  'truefalse',
  'phrases',
  'rolecards',
  'bingo',
  'writing',
  'mediation',
  'gradescale',
  'tipcards',
]);

interface BlockContentProps {
  block: Block;
  /** Task number, for blocks of the Aufgaben group. */
  taskNum: number | null;
  editing: boolean;
  /** Called with an image file picked or dropped onto an image block (editor only). */
  onImageFile?: (file: File) => void;
  /** Called with an image for one picture of a picture grid (editor only). */
  onPicFile?: (index: number, file: File) => void;
}

export function BlockContent({ block, taskNum, editing, onImageFile, onPicFile }: BlockContentProps) {
  const p = block.props;
  const t = (key: string) => `${block.id}:${key}`;
  const txt = useSheetText();
  const lang = useSheetLang();
  const doc = useSheetDoc();
  if (!BLOCK_TYPES[block.type].task && LANGUAGE_BLOCKS.has(block.type)) return <LanguageBlock block={block} target={t} editing={editing} />;
  switch (block.type) {
    case 'heading':
      return <Editable as="h3" className="ws-h3" target={t('text')} value={str(p.text)} />;
    case 'text':
      return (
        <Editable as="p" className="ws-text" target={t('text')} value={str(p.text)} multiline>
          <Marked text={typo(str(p.text), lang)} />
        </Editable>
      );
    case 'hint':
      return (
        <div className="ws-hint" style={variantVars(str(p.variant) as Variant)}>
          <div className="ws-hint-icon">
            <Icon icon={BLOCK_ICONS.hint} size={16} />
          </div>
          <div className="ws-hint-body">
            <Editable className="ws-hint-title" target={t('title')} value={str(p.title)} />
            <Editable target={t('text')} value={str(p.text)} multiline>
              <Marked text={typo(str(p.text), lang)} />
            </Editable>
          </div>
        </div>
      );
    case 'merksatz':
      return (
        <div className="ws-merksatz" style={variantVars(str(p.variant) as Variant)}>
          <div className="ws-merksatz-icon">
            <Icon icon={BLOCK_ICONS.merksatz} size={20} />
          </div>
          <div>
            <div className="ws-label">{txt.merksatz}</div>
            <Editable className="ws-merksatz-text" target={t('text')} value={str(p.text)} multiline>
              <GapText text={str(p.text)} blankClass="ws-blank-lg" />
            </Editable>
          </div>
        </div>
      );
    case 'wordbank':
      return (
        <div className="ws-wordbank">
          <span className="ws-label">{txt.wordbank}</span>
          {lines(p.words).map((w, k) => (
            <span key={k} className="ws-word">
              {typo(w, lang)}
            </span>
          ))}
        </div>
      );
    case 'image':
      return (
        <div className="ws-figure">
          <ImageBox id={str(p.image)} height={num(p.height, 200)} fit={str(p.fit) === 'contain' ? 'contain' : 'cover'} editing={editing} onImageFile={onImageFile} />
          <Editable className="ws-caption" target={t('caption')} value={str(p.caption)} />
          {str(p.source).trim() && (
            <div className="ws-source">
              {txt.imageSource}: {str(p.source)}
            </div>
          )}
        </div>
      );
    case 'qr':
      return <QrBlock url={str(p.url)} caption={str(p.caption)} editing={editing} captionTarget={t('caption')} />;
    case 'plan':
      return (
        <div className="ws-plan">
          <div className="ws-plan-row is-head">
            <div>Zeit</div>
            <div>Phase und Ablauf</div>
            <div>Sozialform</div>
            <div>Material</div>
          </div>
          {rows(p.rows).map(([time = '', phase = '', steps = '', form = '', material = ''], k) => (
            <div key={k} className="ws-plan-row">
              <div className="ws-plan-time">{time}</div>
              <div>
                <div className="ws-plan-phase">{phase}</div>
                {steps && <div className="ws-plan-steps">{steps}</div>}
              </div>
              <div>{form}</div>
              <div>{material}</div>
            </div>
          ))}
        </div>
      );
    case 'goal':
      return (
        <div className="ws-goal">
          <div className="ws-goal-box is-goal">
            <div className="ws-label">Ziel</div>
            <Editable as="p" className="ws-goal-text" target={t('goal')} value={str(p.goal)} multiline />
          </div>
          <div className="ws-goal-box">
            <div className="ws-label">Bildungsplan</div>
            <Editable as="p" className="ws-goal-text" target={t('curriculum')} value={str(p.curriculum)} multiline />
          </div>
        </div>
      );
    case 'hook': {
      const image = str(p.image);
      const vote = str(p.kind) === 'abstimmung';
      return (
        <div className="ws-hook">
          <div className="ws-hook-head">
            <span className="ws-label">Einstieg</span>
            <span className="ws-hook-kind">{HOOK_KINDS.find((k) => k.v === str(p.kind))?.l ?? 'Impuls'}</span>
          </div>
          <div className={'ws-hook-body' + (image || (editing && onImageFile) ? ' has-image' : '')}>
            {(image || (editing && onImageFile)) && <ImageBox id={image} height={96} fit="cover" editing={editing} onImageFile={onImageFile} />}
            <div className="ws-hook-text">
              <Editable as="p" className="ws-hook-impulse" target={t('impulse')} value={str(p.impulse)} multiline />
              {str(p.answer).trim() && (
                <p className="ws-hook-line">
                  <b>{vote ? 'Antworten' : 'Auflösung'}:</b> {str(p.answer)}
                </p>
              )}
              {str(p.url).trim() && (
                <p className="ws-hook-line">
                  <b>Video:</b> {str(p.url)}
                </p>
              )}
              {str(p.question).trim() && (
                <p className="ws-hook-line is-question">
                  <b>Leitfrage:</b> <Editable target={t('question')} value={str(p.question)} />
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }
    case 'expect':
      return (
        <div className="ws-expect">
          {rows(p.items).map(([verdict = '', quote = '', text = ''], k) => {
            const kind = /^fal/i.test(verdict) ? 'is-wrong' : /^vor/i.test(verdict) ? 'is-careful' : 'is-right';
            return (
              <div key={k} className="ws-expect-row">
                <span className={'ws-verdict ' + kind}>{verdict || 'Richtig'}</span>
                <div>
                  <div className="ws-expect-quote">{quote}</div>
                  {text && <div className="ws-expect-text">{text}</div>}
                </div>
              </div>
            );
          })}
        </div>
      );
    case 'recall':
      return <RecallBlock title={str(p.title)} items={rows(p.items)} always={str(p.answers) !== 'loesung'} titleTarget={t('title')} />;
    case 'selfcheck':
      return (
        <div className="ws-self">
          <div className="ws-self-row is-head">
            <Editable className="ws-self-title" target={t('title')} value={str(p.title)} />
            {[Smile, Meh, Frown].map((I, k) => (
              <span key={k} className="ws-self-mark">
                <Icon icon={I} size={17} />
              </span>
            ))}
          </div>
          {lines(p.items).map((item, k) => (
            <div key={k} className="ws-self-row">
              <span className="ws-self-text">{item}</span>
              {[0, 1, 2].map((j) => (
                <span key={j} className="ws-self-mark">
                  <span className="ws-check" />
                </span>
              ))}
            </div>
          ))}
        </div>
      );
    case 'flow': {
      const steps = flowSteps(p.steps);
      return (
        <div className="ws-flow">
          {steps.map((s, k) => {
            const [bg, fg] = FLOW_COLORS[k % FLOW_COLORS.length];
            return [
              <div key={'s' + k} className="ws-flow-step" style={{ background: bg }}>
                <div className="ws-flow-title">{s.title}</div>
                {s.sub && (
                  <div className="ws-flow-sub" style={{ color: fg }}>
                    {s.sub}
                  </div>
                )}
              </div>,
              k < steps.length - 1 && (
                <div key={'a' + k} className="ws-flow-arrow">
                  →
                </div>
              ),
            ];
          })}
        </div>
      );
    }
    default: {
      const level = num(p.level, 0);
      const points = num(p.points, 0);
      const langPoints = num(p.langPoints, 0);
      const help = str(p.help).trim();
      return (
        <div className="ws-task">
          <div className="ws-num">
            {taskNum}
            {str(p.tip).trim() && (
              <span className="ws-tip-badge" title="Dazu gibt es eine Tippkarte">
                <Icon icon={Lightbulb} size={10} />
              </span>
            )}
          </div>
          <div className="ws-task-main">
            <div className="ws-task-head">
              {level > 0 && (
                <span className="ws-level" aria-label={`Niveau ${level} von 3`}>
                  {[1, 2, 3].map((k) => (
                    <Star key={k} size={13} strokeWidth={2.5} fill={k <= level ? 'currentColor' : 'none'} className={k <= level ? '' : 'is-off'} aria-hidden="true" />
                  ))}
                </span>
              )}
              <Editable className="ws-prompt" target={t('prompt')} value={str(p.prompt)} multiline />
              {points > 0 && langPoints === 0 && (
                <span className="ws-points">
                  <span className="ws-points-blank" />/ {points} {txt.points}
                </span>
              )}
              {langPoints > 0 && (
                <span className="ws-points is-split">
                  <span>
                    {txt.content} <span className="ws-points-blank" />/ {points}
                  </span>
                  <span>
                    {txt.language} <span className="ws-points-blank" />/ {langPoints}
                  </span>
                </span>
              )}
            </div>
            {help && doc?.help !== false && (
              <div className="ws-help" lang="de">
                {typo(help, 'de')}
              </div>
            )}
            {LANGUAGE_BLOCKS.has(block.type) ? <LanguageTaskBody block={block} target={t} editing={editing} onPicFile={onPicFile} /> : <TaskBody block={block} target={t} />}
            <CompetenceTag id={str(p.competence)} level={str(p.level)} />
          </div>
        </div>
      );
    }
  }
}

function TaskBody({ block, target }: { block: Block; target(key: string): string }) {
  const p = block.props;
  const { solutions } = useContext(SheetModeContext);
  const answers = solutions !== 'hidden';
  switch (block.type) {
    case 'open':
      return (
        <div className="ws-lines">
          {Array.from({ length: Math.min(20, Math.max(0, num(p.lines, 3))) }, (_, k) => (
            <div key={k} />
          ))}
          {answers && str(p.solution).trim() && <div className={'ws-lines-answer' + answerClass(solutions)}>{str(p.solution)}</div>}
        </div>
      );
    case 'mc':
      return (
        <div className="ws-options">
          {choices(p.options).map((o, k) => (
            <div key={k} className="ws-option">
              <span className={'ws-check' + (answers && o.correct ? ' is-correct' + answerClass(solutions) : '')} />
              {o.text}
            </div>
          ))}
        </div>
      );
    case 'gap':
      return (
        <Editable className="ws-gap" target={target('text')} value={str(p.text)} multiline>
          <GapText text={str(p.text)} blankClass="ws-blank" />
        </Editable>
      );
    case 'table': {
      const cols = lines(p.cols);
      const sol = answers ? cellRows(p.solution) : [];
      const template = { gridTemplateColumns: cols.length > 1 ? `1.2fr repeat(${cols.length - 1}, minmax(0,1fr))` : '1fr' };
      return (
        <div className="ws-table">
          {cols.length > 0 && (
            <div className="ws-table-head" style={template}>
              {cols.map((c, k) => (
                <div key={k}>{c}</div>
              ))}
            </div>
          )}
          {lines(p.rows).map((r, k) => (
            <div key={k} className="ws-table-row" style={template}>
              <div className="ws-table-label">{r}</div>
              {cols.slice(1).map((_, j) => (
                <div key={j} className="ws-table-cell">
                  {sol[k]?.[j] && <span className={'ws-answer' + answerClass(solutions)}>{sol[k][j]}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }
    case 'match':
      return <MatchBody left={lines(p.left)} right={lines(p.right)} solution={answers ? matchNumbers(p.solution) : []} view={solutions} />;
    case 'draw':
      return <div className={'ws-draw is-' + (str(p.pattern) || 'leer')} style={{ height: num(p.height, 160) }} />;
    default:
      return null;
  }
}

/** Matching task; on the solution sheet lines connect each right-hand item with its left-hand partner. */
function MatchBody({ left: L, right: R, solution, view }: { left: string[]; right: string[]; solution: number[]; view: SolutionView }) {
  const box = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState<string[]>([]);
  const key = L.join('\n') + '|' + R.join('\n') + '|' + solution.join();
  // Offsets are in page coordinates, so the lines stay right at any zoom.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el || solution.length === 0) return setPaths([]);
    const dots = (side: string) => Array.from(el.querySelectorAll<HTMLElement>(`[data-dot="${side}"]`));
    const lefts = dots('l');
    const rights = dots('r');
    const center = (d: HTMLElement) => {
      let x = d.offsetWidth / 2;
      let y = d.offsetHeight / 2;
      for (let n: HTMLElement | null = d; n && n !== el; n = n.offsetParent as HTMLElement | null) {
        x += n.offsetLeft;
        y += n.offsetTop;
      }
      return { x, y };
    };
    const out: string[] = [];
    solution.forEach((leftNo, r) => {
      const a = lefts[leftNo - 1];
      const b = rights[r];
      if (!a || !b) return;
      const p1 = center(a);
      const p2 = center(b);
      out.push(`M${p1.x} ${p1.y}L${p2.x} ${p2.y}`);
    });
    setPaths(out);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="ws-match" ref={box}>
      {Array.from({ length: Math.max(L.length, R.length) }, (_, k) => (
        <div key={k} className="ws-match-row">
          {L[k] ? (
            <div className="ws-match-item">
              <span>{L[k]}</span>
              <span className="ws-dot" data-dot="l" />
            </div>
          ) : (
            <div />
          )}
          <div />
          {R[k] ? (
            <div className="ws-match-item is-right">
              <span className="ws-dot" data-dot="r" />
              <span>{R[k]}</span>
            </div>
          ) : (
            <div />
          )}
        </div>
      ))}
      {paths.length > 0 && (
        <svg className={'ws-match-lines' + answerClass(view)} aria-hidden="true">
          {paths.map((d, k) => (
            <path key={k} d={d} />
          ))}
        </svg>
      )}
    </div>
  );
}

/** Which competence (and level) a task practises: on the solution sheet, and faintly while editing. */
function CompetenceTag({ id, level }: { id: string; level: string }) {
  const names = useContext(CompetenceNamesContext);
  const { solutions } = useContext(SheetModeContext);
  const name = id && names.get(id);
  if (!name || solutions === 'hidden') return null;
  return (
    <div className={'ws-comp-tag' + answerClass(solutions)}>
      Kompetenz: {name}
      {LEVEL_NAMES[level] ? ` · Niveau ${LEVEL_NAMES[level]}` : ''}
    </div>
  );
}

/** Retrieval questions; answers always (teacher page) or only on the solution sheet (student page). */
function RecallBlock({ title, items, always, titleTarget }: { title: string; items: string[][]; always: boolean; titleTarget: string }) {
  const { solutions } = useContext(SheetModeContext);
  const view: SolutionView = always ? 'shown' : solutions;
  return (
    <div className="ws-recall">
      <Editable className="ws-label ws-recall-title" target={titleTarget} value={title} />
      {items.map(([q = '', a = ''], k) => (
        <div key={k} className="ws-recall-row">
          <span className="ws-recall-num">{k + 1}</span>
          <span>
            {q}
            {a && view !== 'hidden' && <span className={'ws-recall-answer' + answerClass(view)}> ({a})</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

function QrBlock({ url, caption, editing, captionTarget }: { url: string; caption: string; editing: boolean; captionTarget: string }) {
  const link = url.trim();
  const qr = useMemo(() => qrCode(link), [link]);
  return (
    <div className="ws-qr">
      <div className="ws-qr-code">
        {qr && qr !== 'error' ? (
          <svg viewBox={`0 0 ${qr.size} ${qr.size}`} shapeRendering="crispEdges" role="img" aria-label={`QR-Code: ${link}`}>
            <path d={qr.d} fill="currentColor" />
          </svg>
        ) : (
          editing && (
            <span className="ws-qr-empty" data-noprint="1">
              {qr === 'error' ? 'Link zu lang' : 'Link im Panel eintragen'}
            </span>
          )
        )}
      </div>
      <div className="ws-qr-text">
        <Editable className="ws-qr-caption" target={captionTarget} value={caption} />
        {qr && qr !== 'error' && <div className="ws-qr-url">{link.replace(/^https?:\/\//, '')}</div>}
      </div>
    </div>
  );
}
