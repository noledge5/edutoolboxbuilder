import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors, type Announcements, type DragStartEvent } from '@dnd-kit/core';
import { ClipboardCopy, Copy, Scissors, Send, Sparkles, Trash2, X } from 'lucide-react';
import { Icon } from '../icons';
import { BLOCK_TYPES } from '../model/blockTypes';
import { addClip, clipLabel, type Clip } from '../model/clips';
import { historyReducer, initHistory } from '../model/history';
import * as ops from '../model/ops';
import type { BlockType, Doc, DragItem, DropTarget, Selection } from '../model/types';
import { blockText } from '../library/search';
import { InlineEditContext, type InlineEdit } from '../sheet/inlineEdit';
import { SheetModeContext, type SheetMode } from '../sheet/sheetMode';
import { CompetenceNamesContext } from '../sheet/competences';
import { PAGE_W } from '../sheet/SheetPage';
import { backupFileName, createBackup, downloadBlob, readBackup } from '../storage/backup';
import { loadClips, saveClips } from '../storage/library';
import { storeImageFile } from '../storage/images';
import { putImageAs } from '../storage/db';
import { dataUrlToBlob } from '../storage/backup';
import { AiSettingsDialog } from '../ai/AiSettingsDialog';
import { LessonAiDialog, type LessonAi } from '../ai/LessonAiDialog';
import { VocabAiDialog } from '../ai/VocabAiDialog';
import { TaskAiDialog } from '../ai/TaskAiDialog';
import { CheckAiDialog } from '../ai/CheckAiDialog';
import { FullLessonDialog } from '../ai/FullLessonDialog';
import type { Finding } from '../ai/check';
import { PdfImportDialog } from '../ai/PdfImportDialog';
import { vocabOf } from '../model/language';
import type { EditorApi } from './api';
import { Canvas } from './Canvas';
import { dropTargetAt, sameDrop } from './drop';
import { ghostBesideCursor } from './ghostModifier';
import { JsonDialog } from './JsonDialog';
import { KeysDialog } from './KeysDialog';
import { DEFAULT_PRINT, PrintDialog, type PrintMode } from './PrintDialog';
import { hasLevels, hasShuffle, levelCode, variantDoc } from '../model/variants';
import { markFound, pulse, type SearchFocus } from '../library/highlight';
import type { Handout } from '../share/assignment';
import { PropertiesPanel } from './PropertiesPanel';
import { DragGhost, Toolbox } from './Toolbox';
import { TopBar } from './TopBar';
import { useMediaQuery } from './useMediaQuery';
import { setPart, str } from '../model/text';

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
  if (sel.kind === 'block') return ops.findBlock(doc, sel.id) ? sel : null;
  const ids = sel.ids.filter((id) => ops.findBlock(doc, id));
  return ids.length === sel.ids.length ? sel : ops.selectionOf(ids);
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
const dragLabel = (data: unknown, doc: Doc, clips: Clip[]) => {
  const item = data as DragItem | undefined;
  if (item?.kind === 'clip') {
    const clip = clips.find((c) => c.id === item.id);
    return clip ? clipLabel(clip) : 'Element';
  }
  const type = item?.kind === 'new' ? item.type : item?.kind === 'move' ? ops.getBlock(doc, item.id)?.type : undefined;
  return type ? BLOCK_TYPES[type].label : 'Element';
};

