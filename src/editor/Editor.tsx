import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors, type DragStartEvent } from '@dnd-kit/core';
import { historyReducer, initHistory } from '../model/history';
import * as ops from '../model/ops';
import type { Doc, DragItem, DropTarget, Selection } from '../model/types';
import { saveDoc } from '../storage/db';
import { storeImageFile } from '../storage/images';
import type { EditorApi } from './api';
import { Canvas } from './Canvas';
import { dropTargetAt, sameDrop } from './drop';
import { ghostBesideCursor } from './ghostModifier';
import { JsonDialog } from './JsonDialog';
import { PropertiesPanel } from './PropertiesPanel';
import { DragGhost, Toolbox } from './Toolbox';
import { TopBar } from './TopBar';
import { useMediaQuery } from './useMediaQuery';

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 1.5;
const AUTOSCROLL_EDGE = 60;

/** Drops a selection that no longer points at anything (after undo, delete, import). */
function validSelection(doc: Doc, sel: Selection): Selection {
  if (!sel) return null;
  if (sel.kind === 'page') return doc.pages[sel.p] ? sel : null;
  return ops.findBlock(doc, sel.id) ? sel : null;
}

const isTyping = (el: Element | null) =>
  !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || (el as HTMLElement).isContentEditable);

export function Editor({ initialDoc }: { initialDoc: Doc }) {
  const [hist, dispatch] = useReducer(historyReducer, initialDoc, initHistory);
  const doc = hist.present;
  const [rawSel, setSel] = useState<Selection>({ kind: 'page', p: 0 });
  const sel = validSelection(doc, rawSel);
  const [zoom, setZoom] = useState(0.8);
  const [preview, setPreview] = useState(false);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [drop, setDrop] = useState<DropTarget | null>(null);
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const [saveError, setSaveError] = useState(false);
  const compact = useMediaQuery('screen and (max-width: 1099px)');
  const [toolboxOpen, setToolboxOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const editing = !preview;
  const canvasRef = useRef<HTMLElement>(null);

  // Latest values for listeners registered once.
  const latest = useRef({ doc, sel, drop, dragItem, jsonOpen, editing });
  latest.current = { doc, sel, drop, dragItem, jsonOpen, editing };

  const commit = useCallback((next: Doc, opts?: { mergeKey?: string; select?: Selection }) => {
    dispatch({ type: 'commit', doc: next, mergeKey: opts?.mergeKey });
    if (opts && 'select' in opts) setSel(opts.select ?? null);
  }, []);

  const select = useCallback((s: Selection) => {
    setSel(s);
    setPanelOpen(s !== null);
  }, []);

  const api: EditorApi = {
    doc,
    sel,
    editing,
    drop,
    select,
    addBlock: (type) => {
      const at = ops.insertionPoint(doc, sel);
      const block = ops.createBlock(type);
      commit(ops.insertBlock(doc, at.p, at.i, block), { select: { kind: 'block', id: block.id } });
    },
    duplicateBlock: (id) => {
      const r = ops.duplicateBlock(doc, id);
      commit(r.doc, { select: { kind: 'block', id: r.id } });
    },
    deleteBlock: (id) => {
      const loc = ops.findBlock(doc, id);
      commit(ops.deleteBlock(doc, id), { select: loc ? { kind: 'page', p: loc.p } : null });
    },
    moveBlock: (id, dir) => commit(ops.moveBlockBy(doc, id, dir)),
    setSpan: (id, span) => commit(ops.updateBlock(doc, id, { span })),
    setProp: (id, key, value) => commit(ops.updateBlock(doc, id, { props: { [key]: value } }), { mergeKey: `${id}.${key}` }),
    setImage: (id, file) => {
      storeImageFile(file)
        .then((imageId) => commit(ops.updateBlock(latest.current.doc, id, { props: { image: imageId } })))
        .catch((e) => window.alert('Das Bild konnte nicht gespeichert werden: ' + (e instanceof Error ? e.message : String(e))));
    },
    setPage: (p, patch) => commit(ops.updatePage(doc, p, patch), { mergeKey: `page${p}.${Object.keys(patch).join()}` }),
    setMeta: (patch) => commit(ops.updateDocMeta(doc, patch), { mergeKey: `meta.${Object.keys(patch).join()}` }),
    addPage: () => commit(ops.addPage(doc), { select: { kind: 'page', p: doc.pages.length } }),
    deletePage: (p) => commit(ops.deletePage(doc, p), { select: { kind: 'page', p: Math.max(0, p - 1) } }),
  };

  // Keyboard: Entf/Backspace deletes the selected block, Esc clears the selection, Cmd/Ctrl+Z undoes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { doc, sel, jsonOpen, editing } = latest.current;
      if (jsonOpen || isTyping(document.activeElement)) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        dispatch({ type: e.shiftKey ? 'redo' : 'undo' });
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        dispatch({ type: 'redo' });
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && editing && sel?.kind === 'block') {
        e.preventDefault();
        const loc = ops.findBlock(doc, sel.id);
        dispatch({ type: 'commit', doc: ops.deleteBlock(doc, sel.id) });
        setSel(loc ? { kind: 'page', p: loc.p } : null);
      } else if (e.key === 'Escape') {
        setSel(null);
        setPanelOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Dropping a file somewhere other than an image block must not navigate away from the editor.
  useEffect(() => {
    const block = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) e.preventDefault();
    };
    window.addEventListener('dragover', block);
    window.addEventListener('drop', block);
    return () => {
      window.removeEventListener('dragover', block);
      window.removeEventListener('drop', block);
    };
  }, []);

  // Persistence: save shortly after every change, and right away when the tab is hidden or closed.
  const saved = useRef(initialDoc);
  const save = useCallback((d: Doc) => {
    if (d === saved.current) return;
    saved.current = d;
    saveDoc(d).then(
      () => setSaveError(false),
      () => setSaveError(true),
    );
  }, []);
  useEffect(() => {
    const t = setTimeout(() => save(doc), 300);
    return () => clearTimeout(t);
  }, [doc, save]);
  useEffect(() => {
    const flush = () => save(latest.current.doc);
    const onVisibility = () => document.visibilityState === 'hidden' && flush();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
    };
  }, [save]);

  // — Drag and drop —
  // dnd-kit provides the sensors (mouse, and long-press on touch) and the drag overlay; the drop
  // position is computed from the pointer against the DOM, and the canvas scrolls near its edges.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );
  const pointer = useRef<{ x: number; y: number } | null>(null);

  const updateDrop = useCallback(() => {
    const { doc, dragItem, drop } = latest.current;
    const pt = pointer.current;
    if (!dragItem || !pt) return;
    const next = dropTargetAt(pt.x, pt.y, doc, dragItem);
    if (!sameDrop(next, drop)) {
      latest.current.drop = next;
      setDrop(next);
    }
  }, []);

  useEffect(() => {
    if (!dragItem) return;
    const onMouse = (e: MouseEvent) => {
      pointer.current = { x: e.clientX, y: e.clientY };
      updateDrop();
    };
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      pointer.current = { x: t.clientX, y: t.clientY };
      updateDrop();
    };
    let raf = 0;
    const tick = () => {
      const pt = pointer.current;
      const c = canvasRef.current;
      if (pt && c) {
        const r = c.getBoundingClientRect();
        let dy = 0;
        if (pt.x >= r.left && pt.x <= r.right) {
          if (pt.y < r.top + AUTOSCROLL_EDGE) dy = -(r.top + AUTOSCROLL_EDGE - pt.y);
          else if (pt.y > r.bottom - AUTOSCROLL_EDGE) dy = pt.y - (r.bottom - AUTOSCROLL_EDGE);
        }
        if (dy) {
          c.scrollTop += Math.max(-18, Math.min(18, Math.round(dy / 3)));
          updateDrop();
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener('mousemove', onMouse);
    window.addEventListener('touchmove', onTouch, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('touchmove', onTouch);
    };
  }, [dragItem, updateDrop]);

  const onDragStart = (e: DragStartEvent) => {
    const item = e.active.data.current as DragItem | undefined;
    if (!item) return;
    const ev = e.activatorEvent;
    const pt = 'touches' in ev ? (ev as TouchEvent).touches[0] : (ev as MouseEvent);
    pointer.current = pt ? { x: pt.clientX, y: pt.clientY } : null;
    latest.current.dragItem = item;
    setDragItem(item);
    // On narrow screens the toolbox covers the page: get it out of the way while dragging.
    if (compact) {
      setToolboxOpen(false);
      setPanelOpen(false);
    }
  };

  const endDrag = () => {
    pointer.current = null;
    latest.current.dragItem = null;
    latest.current.drop = null;
    setDragItem(null);
    setDrop(null);
  };

  const onDragEnd = () => {
    const { doc, drop: target, dragItem: item } = latest.current;
    endDrag();
    if (!target || !item) return;
    if (item.kind === 'new') {
      const r = ops.dropNewBlock(doc, item.type, target);
      commit(r.doc, { select: { kind: 'block', id: r.id } });
    } else {
      commit(ops.moveBlockTo(doc, item.id, target), { select: { kind: 'block', id: item.id } });
    }
  };

  const ghostType = dragItem ? (dragItem.kind === 'new' ? dragItem.type : ops.getBlock(doc, dragItem.id)?.type) : undefined;

  const print = () => {
    flushSync(() => {
      setPreview(true);
      setSel(null);
      setPanelOpen(false);
      setToolboxOpen(false);
    });
    window.print();
  };

  return (
    <DndContext sensors={sensors} autoScroll={false} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={endDrag}>
      <div className={'app ' + (editing ? 'is-editing' : 'is-preview') + (compact ? ' is-compact' : '') + (dragItem ? ' is-dragging' : '')}>
        <TopBar
          editing={editing}
          compact={compact}
          zoom={zoom}
          canUndo={hist.past.length > 0}
          canRedo={hist.future.length > 0}
          toolboxOpen={toolboxOpen}
          onToggleToolbox={() => setToolboxOpen((o) => !o)}
          onUndo={() => dispatch({ type: 'undo' })}
          onRedo={() => dispatch({ type: 'redo' })}
          onZoom={(dir) => setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, +(z + dir * 0.1).toFixed(2))))}
          onOpenJson={() => setJsonOpen(true)}
          onTogglePreview={() => setPreview((p) => !p)}
          onPrint={print}
        />
        <div className="workspace">
          {editing && <Toolbox open={!compact || toolboxOpen} compact={compact} onAdd={api.addBlock} onClose={() => setToolboxOpen(false)} />}
          <Canvas
            ref={canvasRef}
            api={api}
            zoom={zoom}
            draggingId={dragItem?.kind === 'move' ? dragItem.id : null}
            onBackgroundClick={() => {
              select(null);
              setToolboxOpen(false);
            }}
          />
          {editing && <PropertiesPanel api={api} open={!compact || (panelOpen && sel !== null)} compact={compact} onClose={() => setPanelOpen(false)} />}
        </div>
        {jsonOpen && (
          <JsonDialog
            doc={doc}
            onClose={() => setJsonOpen(false)}
            onApply={(next) => {
              commit(next, { select: { kind: 'page', p: 0 } });
              setJsonOpen(false);
            }}
          />
        )}
        {saveError && (
          <div className="save-error" role="alert" data-noprint="1">
            Speichern im Browser fehlgeschlagen. Sichere deine Arbeit über „Daten“.
          </div>
        )}
      </div>
      <DragOverlay modifiers={[ghostBesideCursor]} dropAnimation={null} className="drag-overlay">
        {ghostType ? <DragGhost type={ghostType} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
