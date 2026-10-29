// The block "Abbildung": the picture, its labels and the caption. Labels are numbered pins with a legend, pins with
// lines to fill in (the words on the solution sheet), or the words on the picture. In the editor a number under the
// picture is tapped, then the spot on the picture; placed pins move with finger, Pencil or mouse.
import { useContext, useRef, useState, type PointerEvent as ReactPointerEvent, type SyntheticEvent } from 'react';
import { figureLabels, labelLine } from '../model/labels';
import { num, str } from '../model/text';
import type { Block } from '../model/types';
import { Editable, InlineEditContext } from './inlineEdit';
import { useSheetText } from './lang';
import { answerClass, ImageBox } from './parts';
import { SheetModeContext } from './sheetMode';

interface FigureProps {
  block: Block;
  editing: boolean;
  onImageFile?: (file: File) => void;
}

const stop = (e: SyntheticEvent) => e.stopPropagation();

export function Figure({ block, editing, onImageFile }: FigureProps) {
  const p = block.props;
  const t = (key: string) => `${block.id}:${key}`;
  const txt = useSheetText();
  const ctx = useContext(InlineEditContext);
  const { solutions } = useContext(SheetModeContext);
  const box = useRef<HTMLDivElement>(null);
  /** The label waiting for its spot on the picture (editor). */
  const [armed, setArmed] = useState<number | null>(null);
  const labels = figureLabels(p.labels);
  const style = str(p.labelStyle) || 'nummern';
  const canPlace = !!ctx && editing;

  const place = (k: number, clientX: number, clientY: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r || !r.width || !r.height || !ctx) return;
    ctx.change(t(`labels#${k}`), labelLine(labels[k].text, { x: ((clientX - r.left) / r.width) * 100, y: ((clientY - r.top) / r.height) * 100 }));
  };
  const drag = (k: number) => (e: ReactPointerEvent<HTMLElement>) => {
    if (!canPlace) return;
    e.stopPropagation();
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => place(k, ev.clientX, ev.clientY);
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  };

  const legend = style === 'text' ? labels.map((l, k) => ({ l, k })).filter((x) => !x.l.at) : labels.map((l, k) => ({ l, k }));
  return (
    <div className="ws-figure">
      <div
        ref={box}
        className={'ws-figure-box' + (armed !== null ? ' is-armed' : '')}
        onClick={
          armed !== null
            ? (e) => {
                e.stopPropagation();
                place(armed, e.clientX, e.clientY);
                setArmed(null);
              }
            : undefined
        }
      >
        <ImageBox id={str(p.image)} height={num(p.height, 200)} fit={str(p.fit) === 'contain' ? 'contain' : 'cover'} editing={editing} onImageFile={onImageFile} />
        {labels.map(({ text, at }, k) =>
          at ? (
            <span
              key={k}
              className={style === 'text' ? 'ws-pin-text' : 'ws-pin'}
              style={{ left: `${at.x}%`, top: `${at.y}%` }}
              onPointerDown={drag(k)}
              onMouseDown={canPlace ? stop : undefined}
              onTouchStart={canPlace ? stop : undefined}
              onClick={canPlace ? stop : undefined}
            >
              {style === 'text' ? text : k + 1}
            </span>
          ) : null,
        )}
      </div>
      {legend.length > 0 && (
        <ol className={'ws-labels' + (style === 'luecken' ? ' is-gaps' : '')}>
          {legend.map(({ l, k }) => (
            <li key={k}>
              {(style !== 'text' || canPlace) &&
                (canPlace ? (
                  <button
                    type="button"
                    className={'ws-label-num' + (armed === k ? ' is-on' : '') + (l.at ? '' : ' is-open')}
                    title={l.at ? 'Neu setzen: antippen, dann die Stelle im Bild' : 'Antippen, dann die Stelle im Bild'}
                    onMouseDown={stop}
                    onTouchStart={stop}
                    onClick={(e) => {
                      e.stopPropagation();
                      setArmed(armed === k ? null : k);
                    }}
                  >
                    {k + 1}
                  </button>
                ) : (
                  <span className="ws-label-num">{k + 1}</span>
                ))}
              {style === 'luecken' ? (
                <span className="ws-label-line">{solutions !== 'hidden' && <span className={'ws-answer-inline' + answerClass(solutions)}>{l.text}</span>}</span>
              ) : (
                <Editable as="span" className="ws-label-text" target={t(`labels#${k}.0`)} value={l.text} />
              )}
            </li>
          ))}
        </ol>
      )}
      {canPlace && labels.some((l) => !l.at) && (
        <div className="ws-labels-hint" data-noprint="1">
          Nummer antippen, dann die Stelle im Bild. Gesetzte Beschriftungen lassen sich verschieben.
        </div>
      )}
      <Editable className="ws-caption" target={t('caption')} value={str(p.caption)} />
      {str(p.source).trim() && (
        <div className="ws-source">
          {txt.imageSource}: {str(p.source)}
        </div>
      )}
    </div>
  );
}
