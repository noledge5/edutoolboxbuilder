import { useLayoutEffect, useRef, useState, type MouseEvent, type Ref } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { ChevronDown, ChevronUp, Copy, Plus, Trash2 } from 'lucide-react';
import { Icon } from '../icons';
import type { Block, DragItem, Page } from '../model/types';
import { BlockContent } from '../sheet/BlockContent';
import { PAGE_H, PAGE_W, SheetPage, taskNumbers } from '../sheet/SheetPage';
import type { EditorApi } from './api';

interface CanvasProps {
  ref: Ref<HTMLElement>;
  api: EditorApi;
  zoom: number;
  draggingId: string | null;
  onBackgroundClick(): void;
}

export function Canvas({ ref, api, zoom, draggingId, onBackgroundClick }: CanvasProps) {
  return (
    <main className="canvas" ref={ref} onClick={onBackgroundClick}>
      <div className="pages">
        {api.doc.pages.map((page, p) => (
          <PageFrame key={p} api={api} page={page} p={p} zoom={zoom} draggingId={draggingId} />
        ))}
        {api.editing && (
          <button
            type="button"
            className="btn btn-secondary ui-btn add-page"
            data-noprint="1"
            onClick={(e) => {
              e.stopPropagation();
              api.addPage();
            }}
          >
            <Icon icon={Plus} />
            Seite hinzufügen
          </button>
        )}
      </div>
    </main>
  );
}

interface PageFrameProps {
  api: EditorApi;
  page: Page;
  p: number;
  zoom: number;
  draggingId: string | null;
}

function PageFrame({ api, page, p, zoom, draggingId }: PageFrameProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);

  // "Seite ist voll": compare the body's content height with its box after every change,
  // and whenever a block resizes (images and fonts load late).
  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const check = () => setOverflow(body.scrollHeight > body.clientHeight + 2);
    check();
    const ro = new ResizeObserver(check);
    for (const child of Array.from(body.children)) ro.observe(child);
    document.fonts?.ready.then(check);
    return () => ro.disconnect();
  });

  const selectPage = (e: MouseEvent) => {
    e.stopPropagation();
    if (api.editing) api.select({ kind: 'page', p });
  };
  const nums = taskNumbers(page);
  const drop = api.drop;

  return (
    <div className="page-frame">
      <div className="page-label" data-noprint="1">
        <span>Seite {p + 1}</span>
        {overflow && <span className="page-warn">Seite ist voll: Inhalt wird unten abgeschnitten</span>}
      </div>
      <div className="page-scale" style={{ width: PAGE_W * zoom, height: PAGE_H * zoom }}>
        <SheetPage
          doc={api.doc}
          page={page}
          index={p}
          editing={api.editing}
          headerSelected={api.editing && api.sel?.kind === 'page' && api.sel.p === p}
          onHeaderClick={selectPage}
          onBodyClick={selectPage}
          bodyRef={bodyRef}
          dropEnd={!!drop && drop.p === p && drop.pos === 'end'}
          style={{ transform: `scale(${zoom})` }}
        >
          {page.blocks.map((b, i) => (
            <BlockFrame key={b.id} api={api} block={b} p={p} i={i} taskNum={nums[i]} dragging={draggingId === b.id} />
          ))}
        </SheetPage>
      </div>
    </div>
  );
}

interface BlockFrameProps {
  api: EditorApi;
  block: Block;
  p: number;
  i: number;
  taskNum: number | null;
  dragging: boolean;
}

function BlockFrame({ api, block, p, i, taskNum, dragging }: BlockFrameProps) {
  const { editing, drop } = api;
  const selected = editing && api.sel?.kind === 'block' && api.sel.id === block.id;
  const data: DragItem = { kind: 'move', id: block.id };
  const { setNodeRef, listeners, attributes } = useDraggable({ id: 'block:' + block.id, data, disabled: !editing });
  const el = useRef<HTMLDivElement | null>(null);
  const [toolbarBelow, setToolbarBelow] = useState(false);

  // The toolbar sits above the block; blocks at the top of the page body would clip it, so it goes below.
  useLayoutEffect(() => {
    if (selected && el.current) setToolbarBelow(el.current.offsetTop < 46);
  }, [selected, i, block.span]);

  const here = !!drop && drop.p === p && drop.i === i && drop.pos !== 'end';
  const partial = block.span < 12;
  const bar = here ? (partial ? (drop.pos === 'before' ? 'is-left' : 'is-right') : drop.pos === 'before' ? 'is-top' : 'is-bottom') : null;
  const stop = (fn: () => void) => (e: MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div
      ref={(node) => {
        el.current = node;
        setNodeRef(node);
      }}
      className={'ed-block' + (selected ? ' is-selected' : '') + (dragging ? ' is-dragging' : '')}
      style={{ gridColumn: `span ${block.span}` }}
      data-block-id={block.id}
      {...(editing ? { ...attributes, ...listeners } : {})}
      onClick={(e) => {
        e.stopPropagation();
        if (editing) api.select({ kind: 'block', id: block.id });
      }}
      onKeyDown={(e) => {
        if (editing && e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          api.select({ kind: 'block', id: block.id });
        }
      }}
    >
      {bar && <div className={'ed-bar ' + bar} />}
      <BlockContent block={block} taskNum={taskNum} editing={editing} onImageFile={block.type === 'image' ? (f) => api.setImage(block.id, f) : undefined} />
      {selected && (
        <div
          className={'ed-toolbar' + (toolbarBelow ? ' is-below' : '')}
          data-noprint="1"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <button type="button" title="Nach oben" aria-label="Nach oben" onClick={stop(() => api.moveBlock(block.id, -1))}>
            <Icon icon={ChevronUp} />
          </button>
          <button type="button" title="Nach unten" aria-label="Nach unten" onClick={stop(() => api.moveBlock(block.id, 1))}>
            <Icon icon={ChevronDown} />
          </button>
          <button type="button" title="Duplizieren" aria-label="Duplizieren" onClick={stop(() => api.duplicateBlock(block.id))}>
            <Icon icon={Copy} />
          </button>
          <button type="button" className="is-danger" title="Löschen" aria-label="Löschen" onClick={stop(() => api.deleteBlock(block.id))}>
            <Icon icon={Trash2} />
          </button>
        </div>
      )}
    </div>
  );
}