/** Words of the notice for blocks put into the Ablage: "Lückentext liegt" or "3 Bausteine liegen". */
const lieIn = (label: string, n: number) => `${label} ${n === 1 ? 'liegt' : 'liegen'} in der Ablage`;

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
  /** The blocks most used in this subject, first in the toolbox. */
  favorites?: { label: string; types: BlockType[] };
  /** Opens the lesson's slides. */
  onSlides?(): void;
  /** Opens the slides and starts presenting. */
  onPresent?(): void;
  slideCount?: number;
  /** Makes the lesson's slides anew from this worksheet as it is now. */
  onRegenerateSlides?(doc: Doc): void;
  onDeleteSlides?(): void;
  /** Earlier versions of the lesson. */
  onVersions?(): void;
  /** A block found by the search: selected, scrolled into view, its words marked. */
  focus?: SearchFocus;
  /** Hands out blocks (`ids`) or the whole worksheet (null) digitally, by link and QR code. */
  onShare?(doc: Doc, ids: string[] | null): void;
  /** What was handed out from this lesson, newest first, with its evaluation. */
  handouts?: Handout[];
  onOpenHandout?(id: string): void;
  /** Working out the lesson with Claude (in the library). */
  ai?: LessonAi;
  /** A PDF to bring in right away (chosen in the module for a new lesson). */
  pdf?: File;
  onPdfTaken?(): void;
}

const NO_COMPETENCES: { id: string; area: string }[] = [];

