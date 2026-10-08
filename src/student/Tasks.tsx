// A task as students do it on a device: the frame of the sheet (number, stars, instruction, help) with inputs instead
// of blanks. Practice shows right and wrong after "Prüfen"; the solution can be shown after a check.
import { useState, type ReactNode } from 'react';
import { Check, Star } from 'lucide-react';
import { Icon } from '../icons';
import { jumble, statements } from '../model/language';
import { lines, num, rows, segments, str } from '../model/text';
import type { Block } from '../model/types';
import { Marked } from '../sheet/parts';
import { typo } from '../sheet/lang';
import { useImageUrl } from '../storage/images';
import { taskSlots, type Answers, type Slot } from '../share/grade';
import type { StudentText } from './text';

export interface TaskProps {
  block: Block;
  num: number;
  answers: Answers;
  onAnswer(key: string, value: string): void;
  /** After a check: slot key → right (true), wrong (false), not graded (null). */
  marks: Record<string, boolean | null> | null;
  /** Show the expected answers next to the wrong ones. */
  reveal: boolean;
  locked: boolean;
  lang: 'de' | 'en';
  help: boolean;
  t: StudentText;
}

type Ctx = Omit<TaskProps, 'block' | 'num' | 'help' | 't'> & { slots: Map<string, Slot>; t: StudentText };

const state = (c: Ctx, key: string) => {
  const m = c.marks?.[key];
  return m === true ? ' is-right' : m === false ? ' is-wrong' : '';
};

/** The expected answer, shown after "Lösung zeigen" next to a wrong slot. */
function Expected({ c, k }: { c: Ctx; k: string }) {
  const slot = c.slots.get(k);
  if (!c.reveal || !slot?.expected || c.marks?.[k] !== false) return null;
  const text =
    slot.kind === 'choice' || slot.kind === 'multi'
      ? slot.expected
          .split('|')
          .map((v) => slot.options?.find((o) => o.v === v)?.l ?? v)
          .join(', ')
      : slot.expected;
  return <span className="st-expected">{text}</span>;
}

function TextInput({ c, k, wide = false, area = false }: { c: Ctx; k: string; wide?: boolean; area?: boolean }) {
  const props = {
    className: 'st-input' + (wide ? ' is-wide' : '') + state(c, k),
    value: c.answers[k] ?? '',
    disabled: c.locked,
    spellCheck: false,
    autoCapitalize: 'off',
    autoCorrect: 'off',
    lang: c.lang,
    'aria-label': c.slots.get(k)?.label,
    onChange: (e: { target: { value: string } }) => c.onAnswer(k, e.target.value),
  } as const;
  return (
    <>
      {area ? (
        <textarea {...props} rows={4} placeholder={c.t.write} />
      ) : (
        // A gap grows with what is typed (in a test there is no solution to measure it by).
        <input {...props} style={wide ? undefined : { width: `${Math.min(28, Math.max(7, (c.slots.get(k)?.expected.length ?? 0) + 2, (c.answers[k] ?? '').length + 2))}ch` }} />
      )}
      <Expected c={c} k={k} />
    </>
  );
}

