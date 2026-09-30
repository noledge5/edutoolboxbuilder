import { useState, type SyntheticEvent } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { ChevronDown, Search, X } from 'lucide-react';
import { BLOCK_ICONS, Icon } from '../icons';
import { BLOCK_ORDER, BLOCK_TYPES, GROUPS } from '../model/blockTypes';
import { clipLabel, clipText, type Clip } from '../model/clips';
import type { BlockType, DragItem, Lang } from '../model/types';
import { findBlockTypes } from './blockSearch';

const CLOSED_KEY = 'arbeitsblatt-baukasten:toolbox-zu';
/** Key of the favourites group in the stored open/closed state (its label changes with the subject). */
const FAVORITES = 'oft';
const ABLAGE = 'ablage';

function readClosed(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(CLOSED_KEY) ?? '{}') as Record<string, boolean>;
  } catch {
    return {};
  }
}

interface ToolboxProps {
  open: boolean;
  compact: boolean;
  /** Language groups start closed on German worksheets. */
  lang: Lang;
  /** The blocks most used in this subject, shown first: "Oft in Englisch". */
  favorites?: { label: string; types: BlockType[] };
  onAdd(type: BlockType): void;
  /** The Ablage: blocks put aside, newest first. */
  clips: Clip[];
  /** Pastes an entry of the Ablage after the selection. */
  onPaste(id: string): void;
  onRemoveClip(id: string): void;
  onClearClips(): void;
  onClose(): void;
}

export function Toolbox({ open, compact, lang, favorites, onAdd, clips, onPaste, onRemoveClip, onClearClips, onClose }: ToolboxProps) {
  const [closed, setClosed] = useState(readClosed);
  const [query, setQuery] = useState('');
  const found = findBlockTypes(query);
  const isClosed = (g: { label: string; lang?: boolean }) => closed[g.label] ?? (!!g.lang && lang !== 'en');
  const toggle = (g: { label: string; lang?: boolean }) => {
    const next = { ...closed, [g.label]: !isClosed(g) };
    setClosed(next);
    try {
      localStorage.setItem(CLOSED_KEY, JSON.stringify(next));
    } catch {
      // Private mode: the choice lasts until the page is closed.
    }
  };
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
        <label className="tb-search">
          <Icon icon={Search} size={16} />
          <input
            type="search"
            placeholder="Baustein suchen …"
            aria-label="Baustein suchen"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && found[0]) onAdd(found[0]);
              else if (e.key === 'Escape') {
                e.stopPropagation();
                setQuery('');
              }
            }}
          />
          {query && (
            <button type="button" className="iconbtn" onClick={() => setQuery('')} title="Suche leeren" aria-label="Suche leeren">
              <Icon icon={X} size={14} />
            </button>
          )}
        </label>
      </div>
      {query.trim() ? (
        <div className="tb-group">{found.length ? found.map((t) => <ToolboxItem key={t} type={t} onAdd={onAdd} />) : <div className="tb-none">Kein Baustein zu „{query.trim()}“.</div>}</div>
      ) : (
        <>
          <div className={'tb-group is-ablage' + (closed[ABLAGE] ? ' is-closed' : '')}>
            <button type="button" className="tb-group-label" aria-expanded={!closed[ABLAGE]} onClick={() => toggle({ label: ABLAGE })}>
              {clips.length ? `Ablage · ${clips.length}` : 'Ablage'}
              <Icon icon={ChevronDown} size={14} />
            </button>
            {!closed[ABLAGE] &&
              (clips.length ? (
                <>
                  {clips.map((c) => (
                    <ClipItem key={c.id} clip={c} onPaste={onPaste} onRemove={onRemoveClip} />
                  ))}
                  <button type="button" className="tb-clear" onClick={onClearClips}>
                    Ablage leeren
                  </button>
                </>
              ) : (
                <div className="tb-none">Leer. Baustein auswählen, dann ⌘C oder in seiner Leiste „In die Ablage“.</div>
              ))}
          </div>
          {favorites && favorites.types.length > 0 && (
            <div className={'tb-group is-favorites' + (closed[FAVORITES] ? ' is-closed' : '')}>
              <button type="button" className="tb-group-label" aria-expanded={!closed[FAVORITES]} onClick={() => toggle({ label: FAVORITES })}>
                {favorites.label}
                <Icon icon={ChevronDown} size={14} />
              </button>
              {!closed[FAVORITES] && favorites.types.map((t) => <ToolboxItem key={t} type={t} onAdd={onAdd} favorite />)}
            </div>
          )}
          {GROUPS.map((g, gi) => (
            <div className={'tb-group' + (isClosed(g) ? ' is-closed' : '')} key={g.label}>
              <button type="button" className="tb-group-label" aria-expanded={!isClosed(g)} onClick={() => toggle(g)}>
                {g.label}
                <Icon icon={ChevronDown} size={14} />
              </button>
              {!isClosed(g) && BLOCK_ORDER.filter((t) => BLOCK_TYPES[t].group === gi).map((t) => <ToolboxItem key={t} type={t} onAdd={onAdd} />)}
            </div>
          ))}
        </>
      )}
    </aside>
  );
}

function ToolboxItem({ type, onAdd, favorite }: { type: BlockType; onAdd(type: BlockType): void; favorite?: boolean }) {
  const data: DragItem = { kind: 'new', type };
  // The same block can also stand in the favourites group: each draggable needs its own id.
  const { setNodeRef, listeners, attributes } = useDraggable({ id: 'new:' + type + (favorite ? ':oft' : ''), data });
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

/** Keeps a button inside a draggable item from starting a drag or the item's own click. */
const own = (e: SyntheticEvent) => e.stopPropagation();

/** An entry of the Ablage: tap to paste it after the selection, or drag it to a place on the page. */
function ClipItem({ clip, onPaste, onRemove }: { clip: Clip; onPaste(id: string): void; onRemove(id: string): void }) {
  const data: DragItem = { kind: 'clip', id: clip.id };
  const { setNodeRef, listeners, attributes } = useDraggable({ id: 'clip:' + clip.id, data });
  const text = clipText(clip);
  return (
    <div
      ref={setNodeRef}
      className="tb-item is-clip"
      title={`Einfügen: antippen oder auf die Seite ziehen${clip.from ? ` · aus ${clip.from}` : ''}`}
      {...attributes}
      {...listeners}
      onClick={() => onPaste(clip.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPaste(clip.id);
        }
      }}
    >
      <TypeIcon type={clip.blocks[0].type} />
      <span className="tb-clip-text">
        <span>{clipLabel(clip)}</span>
        {(text || clip.from) && <small>{text || clip.from}</small>}
      </span>
      <button
        type="button"
        className="iconbtn tb-clip-del"
        title="Aus der Ablage nehmen"
        aria-label="Aus der Ablage nehmen"
        onMouseDown={own}
        onTouchStart={own}
        onKeyDown={own}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(clip.id);
        }}
      >
        <Icon icon={X} size={14} />
      </button>
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

/** What follows the pointer while dragging a new or existing block, or an entry of the Ablage (`label`). */
export function DragGhost({ type, label }: { type: BlockType; label?: string }) {
  return (
    <div className="drag-ghost">
      <TypeIcon type={type} />
      <span>{label ?? BLOCK_TYPES[type].label}</span>
    </div>
  );
}
