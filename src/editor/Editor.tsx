import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors, type Announcements, type DragStartEvent } from '@dnd-kit/core';
import { X } from 'lucide-react';
import { Icon } from '../icons';
import { BLOCK_TYPES } from '../model/blockTypes';
import { historyReducer, initHistory } from '../model/history';
import * as ops from '../model/ops';
import type { Doc, DragItem, DropTarget, Selection } from '../model/types';
import { InlineEditContext, type InlineEdit } from '../sheet/inlineEdit';
import { SheetModeContext, type SheetMode } from '../sheet/sheetMode';
import { CompetenceNamesContext } from '../sheet/competences';
import { PAGE_W } from '../sheet/SheetPage';
import { backupFileName, createBackup, downloadBlob, readBackup } from '../storage/backup';
import { storeImageFile } from '../storage/images';
import type { EditorApi } from './api';
import { Canvas } from './Canvas';
import { dropTargetAt, sameDrop } from './drop';
import { ghostBesideCursor } from './ghostModifier';
import { JsonDialog } from './JsonDialog';
import { PrintDialog, type PrintMode } from './PrintDialog';
import { PropertiesPanel } from './PropertiesPanel';
import { DragGhost, Toolbox } from './Toolbox';
import { TopBar } from './TopBar';
import { useMediaQuery } from './useMediaQuery';

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 1.5;
const ZOOM_KEY = 'arbeitsblatt-baukasten:zoom';
const AUTOSCROLL_EDGE = 60;

const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, +z.toFixed(2)));

/** The zoom the teacher used last, on this device (a convenience, so plain localStorage). */
function storedZoom(): number | null {
  try {
    const z = parseFloat(localStorage.getItem(ZOOM_KEY) ?? '');
    return Number.isFinite(z) ? clampZoom(z) : null;
  } catch {
    return null;
  }
}

/** Drops a selection that no longer points at anything (after undo, delete, import). */
function validSelection(doc: Doc, sel: Selection): Selection {
  if (!sel) return null;
  if (sel.kind === 'page') return doc.pages[sel.p] ? sel : null;
  return ops.findBlock(doc, sel.id) ? sel : null;
}

const isTyping = (el: Element | null) =>
  !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || (el as HTMLElement).isContentEditable);

/** Delete/Backspace and the arrow keys only act on the page, not while a button in the panel or toolbox has focus. */
const focusOnCanvas = (el: Element | null) => !el || el === document.body || !!el.closest('.canvas');

/** Numbers of the pages whose content is cut off at the bottom. */
const fullPages = () =>
  Array.from(document.querySelectorAll<HTMLElement>('[data-page-body]'))
    .filter((b) => b.scrollHeight > b.clientHeight + 2)
    .map((b) => Number(b.dataset.pageBody));

// Screen-reader messages of dnd-kit, in German.
const dragLabel = (data: unknown, doc: Doc) => {
  const item = data as DragItem | undefined;
  const type = item?.kind === 'new' ? item.type : item?.kind === 'move' ? ops.getBlock(doc, item.id)?.type : undefined;
  return type ? BLOCK_TYPES[type].label : 'Element';
};

export const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

export interface EditorProps {
  initialDoc: Doc;
  /** Persists the document; called shortly after every change. */
  onSave(doc: Doc): Promise<void>;
  /** Back to the overview (library). */
  onBack?(): void;
  /** Where the worksheet sits, e.g. "Geographie · Klasse 9 · Modul 1", shown in the top bar. */
  place?: string;
  /** The code (Kürzel) comes from grade, module and lesson and cannot be edited here. */
  codeLocked?: boolean;
  /** The module's competences, for linking tasks. */
  competences?: { id: string; area: string }[];
  /** Planning note of the lesson from the year plan, shown above the page. */
  note?: string;
}

const NO_COMPETENCES: { id: string; area: string }[] = [];

