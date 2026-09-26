// Printed content of one block. Pure rendering: editor chrome (selection, drag, toolbar) lives in the editor.
import { useRef, useState, type CSSProperties } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { Icon, BLOCK_ICONS } from '../icons';
import { FLOW_COLORS, VARIANTS } from '../model/themes';
import { flowSteps, lines, num, segments, str } from '../model/text';
import type { Block, Variant } from '../model/types';
import { useImageUrl } from '../storage/images';

interface BlockContentProps {
  block: Block;
  /** Task number, for blocks of the Aufgaben group. */
  taskNum: number | null;
  editing: boolean;
  /** Called with an image file picked or dropped onto an image block (editor only). */
  onImageFile?: (file: File) => void;
}

const variantVars = (v: Variant): CSSProperties => {
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

function GapText({ text, blankClass }: { text: string; blankClass: string }) {
  return (
    <>
      {segments(text).map((s, k) => (s.blank ? <span key={k} className={blankClass} /> : <span key={k}>{s.text}</span>))}
    </>
  );
}

export function BlockContent({ block, taskNum, editing, onImageFile }: BlockContentProps) {
  const p = block.props;
  switch (block.type) {
    case 'heading':
      return <h3 className="ws-h3">{str(p.text)}</h3>;
    case 'text':
      return <p className="ws-text">{str(p.text)}</p>;
    case 'hint':
      return (
        <div className="ws-hint" style={variantVars(str(p.variant) as Variant)}>
          <div className="ws-hint-icon">
            <Icon icon={BLOCK_ICONS.hint} size={16} />
          </div>
          <div className="ws-hint-body">
            <div className="ws-hint-title">{str(p.title)}</div>
            {str(p.text)}
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
            <div className="ws-label">Merksatz</div>
            <div className="ws-merksatz-text">
              <GapText text={str(p.text)} blankClass="ws-blank-lg" />
            </div>
          </div>
        </div>
      );
    case 'wordbank':
      return (
        <div className="ws-wordbank">
          <span className="ws-label">Wortspeicher</span>
          {lines(p.words).map((w, k) => (
            <span key={k} className="ws-word">
              {w}
            </span>
          ))}
        </div>
      );
    case 'image':
      return (
        <div className="ws-figure">
          <ImageBox id={str(p.image)} height={num(p.height, 200)} fit={str(p.fit) === 'contain' ? 'contain' : 'cover'} editing={editing} onImageFile={onImageFile} />
          <div className="ws-caption">{str(p.caption)}</div>
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
    default:
      return (
        <div className="ws-task">
          <div className="ws-num">{taskNum}</div>
          <div className="ws-task-main">
            <div className="ws-prompt">{str(p.prompt)}</div>
            <TaskBody block={block} />
          </div>
        </div>
      );
  }
}

function TaskBody({ block }: { block: Block }) {
  const p = block.props;
  switch (block.type) {
    case 'open':
      return (
        <div className="ws-lines">
          {Array.from({ length: Math.min(20, Math.max(0, num(p.lines, 3))) }, (_, k) => (
            <div key={k} />
          ))}
        </div>
      );
    case 'mc':
      return (
        <div className="ws-options">
          {lines(p.options).map((o, k) => (
            <div key={k} className="ws-option">
              <span className="ws-check" />
              {o}
            </div>
          ))}
        </div>
      );
    case 'gap':
      return (
        <div className="ws-gap">
          <GapText text={str(p.text)} blankClass="ws-blank" />
        </div>
      );
    case 'table': {
      const cols = lines(p.cols);
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
                <div key={j} className="ws-table-cell" />
              ))}
            </div>
          ))}
        </div>
      );
    }
    case 'match': {
      const L = lines(p.left);
      const R = lines(p.right);
      return (
        <div className="ws-match">
          {Array.from({ length: Math.max(L.length, R.length) }, (_, k) => (
            <div key={k} className="ws-match-row">
              {L[k] ? (
                <div className="ws-match-item">
                  <span>{L[k]}</span>
                  <span className="ws-dot" />
                </div>
              ) : (
                <div />
              )}
              <div />
              {R[k] ? (
                <div className="ws-match-item is-right">
                  <span className="ws-dot" />
                  <span>{R[k]}</span>
                </div>
              ) : (
                <div />
              )}
            </div>
          ))}
        </div>
      );
    }
    case 'draw':
      return <div className="ws-draw" style={{ height: num(p.height, 160) }} />;
    default:
      return null;
  }
}

interface ImageBoxProps {
  id: string;
  height: number;
  fit: 'cover' | 'contain';
  editing: boolean;
  onImageFile?: (file: File) => void;
}

function ImageBox({ id, height, fit, editing, onImageFile }: ImageBoxProps) {
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
