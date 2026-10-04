// Printed content of the language blocks (vocabulary, grammar, the four skills) and of the blocks that sum up
// the whole sheet (grade scale, tip cards). BlockContent hands these block types over to here.
import { useContext, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Headphones, Lightbulb, Scissors, Star } from 'lucide-react';
import { Icon } from '../icons';
import { docPoints, docTips, glossary, gradeRanges, jumble, pointText, statements, thresholds } from '../model/language';
import { lines, num, rows, str } from '../model/text';
import type { Block, Variant } from '../model/types';
import { Editable } from './inlineEdit';
import { typo, useSheetDoc, useSheetLang, useSheetText } from './lang';
import { answerClass, GapText, ImageBox, Marked, qrCode, variantProps } from './parts';
import { SheetModeContext } from './sheetMode';

/** Column colours of the sentence-building table (subject, verb, object, place, time …). */
const COLUMN_COLORS = ['accent-3', 'accent', 'accent-2', 'accent-4', 'accent-5', 'accent-6', 'accent-7'];
const columnVars = (k: number) => {
  const r = COLUMN_COLORS[k % COLUMN_COLORS.length];
  return { '--c-bg': `var(--color-${r}-100)`, '--c-head': `var(--color-${r}-200)`, '--c-fg': `var(--color-${r}-800)` } as CSSProperties;
};

/** Text of a cell: gaps (___, [[answer]]), highlights ({{s}}) and typographic quotes. */
const Cell = ({ text }: { text: string }) => <GapText text={text} blankClass="ws-blank" />;

/** A line to write on; on the solution sheet it carries the answer. */
function AnswerLine({ answer, className = '' }: { answer?: string; className?: string }) {
  const { solutions } = useContext(SheetModeContext);
  const lang = useSheetLang();
  return <div className={'ws-wline ' + className}>{answer && solutions !== 'hidden' && <span className={'ws-wline-answer' + answerClass(solutions)}>{typo(answer, lang)}</span>}</div>;
}

