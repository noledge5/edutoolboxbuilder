import { useDraggable } from '@dnd-kit/core';
import { X } from 'lucide-react';
import { BLOCK_ICONS, Icon } from '../icons';
import { BLOCK_ORDER, BLOCK_TYPES, GROUPS } from '../model/blockTypes';
import type { BlockType, DragItem } from '../model/types';

interface ToolboxProps {
  open: boolean;
  compact: boolean;
  onAdd(type: BlockType): void;
  onClose(): void;
}

export function Toolbox({ open, compact, onAdd, onClose }: ToolboxProps) {
  return (
    <aside className={'toolbox' + (open ? ' is-open' : '')} data-noprint="1" aria-hidden={!open}>
      <div className="tb-head">
        <div className="tb-title-row">
          <div className="tb-title">Toolbox</div>
          {compact && (
            <button type="button" className="iconbtn" onClick={onClose} title="Schließen" aria-label="Toolbox schließen">
              <Icon icon={X} />
            </button>
          )}
        </div>
        <div className="tb-help">Auf die Seite ziehen oder anklicken.</div>
      </div>
      {GROUPS.map((g, gi) => (
        <div className="tb-group" key={g.label}>
          <div className="tb-group-label">{g.label}</div>
          {BLOCK_ORDER.filter((t) => BLOCK_TYPES[t].group === gi).map((t) => (
            <ToolboxItem key={t} type={t} onAdd={onAdd} />
          ))}
        </div>
      ))}
    </aside>
  );
}

function ToolboxItem({ type, onAdd }: { type: BlockType; onAdd(type: BlockType): void }) {
  const data: DragItem = { kind: 'new', type };
  const { setNodeRef, listeners, attributes } = useDraggable({ id: 'new:' + type, data });
  return (
    <div
      ref={setNodeRef}
      className="tb-item"
      {...attributes}
      {...listeners}
      onClick={() => onAdd(type)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onAdd(type);
        }
      }}
    >
      <TypeIcon type={type} />
      <span>{BLOCK_TYPES[type].label}</span>
    </div>
  );
}

function TypeIcon({ type }: { type: BlockType }) {
  const g = GROUPS[BLOCK_TYPES[type].group];
  return (
    <span className="tb-icon" style={{ background: g.bg, color: g.fg }}>
      <Icon icon={BLOCK_ICONS[type]} />
    </span>
  );
}

/** What follows the pointer while dragging a new or existing block. */
export function DragGhost({ type }: { type: BlockType }) {
  return (
    <div className="drag-ghost">
      <TypeIcon type={type} />
      <span>{BLOCK_TYPES[type].label}</span>
    </div>
  );
}