export function Editor({ initialDoc, onSave, onBack, place, codeLocked, competences = NO_COMPETENCES, note = '' }: EditorProps) {
  const [noteOpen, setNoteOpen] = useState(true);
  const [hist, dispatch] = useReducer(historyReducer, initialDoc, initHistory);
  const doc = hist.present;
  const [rawSel, setSel] = useState<Selection>({ kind: 'page', p: 0 });
  const sel = validSelection(doc, rawSel);
  const compact = useMediaQuery('screen and (max-width: 1099px)');
  const [zoom, setZoomState] = useState(() => storedZoom() ?? 0.8);
  const [preview, setPreview] = useState(false);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [drop, setDrop] = useState<DropTarget | null>(null);
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [toolboxOpen, setToolboxOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [inline, setInline] = useState<string | null>(null);
  const [printMode, setPrintMode] = useState<PrintMode>({ solutions: false, bw: false });
  const [printOpen, setPrintOpen] = useState(false);
  const editing = !preview;
  // While editing, stored answers show faintly; the preview and print show the chosen version.
  const competenceNames = useMemo(() => new Map(competences.map((c) => [c.id, c.area])), [competences]);
  const sheetMode: SheetMode = editing ? { solutions: 'ghost', bw: false } : { solutions: printMode.solutions ? 'shown' : 'hidden', bw: printMode.bw };
  const canvasRef = useRef<HTMLElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Latest values for listeners registered once.
  const latest = useRef({ doc, sel, drop, dragItem, jsonOpen, editing });
  latest.current = { doc, sel, drop, dragItem, jsonOpen, editing };

  const commit = useCallback((next: Doc, opts?: { mergeKey?: string; select?: Selection }) => {
    dispatch({ type: 'commit', doc: next, mergeKey: opts?.mergeKey });
    if (opts && 'select' in opts) setSel(opts.select ?? null);
  }, []);

  const undo = useCallback((redo = false) => {
    setInline(null);
    dispatch({ type: redo ? 'redo' : 'undo' });
  }, []);

  const select = useCallback((s: Selection) => {
    setSel(s);
    setInline(null);
    setPanelOpen(s !== null);
  }, []);

  const setZoom = useCallback((z: number) => {
    const next = clampZoom(z);
    setZoomState(next);
    try {
      localStorage.setItem(ZOOM_KEY, String(next));
    } catch {
      // Not available (private mode): the zoom just is not remembered.
    }
  }, []);

  /** Zoom so a page fills the canvas width. */
  const fitZoom = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const cs = getComputedStyle(c);
    const free = c.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    setZoom(Math.floor((free / PAGE_W) * 100) / 100);
  }, [setZoom]);

  // On a tablet without a remembered zoom, start with the page fitted to the screen.
  const fitOnStart = useRef(compact && storedZoom() === null);
  useEffect(() => {
    if (fitOnStart.current) fitZoom();
  }, [fitZoom]);

  const api: EditorApi = {
    doc,
    sel,
    editing,
    drop,
    codeLocked: !!codeLocked,
    competences,
    select,
    startEdit: (target, s) => {
      // Render the text field synchronously and focus it inside the tap, or iPadOS will not open the keyboard.
      flushSync(() => {
        setSel(s);
        setInline(target);
      });
      const el = document.querySelector<HTMLTextAreaElement>('[data-inline-input]');
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    },
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
    setImage: (id, file, props = {}) => {
      storeImageFile(file)
        .then((imageId) => commit(ops.updateBlock(latest.current.doc, id, { props: { ...props, image: imageId } })))
        .catch((e) => window.alert('Das Bild konnte nicht gespeichert werden: ' + errorText(e)));
    },
    setProps: (id, props) => commit(ops.updateBlock(doc, id, { props })),
    setPic: (id, index, file) => {
      storeImageFile(file)
        .then((imageId) => {
          const d = latest.current.doc;
          const b = ops.getBlock(d, id);
          if (!b) return;
          const pics = String(b.props.pics ?? '').split('\n');
          while (pics.length <= index) pics.push('');
          pics[index] = imageId;
          commit(ops.updateBlock(d, id, { props: { pics: pics.join('\n') } }));
        })
        .catch((e) => window.alert('Das Bild konnte nicht gespeichert werden: ' + errorText(e)));
    },
    setPage: (p, patch) => commit(ops.updatePage(doc, p, patch), { mergeKey: `page${p}.${Object.keys(patch).join()}` }),
    setMeta: (patch) => commit(ops.updateDocMeta(doc, patch), { mergeKey: `meta.${Object.keys(patch).join()}` }),
    addPage: () => {
      // The new page takes over the header settings of the selected page (or the last one).
      const like = sel ? (sel.kind === 'page' ? sel.p : (ops.findBlock(doc, sel.id)?.p ?? doc.pages.length - 1)) : doc.pages.length - 1;
      commit(ops.addPage(doc, like), { select: { kind: 'page', p: doc.pages.length } });
    },
    deletePage: (p) => commit(ops.deletePage(doc, p), { select: { kind: 'page', p: Math.max(0, p - 1) } }),
    splitPage: (p, i) => commit(ops.splitPage(doc, p, i), { select: { kind: 'page', p: p + 1 } }),
  };

  // Text edited right on the page goes through the same operations as the panel, so undo works.
  const inlineEdit: InlineEdit = {
    target: editing ? inline : null,
    change: (target, value) => {
      const d = latest.current.doc;
      const page = /^page(\d+):(\w+)$/.exec(target);
      if (page) {
        const p = Number(page[1]);
        commit(ops.updatePage(d, p, { [page[2]]: value }), { mergeKey: `page${p}.${page[2]}` });
        return;
      }
      const cut = target.lastIndexOf(':');
      const id = target.slice(0, cut);
      const key = target.slice(cut + 1);
      commit(ops.updateBlock(d, id, { props: { [key]: value } }), { mergeKey: `${id}.${key}` });
    },
    done: () => setInline(null),
  };

  // — Files: save the worksheet with its images as one file, and open such a file again. —
  const saveFile = async () => {
    try {
      const file = await createBackup(latest.current.doc);
      downloadBlob(new Blob([JSON.stringify(file)], { type: 'application/json' }), backupFileName(file.doc));
    } catch (e) {
      window.alert('Die Datei konnte nicht erstellt werden: ' + errorText(e));
    }
  };

  const openFile = useCallback(
    async (file: File) => {
      try {
        const opened = await readBackup(await file.text());
        // Keep the place in the library: icon and code stay those of this worksheet.
        const { icon, code } = latest.current.doc;
        const next = codeLocked ? { ...opened, icon, code } : opened;
        commit(next, { select: { kind: 'page', p: 0 } });
        setNotice(`„${file.name}“ geöffnet. Mit Rückgängig kommst du zum vorherigen Inhalt zurück.`);
      } catch (e) {
        window.alert('Die Datei konnte nicht geöffnet werden: ' + errorText(e));
      }
    },
    [commit, codeLocked],
  );

  // Dropping a file: images are handled by image blocks; a worksheet file dropped anywhere else is opened.
  // Anything else must not make the browser navigate away from the editor.
  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) e.preventDefault();
    };
    const onDrop = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files') || e.defaultPrevented) return;
      e.preventDefault();
      const f = Array.from(e.dataTransfer.files).find((x) => x.name.toLowerCase().endsWith('.json') || x.type === 'application/json');
      if (f) openFile(f);
    };
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, [openFile]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(t);
  }, [notice]);

  // Keyboard: Entf deletes, Esc clears the selection, Cmd/Ctrl+Z undoes, Cmd/Ctrl+D duplicates,
  // arrow keys select the previous/next block, Alt+arrow keys move it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { doc, sel, jsonOpen, editing } = latest.current;
      if (jsonOpen || isTyping(document.activeElement)) return;
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      const block = sel?.kind === 'block' ? sel.id : null;
      const onCanvas = focusOnCanvas(document.activeElement);
      if (mod && key === 'z') {
        e.preventDefault();
        undo(e.shiftKey);
      } else if (mod && key === 'y') {
        e.preventDefault();
        undo(true);
      } else if (mod && key === 'd' && editing && block) {
        e.preventDefault();
        const r = ops.duplicateBlock(doc, block);
        dispatch({ type: 'commit', doc: r.doc });
        setSel({ kind: 'block', id: r.id });
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && editing && block && onCanvas) {
        e.preventDefault();
        const loc = ops.findBlock(doc, block);
        dispatch({ type: 'commit', doc: ops.deleteBlock(doc, block) });
        setSel(loc ? { kind: 'page', p: loc.p } : null);
      } else if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && editing && onCanvas && !mod) {
        const dir = e.key === 'ArrowUp' ? -1 : 1;
        if (e.altKey && block) {
          e.preventDefault();
          dispatch({ type: 'commit', doc: ops.moveBlockBy(doc, block, dir) });
          return;
        }
        const order = ops.allBlockIds(doc);
        let next: string | undefined;
        if (block) next = order[order.indexOf(block) + dir];
        else if (sel?.kind === 'page' && dir > 0) next = doc.pages[sel.p].blocks[0]?.id;
        if (next) {
          e.preventDefault();
          setSel({ kind: 'block', id: next });
          (document.querySelector(`[data-block-id="${next}"]`) as HTMLElement | null)?.focus({ preventScroll: true });
        }
      } else if (e.key === 'Escape') {
        setSel(null);
        setPanelOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo]);

  // Persistence: save shortly after every change, and right away when the tab is hidden or closed.
  const saved = useRef(initialDoc);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const save = useCallback((d: Doc) => {
    if (d === saved.current) return;
    saved.current = d;
    onSaveRef.current(d).then(
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
      // Leaving the editor (back to the overview) must not lose the last edits.
      flush();
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
    setInline(null);
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

  const showPreview = (mode: PrintMode) => {
    setPrintMode(mode);
    setPrintOpen(false);
    setPreview(true);
    setSel(null);
    setInline(null);
    setPanelOpen(false);
    setToolboxOpen(false);
  };

  const print = (mode: PrintMode) => {
    const full = fullPages()
      .filter((p) => mode.solutions || doc.pages[p]?.type !== 'lehrkraft')
      .map((p) => ops.pageLabel(doc, p));
    if (full.length > 0) {
      if (!window.confirm(`${full.join(', ')} ${full.length === 1 ? 'ist' : 'sind'} voll: Inhalt wird unten abgeschnitten. Trotzdem drucken?`)) return;
    }
    // Back to editing once the print dialog closes, if that is where printing started.
    if (!preview) window.addEventListener('afterprint', () => setPreview(false), { once: true });
    flushSync(() => showPreview(mode));
    window.print();
  };

  const announcements: Announcements = {
    onDragStart: ({ active }) => `${dragLabel(active.data.current, latest.current.doc)} aufgenommen.`,
    onDragOver: () => undefined,
    onDragEnd: ({ active }) => `${dragLabel(active.data.current, latest.current.doc)} abgelegt.`,
    onDragCancel: ({ active }) => `Ziehen von ${dragLabel(active.data.current, latest.current.doc)} abgebrochen.`,
  };

  return (
    <DndContext
      sensors={sensors}
      autoScroll={false}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={endDrag}
      accessibility={{
        announcements,
        screenReaderInstructions: { draggable: 'Mit der Maus ziehen oder auf dem Tablet gedrückt halten und ziehen. Mit Eingabe auswählen.' },
      }}
    >
      <div className={'app ' + (editing ? 'is-editing' : 'is-preview') + (compact ? ' is-compact' : '') + (dragItem ? ' is-dragging' : '') + (note && noteOpen ? ' has-note' : '')}>
        <TopBar
          icon={doc.icon}
          place={place}
          onBack={onBack}
          editing={editing}
          compact={compact}
          zoom={zoom}
          canUndo={hist.past.length > 0}
          canRedo={hist.future.length > 0}
          toolboxOpen={toolboxOpen}
          onToggleToolbox={() => setToolboxOpen((o) => !o)}
          onUndo={() => undo()}
          onRedo={() => undo(true)}
          onZoom={(dir) => setZoom(zoom + dir * 0.1)}
          onFitZoom={fitZoom}
          onOpenFile={() => fileInput.current?.click()}
          onSaveFile={saveFile}
          onOpenJson={() => setJsonOpen(true)}
          onTogglePreview={() => setPreview((p) => !p)}
          onPrint={() => setPrintOpen(true)}
          modeLabel={!editing ? [printMode.solutions ? 'Lösungsfassung' : 'Schülerfassung', printMode.bw ? 'S/W' : 'Farbe'].join(' · ') : undefined}
        />
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) openFile(f);
          }}
        />
        {note && noteOpen && (
          <div className="ed-note" data-noprint="1">
            <span>
              <b>Planung:</b> {note}
            </span>
            <button type="button" className="iconbtn" title="Ausblenden" aria-label="Planung ausblenden" onClick={() => setNoteOpen(false)}>
              <Icon icon={X} size={16} />
            </button>
          </div>
        )}
        <div className="workspace">
          {editing && <Toolbox open={!compact || toolboxOpen} compact={compact} lang={doc.lang} onAdd={api.addBlock} onClose={() => setToolboxOpen(false)} />}
          <InlineEditContext.Provider value={editing ? inlineEdit : null}>
            <SheetModeContext.Provider value={sheetMode}>
              <CompetenceNamesContext.Provider value={competenceNames}>
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
              </CompetenceNamesContext.Provider>
            </SheetModeContext.Provider>
          </InlineEditContext.Provider>
          {editing && (
            <PropertiesPanel api={api} open={!compact || (panelOpen && sel !== null && inline === null)} compact={compact} onClose={() => setPanelOpen(false)} />
          )}
        </div>
        {printOpen && <PrintDialog mode={printMode} hasTeacherPages={doc.pages.some((pg) => pg.type === 'lehrkraft')} onPreview={showPreview} onPrint={print} onClose={() => setPrintOpen(false)} />}
        {jsonOpen && (
          <JsonDialog
            doc={doc}
            onClose={() => setJsonOpen(false)}
            onApply={(next) => {
              const { icon, code } = latest.current.doc;
              commit(codeLocked ? { ...next, icon, code } : next, { select: { kind: 'page', p: 0 } });
              setJsonOpen(false);
            }}
          />
        )}
        <div className="toasts" data-noprint="1">
          {saveError && (
            <div className="toast is-warn" role="alert">
              <span>Speichern im Browser fehlgeschlagen. Sichere deine Arbeit über „Datei“ → „Als Datei sichern“.</span>
            </div>
          )}
          {notice && (
            <div className="toast" role="status">
              <span>{notice}</span>
            </div>
          )}
        </div>
      </div>
      <DragOverlay modifiers={[ghostBesideCursor]} dropAnimation={null} className="drag-overlay">
        {ghostType ? <DragGhost type={ghostType} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