export function Editor({
  initialDoc,
  onSave,
  onBack,
  place,
  codeLocked,
  competences = NO_COMPETENCES,
  note = '',
  favorites,
  onSlides,
  onPresent,
  slideCount = 0,
  onRegenerateSlides,
  onDeleteSlides,
  onVersions,
  focus,
  onShare,
  handouts = [],
  onOpenHandout,
  ai,
  pdf,
  onPdfTaken,
}: EditorProps) {
  const [noteOpen, setNoteOpen] = useState(true);
  const [hist, dispatch] = useReducer(historyReducer, initialDoc, initHistory);
  const doc = hist.present;
  const [rawSel, setSel] = useState<Selection>({ kind: 'page', p: 0 });
  const sel = validSelection(doc, rawSel);
  const compact = useMediaQuery('screen and (max-width: 1099px)');
  const [zoom, setZoomState] = useState(() => storedZoom() ?? 0.8);
  const [preview, setPreview] = useState(false);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [keysOpen, setKeysOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState<'lesson' | 'full' | 'settings' | 'vocab' | 'task' | 'check' | null>(null);
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [fixing, setFixing] = useState<Finding | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const pdfInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!pdf) return;
    setPdfFile(pdf);
    onPdfTaken?.();
  }, [pdf, onPdfTaken]);
  const [drop, setDrop] = useState<DropTarget | null>(null);
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [toolboxOpen, setToolboxOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [inline, setInline] = useState<string | null>(null);
  /** A line emptied on the page, removed when its editing ends. */
  const emptied = useRef<string | null>(null);
  const [printMode, setPrintMode] = useState<PrintMode>(DEFAULT_PRINT);
  const [printOpen, setPrintOpen] = useState(false);
  /** Choosing several blocks by tapping them (iPad), started from a block's toolbar. */
  const [picking, setPicking] = useState(false);
  /** The Ablage: blocks put aside for pasting, kept on this device. */
  const [clips, setClips] = useState<Clip[]>([]);
  /** Where a shift-click range starts: the block clicked last. */
  const anchor = useRef<string | null>(null);
  const editing = !preview;
  // While editing, stored answers show faintly; the preview and print show the chosen version.
  const competenceNames = useMemo(() => new Map(competences.map((c) => [c.id, c.area])), [competences]);
  const sheetMode: SheetMode = editing ? { solutions: 'ghost', bw: false } : { solutions: printMode.solutions ? 'shown' : 'hidden', bw: printMode.bw, group: printMode.group };
  // The preview and print show the chosen version: some levels only, or test group B.
  const shownDoc = useMemo(() => (editing ? doc : variantDoc(doc, printMode)), [editing, doc, printMode]);
  const canvasRef = useRef<HTMLElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Latest values for listeners registered once.
  const latest = useRef({ doc, sel, drop, dragItem, jsonOpen: jsonOpen || keysOpen, editing, clips });
  latest.current = { doc, sel, drop, dragItem, jsonOpen: jsonOpen || keysOpen, editing, clips };

  useEffect(() => {
    let alive = true;
    loadClips().then(
      (c) => alive && setClips(c),
      () => {},
    );
    return () => {
      alive = false;
    };
  }, []);

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
    if (s?.kind === 'block') anchor.current = s.id;
  }, []);

  // — Several blocks at once, and the Ablage —

  /** Where blocks put into the Ablage come from: "Modul 1 · Stunde 2: Treibhauseffekt". */
  const clipFrom = place ? place.split(' · ').slice(2).join(' · ') : (doc.pages[0]?.title ?? '');

  const putClips = (next: Clip[]) => {
    latest.current.clips = next;
    setClips(next);
    saveClips(next).catch(() => setNotice('Die Ablage konnte nicht gespeichert werden.'));
  };

  /** Puts blocks into the Ablage (their text also into the clipboard, for other apps); `cut` removes them. */
  const toAblage = (ids: string[], cut = false) => {
    const { doc, clips } = latest.current;
    const blocks = ops.blocksOf(doc, ids);
    if (!blocks.length) return;
    const next = addClip(clips, blocks, clipFrom, Date.now());
    putClips(next);
    const text = blocks.flatMap(blockText).join('\n\n');
    if (text) navigator.clipboard?.writeText(text).catch(() => {});
    if (cut) {
      const loc = ops.findBlock(doc, blocks[0].id);
      commit(ops.deleteBlocks(doc, ids), { select: loc ? { kind: 'page', p: loc.p } : null });
    }
    setNotice(`${lieIn(clipLabel(next[0]), blocks.length)}${cut ? ' (ausgeschnitten)' : ''}. Einfügen: ⌘V oder in der Toolbox antippen.`);
  };

  /** Pastes an entry of the Ablage (the newest without `clipId`) after the selection, or where it was dropped. */
  const paste = (clipId?: string, target?: DropTarget) => {
    const { doc, sel, clips } = latest.current;
    const clip = clipId ? clips.find((c) => c.id === clipId) : clips[0];
    if (!clip) return;
    const blocks = ops.copyBlocks(clip.blocks, competences.map((c) => c.id));
    const at = ops.insertionPoint(doc, sel);
    commit(target ? ops.dropBlocks(doc, blocks, target) : ops.insertBlocks(doc, at.p, at.i, blocks), { select: ops.selectionOf(blocks.map((b) => b.id)) });
    anchor.current = blocks[0].id;
    setPicking(false);
    setInline(null);
  };

  /** The selected blocks removed. */
  const deleteSelected = () => {
    const { doc, sel } = latest.current;
    const ids = ops.selectedIds(doc, sel);
    if (!ids.length) return;
    const loc = ops.findBlock(doc, ids[0]);
    commit(ops.deleteBlocks(doc, ids), { select: loc ? { kind: 'page', p: loc.p } : null });
  };

  /** Copies of the selected blocks right after the last of them, selected. */
  const duplicateSelected = () => {
    const { doc, sel } = latest.current;
    const blocks = ops.copyBlocks(ops.blocksOf(doc, ops.selectedIds(doc, sel)));
    if (!blocks.length) return;
    const at = ops.insertionPoint(doc, sel);
    commit(ops.insertBlocks(doc, at.p, at.i, blocks), { select: ops.selectionOf(blocks.map((b) => b.id)) });
  };

  /** ⌘-click or a tap while choosing: the block joins the selection or leaves it. ⇧-click: all blocks up to it. */
  const pickBlock = (id: string, range: boolean) => {
    const { doc, sel } = latest.current;
    const ids = ops.selectedIds(doc, sel);
    const from = anchor.current ?? ids.at(-1);
    let next: string[];
    if (range && from) next = ops.blockRange(doc, from, id);
    else {
      next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
      anchor.current = id;
    }
    setInline(null);
    setSel(ops.selectionOf(ops.blocksOf(doc, next).map((b) => b.id)));
  };

  const endPicking = () => {
    setPicking(false);
    setSel(null);
  };

  /** Opens a text of the page for editing in place. */
  const startEdit = (target: string, s: Selection) => {
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
  };

  /** Sets the level (G/M/E, '' none) of the selected tasks. */
  const setLevel = (ids: string[], level: string) => {
    let d = latest.current.doc;
    for (const b of ops.blocksOf(d, ids)) if (BLOCK_TYPES[b.type].fields.some((f) => f.key === 'level')) d = ops.updateBlock(d, b.id, { props: { level } });
    if (d !== latest.current.doc) commit(d);
  };

  // For the keyboard listener, registered once.
  const actions = useRef({ toAblage, paste, deleteSelected, duplicateSelected, startEdit, setLevel });
  actions.current = { toAblage, paste, deleteSelected, duplicateSelected, startEdit, setLevel };

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
    doc: shownDoc,
    sel,
    editing,
    drop,
    codeLocked: !!codeLocked,
    competences,
    select,
    picking,
    pickBlock,
    startPicking: (id) => {
      setPicking(true);
      setInline(null);
      setPanelOpen(false);
      setSel({ kind: 'block', id });
      anchor.current = id;
    },
    toAblage: (ids) => toAblage(ids),
    share: onShare && ((ids) => onShare(latest.current.doc, ids)),
    startEdit,
    addBlock: (type) => {
      const at = ops.insertionPoint(doc, sel);
      const block = ops.createBlock(type);
      commit(ops.insertBlock(doc, at.p, at.i, block), { select: { kind: 'block', id: block.id } });
    },
    insertAfter: (id, blocks) => {
      const loc = ops.findBlock(doc, id);
      if (loc) commit(ops.insertBlocks(doc, loc.p, loc.i + 1, blocks), { select: ops.selectionOf(blocks.map((b) => b.id)) });
    },
    replaceBlock: (id, blocks) => commit(ops.replaceBlock(doc, id, blocks), { select: ops.selectionOf(blocks.map((b) => b.id)) }),
    taskContext:
      ai &&
      ((id) => {
        const p = id ? ops.findBlock(doc, id)?.p : ops.insertionPoint(doc, sel).p;
        if (p === undefined) return null;
        return { subject: ai.module.subject, grade: ai.module.grade, topic: ai.module.title, lang: doc.lang, page: doc.pages[p], competences: ai.module.competences, notes: ai.notes() };
      }),
    helperContext:
      ai &&
      ((id) => {
        const loc = ops.findBlock(doc, id);
        if (!loc) return null;
        const comp = String(doc.pages[loc.p].blocks[loc.i].props.competence ?? '');
        return { subject: ai.module.subject, grade: ai.module.grade, lang: doc.lang, pageTitle: doc.pages[loc.p].title, competence: ai.module.competences.find((c) => c.id === comp) };
      }),
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
      const like = sel ? (sel.kind === 'page' ? sel.p : ops.insertionPoint(doc, sel).p) : doc.pages.length - 1;
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
      // "options#2": the third line of a field, "rows#1.2": a cell of it; "!" counts empty lines too.
      const [, key, mark, line, cell] = /^(\w+)(?:([#!])(\d+)(?:\.(\d+))?)?$/.exec(target.slice(cut + 1)) ?? [];
      if (!key) return;
      // An emptied line would vanish under the cursor and the next one slide in: it goes when editing ends.
      emptied.current = mark && !cell && !value.trim() ? target : null;
      if (emptied.current) return;
      const next = mark ? setPart(str(ops.blocksOf(d, [id])[0]?.props[key]), Number(line), value, cell === undefined ? undefined : Number(cell), mark === '!') : value;
      commit(ops.updateBlock(d, id, { props: { [key]: next } }), { mergeKey: `${id}.${target.slice(cut + 1)}` });
    },
    done: () => {
      const target = emptied.current;
      emptied.current = null;
      if (target) {
        const cut = target.lastIndexOf(':');
        const [, key, mark, line] = /^(\w+)([#!])(\d+)$/.exec(target.slice(cut + 1)) ?? [];
        const id = target.slice(0, cut);
        const d = latest.current.doc;
        if (key) commit(ops.updateBlock(d, id, { props: { [key]: setPart(str(ops.blocksOf(d, [id])[0]?.props[key]), Number(line), '', undefined, mark === '!') } }));
      }
      setInline(null);
    },
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

  // A jump from the search: select the block, bring it to the middle and mark the words found.
  useEffect(() => {
    if (!focus || !ops.findBlock(latest.current.doc, focus.id)) return;
    setPreview(false);
    setInline(null);
    setSel({ kind: 'block', id: focus.id });
    const t = setTimeout(() => {
      const el = document.querySelector(`[data-block-id="${CSS.escape(focus.id)}"]`);
      if (!el) return;
      el.scrollIntoView({ block: 'center', inline: 'nearest' });
      markFound(el, focus.query);
      pulse(el);
    }, 150);
    return () => clearTimeout(t);
  }, [focus?.n]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard: Entf deletes, Esc clears the selection, Cmd/Ctrl+Z undoes, Cmd/Ctrl+D duplicates,
  // Cmd/Ctrl+C/X put the selected blocks into the Ablage, Cmd/Ctrl+V pastes the newest entry, Cmd/Ctrl+A selects
  // all blocks, arrow keys select the previous/next block, Alt+arrow keys move it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { doc, sel, jsonOpen, editing, clips } = latest.current;
      if (jsonOpen || isTyping(document.activeElement) || document.querySelector('.search')) return;
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      const block = sel?.kind === 'block' ? sel.id : null;
      const ids = ops.selectedIds(doc, sel);
      const onCanvas = focusOnCanvas(document.activeElement);
      // Text marked with the mouse is copied as usual.
      const marked = !!window.getSelection()?.toString().trim();
      if (mod && key === 'z') {
        e.preventDefault();
        undo(e.shiftKey);
      } else if (mod && key === 'y') {
        e.preventDefault();
        undo(true);
      } else if (mod && key === 'd' && editing && ids.length) {
        e.preventDefault();
        actions.current.duplicateSelected();
      } else if (mod && (key === 'c' || key === 'x') && editing && ids.length && !marked && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        actions.current.toAblage(ids, key === 'x');
      } else if (mod && key === 'v' && editing && clips.length && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        actions.current.paste();
      } else if (mod && key === 'p' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        setPrintOpen(true);
      } else if (e.key === '?' && !mod) {
        e.preventDefault();
        setKeysOpen(true);
      } else if (e.key === 'Enter' && !mod && !e.defaultPrevented && editing && block && onCanvas) {
        const target = document.querySelector(`[data-block-id="${block}"] [data-edit]`)?.getAttribute('data-edit');
        if (target) {
          e.preventDefault();
          actions.current.startEdit(target, { kind: 'block', id: block });
        }
      } else if (/^[0-3]$/.test(e.key) && !mod && !e.altKey && editing && ids.length && onCanvas) {
        e.preventDefault();
        actions.current.setLevel(ids, e.key === '0' ? '' : e.key);
      } else if (mod && key === 'a' && editing) {
        e.preventDefault();
        setSel(ops.selectionOf(ops.allBlockIds(doc)));
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && editing && ids.length && onCanvas) {
        e.preventDefault();
        actions.current.deleteSelected();
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
        setPicking(false);
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
    } else if (item.kind === 'clip') {
      paste(item.id, target);
    } else {
      commit(ops.moveBlockTo(doc, item.id, target), { select: { kind: 'block', id: item.id } });
    }
  };

  const dragClip = dragItem?.kind === 'clip' ? clips.find((c) => c.id === dragItem.id) : undefined;
  const ghostType = dragItem ? (dragItem.kind === 'new' ? dragItem.type : dragItem.kind === 'clip' ? dragClip?.blocks[0].type : ops.getBlock(doc, dragItem.id)?.type) : undefined;
  const selIds = ops.selectedIds(doc, sel);

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
    onDragStart: ({ active }) => `${dragLabel(active.data.current, latest.current.doc, latest.current.clips)} aufgenommen.`,
    onDragOver: () => undefined,
    onDragEnd: ({ active }) => `${dragLabel(active.data.current, latest.current.doc, latest.current.clips)} abgelegt.`,
    onDragCancel: ({ active }) => `Ziehen von ${dragLabel(active.data.current, latest.current.doc, latest.current.clips)} abgebrochen.`,
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
          onKeys={() => setKeysOpen(true)}
          onTogglePreview={() => setPreview((p) => !p)}
          onPrint={() => setPrintOpen(true)}
          modeLabel={
            !editing
              ? [
                  printMode.solutions ? 'Lösungsfassung' : 'Schülerfassung',
                  printMode.bw ? 'S/W' : 'Farbe',
                  levelCode(printMode.levels) && `Niveau ${levelCode(printMode.levels)}`,
                  printMode.group && `Gruppe ${printMode.group}`,
                ]
                  .filter(Boolean)
                  .join(' · ')
              : undefined
          }
          onSlides={onSlides}
          onPresent={onPresent}
          slideCount={slideCount}
          onRegenerateSlides={onRegenerateSlides && (() => onRegenerateSlides(doc))}
          onDeleteSlides={onDeleteSlides}
          onVersions={onVersions}
          onShareAll={onShare && (() => onShare(doc, null))}
          handouts={handouts}
          onOpenHandout={onOpenHandout}
          onClaude={ai && (() => setAiOpen('lesson'))}
          onVocabAi={ai && ai.module.lang === 'en' ? () => setAiOpen('vocab') : undefined}
          onTaskAi={ai && (() => setAiOpen('task'))}
          onCheckAi={ai && (() => setAiOpen('check'))}
          onFullAi={ai && (() => setAiOpen('full'))}
          onImportPdf={ai && (() => pdfInput.current?.click())}
          onAiSettings={() => setAiOpen('settings')}
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
        <input
          ref={pdfInput}
          type="file"
          accept=".pdf,application/pdf"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) setPdfFile(f);
          }}
        />
        {note && noteOpen && (
          <div className="ed-note" data-noprint="1">
            <span>
              <b>Planung:</b> {note}
            </span>
            {ai && editing && !doc.pages.some((pg) => pg.blocks.length > 0) && (
              <button type="button" className="btn btn-secondary ui-btn ed-note-ai" onClick={() => setAiOpen('lesson')}>
                <Icon icon={Sparkles} />
                Mit Claude ausarbeiten
              </button>
            )}
            <button type="button" className="iconbtn" title="Ausblenden" aria-label="Planung ausblenden" onClick={() => setNoteOpen(false)}>
              <Icon icon={X} size={16} />
            </button>
          </div>
        )}
        <div className="workspace">
          {editing && (
            <Toolbox
              open={!compact || toolboxOpen}
              compact={compact}
              lang={doc.lang}
              favorites={favorites}
              onAdd={api.addBlock}
              clips={clips}
              onPaste={(id) => paste(id)}
              onRemoveClip={(id) => putClips(latest.current.clips.filter((c) => c.id !== id))}
              onClearClips={() => window.confirm('Alles aus der Ablage entfernen?') && putClips([])}
              onClose={() => setToolboxOpen(false)}
            />
          )}
          <InlineEditContext.Provider value={editing ? inlineEdit : null}>
            <SheetModeContext.Provider value={sheetMode}>
              <CompetenceNamesContext.Provider value={competenceNames}>
              <Canvas
                ref={canvasRef}
                api={api}
                zoom={zoom}
                draggingId={dragItem?.kind === 'move' ? dragItem.id : null}
                onBackgroundClick={() => {
                  // While choosing blocks, a tap between them keeps the choice.
                  if (picking) return;
                  select(null);
                  setToolboxOpen(false);
                }}
              />
              </CompetenceNamesContext.Provider>
            </SheetModeContext.Provider>
          </InlineEditContext.Provider>
          {editing && (picking || sel?.kind === 'blocks') && (
            <div className="multi-bar" data-noprint="1" role="toolbar" aria-label="Ausgewählte Bausteine">
              <span className="multi-count">{selIds.length ? `${selIds.length} ${selIds.length === 1 ? 'Baustein' : 'Bausteine'}` : 'Bausteine antippen'}</span>
              <button type="button" disabled={!selIds.length} onClick={() => toAblage(selIds)} title="In die Ablage (⌘C)">
                <Icon icon={ClipboardCopy} />
                <span className="multi-label">In die Ablage</span>
              </button>
              <button type="button" disabled={!selIds.length} onClick={() => toAblage(selIds, true)} title="Ausschneiden (⌘X)">
                <Icon icon={Scissors} />
                <span className="multi-label">Ausschneiden</span>
              </button>
              <button type="button" disabled={!selIds.length} onClick={duplicateSelected} title="Duplizieren (⌘D)">
                <Icon icon={Copy} />
                <span className="multi-label">Duplizieren</span>
              </button>
              {onShare && (
                <button type="button" disabled={!selIds.length} onClick={() => onShare(doc, selIds)} title="Digital austeilen (Link und QR-Code)">
                  <Icon icon={Send} />
                  <span className="multi-label">Austeilen</span>
                </button>
              )}
              <button type="button" className="is-danger" disabled={!selIds.length} onClick={deleteSelected} title="Löschen (Entf)">
                <Icon icon={Trash2} />
                <span className="multi-label">Löschen</span>
              </button>
              <button type="button" className="multi-done" onClick={endPicking}>
                Fertig
              </button>
            </div>
          )}
          {editing && (
            <PropertiesPanel api={api} open={!compact || (panelOpen && sel !== null && inline === null)} compact={compact} onClose={() => setPanelOpen(false)} />
          )}
        </div>
        {printOpen && (
          <PrintDialog
            mode={printMode}
            hasTeacherPages={doc.pages.some((pg) => pg.type === 'lehrkraft')}
            hasLevels={hasLevels(doc)}
            canShuffle={hasShuffle(doc)}
            onPreview={showPreview}
            onPrint={print}
            onClose={() => setPrintOpen(false)}
          />
        )}
        {keysOpen && <KeysDialog onClose={() => setKeysOpen(false)} />}
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
        {aiOpen === 'lesson' && ai && (
          <LessonAiDialog
            doc={doc}
            ai={ai}
            onClose={() => setAiOpen(null)}
            onApply={async (draft) => {
              try {
                await Promise.all(Object.entries(draft.images).map(([id, url]) => putImageAs(id, dataUrlToBlob(url))));
              } catch (e) {
                window.alert('Ein Bild konnte nicht gespeichert werden: ' + errorText(e));
              }
              ai.onApplied(draft.added);
              const { icon, code } = latest.current.doc;
              commit({ ...draft.doc, icon, code }, { select: { kind: 'page', p: 0 } });
              setAiOpen(null);
              setNotice('Von Claude übernommen. Mit Rückgängig oder unter „Frühere Fassungen“ kommst du zur vorherigen Fassung zurück.');
            }}
          />
        )}
        {aiOpen === 'full' && ai && (
          <FullLessonDialog
            doc={doc}
            ai={ai}
            onClose={() => setAiOpen(null)}
            onApply={async (r) => {
              try {
                await Promise.all(Object.entries(r.images).map(([id, url]) => putImageAs(id, dataUrlToBlob(url))));
              } catch (e) {
                window.alert('Ein Bild konnte nicht gespeichert werden: ' + errorText(e));
              }
              ai.onApplied(r.added);
              const { icon, code } = latest.current.doc;
              commit({ ...r.doc, icon, code }, { select: { kind: 'page', p: 0 } });
              ai.setSlides(r.slides);
              setAiOpen(null);
              setNotice(`Stunde und ${r.slides.length} Folien von Claude übernommen. Die vorige Fassung liegt unter „Frühere Fassungen“.`);
            }}
          />
        )}
        {aiOpen === 'settings' && <AiSettingsDialog onClose={() => setAiOpen(null)} />}
        {pdfFile && ai && (
          <PdfImportDialog
            file={pdfFile}
            doc={doc}
            ai={ai}
            onClose={() => setPdfFile(null)}
            onApply={(r) => {
              ai.onApplied(r.added);
              const { icon, code } = latest.current.doc;
              commit({ ...r.doc, icon, code }, { select: { kind: 'page', p: 0 } });
              if (r.title) ai.rename?.(r.title);
              setPdfFile(null);
              setNotice('PDF eingepflegt. Mit Rückgängig oder unter „Frühere Fassungen“ kommst du zur vorherigen Fassung zurück.');
            }}
          />
        )}
        {aiOpen === 'check' && ai && (
          <CheckAiDialog
            doc={doc}
            context={{ subject: ai.module.subject, grade: ai.module.grade, topic: ai.module.title, lang: doc.lang, competences: ai.module.competences, notes: ai.notes() }}
            findings={findings}
            onFindings={setFindings}
            onShow={(id) => {
              setAiOpen(null);
              select({ kind: 'block', id });
              document.querySelector(`[data-block-id="${id}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }}
            onFix={(f) => {
              setAiOpen(null);
              setFixing(f);
            }}
            onClose={() => setAiOpen(null)}
          />
        )}
        {fixing?.blockId && ops.findBlock(doc, fixing.blockId) && api.taskContext?.(fixing.blockId) && (
          <TaskAiDialog
            doc={doc}
            context={api.taskContext(fixing.blockId)!}
            block={ops.blocksOf(doc, [fixing.blockId])[0]}
            initial={fixing.fix}
            onApply={(blocks, how) => {
              if (how === 'replace') api.replaceBlock(fixing.blockId!, blocks);
              else api.insertAfter(fixing.blockId!, blocks);
              setFindings((all) => all && all.filter((x) => x !== fixing));
              setFixing(null);
              setAiOpen('check');
            }}
            onClose={() => {
              setFixing(null);
              setAiOpen('check');
            }}
          />
        )}
        {aiOpen === 'task' && api.taskContext?.(null) && (
          <TaskAiDialog
            doc={doc}
            context={api.taskContext(null)!}
            onClose={() => setAiOpen(null)}
            onApply={(blocks) => {
              const d = latest.current.doc;
              const at = ops.insertionPoint(d, latest.current.sel);
              commit(ops.insertBlocks(d, at.p, at.i, blocks), { select: ops.selectionOf(blocks.map((b) => b.id)) });
              setAiOpen(null);
            }}
          />
        )}
        {aiOpen === 'vocab' && ai && (
          <VocabAiDialog
            scope="lesson"
            grade={ai.module.grade}
            topic={ai.module.title}
            lang={doc.lang}
            kicker={`${ai.module.lang === 'en' ? 'Class' : 'Klasse'} ${ai.module.grade} · Unit ${ai.module.number}`}
            sources={[{ title: ai.lesson.title, doc }]}
            known={[...ai.known(), ...vocabOf([doc]).map((w) => w.en)]}
            onClose={() => setAiOpen(null)}
            onApply={(pages) => {
              const d = latest.current.doc;
              commit({ ...d, pages: [...d.pages, ...pages] }, { select: { kind: 'page', p: d.pages.length } });
              setAiOpen(null);
              setNotice(`${pages.length === 1 ? 'Seite' : `${pages.length} Seiten`} „Vocabulary“ angelegt. Bilder setzt du im Panel der Listen ein; Rückgängig nimmt sie wieder heraus.`);
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
        {ghostType ? <DragGhost type={ghostType} label={dragClip ? clipLabel(dragClip) : undefined} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
