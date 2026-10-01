// Strokes as SVG: on a slide while presenting, in a sketch element and on a blank board. The colours are CSS
// variables (`--ink-*` in tokens.css); the marker is see-through, so the slide shows under it.
import { memo, type CSSProperties } from 'react';
import { strokePath, type Paper, type Stroke } from '../model/ink';

/** The slide's size (as in SlideView, which uses this file). */
const SLIDE_W = 1920;
const SLIDE_H = 1080;

const StrokePath = memo(function StrokePath({ s }: { s: Stroke }) {
  return <path d={strokePath(s)} fill={`var(--ink-${s.color})`} opacity={s.tool === 'marker' ? 0.42 : 1} />;
});

/** Strokes in a box of `w` × `h` (default: the whole slide), stretched to the box they are shown in. */
export function InkSvg({ strokes, w = SLIDE_W, h = SLIDE_H, className = 'sl-ink', style }: { strokes: Stroke[]; w?: number; h?: number; className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      {strokes.map((s, k) => (
        <StrokePath key={k} s={s} />
      ))}
    </svg>
  );
}

/** A blank board put in while presenting: white, squared or lined paper in the look of the slides. */
export function BoardView({ paper, design, style }: { paper: Paper; design: string; style?: CSSProperties }) {
  return <div className={`sl-board is-${paper} is-d-${design}`} style={style} />;
}
