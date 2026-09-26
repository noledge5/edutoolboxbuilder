// Pieces shared by the block renderers: gaps with answers, highlighted text, colour variants, image boxes, QR codes.
import { useContext, useRef, useState, type CSSProperties } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { encode } from 'uqr';
import { Icon } from '../icons';
import { VARIANTS } from '../model/themes';
import { segments, type Segment } from '../model/text';
import type { Variant } from '../model/types';
import { useImageUrl } from '../storage/images';
import { typo, useSheetLang } from './lang';
import { SheetModeContext, type SolutionView } from './sheetMode';

export const variantVars = (v: Variant): CSSProperties => {
  const c = VARIANTS[v] ?? VARIANTS['accent-2'];
  return {
    '--v-bg': c.bg,
    '--v-circle': c.circle,
    '--v-circle-fg': c.circleFg,
    '--v-title': c.title,
    '--v-solid': c.solid,
    '--v-solid-fg': c.solidFg,
  } as CSSProperties;
};

/** Class for an answer: clear on the solution sheet, faint while editing. */
export const answerClass = (view: SolutionView) => (view === 'ghost' ? ' is-ghost' : '');

/** A gap to write in; wide enough for its answer, which shows on the solution sheet. */
export function Blank({ seg, cls, view }: { seg: Segment; cls: string; view: SolutionView }) {
  const answer = seg.solution;
  const show = !!answer && view !== 'hidden';
  const style = answer ? ({ '--w': `${answer.length * 0.6 + 1.4}em` } as CSSProperties) : undefined;
  return (
    <span className={cls + (show ? ' has-answer' + answerClass(view) : '')} style={style}>
      {show ? answer : null}
    </span>
  );
}

export function GapText({ text, blankClass }: { text: string; blankClass: string }) {
  const { solutions } = useContext(SheetModeContext);
  const lang = useSheetLang();
  return <>{segments(text).map((s, k) => (s.blank ? <Blank key={k} seg={s} cls={blankClass} view={solutions} /> : <Marked key={k} text={typo(s.text, lang)} />))}</>;
}

/** Text with {{…}} parts highlighted, e.g. "he play{{s}}" for the -s of the simple present. */
export function Marked({ text }: { text: string }) {
  if (!text.includes('{{')) return <>{text}</>;
  return (
    <>
      {text.split(/\{\{(.*?)\}\}/).map((part, k) =>
        k % 2 ? (
          <mark key={k} className="ws-mark">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** Dark modules of a QR code as one SVG path. */
export function qrPath(data: boolean[][]): string {
  let d = '';
  data.forEach((row, y) => row.forEach((on, x) => on && (d += `M${x} ${y}h1v1h-1z`)));
  return d;
}

/** A QR code for a link, or null when there is none (or it is too long). */
export function qrCode(link: string): { size: number; d: string } | null | 'error' {
  if (!link || link === 'https://') return null;
  try {
    const r = encode(link, { ecc: 'M', border: 0 });
    return { size: r.size, d: qrPath(r.data) };
  } catch {
    return 'error';
  }
}

export interface ImageBoxProps {
  id: string;
  height: number;
  fit: 'cover' | 'contain';
  editing: boolean;
  onImageFile?: (file: File) => void;
}

export function ImageBox({ id, height, fit, editing, onImageFile }: ImageBoxProps) {
  const img = useImageUrl(id);
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const canEdit = editing && !!onImageFile;
  const fileOf = (dt: DataTransfer | null) => Array.from(dt?.files ?? []).find((f) => f.type.startsWith('image/'));

  return (
    <div
      className={'ws-image' + (over ? ' is-dragover' : '')}
      style={{ height }}
      onDragOver={
        canEdit
          ? (e) => {
              if (!e.dataTransfer.types.includes('Files')) return;
              e.preventDefault();
              setOver(true);
            }
          : undefined
      }
      onDragLeave={canEdit ? () => setOver(false) : undefined}
      onDrop={
        canEdit
          ? (e) => {
              e.preventDefault();
              setOver(false);
              const f = fileOf(e.dataTransfer);
              if (f) onImageFile!(f);
            }
          : undefined
      }
    >
      {img.status === 'ready' && <img src={img.url} alt="" style={{ objectFit: fit }} draggable={false} />}
      {canEdit && img.status !== 'ready' && img.status !== 'loading' && (
        <div className="ws-image-empty" data-noprint="1">
          <Icon icon={ImageIcon} size={20} />
          <span>{img.status === 'missing' ? 'Bild fehlt auf diesem Gerät' : 'Abbildung hierher ziehen'}</span>
          <button
            type="button"
            className="ws-image-pick"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              input.current?.click();
            }}
          >
            Bild wählen
          </button>
          <input
            ref={input}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) onImageFile!(f);
            }}
          />
        </div>
      )}
    </div>
  );
}
