// The upload on the teacher page: a raw picture from ComfyUI becomes the layer of a part in the browser, with the
// same steps as `npm run lq:bilder` (bilder/ebene.ts); only the scaling is done by a canvas here. Then it is encoded
// for the server (WebP where the browser can, else PNG; backgrounds as JPEG), at most 400 KB.
import { ebeneAnpassen, editEbene, einzelEbene, flaecheEbene, type Einstellung, type Roh, type Skalieren } from '../bilder/ebene';
import { randFarbe } from '../bilder/pixel';
import { EBENE_GROESSE as G, HINTERGRUND_FARBE } from '../bilder/vorlagen';
import { TEIL_BILDER } from '../app/teilBilder';
import type { Slot } from '../teile';

/** How a raw picture becomes a layer: made on its own on grey (`einzeln`), an edit of the base figure (`edit`), a
 *  whole background (`flaeche`). The first one per place is the usual way (docs/design/lernquest/bilder.md). A
 *  finished layer (the built-in or uploaded picture) is only fine-tuned (`ebene`). */
export type Weg = 'einzeln' | 'edit' | 'flaeche' | 'ebene';
export const WEGE: Record<Slot, Weg[]> = {
  kopf: ['einzeln', 'edit'],
  augen: ['edit', 'einzeln'],
  kleidung: ['edit'],
  werkzeug: ['einzeln', 'edit'],
  begleiter: ['einzeln', 'edit'],
  hintergrund: ['flaeche'],
};

/** Server limit for one picture. */
export const MAX_BYTES = 400_000;
/** Raw pictures are scaled down to this before the work (ComfyUI gives 1024). */
const ROH_MAX = 1024;

const leinwand = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};
const zeichner = (c: HTMLCanvasElement) => {
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Der Browser kann hier keine Bilder bearbeiten.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return ctx;
};
const pixel = (ctx: CanvasRenderingContext2D, w: number, h: number) => new Uint8Array(ctx.getImageData(0, 0, w, h).data.buffer);
const aufLeinwand = (r: Roh) => {
  const c = leinwand(r.w, r.h);
  zeichner(c).putImageData(new ImageData(new Uint8ClampedArray(r.data), r.w, r.h), 0, 0);
  return c;
};

/** The canvas way of scaling a box of a picture (for `einzelEbene`). */
const mitCanvas: Skalieren = (r, box, w, h) => {
  const c = leinwand(w, h);
  const ctx = zeichner(c);
  ctx.drawImage(aufLeinwand(r), box.x, box.y, box.w, box.h, 0, 0, w, h);
  return pixel(ctx, w, h);
};

/** A chosen file, opened: the picture and its pixels (at most 1024 px wide). */
export interface Quelle {
  bild: ImageBitmap;
  roh: Roh;
}

export async function oeffnen(datei: Blob): Promise<Quelle> {
  let bild: ImageBitmap;
  try {
    bild = await createImageBitmap(datei);
  } catch {
    throw new Error('Das Bild lässt sich nicht öffnen. Geht: PNG, WebP oder JPEG.');
  }
  if (bild.width < 64 || bild.height < 64 || bild.width > 8000 || bild.height > 8000)
    throw new Error(`Das Bild ist ${bild.width} × ${bild.height} groß; es sollte etwa 1024 × 1024 sein.`);
  const k = Math.min(1, ROH_MAX / Math.max(bild.width, bild.height));
  const w = Math.round(bild.width * k);
  const h = Math.round(bild.height * k);
  const c = leinwand(w, h);
  const ctx = zeichner(c);
  ctx.drawImage(bild, 0, 0, w, h);
  return { bild, roh: { data: pixel(ctx, w, h), w, h } };
}

/** A whole picture at layer size on a flat colour (an edit and its base are compared like this). */
function aufGrund(bild: CanvasImageSource, farbe: string): Uint8Array {
  const c = leinwand(G, G);
  const ctx = zeichner(c);
  ctx.fillStyle = farbe;
  ctx.fillRect(0, 0, G, G);
  ctx.drawImage(bild, 0, 0, G, G);
  return pixel(ctx, G, G);
}