const withBrackets = (ipa: string) => (!ipa || /^[[/]/.test(ipa) ? ipa : `[${ipa}]`);

interface BlockProps {
  block: Block;
  target(key: string): string;
  editing: boolean;
  onPicFile?: (index: number, file: File) => void;
}

/** Blocks that are not tasks. */
export function LanguageBlock({ block, target: t, editing }: BlockProps): ReactNode {
  const p = block.props;
  switch (block.type) {
    case 'vocab':
      return <VocabList title={str(p.title)} titleTarget={t('title')} rows={rows(p.rows)} />;
    case 'grammar':
      return <GrammarBox block={block} target={t} />;
    case 'forms':
      return <FormsTable block={block} target={t} />;
    case 'listening':
      return <Listening block={block} target={t} editing={editing} />;
    case 'reading':
      return <Reading block={block} target={t} />;
    case 'phrases':
      return <Phrases block={block} target={t} />;
    case 'rolecards':
      return <RoleCards block={block} target={t} />;
    case 'gradescale':
      return <GradeScale half={str(p.half) !== 'nein'} percents={thresholds(str(p.thresholds))} />;
    case 'tipcards':
      return <TipCards cols={num(p.cols, 2)} editing={editing} />;
    default:
      return null;
  }
}

/** The body of language tasks (under the numbered instruction). */
export function LanguageTaskBody({ block, target: t, editing, onPicFile }: BlockProps): ReactNode {
  const p = block.props;
  switch (block.type) {
    case 'foldtest':
      return <FoldTest rows={rows(p.rows)} fold={str(p.mode) !== 'test'} />;
    case 'picvocab':
      return <PicVocab block={block} editing={editing} onPicFile={onPicFile} />;
    case 'wordweb':
      return <WordWeb center={str(p.center)} centerTarget={t('center')} branches={rows(p.branches)} height={num(p.height, 250)} />;
    case 'jumble':
      return <Jumbles items={lines(p.items)} />;
    case 'transform':
      return <Transforms items={rows(p.items)} />;
    case 'syntax':
      return <SyntaxTable cols={lines(p.cols)} rows={rows(p.rows)} />;
    case 'truefalse':
      return <TrueFalse items={statements(str(p.items))} withNg={str(p.mode) !== 'tf'} />;
    case 'bingo':
      return <Bingo items={lines(p.items)} cols={num(p.cols, 3)} find={str(p.mode) !== 'bingo'} />;
    case 'writing':
      return <WritingFrame starters={lines(p.starters)} lines={num(p.lines, 1)} checklist={lines(p.checklist)} />;
    case 'mediation':
      return <Mediation block={block} target={t} />;
    default:
      return null;
  }
}

// — Wortschatz —

function VocabList({ title, titleTarget, rows: data }: { title: string; titleTarget: string; rows: string[][] }) {
  const txt = useSheetText();
  const lang = useSheetLang();
  const hasIpa = data.some((r) => r[1]);
  const hasExample = data.some((r) => r[3]);
  const cols = [0, hasIpa ? 1 : -1, 2, hasExample ? 3 : -1].filter((c) => c >= 0);
  const widths: Record<number, string> = { 0: 'minmax(0, 1fr)', 1: 'minmax(0, 0.95fr)', 2: 'minmax(0, 1fr)', 3: 'minmax(0, 1.8fr)' };
  const template = { gridTemplateColumns: cols.map((c) => widths[c]).join(' ') };
  return (
    <div className="ws-vocab">
      <Editable className="ws-vocab-title" target={titleTarget} value={title} />
      <div className="ws-vocab-row is-head" style={template}>
        {cols.map((c) => (
          <div key={c}>{txt.vocabCols[c]}</div>
        ))}
      </div>
      {data.map((r, k) => (
        <div key={k} className="ws-vocab-row" style={template}>
          {cols.map((c) => (
            <div key={c} className={c === 0 ? 'ws-vocab-en' : c === 1 ? 'ws-ipa' : c === 3 ? 'ws-vocab-example' : ''}>
              {c === 1 ? withBrackets(r[1] ?? '') : <Marked text={typo(r[c] ?? '', lang)} />}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function FoldTest({ rows: data, fold }: { rows: string[][]; fold: boolean }) {
  const txt = useSheetText();
  const lang = useSheetLang();
  return (
    <div className={'ws-fold' + (fold ? ' is-knick' : '')}>
      {fold && (
        <div className="ws-fold-row is-head" aria-hidden="true">
          <div />
          <div />
          <div className="ws-fold-label">
            <Icon icon={Scissors} size={12} /> {txt.fold}
          </div>
        </div>
      )}
      {data.map(([given = '', answer = ''], k) => (
        <div key={k} className="ws-fold-row">
          <div className="ws-fold-given">{typo(given, lang)}</div>
          <AnswerLine answer={fold ? undefined : answer} />
          {fold && (
            <>
              <div className="ws-fold-line" />
              <div className="ws-fold-answer">{typo(answer, lang)}</div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function PicVocab({ block, editing, onPicFile }: { block: Block; editing: boolean; onPicFile?: (index: number, file: File) => void }) {
  const p = block.props;
  const items = rows(p.items);
  const pics = str(p.pics).split('\n');
  const cols = Math.min(6, Math.max(2, num(p.cols, 4)));
  const height = num(p.height, 90);
  return (
    <div className="ws-pics" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {items.map(([pic = '', word = ''], k) => {
        const id = pics[k]?.trim() ?? '';
        return (
          <div key={k} className="ws-pic">
            {id || !pic ? (
              <ImageBox id={id} height={height} fit="contain" editing={editing} onImageFile={onPicFile ? (f) => onPicFile(k, f) : undefined} />
            ) : (
              <div className="ws-pic-emoji" style={{ height, fontSize: Math.min(64, height * 0.62) }}>
                {pic}
              </div>
            )}
            <AnswerLine answer={word} />
          </div>
        );
      })}
    </div>
  );
}

function WordWeb({ center, centerTarget, branches, height }: { center: string; centerTarget: string; branches: string[][]; height: number }) {
  const n = branches.length;
  // Branches sit on an ellipse around the centre, starting at the top.
  const spots = branches.map((_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(1, n);
    return { x: 50 + 36 * Math.cos(a), y: 50 + 36 * Math.sin(a) };
  });
  return (
    <div className="ws-web" style={{ height }}>
      <svg className="ws-web-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {spots.map((s, i) => (
          <line key={i} x1="50" y1="50" x2={s.x} y2={s.y} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <Editable className="ws-web-center" target={centerTarget} value={center} />
      {branches.map(([label = '', words = ''], i) => (
        // Words go on the side away from the centre, so the connecting line does not run through them.
        <div key={i} className={'ws-web-branch' + (spots[i].y < 40 ? ' is-up' : '')} style={{ left: `${spots[i].x}%`, top: `${spots[i].y}%` }}>
          <div className="ws-web-label">
            <Cell text={label} />
          </div>
          {words
            .split(',')
            .map((w) => w.trim())
            .filter(Boolean)
            .map((w, k) => (
              <div key={k} className="ws-web-word">
                <Cell text={w} />
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}

// — Grammatik —

function GrammarBox({ block, target: t }: { block: Block; target(key: string): string }) {
  const p = block.props;
  const vr = variantProps(useSheetDoc()?.look, str(p.variant) as Variant);
  const txt = useSheetText();
  const lang = useSheetLang();
  const signal = str(p.signal)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const examples = lines(p.examples);
  return (
    <div className={"ws-grammar" + vr.className} style={vr.style}>
      <Editable className="ws-grammar-title" target={t('title')} value={str(p.title)} />
      {str(p.rule).trim() && (
        <div className="ws-grammar-part">
          <div className="ws-label">{txt.rule}</div>
          <Editable className="ws-grammar-rule" target={t('rule')} value={str(p.rule)} multiline>
            <Marked text={typo(str(p.rule), lang)} />
          </Editable>
        </div>
      )}
      {signal.length > 0 && (
        <div className="ws-grammar-part">
          <div className="ws-label">{txt.signal}</div>
          <div className="ws-grammar-signal">
            {signal.map((w, k) => (
              <span key={k} className="ws-word">
                {w}
              </span>
            ))}
          </div>
        </div>
      )}
      {examples.length > 0 && (
        <div className="ws-grammar-part">
          <div className="ws-label">{txt.examples}</div>
          <ul className="ws-grammar-examples">
            {examples.map((e, k) => (
              <li key={k}>
                <Marked text={typo(e, lang)} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function FormsTable({ block, target: t }: { block: Block; target(key: string): string }) {
  const p = block.props;
  const vr = variantProps(useSheetDoc()?.look, str(p.variant) as Variant);
  const cols = str(p.cols)
    .split('\n')
    .map((c) => c.trim());
  const data = rows(p.rows);
  const n = Math.max(cols.filter(Boolean).length, ...data.map((r) => r.length), 1);
  const template = { gridTemplateColumns: `minmax(0, 0.8fr) repeat(${n - 1}, minmax(0, 1fr))` };
  return (
    <div className={"ws-forms" + vr.className} style={vr.style}>
      <Editable className="ws-forms-title" target={t('title')} value={str(p.title)} />
      <div className="ws-forms-grid">
        {cols.some(Boolean) && (
          <div className="ws-forms-row is-head" style={template}>
            {Array.from({ length: n }, (_, k) => (
              <div key={k}>{cols[k] ?? ''}</div>
            ))}
          </div>
        )}
        {data.map((r, k) => (
          <div key={k} className="ws-forms-row" style={template}>
            {Array.from({ length: n }, (_, j) => (
              <div key={j} className={j === 0 ? 'ws-forms-person' : ''}>
                <Cell text={r[j] ?? ''} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Jumbles({ items }: { items: string[] }) {
  const lang = useSheetLang();
  return (
    <ol className="ws-jumbles">
      {items.map((line, k) => {
        const j = jumble(line);
        return (
          <li key={k} className="ws-jumble">
            <div className="ws-jumble-parts">
              {j.parts.map((part, i) => (
                <span key={i} className="ws-jumble-part">
                  {typo(part, lang)}
                </span>
              ))}
            </div>
            <AnswerLine answer={j.solution} />
          </li>
        );
      })}
    </ol>
  );
}

function Transforms({ items }: { items: string[][] }) {
  const lang = useSheetLang();
  return (
    <ol className="ws-transforms">
      {items.map(([from = '', to = '', answer = ''], k) => (
        <li key={k} className="ws-transform">
          <div className="ws-transform-from">
            <span>{typo(from, lang)}</span>
            {to && <span className="ws-transform-to">→ {to}</span>}
          </div>
          <AnswerLine answer={answer} />
        </li>
      ))}
    </ol>
  );
}

function SyntaxTable({ cols, rows: data }: { cols: string[]; rows: string[][] }) {
  const n = Math.max(cols.length, ...data.map((r) => r.length), 1);
  const template = { gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` };
  return (
    <div className="ws-syntax">
      <div className="ws-syntax-row is-head" style={template}>
        {Array.from({ length: n }, (_, k) => (
          <div key={k} style={columnVars(k)}>
            {cols[k] ?? ''}
          </div>
        ))}
      </div>
      {data.map((r, k) => (
        <div key={k} className="ws-syntax-row" style={template}>
          {Array.from({ length: n }, (_, j) => {
            const cell = r[j] ?? '';
            // An empty cell is a gap to write in.
            return (
              <div key={j} style={columnVars(j)}>
                {cell ? <Cell text={cell} /> : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// — Hören, Lesen, Sprechen, Schreiben —

function Listening({ block, target: t, editing }: { block: Block; target(key: string): string; editing: boolean }) {
  const p = block.props;
  const txt = useSheetText();
  const lang = useSheetLang();
  const { solutions } = useContext(SheetModeContext);
  const link = str(p.url).trim();
  const qr = useMemo(() => qrCode(link), [link]);
  const stage = txt.stages[str(p.stage)];
  const transcript = str(p.transcript).trim();
  return (
    <div className="ws-listen">
      <div className="ws-listen-main">
        <div className="ws-listen-icon">
          <Icon icon={Headphones} size={20} />
        </div>
        <div className="ws-listen-text">
          <div className="ws-listen-head">
            {stage && <span className="ws-listen-stage">{stage}</span>}
            {str(p.track).trim() && <span className="ws-listen-track">{str(p.track)}</span>}
          </div>
          <Editable className="ws-listen-note" target={t('note')} value={str(p.note)} multiline />
        </div>
        {qr && qr !== 'error' && (
          <svg className="ws-listen-qr" viewBox={`0 0 ${qr.size} ${qr.size}`} shapeRendering="crispEdges" role="img" aria-label={`QR-Code: ${link}`}>
            <path d={qr.d} fill="currentColor" />
          </svg>
        )}
        {qr === 'error' && editing && (
          <span className="ws-qr-empty" data-noprint="1">
            Link zu lang
          </span>
        )}
      </div>
      {transcript && solutions !== 'hidden' && (
        <div className={'ws-listen-transcript' + answerClass(solutions)}>
          <div className="ws-label">{txt.transcript}</div>
          {typo(transcript, lang)}
        </div>
      )}
    </div>
  );
}

function Reading({ block, target: t }: { block: Block; target(key: string): string }) {
  const p = block.props;
  const txt = useSheetText();
  const lang = useSheetLang();
  const text = str(p.text);
  const every = Math.max(0, num(p.numbers, 5));
  const gloss = glossary(str(p.glossary));
  const box = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<{ count: number; lineHeight: number; wordLines: (number | null)[] }>({ count: 0, lineHeight: 0, wordLines: [] });
  const key = text + '|' + gloss.map((g) => g[0]).join('|');
  // Line numbers and the lines of glossary words come from the laid-out text, so they are right at any width.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20;
      const count = Math.round(el.offsetHeight / lineHeight);
      const rect = el.getBoundingClientRect();
      const scale = el.offsetHeight ? rect.height / el.offsetHeight : 1;
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n as Text);
      const wordLines = gloss.map(([word]) => {
        const re = new RegExp(`(^|[^\\p{L}])(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'iu');
        for (const node of nodes) {
          const m = re.exec(node.data);
          if (!m) continue;
          const range = document.createRange();
          range.setStart(node, m.index + m[1].length);
          range.setEnd(node, m.index + m[1].length + m[2].length);
          const r = range.getClientRects()[0];
          if (r) return Math.floor((r.top - rect.top) / scale / lineHeight + 0.2) + 1;
        }
        return null;
      });
      setLayout((old) => (old.count === count && old.lineHeight === lineHeight && old.wordLines.join() === wordLines.join() ? old : { count, lineHeight, wordLines }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  // A few numbers more than measured: the column is cut off at the text's height, so a print that wraps
  // one line more or less still shows the right numbers.
  const numbers = every > 0 && layout.lineHeight ? Array.from({ length: Math.floor((layout.count + 3) / every) }, (_, k) => (k + 1) * every) : [];
  return (
    <div className="ws-reading">
      <Editable as="h3" className="ws-h3 ws-reading-title" target={t('title')} value={str(p.title)} />
      <div className="ws-reading-body">
        <div className="ws-reading-numbers" aria-hidden="true">
          {numbers.map((n) => (
            <span key={n} style={{ top: (n - 1) * layout.lineHeight }}>
              {n}
            </span>
          ))}
        </div>
        <div ref={box} className="ws-reading-text">
          <Editable target={t('text')} value={text} multiline>
            <Marked text={typo(text, lang)} />
          </Editable>
        </div>
      </div>
      {gloss.length > 0 && (
        <div className="ws-reading-gloss">
          {gloss.map(([word, meaning = ''], k) => (
            <span key={k} className="ws-gloss">
              {layout.wordLines[k] && (
                <span className="ws-gloss-line">
                  {txt.line} {layout.wordLines[k]}
                </span>
              )}
              <b>{word}</b> {typo(meaning, lang)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function TrueFalse({ items, withNg }: { items: ReturnType<typeof statements>; withNg: boolean }) {
  const txt = useSheetText();
  const lang = useSheetLang();
  const { solutions } = useContext(SheetModeContext);
  const keys = withNg ? (['T', 'F', 'NG'] as const) : (['T', 'F'] as const);
  const template = { gridTemplateColumns: `minmax(0, 1fr) repeat(${keys.length}, ${withNg ? 64 : 58}px)` };
  return (
    <div className="ws-tf">
      <div className="ws-tf-row is-head" style={template}>
        <div />
        {keys.map((k, i) => (
          <div key={k}>{txt.tf[i]}</div>
        ))}
      </div>
      {items.map((s, k) => (
        <div key={k} className="ws-tf-row" style={template}>
          <div>{typo(s.text, lang)}</div>
          {keys.map((key) => (
            <div key={key}>
              <span className={'ws-check' + (solutions !== 'hidden' && s.answer === key ? ' is-correct' + answerClass(solutions) : '')} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function Phrases({ block, target: t }: { block: Block; target(key: string): string }) {
  const p = block.props;
  const vr = variantProps(useSheetDoc()?.look, str(p.variant) as Variant);
  const lang = useSheetLang();
  return (
    <div className={"ws-phrases" + vr.className} style={vr.style}>
      <Editable className="ws-phrases-title" target={t('title')} value={str(p.title)} />
      {rows(p.items).map(([en = '', de = ''], k) => (
        <div key={k} className="ws-phrase">
          <span className="ws-phrase-en">{typo(en, 'en')}</span>
          <span className="ws-phrase-de">{typo(de, lang === 'en' ? 'de' : lang)}</span>
        </div>
      ))}
    </div>
  );
}

function RoleCards({ block, target: t }: { block: Block; target(key: string): string }) {
  const p = block.props;
  const card = (side: 'A' | 'B') => (
    <div className="ws-role">
      <span className="ws-role-cut" aria-hidden="true">
        <Icon icon={Scissors} size={13} />
      </span>
      <Editable className="ws-role-title" target={t('title' + side)} value={str(p['title' + side])} />
      <div className="ws-role-text">
        {str(p['text' + side])
          .split('\n')
          .map((l, k) => (
            <div key={k}>{l.trim() ? <Cell text={l} /> : ' '}</div>
          ))}
      </div>
    </div>
  );
  return (
    <div className="ws-roles">
      {card('A')}
      {card('B')}
    </div>
  );
}

function Bingo({ items, cols, find }: { items: string[]; cols: number; find: boolean }) {
  const txt = useSheetText();
  const lang = useSheetLang();
  const n = Math.min(5, Math.max(2, cols));
  return (
    <div className={'ws-bingo' + (find ? ' is-find' : '')} style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
      {items.map((item, k) => (
        <div key={k} className="ws-bingo-cell">
          <div className="ws-bingo-text">{typo(item, lang)}</div>
          {find && (
            <div className="ws-bingo-name">
              <span>{txt.nameLine}:</span>
              <div className="ws-wline" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function WritingFrame({ starters, lines: per, checklist }: { starters: string[]; lines: number; checklist: string[] }) {
  const txt = useSheetText();
  const lang = useSheetLang();
  const extra = Math.max(0, Math.min(6, per) - 1);
  return (
    <div className="ws-writing">
      {starters.map((s, k) => (
        <div key={k} className="ws-starter">
          <div className="ws-starter-first">
            <span>{typo(s, lang)}</span>
            <div className="ws-wline" />
          </div>
          {Array.from({ length: extra }, (_, j) => (
            <div key={j} className="ws-wline" />
          ))}
        </div>
      ))}
      {checklist.length > 0 && (
        <div className="ws-checklist">
          <div className="ws-label">{txt.checklist}</div>
          {checklist.map((c, k) => (
            <div key={k} className="ws-checklist-item">
              <span className="ws-box" />
              {typo(c, lang)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Mediation({ block, target: t }: { block: Block; target(key: string): string }) {
  const p = block.props;
  const txt = useSheetText();
  const { solutions } = useContext(SheetModeContext);
  return (
    <div className="ws-mediation">
      <div className="ws-mediation-source" lang="de">
        <div className="ws-label">{txt.source}</div>
        <Editable target={t('source')} value={str(p.source)} multiline />
      </div>
      <div className="ws-lines">
        {Array.from({ length: Math.min(20, Math.max(0, num(p.lines, 4))) }, (_, k) => (
          <div key={k} />
        ))}
        {solutions !== 'hidden' && str(p.solution).trim() && <div className={'ws-lines-answer' + answerClass(solutions)}>{str(p.solution)}</div>}
      </div>
    </div>
  );
}

// — Test & Differenzierung —

function GradeScale({ percents, half }: { percents: number[]; half: boolean }) {
  const doc = useSheetDoc();
  const points = doc ? docPoints(doc) : { content: 0, language: 0, total: 0 };
  const ranges = gradeRanges(points.total, percents, half);
  return (
    <div className="ws-grades" lang="de">
      <div className="ws-grades-points">
        <span>
          <b>Punkte:</b> <span className="ws-points-blank" /> / {pointText(points.total)}
        </span>
        {points.language > 0 && (
          <span className="ws-grades-split">
            Inhalt <span className="ws-points-blank" /> / {pointText(points.content)} · Sprache <span className="ws-points-blank" /> / {pointText(points.language)}
          </span>
        )}
      </div>
      <div className="ws-grades-table">
        {ranges.map((r) => (
          <div key={r.grade} className="ws-grades-cell">
            <div className="ws-grades-grade">{r.grade}</div>
            <div className="ws-grades-range">{points.total === 0 ? '–' : r.from === r.to ? pointText(r.from) : `${pointText(r.to)}–${pointText(r.from)}`}</div>
          </div>
        ))}
      </div>
      <div className="ws-grades-sign">
        <span>
          <b>Note:</b> <span className="ws-sign-line is-short" />
        </span>
        <span>
          <b>Unterschrift:</b> <span className="ws-sign-line" />
        </span>
      </div>
    </div>
  );
}

function TipCards({ cols, editing }: { cols: number; editing: boolean }) {
  const doc = useSheetDoc();
  const txt = useSheetText();
  const lang = useSheetLang();
  const tips = doc ? docTips(doc) : [];
  if (tips.length === 0)
    return editing ? (
      <div className="ws-tips-empty" data-noprint="1">
        Noch keine Tipps. Trage bei einer Aufgabe im Panel unter „Tipp“ einen ein, dann erscheint hier eine Karte zum Ausschneiden.
      </div>
    ) : null;
  return (
    <div className="ws-tips" style={{ gridTemplateColumns: `repeat(${Math.min(3, Math.max(1, cols))}, minmax(0, 1fr))` }}>
      {tips.map((tip, k) => (
        <div key={k} className="ws-tip">
          <div className="ws-tip-head">
            <Icon icon={Lightbulb} size={14} />
            <span>{txt.tip(tip.num, tip.page)}</span>
            {Number(tip.level) > 0 && (
              <span className="ws-level">
                {Array.from({ length: Number(tip.level) }, (_, i) => (
                  <Star key={i} size={11} strokeWidth={2.5} fill="currentColor" aria-hidden="true" />
                ))}
              </span>
            )}
          </div>
          <div className="ws-tip-text">{typo(tip.text, lang)}</div>
        </div>
      ))}
    </div>
  );
}
