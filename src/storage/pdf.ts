// Reading a worksheet PDF in the browser (pdf.js, loaded only when needed): each page as a picture for Claude (with
// the pictures found in it framed and named, and 10 % marks on the edges), its text, and later the figures cut out of
// the page at a higher resolution.
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

/** A box on a page in percent of its width and height: x, y (top left), w, h. */
export type Box = [number, number, number, number];

/** A picture embedded in the PDF, found from the drawing commands: "B1" on page 1 … */
export interface PdfCandidate {
  id: string;
  /** Page number, from 1. */
  page: number;
  box: Box;
}

export interface PdfPage {
  /** The page as Claude sees it: JPEG, base64 without the data: prefix. */
  jpeg: string;
  /** The text layer in reading order ('' for a scan). */
  text: string;
  /** No text layer, or one picture over the whole page: a scan or a photo. */
  scan: boolean;
}

export interface PdfRead {
  pages: PdfPage[];
  candidates: PdfCandidate[];
  /** Pages in the file (only the first `MAX_PAGES` are read). */
  pageCount: number;
  doc: PDFDocumentProxy;
  /** Frees the document and its worker. */
  close(): void;
}

export const MAX_PAGES = 8;
/** Long edge of the page pictures for Claude (larger ones are scaled down by the API anyway). */
const FOR_CLAUDE = 1568;
/** Width of the page when figures are cut out. */
const FOR_FIGURES = 1800;

// The legacy build: also for iPads a few versions behind.
async function pdfjs() {
  const lib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const { default: worker } = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url');
  lib.GlobalWorkerOptions.workerSrc = worker;
  return lib;
}

type Matrix = [number, number, number, number, number, number];
const mul = (m: Matrix, n: Matrix): Matrix => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
];
const apply = (m: Matrix, x: number, y: number): [number, number] => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

/** Overlap of two boxes, as a share of the smaller one. */
function overlap(a: Box, b: Box): number {
  const w = Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0]);
  const h = Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]);
  if (w <= 0 || h <= 0) return 0;
  return (w * h) / Math.min(a[2] * a[3], b[2] * b[3]);
}

/**
 * Where the page paints pictures, in percent of the page. Follows the transformation matrix through save/restore,
 * transform and form XObjects; a picture fills the unit square of the matrix in effect when it is painted.
 */
async function pictureBoxes(page: PDFPageProxy, OPS: Record<string, number>): Promise<Box[]> {
  const viewport = page.getViewport({ scale: 1 });
  const list = await page.getOperatorList();
  const stack: Matrix[] = [];
  let ctm: Matrix = [1, 0, 0, 1, 0, 0];
  const out: Box[] = [];
  const paints = new Set([OPS.paintImageXObject, OPS.paintInlineImageXObject, OPS.paintImageXObjectRepeat, OPS.paintImageMaskXObject]);
  list.fnArray.forEach((fn, i) => {
    const args = list.argsArray[i] as unknown[];
    if (fn === OPS.save) stack.push(ctm);
    else if (fn === OPS.restore) ctm = stack.pop() ?? ctm;
    else if (fn === OPS.transform) ctm = mul(ctm, args as Matrix);
    else if (fn === OPS.paintFormXObjectBegin) {
      stack.push(ctm);
      const m = args[0] as Matrix | null;
      if (Array.isArray(m) && m.length === 6) ctm = mul(ctm, m);
    } else if (fn === OPS.paintFormXObjectEnd) ctm = stack.pop() ?? ctm;
    else if (paints.has(fn)) {
      const corners = [apply(ctm, 0, 0), apply(ctm, 1, 0), apply(ctm, 0, 1), apply(ctm, 1, 1)].map(([x, y]) => viewport.convertToViewportPoint(x, y));
      const xs = corners.map((c) => c[0]);
      const ys = corners.map((c) => c[1]);
      const x = Math.max(0, Math.min(...xs));
      const y = Math.max(0, Math.min(...ys));
      const w = Math.min(viewport.width, Math.max(...xs)) - x;
      const h = Math.min(viewport.height, Math.max(...ys)) - y;
      if (w > 0 && h > 0) out.push([(100 * x) / viewport.width, (100 * y) / viewport.height, (100 * w) / viewport.width, (100 * h) / viewport.height]);
    }
  });
  return out;
}

/** The text layer, line by line. */
async function pageText(page: PDFPageProxy): Promise<string> {
  const content = await page.getTextContent();
  let text = '';
  for (const item of content.items) {
    if (!('str' in item)) continue;
    text += item.str + (item.hasEOL ? '\n' : '');
  }
  return text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

async function renderPage(page: PDFPageProxy, scale: number): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  return canvas;
}

