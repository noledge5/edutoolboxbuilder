// Printed content of one block. Pure rendering: editor chrome (selection, drag, toolbar) lives in the editor.
import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { Frown, Image as ImageIcon, Meh, Smile, Star } from 'lucide-react';
import { encode } from 'uqr';
import { Icon, BLOCK_ICONS } from '../icons';
import { FLOW_COLORS, VARIANTS } from '../model/themes';
import { flowSteps, lines, num, segments, str } from '../model/text';
import type { Block, Variant } from '../model/types';
import { useImageUrl } from '../storage/images';
import { Editable } from './inlineEdit';

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
  const t = (key: string) => `${block.id}:${key}`;
  switch (block.type) {
    case 'heading':
      return <Editable as="h3" className="ws-h3" target={t('text')} value={str(p.text)} />;
    case 'text':
      return <Editable as="p" className="ws-text" target={t('text')} value={str(p.text)} multiline />;
    case 'hint':
      return (
        <div className="ws-hint" style={variantVars(str(p.variant) as Variant)}>
          <div className="ws-hint-icon">
            <Icon icon={BLOCK_ICONS.hint} size={16} />
          </div>
          <div className="ws-hint-body">
            <Editable className="ws-hint-title" target={t('title')} value={str(p.title)} />
            <Editable target={t('text')} value={str(p.text)} multiline />
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
            <Editable className="ws-merksatz-text" target={t('text')} value={str(p.text)} multiline>
              <GapText text={str(p.text)} blankClass="ws-blank-lg" />
            </Editable>
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
          <Editable className="ws-caption" target={t('caption')} value={str(p.caption)} />
          {str(p.source).trim() && <div className="ws-source">Quelle: {str(p.source)}</div>}
        </div>
      );
    case 'qr':
      return <QrBlock url={str(p.url)} caption={str(p.caption)} editing={editing} captionTarget={t('caption')} />;
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
      return (
        <div className="ws-task">
          <div className="ws-num">{taskNum}</div>
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
              {points > 0 && (
                <span className="ws-points">
                  <span className="ws-points-blank" />/ {points} P.
                </span>
              )}
            </div>
            <TaskBody block={block} target={t} />
          </div>
        </div>
      );
    }
  }
}

function TaskBody({ block, target }: { block: Block; target(key: string): string }) {
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
        <Editable className="ws-gap" target={target('text')} value={str(p.text)} multiline>
          <GapText text={str(p.text)} blankClass="ws-blank" />
        </Editable>
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
      return <div className={'ws-draw is-' + (str(p.pattern) || 'leer')} style={{ height: num(p.height, 160) }} />;
    default:
      return null;
  }
}

/** Dark modules of a QR code as one SVG path. */
function qrPath(data: boolean[][]): string {
  let d = '';
  data.forEach((row, y) => row.forEach((on, x) => on && (d += `M${x} ${y}h1v1h-1z`)));
  return d;
}

function QrBlock({ url, caption, editing, captionTarget }: { url: string; caption: string; editing: boolean; captionTarget: string }) {
  const link = url.trim();
  const qr = useMemo(() => {
    if (!link || link === 'https://') return null;
    try {
      const r = encode(link, { ecc: 'M', border: 0 });
      return { size: r.size, d: qrPath(r.data) };
    } catch {
      return 'error' as const;
    }
  }, [link]);
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
