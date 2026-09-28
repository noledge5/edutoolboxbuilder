// Reading a PowerPoint file (.pptx) into slides. Slides the Baukasten exported come back as they were, as long as
// their words were not changed in PowerPoint (see PPTX_SLIDES_PATH). Other slides are read by what is on them:
// a title slide, a slide with a picture, a list of bullet points, a table, or a free slide with its pictures and
// text boxes where they were. Speaker notes come along. `notes` tells the teacher (in German) what was left out.
import type JSZip from 'jszip';
import { uid } from '../model/ops';
import { createElement, createSlide, isSlideDesign, normalizeSlides, type Slide, type SlideDesign, type SlideElement } from '../model/slides';
import { dataUrlToBlob } from '../storage/backup';
import { PPTX_SLIDES_FORMAT, PPTX_SLIDES_PATH, wordsPrint, type PptxSlidesFile } from './pptx';

const A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const P = 'http://schemas.openxmlformats.org/presentationml/2006/main';
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

export interface PptxRead {
  slides: Slide[];
  /** The design of slides the Baukasten exported, if the file has them. */
  design: SlideDesign | null;
  /** How many slides came back exactly as the Baukasten exported them. */
  kept: number;
  notes: string[];
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Para {
  text: string;
  level: number;
}

interface TextShape {
  kind: 'text';
  ph: string;
  rect: Rect | null;
  paras: Para[];
  /** Largest font size in points (0: unknown). */
  size: number;
}

interface PicShape {
  kind: 'pic';
  rect: Rect | null;
  target: string;
}

interface TableShape {
  kind: 'table';
  rect: Rect | null;
  rows: string[][];
}

type Shape = TextShape | PicShape | TableShape;

const xml = (text: string) => new DOMParser().parseFromString(text, 'application/xml');
const kids = (el: Element, ns: string, name: string) => [...el.children].filter((c) => c.namespaceURI === ns && c.localName === name);
const kid = (el: Element | null | undefined, ns: string, name: string) => (el ? (kids(el, ns, name)[0] ?? null) : null);
const all = (el: Element | Document, ns: string, name: string) => [...el.getElementsByTagNameNS(ns, name)];

/** Resolves "../media/image1.png" against "ppt/slides/slide1.xml". */
function resolve(from: string, target: string): string {
  if (target.startsWith('/')) return target.slice(1);
  const parts = from.split('/').slice(0, -1);
  for (const bit of target.split('/')) {
    if (bit === '..') parts.pop();
    else if (bit !== '.') parts.push(bit);
  }
  return parts.join('/');
}

async function relsOf(zip: JSZip, path: string): Promise<Map<string, { type: string; target: string; external: boolean }>> {
  const dir = path.split('/').slice(0, -1).join('/');
  const file = `${dir}/_rels/${path.split('/').pop()}.rels`;
  const text = await zip.file(file)?.async('string');
  const out = new Map<string, { type: string; target: string; external: boolean }>();
  if (!text) return out;
  for (const r of [...xml(text).getElementsByTagName('Relationship')]) {
    const external = r.getAttribute('TargetMode') === 'External';
    const target = r.getAttribute('Target') ?? '';
    out.set(r.getAttribute('Id') ?? '', { type: r.getAttribute('Type') ?? '', target: external ? target : resolve(path, target), external });
  }
  return out;
}

/** Position of a shape in EMU: its own, or that of the matching placeholder of its layout and master. */
function rectOf(el: Element, fallback: Map<string, Rect>): Rect | null {
  const xfrm = all(el, A, 'xfrm')[0];
  const off = kid(xfrm, A, 'off');
  const ext = kid(xfrm, A, 'ext');
  if (off && ext) return { x: +off.getAttribute('x')!, y: +off.getAttribute('y')!, w: +ext.getAttribute('cx')!, h: +ext.getAttribute('cy')! };
  const ph = all(el, P, 'ph')[0];
  if (!ph) return null;
  return fallback.get(`idx:${ph.getAttribute('idx')}`) ?? fallback.get(`type:${ph.getAttribute('type') ?? 'body'}`) ?? null;
}

/** Placeholder positions of a layout or master: by index and by type. */
async function placeholderRects(zip: JSZip, path: string, into: Map<string, Rect>) {
  const text = await zip.file(path)?.async('string');
  if (!text) return;
  for (const sp of all(xml(text), P, 'sp')) {
    const ph = all(sp, P, 'ph')[0];
    const r = ph && rectOf(sp, new Map());
    if (!ph || !r) continue;
    const idx = ph.getAttribute('idx');
    const type = ph.getAttribute('type') ?? 'body';
    if (idx && !into.has(`idx:${idx}`)) into.set(`idx:${idx}`, r);
    if (!into.has(`type:${type}`)) into.set(`type:${type}`, r);
  }
}

/** Paragraphs of a text body, with **bold** where only part of a paragraph is bold. */
function paragraphs(body: Element | null): { paras: Para[]; size: number } {
  const paras: Para[] = [];
  let size = 0;
  for (const p of body ? kids(body, A, 'p') : []) {
    const runs: { text: string; bold: boolean }[] = [];
    for (const c of [...p.children]) {
      if (c.namespaceURI !== A) continue;
      if (c.localName === 'br') runs.push({ text: '\n', bold: false });
      else if (c.localName === 'r' || c.localName === 'fld') {
        const rPr = kid(c, A, 'rPr');
        const sz = Number(rPr?.getAttribute('sz'));
        if (sz) size = Math.max(size, sz / 100);
        runs.push({ text: kid(c, A, 't')?.textContent ?? '', bold: rPr?.getAttribute('b') === '1' });
      }
    }
    const allBold = runs.filter((r) => r.text.trim()).every((r) => r.bold);
    const text = runs
      .map((r) => (r.bold && !allBold && r.text.trim() ? `**${r.text.trim()}**${/\s$/.test(r.text) ? ' ' : ''}` : r.text))
      .join('')
      .replace(/[ \t]+/g, ' ')
      .trim();
    const level = Number(kid(p, A, 'pPr')?.getAttribute('lvl') ?? 0);
    if (text) paras.push({ text, level });
  }
  return { paras, size };
}

/** The shapes of a slide in drawing order, with group positions worked out. */
function shapesOf(tree: Element, fallback: Map<string, Rect>, notes: string[], at: string): Shape[] {
  const out: Shape[] = [];
  const walk = (parent: Element, map: (r: Rect) => Rect) => {
    for (const el of [...parent.children]) {
      if (el.namespaceURI !== P) continue;
      const rect = () => {
        const r = rectOf(el, fallback);
        return r && map(r);
      };
      if (el.localName === 'sp') {
        const ph = all(el, P, 'ph')[0];
        const type = ph ? (ph.getAttribute('type') ?? 'body') : '';
        if (['dt', 'ftr', 'sldNum', 'hdr'].includes(type)) continue;
        const { paras, size } = paragraphs(kid(el, P, 'txBody'));
        if (paras.length) out.push({ kind: 'text', ph: type, rect: rect(), paras, size });
      } else if (el.localName === 'pic') {
        const blip = all(el, A, 'blip')[0];
        const id = blip?.getAttributeNS(R, 'embed') ?? '';
        if (all(el, A, 'videoFile').length || all(el, A, 'audioFile').length) notes.push(`${at}: Ein Video oder Ton wurde nicht übernommen; füge es als Video-Element mit Link ein.`);
        else if (id) out.push({ kind: 'pic', rect: rect(), target: id });
      } else if (el.localName === 'grpSp') {
        const xfrm = all(el, A, 'xfrm')[0];
        const off = kid(xfrm, A, 'off');
        const ext = kid(xfrm, A, 'ext');
        const chOff = kid(xfrm, A, 'chOff');
        const chExt = kid(xfrm, A, 'chExt');
        if (off && ext && chOff && chExt) {
          const sx = +ext.getAttribute('cx')! / (+chExt.getAttribute('cx')! || 1);
          const sy = +ext.getAttribute('cy')! / (+chExt.getAttribute('cy')! || 1);
          const inner = (r: Rect): Rect =>
            map({ x: +off.getAttribute('x')! + (r.x - +chOff.getAttribute('x')!) * sx, y: +off.getAttribute('y')! + (r.y - +chOff.getAttribute('y')!) * sy, w: r.w * sx, h: r.h * sy });
          walk(el, inner);
        } else walk(el, map);
      } else if (el.localName === 'graphicFrame') {
        const tbl = all(el, A, 'tbl')[0];
        if (tbl) {
          const rows = kids(tbl, A, 'tr').map((tr) =>
            kids(tr, A, 'tc').map((tc) =>
              paragraphs(kid(tc, A, 'txBody'))
                .paras.map((p) => p.text)
                .join(' '),
            ),
          );
          out.push({ kind: 'table', rect: rect(), rows: rows.filter((r) => r.some(Boolean)) });
        } else notes.push(`${at}: Ein Diagramm oder SmartArt wurde nicht übernommen.`);
      }
    }
  };
  walk(tree, (r) => r);
  return out;
}

const IMAGE_TYPES: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', bmp: 'image/bmp', webp: 'image/webp', svg: 'image/svg+xml' };

export async function readPptx(file: Blob, store: (image: File) => Promise<string>): Promise<PptxRead> {
  const { default: JSZipLib } = await import('jszip');
  let zip: JSZip;
  try {
    zip = await JSZipLib.loadAsync(file);
  } catch {
    throw new Error('Die Datei ist keine PowerPoint-Datei (.pptx).');
  }
  const presPath = 'ppt/presentation.xml';
  const presText = await zip.file(presPath)?.async('string');
  if (!presText) throw new Error('Die Datei ist keine PowerPoint-Datei (.pptx).');
  const pres = xml(presText);
  const size = all(pres, P, 'sldSz')[0];
  const cx = Number(size?.getAttribute('cx')) || 12192000;
  const cy = Number(size?.getAttribute('cy')) || 6858000;
  // Slides of another size (4:3) are placed in the middle of ours.
  const scale = Math.min(1920 / cx, 1080 / cy);
  const dx = (1920 - cx * scale) / 2;
  const dy = (1080 - cy * scale) / 2;
  const px = (r: Rect) => ({ x: Math.round(r.x * scale + dx), y: Math.round(r.y * scale + dy), w: Math.round(r.w * scale), h: Math.round(r.h * scale) });

  const presRels = await relsOf(zip, presPath);
  const order = all(pres, P, 'sldId')
    .map((s) => presRels.get(s.getAttributeNS(R, 'id') ?? '')?.target ?? '')
    .filter(Boolean);

  // Slides the Baukasten exported.
  let kept: PptxSlidesFile | null = null;
  try {
    const k = JSON.parse((await zip.file(PPTX_SLIDES_PATH)?.async('string')) ?? 'null');
    if (k?.format === PPTX_SLIDES_FORMAT && Array.isArray(k.slides) && Array.isArray(k.prints)) kept = k;
  } catch {
    kept = null;
  }
  const keptSlides = kept ? normalizeSlides(kept.slides) : [];
  const keptImages = new Map<string, string>();
  const keptImage = async (id: string) => {
    if (!id) return '';
    if (keptImages.has(id)) return keptImages.get(id)!;
    const url = kept?.images[id];
    let fresh = '';
    if (url) {
      try {
        const blob = dataUrlToBlob(url);
        fresh = await store(new File([blob], 'bild', { type: blob.type }));
      } catch {
        fresh = '';
      }
    }
    keptImages.set(id, fresh);
    return fresh;
  };

  const notes: string[] = [];
  const slides: Slide[] = [];
  let keptCount = 0;
  const media = new Map<string, string>();

  for (let i = 0; i < order.length; i++) {
    const path = order[i];
    const at = `Folie ${i + 1}`;
    const text = await zip.file(path)?.async('string');
    if (!text) continue;
    const rels = await relsOf(zip, path);

    // Unchanged since the Baukasten exported it: take it back as it was.
    const print = wordsPrint(text);
    const k = kept ? kept.prints.indexOf(print) : -1;
    if (k >= 0 && keptSlides[k]) {
      const s = keptSlides[k];
      slides.push({ ...s, id: uid(), image: await keptImage(s.image), elements: await Promise.all(s.elements.map(async (e) => ({ ...e, image: await keptImage(e.image) }))) });
      keptCount++;
      continue;
    }

    // Placeholder positions from the slide's layout and master.
    const fallback = new Map<string, Rect>();
    const layout = [...rels.values()].find((r) => r.type.endsWith('/slideLayout'));
    if (layout) {
      await placeholderRects(zip, layout.target, fallback);
      const master = [...(await relsOf(zip, layout.target)).values()].find((r) => r.type.endsWith('/slideMaster'));
      if (master) await placeholderRects(zip, master.target, fallback);
    }
    const doc = xml(text);
    const tree = all(doc, P, 'spTree')[0];
    const shapes = tree ? shapesOf(tree, fallback, notes, at) : [];

    // Speaker notes.
    let speaker = '';
    const notesRel = [...rels.values()].find((r) => r.type.endsWith('/notesSlide'));
    const notesText = notesRel && (await zip.file(notesRel.target)?.async('string'));
    if (notesText) {
      const body = all(xml(notesText), P, 'sp').find((sp) => all(sp, P, 'ph')[0]?.getAttribute('type') === 'body');
      speaker = paragraphs(body ? kid(body, P, 'txBody') : null)
        .paras.map((p) => p.text)
        .join('\n');
    }

    // Pictures, stored once each.
    const pictureOf = async (rid: string): Promise<string> => {
      const rel = rels.get(rid);
      if (!rel || rel.external) return '';
      if (media.has(rel.target)) return media.get(rel.target)!;
      const ext = rel.target.split('.').pop()?.toLowerCase() ?? '';
      let id = '';
      if (IMAGE_TYPES[ext]) {
        const bytes = await zip.file(rel.target)?.async('blob');
        if (bytes) id = await store(new File([bytes], rel.target.split('/').pop() ?? 'bild', { type: IMAGE_TYPES[ext] })).catch(() => '');
      } else notes.push(`${at}: Ein Bild im Format ${ext.toUpperCase()} kann der Browser nicht zeigen und wurde weggelassen.`);
      media.set(rel.target, id);
      return id;
    };

    const texts = shapes.filter((s): s is TextShape => s.kind === 'text');
    const pics = shapes.filter((s): s is PicShape => s.kind === 'pic');
    const tables = shapes.filter((s): s is TableShape => s.kind === 'table');
    // The title: a title placeholder, or else the largest writing in the upper part of the slide.
    let title = texts.find((t) => t.ph === 'title' || t.ph === 'ctrTitle');
    if (!title) {
      const upper = texts.filter((t) => !t.rect || t.rect.y < cy * 0.45);
      title = upper.sort((a, b) => b.size - a.size)[0];
      if (title && texts.length > 1 && title.size <= Math.max(...texts.filter((t) => t !== title).map((t) => t.size))) title = undefined;
    }
    const titleText = title ? title.paras.map((p) => p.text).join(' ') : '';
    const rest = texts.filter((t) => t !== title).sort((a, b) => (a.rect && b.rect ? a.rect.y - b.rect.y || a.rect.x - b.rect.x : 0));
    const paras = rest.flatMap((t) => t.paras);
    const base = { type: 'uebung' as const, phase: '', form: '' as const, minutes: 0, notes: speaker, reveal: false };

    if (title && (title.ph === 'ctrTitle' || (i === 0 && !pics.length && paras.length <= 2))) {
      slides.push({ ...createSlide('title'), notes: speaker, title: titleText, text: paras.map((p) => p.text).join('\n') });
    } else if (pics.length === 1 && !tables.length) {
      slides.push({ ...createSlide('image'), ...base, title: titleText, text: paras.map((p) => p.text).join('\n'), image: await pictureOf(pics[0].target), source: '' });
    } else if (pics.length > 1) {
      // Several pictures: a free slide with pictures and text boxes arranged as they were, below the heading.
      const placed = shapes.filter((s) => s !== title && s.rect).map((s) => ({ s, r: px(s.rect!) }));
      const top = titleText ? 330 : 200;
      const bottom = 980;
      const minY = Math.min(...placed.map((p) => p.r.y));
      const maxY = Math.max(...placed.map((p) => p.r.y + p.r.h));
      const minX = Math.min(...placed.map((p) => p.r.x));
      const maxX = Math.max(...placed.map((p) => p.r.x + p.r.w));
      const fit = Math.min(1, (bottom - top) / Math.max(1, maxY - minY), 1728 / Math.max(1, maxX - minX));
      const left = (1920 - (maxX - minX) * fit) / 2;
      const elements: SlideElement[] = [];
      for (const { s, r: raw } of placed) {
        const r = { x: left + (raw.x - minX) * fit, y: top + (raw.y - minY) * fit, w: raw.w * fit, h: raw.h * fit };
        const box = { x: Math.round(Math.max(0, r.x)), y: Math.round(Math.max(0, r.y)), w: Math.round(Math.max(60, Math.min(r.w, 1920))), h: Math.round(Math.max(40, Math.min(r.h, 1080))) };
        box.x = Math.min(box.x, 1920 - box.w);
        box.y = Math.min(box.y, 1080 - box.h);
        if (s.kind === 'pic') elements.push(createElement('image', { ...box, image: await pictureOf(s.target), fit: 'contain' }));
        else if (s.kind === 'text')
          elements.push(createElement('text', { ...box, style: 'plain', size: Math.min(120, Math.max(24, Math.round((s.size || 20) * 2 * fit))), text: s.paras.map((p) => p.text).join('\n') }));
        else elements.push(createElement('text', { ...box, style: 'box', size: 28, text: s.rows.map((row) => row.join(' · ')).join('\n') }));
      }
      slides.push({ ...createSlide('blank'), ...base, title: titleText, elements });
    } else if (tables.length) {
      // A table: one entry per row, the first cell as the entry, the others beside it; the head row goes under the heading.
      const [head, ...rows] = tables.flatMap((t) => t.rows);
      const hasHead = rows.length > 0 && head.length > 1;
      const body = hasHead ? rows : [head];
      const items = body.map((row) => (row.length > 1 ? `${row[0]} | ${row.slice(1).filter(Boolean).join(' · ')}` : row[0]).replace(/\n/g, ' '));
      const intro = [paras.map((p) => p.text).join(' '), hasHead ? head.filter(Boolean).join(' · ') : ''].filter(Boolean).join('\n');
      for (let k = 0; k < Math.max(1, Math.ceil(items.length / 8)); k++)
        slides.push({ ...createSlide('list'), ...base, title: k ? `${titleText} (${k + 1})` : titleText, text: intro, items: items.slice(k * 8, k * 8 + 8).join('\n') });
    } else if (!paras.length) {
      slides.push({ ...createSlide('statement'), ...base, label: '', title: titleText, text: '' });
    } else if (paras.length === 1 && paras[0].text.length > 90) {
      slides.push({ ...createSlide('list'), ...base, title: titleText, text: paras[0].text, items: '' });
    } else {
      // Bullet points: one entry each; deeper levels join the point above.
      const items: string[] = [];
      for (const p of paras) {
        const one = p.text.replace(/\s*\n\s*/g, ' ').replace(/\|/g, '/');
        if (p.level > 0 && items.length) items[items.length - 1] += ` – ${one}`;
        else items.push(one);
      }
      for (let k = 0; k < Math.ceil(items.length / 8); k++)
        slides.push({ ...createSlide('list'), ...base, title: k ? `${titleText} (${k + 1})` : titleText, text: '', items: items.slice(k * 8, k * 8 + 8).join('\n') });
    }
  }
  if (!order.length) notes.push('Die Datei enthält keine Folien.');
  const design = kept && isSlideDesign(kept.design) && keptCount === slides.length ? kept.design : null;
  return { slides, design, kept: keptCount, notes };
}