/** The marks Claude reads boxes from: 10 % ticks on the edges, the found pictures framed with their id. */
function annotate(canvas: HTMLCanvasElement, candidates: PdfCandidate[]) {
  const ctx = canvas.getContext('2d')!;
  const { width: W, height: H } = canvas;
  ctx.strokeStyle = 'rgba(0, 120, 220, 0.8)';
  ctx.fillStyle = 'rgba(0, 120, 220, 0.9)';
  ctx.lineWidth = 2;
  ctx.font = `${Math.round(W / 70)}px sans-serif`;
  for (let k = 1; k < 10; k++) {
    const x = (W * k) / 10;
    const y = (H * k) / 10;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H / 90);
    ctx.moveTo(x, H);
    ctx.lineTo(x, H - H / 90);
    ctx.moveTo(0, y);
    ctx.lineTo(W / 90, y);
    ctx.moveTo(W, y);
    ctx.lineTo(W - W / 90, y);
    ctx.stroke();
    ctx.fillText(String(k * 10), x + 3, H / 45);
    ctx.fillText(String(k * 10), W / 80, y - 3);
  }
  ctx.lineWidth = 3;
  for (const c of candidates) {
    const [x, y, w, h] = [(c.box[0] * W) / 100, (c.box[1] * H) / 100, (c.box[2] * W) / 100, (c.box[3] * H) / 100];
    ctx.strokeStyle = 'rgba(220, 0, 120, 0.9)';
    ctx.strokeRect(x, y, w, h);
    const label = ` ${c.id} `;
    const tw = ctx.measureText(label).width;
    const th = W / 55;
    ctx.fillStyle = 'rgba(220, 0, 120, 0.95)';
    ctx.fillRect(x, y, tw, th);
    ctx.fillStyle = '#fff';
    ctx.fillText(label, x, y + th * 0.78);
  }
}

const base64Of = (canvas: HTMLCanvasElement, quality = 0.82) => canvas.toDataURL('image/jpeg', quality).split(',')[1];

/** Reads the first pages of a PDF: pictures for Claude, text, found pictures. */
export async function readPdf(file: File): Promise<PdfRead> {
  const lib = await pdfjs();
  let doc: PDFDocumentProxy;
  const task = lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  try {
    doc = await task.promise;
  } catch (e) {
    const name = e instanceof Error ? e.name : '';
    throw new Error(name === 'PasswordException' ? 'Das PDF ist mit einem Passwort geschützt.' : 'Die Datei lässt sich nicht als PDF lesen.');
  }
  const pages: PdfPage[] = [];
  const candidates: PdfCandidate[] = [];
  const OPS = lib.OPS as unknown as Record<string, number>;
  for (let n = 1; n <= Math.min(doc.numPages, MAX_PAGES); n++) {
    const page = await doc.getPage(n);
    const text = await pageText(page);
    // Pictures worth taking over: not tiny (icons, bullets), not the whole page (a scan or a background).
    const boxes: Box[] = [];
    let whole = false;
    for (const b of await pictureBoxes(page, OPS)) {
      if (b[2] * b[3] > 75 * 75) whole = true;
      else if (b[2] >= 6 && b[3] >= 4 && !boxes.some((o) => overlap(o, b) > 0.8)) boxes.push(b);
    }
    const scan = text.replace(/\s/g, '').length < 20 || (whole && text.replace(/\s/g, '').length < 200);
    const own = (scan ? [] : boxes).map((box, i): PdfCandidate => ({ id: `B${candidates.length + i + 1}`, page: n, box: box.map((v) => Math.round(v * 10) / 10) as Box }));
    candidates.push(...own);
    const base = page.getViewport({ scale: 1 });
    const canvas = await renderPage(page, FOR_CLAUDE / Math.max(base.width, base.height));
    annotate(canvas, own);
    pages.push({ jpeg: base64Of(canvas), text, scan });
    canvas.width = canvas.height = 0;
    page.cleanup();
  }
  return { pages, candidates, pageCount: doc.numPages, doc, close: () => void task.destroy() };
}

/** Cuts a figure out of a page (box in percent, with a small margin) as a JPEG data URL. */
export async function cropFigure(doc: PDFDocumentProxy, pageNumber: number, box: Box, margin = 0.6): Promise<string> {
  const page = await doc.getPage(pageNumber);
  const base = page.getViewport({ scale: 1 });
  const canvas = await renderPage(page, FOR_FIGURES / base.width);
  const { width: W, height: H } = canvas;
  const x0 = Math.max(0, ((box[0] - margin) * W) / 100);
  const y0 = Math.max(0, ((box[1] - margin) * H) / 100);
  const x1 = Math.min(W, ((box[0] + box[2] + margin) * W) / 100);
  const y1 = Math.min(H, ((box[1] + box[3] + margin) * H) / 100);
  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.round(x1 - x0));
  out.height = Math.max(1, Math.round(y1 - y0));
  out.getContext('2d')!.drawImage(canvas, x0, y0, x1 - x0, y1 - y0, 0, 0, out.width, out.height);
  canvas.width = canvas.height = 0;
  page.cleanup();
  return out.toDataURL('image/jpeg', 0.9);
}