let grundfigur: Promise<HTMLImageElement> | undefined;
/** The painted base figure (koerper-0.webp) the edits were made on. */
function grundfigurLaden(): Promise<HTMLImageElement> {
  const url = TEIL_BILDER['koerper-0'];
  if (!url) return Promise.reject(new Error('Für ein Edit fehlt die gemalte Grundfigur in der App.'));
  return (grundfigur ??= new Promise((ok, fehler) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => {
      grundfigur = undefined;
      fehler(new Error('Die Grundfigur lädt nicht.'));
    };
    img.src = url;
  }));
}

/** The layer of a part from a raw picture (480 × 480, RGBA). */
export async function ebeneMachen(q: Quelle, slot: Slot, weg: Weg, a: Einstellung): Promise<Roh> {
  if (weg === 'ebene') {
    const c = leinwand(G, G);
    const ctx = zeichner(c);
    ctx.drawImage(q.bild, 0, 0, G, G);
    const e = { data: pixel(ctx, G, G), w: G, h: G };
    return slot === 'hintergrund' ? flaecheEbene(ebeneAnpassen(e, a)) : ebeneAnpassen(e, a);
  }
  if (weg === 'flaeche') {
    // Cover: the middle square of the picture.
    const s = Math.min(q.bild.width, q.bild.height);
    const c = leinwand(G, G);
    const ctx = zeichner(c);
    ctx.drawImage(q.bild, (q.bild.width - s) / 2, (q.bild.height - s) / 2, s, s, 0, 0, G, G);
    return flaecheEbene({ data: pixel(ctx, G, G), w: G, h: G });
  }
  if (weg === 'einzeln') return einzelEbene({ ...q.roh, data: new Uint8Array(q.roh.data) }, slot, a, mitCanvas);
  if (Math.abs(q.bild.width - q.bild.height) > 2)
    throw new Error(`Ein Edit muss quadratisch sein wie die Grundfigur (ist ${q.bild.width} × ${q.bild.height}).`);
  const bild = aufGrund(q.bild, HINTERGRUND_FARBE);
  // The base figure on the grey the edit model left around the figure, so only the part differs.
  const [r, g, b] = randFarbe(bild, G, G);
  const basis = aufGrund(await grundfigurLaden(), `rgb(${r}, ${g}, ${b})`);
  return editEbene(basis, bild, slot, a).ebene;
}

/** A picture by its address (the built-in or uploaded layer of a part), opened like a chosen file. */
export async function oeffnenUrl(url: string): Promise<Quelle> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Das Bild lädt nicht.');
  return oeffnen(await res.blob());
}

/** The painted base figure on grey at 1024 × 1024, as the edit model gets it (the edit prompts expect this). */
export async function grundfigurDataUrl(): Promise<string> {
  const c = leinwand(1024, 1024);
  const ctx = zeichner(c);
  ctx.fillStyle = HINTERGRUND_FARBE;
  ctx.fillRect(0, 0, 1024, 1024);
  ctx.drawImage(await grundfigurLaden(), 0, 0, 1024, 1024);
  return c.toDataURL('image/png');
}

const blob = (c: HTMLCanvasElement, typ: string, q?: number) =>
  new Promise<Blob | null>((ok) => c.toBlob(ok, typ, q));

/** The layer as a file for the server: WebP where the browser can encode it (else PNG; a background JPEG), at most
 *  400 KB. */
export async function kodieren(e: Roh, slot: Slot): Promise<Blob> {
  const c = aufLeinwand(e);
  for (const q of [0.85, 0.7, 0.55]) {
    const b = await blob(c, 'image/webp', q);
    if (b?.type !== 'image/webp') break; // Safari: no WebP encoder
    if (b.size <= MAX_BYTES) return b;
  }
  const b = slot === 'hintergrund' ? await blob(c, 'image/jpeg', 0.85) : await blob(c, 'image/png');
  if (!b) throw new Error('Das Bild ließ sich nicht speichern.');
  if (b.size > MAX_BYTES)
    throw new Error(`Das fertige Bild ist mit ${Math.round(b.size / 1000)} KB zu groß (höchstens 400 KB). In Chrome wird es als WebP kleiner.`);
  return b;
}

export async function alsBase64(b: Blob): Promise<string> {
  const bytes = new Uint8Array(await b.arrayBuffer());
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
