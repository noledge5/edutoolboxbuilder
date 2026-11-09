// From a raw picture to the finished layer of a part (480 × 480, transparent where empty), the same steps in the
// script (`npm run lq:bilder`, scaling with sharp) and on the teacher page (upload, scaling with canvas). Only the
// scaling differs, so it is passed in; everything else is the pure pixel work of pixel.ts.
import type { Slot } from '../teile.ts';
import { aenderung, drehen, einpassen, freistellen, grauWeg, hatTransparenz, hexRgb, sichtbar, umformen, verschieben, verschiebung, type Anpassung, type Box } from './pixel.ts';
import { EBENE_GROESSE as G, EDIT_BEREICH, HINTERGRUND_FARBE, KLEIDUNG_EDIT_MASKE, KLEIDUNG_MASKE, PLAETZE } from './vorlagen.ts';

export interface Roh {
  data: Uint8Array;
  w: number;
  h: number;
}

/** Fine-tuning per part (src/lernquest/bilder/anpassen.json, or the sliders on the teacher page): `s`, `dx`, `dy`,
 *  `r` place a part made on its own (and move a finished layer, `ebeneAnpassen`); `toleranz` and `loecher` cut the background away (`loecher`: also enclosed grey
 *  patches); `schwelle` = how different a pixel of an edit must be from the base figure to count (default 30). */
export interface Einstellung extends Anpassung {
  toleranz?: number;
  loecher?: boolean;
  schwelle?: number;
}

/** Scales the box of a picture to w × h pixels (RGBA): sharp in the script, canvas in the browser. */
export type Skalieren = (r: Roh, box: Box, w: number, h: number) => Uint8Array | Promise<Uint8Array>;

type Rechteck = { x: number; y: number; width: number; height: number; rx: number };

/** A mask of rounded rectangles (canvas units 0–240) at layer size, 255 = keep, with a soft edge of about 2 px. */
export function rechteckMaske(rechtecke: Rechteck[], groesse = G): Uint8Array {
  const k = groesse / 240;
  const out = new Uint8Array(groesse * groesse);
  for (const r of rechtecke) {
    const cx = (r.x + r.width / 2) * k;
    const cy = (r.y + r.height / 2) * k;
    const hx = (r.width / 2) * k;
    const hy = (r.height / 2) * k;
    const rad = Math.min(r.rx * k, hx, hy);
    for (let y = 0; y < groesse; y++)
      for (let x = 0; x < groesse; x++) {
        // Signed distance to the rounded rectangle (negative inside).
        const qx = Math.abs(x + 0.5 - cx) - hx + rad;
        const qy = Math.abs(y + 0.5 - cy) - hy + rad;
        const d = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rad;
        const v = Math.round(255 * Math.min(1, Math.max(0, 0.5 - d / 4)));
        if (v > out[y * groesse + x]) out[y * groesse + x] = v;
      }
  }
  return out;
}

/** The clothes masks: for a picture painted on the whole figure, and for the change of an edit (off the hands). */
export const kleidungsMaske = () => rechteckMaske([KLEIDUNG_MASKE]);
export const kleidungEditMaske = () => rechteckMaske(KLEIDUNG_EDIT_MASKE);

const maskieren = (data: Uint8Array, maske: Uint8Array) => {
  for (let p = 0; p < maske.length; p++) data[p * 4 + 3] = Math.round((data[p * 4 + 3] * maske[p]) / 255);
};

/** A part made on its own (head, eyes, tool, companion): background cut away (unless the picture already has
 *  transparency), trimmed and placed into its box on an empty layer. Changes `r.data` (the cut-out). */
export async function einzelEbene(r: Roh, slot: Slot, a: Einstellung, skalieren: Skalieren): Promise<Roh> {
  if (!hatTransparenz(r.data)) freistellen(r.data, r.w, r.h, a.toleranz, a.loecher);
  if (a.r) r = drehen(r.data, r.w, r.h, a.r);
  const box = sichtbar(r.data, r.w, r.h);
  if (!box) throw new Error('nach dem Freistellen ist nichts mehr zu sehen (Toleranz kleiner?)');
  const z = einpassen(box.w, box.h, PLAETZE[slot], G, a);
  const l = Math.max(0, z.left);
  const t = Math.max(0, z.top);
  if (Math.min(G, z.left + z.width) <= l || Math.min(G, z.top + z.height) <= t)
    throw new Error('liegt ganz außerhalb der Fläche (Anpassung prüfen)');
  const teil = await skalieren(r, box, z.width, z.height);
  const data = new Uint8Array(G * G * 4);
  // Only what lies on the layer.
  for (let y = t; y < Math.min(G, z.top + z.height); y++) {
    const von = ((y - z.top) * z.width + (l - z.left)) * 4;
    const bis = von + (Math.min(G, z.left + z.width) - l) * 4;
    data.set(teil.subarray(von, bis), (y * G + l) * 4);
  }
  return { data, w: G, h: G };
}

/** A picture painted on the whole base figure (clothes by inpainting): only the torso stays. Changes `e.data`. */
export function figurEbene(e: Roh): Roh {
  maskieren(e.data, kleidungsMaske());
  return e;
}

/** A background: the whole picture, fully opaque. Changes `e.data`. */
export function flaecheEbene(e: Roh): Roh {
  for (let i = 3; i < e.data.length; i += 4) e.data[i] = 255;
  return e;
}

/** The part of an edit picture: what changed against the base figure it was painted on (both at layer size on the
 *  same flat grey), moved back if the model shifted the figure; clothes also stay off the hands. `bereich` is the
 *  place, `haare` or `mund`. */
export function editEbene(
  basis: Uint8Array,
  bild: Uint8Array,
  bereich: Slot | 'haare' | 'mund',
  a: Einstellung = {},
): { ebene: Roh; dx: number; dy: number } {
  const k = G / 240;
  const b = EDIT_BEREICH[bereich];
  const box = { x: Math.round(b.x * k), y: Math.round(b.y * k), w: Math.round(b.width * k), h: Math.round(b.height * k) };
  const v = verschiebung(basis, bild, G, G, 12, box);
  const zurueck = v.dx || v.dy ? verschieben(bild, G, G, v.dx, v.dy) : bild;
  const data = aenderung(basis, zurueck, G, G, box, a.schwelle);
  if (bereich !== 'haare' && bereich !== 'mund' && PLAETZE[bereich].weg === 'figur') maskieren(data, kleidungEditMaske());
  if (!sichtbar(data, G, G)) throw new Error('keine Änderung gefunden (schwelle kleiner?)');
  return { ebene: { data, w: G, h: G }, dx: v.dx, dy: v.dy };
}

/** A finished layer (a built-in or uploaded picture) fine-tuned: grey left around the part cut away (`toleranz`, off
 *  when 0 or missing), then moved (`dx`, `dy` in canvas units), scaled (`s`) and turned (`r`) around the middle of
 *  what is visible. With no settings it stays as it is. */
export function ebeneAnpassen(e: Roh, a: Einstellung): Roh {
  const data = new Uint8Array(e.data);
  if (a.toleranz) grauWeg(data, e.w, e.h, hexRgb(HINTERGRUND_FARBE), a.toleranz);
  const k = e.w / 240;
  const out = umformen(data, e.w, e.h, { s: a.s, r: a.r, dx: (a.dx ?? 0) * k, dy: (a.dy ?? 0) * k });
  if (!sichtbar(out, e.w, e.h)) throw new Error('nichts mehr zu sehen (Freistellen kleiner?)');
  return { data: out, w: e.w, h: e.h };
}