function Choices({ c, k, multi = false }: { c: Ctx; k: string; multi?: boolean }) {
  const slot = c.slots.get(k)!;
  const chosen = (c.answers[k] ?? '').split('|').filter(Boolean);
  const pick = (v: string) => {
    if (c.locked) return;
    const next = multi ? (chosen.includes(v) ? chosen.filter((x) => x !== v) : [...chosen, v]) : [v];
    c.onAnswer(k, next.join('|'));
  };
  const want = slot.expected.split('|');
  return (
    <div className="st-choices" role={multi ? 'group' : 'radiogroup'} aria-label={slot.label}>
      {slot.options!.map((o) => {
        const on = chosen.includes(o.v);
        // After a check: the chosen ones right or wrong; with the solution, also the missed right ones.
        const mark = c.marks && c.marks[k] !== null ? (on ? (want.includes(o.v) ? ' is-right' : ' is-wrong') : c.reveal && want.includes(o.v) ? ' is-missed' : '') : '';
        return (
          <button key={o.v} type="button" role={multi ? 'checkbox' : 'radio'} aria-checked={on} className={'st-choice' + (on ? ' is-on' : '') + mark} onClick={() => pick(o.v)} disabled={c.locked}>
            <span className={'st-box' + (multi ? '' : ' is-round')}>{on && <Icon icon={Check} size={14} />}</span>
            <span>{typo(o.l, c.lang)}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Words to put in order: tap the parts; tapping a placed part takes it back. */
function OrderParts({ c, k }: { c: Ctx; k: string }) {
  const slot = c.slots.get(k)!;
  const parts = slot.options!;
  const [picked, setPicked] = useState<string[]>(() => {
    // Rebuild the taps from a stored sentence (after reloading the page).
    const given = c.answers[k] ?? '';
    if (!given) return [];
    const left = [...parts];
    const out: string[] = [];
    for (const w of given.split(' ')) {
      const i = left.findIndex((p) => p.l === w);
      if (i >= 0) out.push(left.splice(i, 1)[0].v);
    }
    return out;
  });
  const set = (next: string[]) => {
    setPicked(next);
    c.onAnswer(k, next.map((v) => parts.find((p) => p.v === v)!.l).join(' '));
  };
  return (
    <div className="st-order">
      <div className={'st-order-line' + state(c, k)}>
        {picked.length === 0 && <span className="st-order-hint">{c.t.order}</span>}
        {picked.map((v) => (
          <button key={v} type="button" className="st-part is-placed" disabled={c.locked} onClick={() => set(picked.filter((x) => x !== v))}>
            {parts.find((p) => p.v === v)!.l}
          </button>
        ))}
      </div>
      <div className="st-order-pool">
        {parts
          .filter((p) => !picked.includes(p.v))
          .map((p) => (
            <button key={p.v} type="button" className="st-part" disabled={c.locked} onClick={() => set([...picked, p.v])}>
              {p.l}
            </button>
          ))}
        {picked.length > 0 && !c.locked && (
          <button type="button" className="st-part-reset" onClick={() => set([])}>
            {c.t.reset}
          </button>
        )}
      </div>
      <Expected c={c} k={k} />
    </div>
  );
}

/** A line of text with its gaps as inputs; `prefix` keys the gaps (g0, g1 … over the whole text). */
function GapLine({ c, text, start, prefix }: { c: Ctx; text: string; start: number; prefix: string }) {
  let i = start;
  return <>{segments(text).map((s, k) => (s.blank ? <TextInput key={k} c={c} k={`${prefix}${i++}`} /> : <Marked key={k} text={typo(s.text, c.lang)} />))}</>;
}

function Picture({ id, emoji }: { id: string; emoji: string }) {
  const img = useImageUrl(id);
  if (img.status === 'ready') return <img className="st-pic" src={img.url} alt="" />;
  return <span className="st-pic is-emoji">{emoji}</span>;
}

function Body({ block, c }: { block: Block; c: Ctx }): ReactNode {
  const p = block.props;
  switch (block.type) {
    case 'gap': {
      let n = 0;
      return (
        <div className="st-gap">
          {str(p.text)
            .split('\n')
            .map((line, k) => {
              const start = n;
              n += segments(line).filter((s) => s.blank).length;
              return (
                <p key={k}>
                  <GapLine c={c} text={line} start={start} prefix="g" />
                </p>
              );
            })}
        </div>
      );
    }
    case 'mc':
      return <Choices c={c} k="a" multi={c.slots.get('a')?.kind === 'multi'} />;
    case 'truefalse':
      return (
        <div className="st-rows">
          {statements(str(p.items)).map((s, i) => (
            <div key={i} className="st-row">
              <div className="st-row-text">{typo(s.text, c.lang)}</div>
              <Choices c={c} k={`s${i}`} />
            </div>
          ))}
        </div>
      );
    case 'match': {
      const left = lines(p.left);
      return (
        <div className="st-match">
          <ol className="st-match-left">
            {left.map((l, i) => (
              <li key={i}>
                <b>{i + 1}</b> {typo(l, c.lang)}
              </li>
            ))}
          </ol>
          <div className="st-rows">
            {lines(p.right).map((r, j) => {
              const k = `m${j}`;
              return (
                <label key={j} className="st-row">
                  <span className="st-row-text">{typo(r, c.lang)}</span>
                  <select className={'st-select' + state(c, k)} value={c.answers[k] ?? ''} disabled={c.locked} onChange={(e) => c.onAnswer(k, e.target.value)}>
                    <option value="">{c.t.choose}</option>
                    {left.map((l, i) => (
                      <option key={i} value={String(i + 1)}>
                        {i + 1} · {l}
                      </option>
                    ))}
                  </select>
                  <Expected c={c} k={k} />
                </label>
              );
            })}
          </div>
        </div>
      );
    }
    case 'table': {
      const cols = lines(p.cols);
      return (
        <div className="st-table-wrap">
          <table className="st-table">
            {cols.length > 0 && (
              <thead>
                <tr>
                  {cols.map((col, k) => (
                    <th key={k}>{col}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {lines(p.rows).map((r, k) => (
                <tr key={k}>
                  <th>{r}</th>
                  {cols.slice(1).map((_, j) => (
                    <td key={j}>
                      <TextInput c={c} k={`t${k}-${j}`} wide />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case 'open':
      return <TextInput c={c} k="a" wide area />;
    case 'mediation':
      return (
        <>
          <div className="st-source">{typo(str(p.source), 'de')}</div>
          <TextInput c={c} k="a" wide area />
        </>
      );
    case 'writing':
      return (
        <>
          {lines(p.starters).length > 0 && (
            <ul className="st-starters">
              {lines(p.starters).map((s, k) => (
                <li key={k}>{typo(s, c.lang)} …</li>
              ))}
            </ul>
          )}
          <TextInput c={c} k="a" wide area />
          {lines(p.checklist).length > 0 && (
            <ul className="st-checklist">
              {lines(p.checklist).map((s, k) => (
                <li key={k}>☐ {typo(s, c.lang)}</li>
              ))}
            </ul>
          )}
        </>
      );
    case 'jumble':
      return (
        <div className="st-rows">
          {lines(p.items).map((line, i) => (
            <OrderParts key={`${i}:${jumble(line).parts.join('/')}`} c={c} k={`j${i}`} />
          ))}
        </div>
      );
    case 'transform':
      return (
        <div className="st-rows">
          {rows(p.items).map(([source = '', target = ''], i) => (
            <div key={i} className="st-row is-stack">
              <div className="st-row-text">
                {typo(source, c.lang)} {target && <span className="st-target">→ {target}</span>}
              </div>
              <TextInput c={c} k={`x${i}`} wide />
            </div>
          ))}
        </div>
      );
    case 'foldtest':
      return (
        <div className="st-rows">
          {rows(p.rows).map(([given = ''], i) => (
            <div key={i} className="st-row">
              <div className="st-row-text">{given}</div>
              <TextInput c={c} k={`f${i}`} />
            </div>
          ))}
        </div>
      );
    case 'picvocab': {
      const pics = str(p.pics).split('\n');
      return (
        <div className="st-pics" style={{ gridTemplateColumns: `repeat(${Math.min(num(p.cols, 3), 3)}, minmax(0, 1fr))` }}>
          {rows(p.items).map(([emoji = ''], i) => (
            <div key={i} className="st-pic-card">
              <Picture id={(pics[i] ?? '').trim()} emoji={emoji} />
              <TextInput c={c} k={`p${i}`} wide />
            </div>
          ))}
        </div>
      );
    }
    case 'wordweb':
      return (
        <div className="st-web">
          <div className="st-web-center">{str(p.center)}</div>
          {rows(p.branches).map(([head = '', words = ''], i) => (
            <div key={i} className="st-row is-stack">
              <b>{head}</b>
              <div className="st-web-words">
                {words
                  .split(',')
                  .map((w) => w.trim())
                  .map((w, k) =>
                    segments(w).some((s) => s.blank) ? (
                      <TextInput key={k} c={c} k={`w${i}-${k}`} />
                    ) : (
                      <span key={k} className="st-word">
                        {w}
                      </span>
                    ),
                  )}
              </div>
            </div>
          ))}
        </div>
      );
    case 'syntax': {
      const cols = lines(p.cols);
      return (
        <div className="st-table-wrap">
          <table className="st-table">
            <thead>
              <tr>
                {cols.map((col, k) => (
                  <th key={k}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows(p.rows).map((cells, i) => (
                <tr key={i}>
                  {cells.map((cell, k) => (
                    <td key={k}>{cell === '' || segments(cell).some((s) => s.blank) ? <TextInput c={c} k={`y${i}-${k}`} wide /> : <Marked text={cell} />}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    default:
      return <p className="st-paper">{c.t.paper}</p>;
  }
}

export function Task({ block, num: n, help, t, ...rest }: TaskProps) {
  const p = block.props;
  const level = num(p.level, 0);
  const slots = new Map(taskSlots(block).map((s) => [s.key, s]));
  const c: Ctx = { ...rest, slots, t };
  const helpText = str(p.help).trim();
  return (
    <div className="ws-task st-task">
      <div className="ws-num">{n}</div>
      <div className="ws-task-main">
        <div className="ws-task-head">
          {level > 0 && (
            <span className="ws-level" aria-label={`Niveau ${level} von 3`}>
              {[1, 2, 3].map((k) => (
                <Star key={k} size={13} strokeWidth={2.5} fill={k <= level ? 'currentColor' : 'none'} className={k <= level ? '' : 'is-off'} aria-hidden="true" />
              ))}
            </span>
          )}
          <div className="ws-prompt">{typo(str(p.prompt), rest.lang)}</div>
        </div>
        {helpText && help && (
          <div className="ws-help" lang="de">
            {typo(helpText, 'de')}
          </div>
        )}
        <div className="st-body">
          <Body block={block} c={c} />
        </div>
        {str(p.tip).trim() && <Tip text={str(p.tip)} />}
      </div>
    </div>
  );
}

/** The tip of a task, folded away until asked for. */
function Tip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="st-tip">
      <button type="button" className="st-link" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        💡 Tipp
      </button>
      {open && <p>{text}</p>}
    </div>
  );
}

/** Right/wrong icon for a result line. */
