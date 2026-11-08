// Turns pictures from ComfyUI into the hero's layers (docs/design/lernquest/bilder.md). Runs in plain Node (>= 22.18):
//   npm run lq:bilder                     raw pictures from lernquest-roh/ → src/lernquest/app/teile/<id>.webp
//   npm run lq:bilder -- --ordner <pfad>  raw pictures from another folder
//   npm run lq:bilder -- --prompts        writes docs/design/lernquest/bilder/prompts.md and edit-prompts.md
//   npm run lq:bilder -- --schablonen     writes the masks and the overview of places next to it
// A raw picture is named after its part (`krone.png`, also `krone_00003_.png` as ComfyUI saves it); the bald base
// figure is `koerper.png`, its skin tones 2–6 `koerper_h1.png` … `koerper_h5.png` (edits of it; missing ones are
// recoloured). Every layer is the whole canvas (480 × 480, transparent where empty), so the app only stacks them.
// Pictures from an edit model (a part or a hair `haare-<id>` painted onto koerper.png) go to lernquest-roh/edit/: only
// what changed against koerper.png is kept, so it lies exactly where the model painted it; hair also in every colour.
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import sharp, { type OverlayOptions } from 'sharp';
import {
  aenderung,
  einpassen,
  freistellen,
  hatTransparenz,
  hautMessen,
  hautUmfaerben,
  haareUmfaerben,
  hexRgb,
  mittelFarbe,
  sichtbar,
  type Anpassung,
  verschieben,
  verschiebung,
} from '../src/lernquest/bilder/pixel.ts';
import {
  AUGEN_MASKE,
  EBENE_GROESSE as G,
  EDIT_BEREICH,
  editListe,
  HAUT_PUNKTE,
  HINTERGRUND_FARBE,
  KLEIDUNG_EDIT_MASKE,
  KLEIDUNG_MASKE,
  PLAETZE,
  promptListe,
  ROH_GROESSE,
} from '../src/lernquest/bilder/vorlagen.ts';
import { FRISUREN, HAARFARBEN, HAUT, MUENDER, teil, TEILE } from '../src/lernquest/teile.ts';

const WURZEL = resolve(import.meta.dirname, '..');
const ZIEL = join(WURZEL, 'src/lernquest/app/teile');
const DOKU = join(WURZEL, 'docs/design/lernquest/bilder');
const args = process.argv.slice(2);
const wert = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

/** Fine-tuning per part from src/lernquest/bilder/anpassen.json; `toleranz` and `loecher` for cutting away the
 *  background (`loecher`: also enclosed grey patches, e.g. between the legs); `schwelle` for edit pictures (how
 *  different a pixel must be from the base figure to count as the part, default 30). */
interface Anpassungen extends Anpassung {
  toleranz?: number;
  loecher?: boolean;
  schwelle?: number;
}

type Roh = { data: Uint8Array; w: number; h: number };

async function laden(datei: string): Promise<Roh> {
  const { data, info } = await sharp(datei).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return {
    data: new Uint8Array(data.buffer, data.byteOffset, data.length),
    w: info.width,
    h: info.height,
  };
}

const roh = (r: Roh) => sharp(Buffer.from(r.data), { raw: { width: r.w, height: r.h, channels: 4 } });

async function speichern(name: string, r: Roh) {
  await roh(r)
    .webp({ quality: 85, alphaQuality: 90, effort: 5 })
    .toFile(join(ZIEL, `${name}.webp`));
}

/** A mask drawn from SVG at layer size, white = keep, with a soft edge. */
async function maske(form: string, groesse: number): Promise<Uint8Array> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${groesse}" height="${groesse}" viewBox="0 0 240 240"><rect width="240" height="240"/>${form}</svg>`;
  const { data } = await sharp(Buffer.from(svg)).blur(1.2).greyscale().raw().toBuffer({ resolveWithObject: true });
  return new Uint8Array(data);
}
const kleidungForm = () => {
  const m = KLEIDUNG_MASKE;
  return `<rect x="${m.x}" y="${m.y}" width="${m.width}" height="${m.height}" rx="${m.rx}" fill="#fff"/>`;
};
const kleidungEditForm = () =>
  KLEIDUNG_EDIT_MASKE.map(
    (m) => `<rect x="${m.x}" y="${m.y}" width="${m.width}" height="${m.height}" rx="${m.rx}" fill="#fff"/>`,
  ).join('');
const augenForm = () =>
  `<ellipse cx="${AUGEN_MASKE.cx}" cy="${AUGEN_MASKE.cy}" rx="${AUGEN_MASKE.rx}" ry="${AUGEN_MASKE.ry}" fill="#fff"/>`;

/** Resized to the layer, the whole picture (the base figure and clothes are painted on the canvas itself). */
async function aufEbene(r: Roh): Promise<Roh> {
  if (Math.abs(r.w - r.h) > 2) throw new Error(`muss quadratisch sein (ist ${r.w} × ${r.h})`);
  const { data } = await roh(r).resize(G, G).raw().toBuffer({ resolveWithObject: true });
  return { data: new Uint8Array(data), w: G, h: G };
}

/** For comparing an edit with its base: on the flat grey background (transparent areas too), at layer size. */
async function aufGrau(datei: string): Promise<Roh> {
  const r = await sharp(datei)
    .flatten({ background: HINTERGRUND_FARBE })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return aufEbene({ data: new Uint8Array(r.data), w: r.info.width, h: r.info.height });
}

/** A part made on its own: background cut away, trimmed and placed into its box on an empty layer. */
async function einzeln(r: Roh, id: string, a: Anpassungen): Promise<Roh> {
  if (!hatTransparenz(r.data)) freistellen(r.data, r.w, r.h, a.toleranz, a.loecher);
  const box = sichtbar(r.data, r.w, r.h);
  if (!box) throw new Error('nach dem Freistellen ist nichts mehr zu sehen (Toleranz kleiner?)');
  const platz = PLAETZE[teil(id)!.slot];
  const z = einpassen(box.w, box.h, platz, G, a);
  let bild = await roh(r)
    .extract({ left: box.x, top: box.y, width: box.w, height: box.h })
    .resize(z.width, z.height)
    .png()
    .toBuffer();
  // Keep what lies outside the layer away, sharp only composites inside.
  const l = Math.max(0, z.left);
  const t = Math.max(0, z.top);
  const w = Math.min(G, z.left + z.width) - l;
  const h = Math.min(G, z.top + z.height) - t;
  if (w <= 0 || h <= 0) throw new Error('liegt ganz außerhalb der Fläche (Anpassung prüfen)');
  if (w !== z.width || h !== z.height)
    bild = await sharp(bild)
      .extract({ left: l - z.left, top: t - z.top, width: w, height: h })
      .toBuffer();
  const { data } = await sharp({
    create: {
      width: G,
      height: G,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: bild, left: l, top: t }])
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data: new Uint8Array(data), w: G, h: G };
}

async function bauen() {
  const ordner = resolve(WURZEL, wert('--ordner') ?? 'lernquest-roh');
  if (!existsSync(ordner)) throw new Error(`Ordner fehlt: ${ordner} (Rohbilder dort ablegen oder --ordner angeben)`);
  const anpassen: Record<string, Anpassungen> = JSON.parse(
    await readFile(join(WURZEL, 'src/lernquest/bilder/anpassen.json'), 'utf8'),
  );
  const frisuren = FRISUREN.filter((f) => f.id !== 'glatze').map((f) => `haare-${f.id}`);
  const munder = MUENDER.map((m) => `mund-${m.id}`);
  const gueltig = new Set(['koerper', ...HAUT.map((_, i) => `koerper_h${i}`), ...frisuren, ...munder, ...TEILE.map((t) => t.id)]);
  const fremd: string[] = [];
  const sammeln = async (dir: string) => {
    const je = new Map<string, string[]>();
    if (!existsSync(dir)) return je;
    for (const name of (await readdir(dir)).sort()) {
      // `krone.png`, `krone_00003_.png` (ComfyUI), `koerper_h2.png`, `haare-zopf_00001_.png`
      const m = /^([a-z0-9-]+?(?:_h[0-9])?)(?:_[0-9]+_?)?\.(png|webp|jpe?g)$/i.exec(name);
      if (!m) continue;
      const id = m[1].toLowerCase();
      if (!gueltig.has(id)) {
        fremd.push(name);
        continue;
      }
      je.set(id, [...(je.get(id) ?? []), name]);
    }
    return je;
  };
  const je = await sammeln(ordner);
  const edits = await sammeln(join(ordner, 'edit'));
  await mkdir(ZIEL, { recursive: true });
  const fertig: string[] = [];
  const fehler: string[] = [];
  const kleidungsMaske = await maske(kleidungForm(), G);
  const kleidungEditMaske = await maske(kleidungEditForm(), G);
  const eins = (map: Map<string, string[]>, id: string, wo = '') => {
    const namen = map.get(id);
    if (namen && namen.length > 1) throw new Error(`mehrere Bilder${wo} (${namen.join(', ')}), bitte nur eins lassen`);
    return namen?.[0];
  };

  // The bald base figure in its skin tones: tone 1 is koerper.png, the others come from edits (koerper_h1 …) or,
  // where there is none, are recoloured from it.
  const basisName = je.get('koerper')?.[0];
  if (basisName) {
    try {
      eins(je, 'koerper');
      const r = await laden(join(ordner, basisName));
      const a = anpassen.koerper ?? {};
      const grau0 = await aufGrau(join(ordner, basisName));
      if (!hatTransparenz(r.data)) freistellen(r.data, r.w, r.h, a.toleranz, a.loecher);
      const e = await aufEbene(r);
      const haut = hautMessen(e.data, G, HAUT_PUNKTE);
      const wie: string[] = [];
      for (let i = 0; i < HAUT.length; i++) {
        const name = i ? eins(je, `koerper_h${i}`) : undefined;
        if (!name) {
          await speichern(`koerper-${i}`, { ...e, data: i ? hautUmfaerben(e.data, haut, hexRgb(HAUT[i])) : e.data });
          wie.push(i ? 'umgefärbt' : 'Bild');
          continue;
        }
        // An edit of koerper.png: moved back if needed; the outline is the base figure's (the body is the same), so a
        // very light skin is not cut away as background.
        const grau = await aufGrau(join(ordner, name));
        const v = verschiebung(grau0.data, grau.data, G, G, 12);
        const data = v.dx || v.dy ? verschieben(grau.data, G, G, v.dx, v.dy) : new Uint8Array(grau.data);
        for (let p = 0; p < G * G; p++) data[p * 4 + 3] = e.data[p * 4 + 3];
        await speichern(`koerper-${i}`, { data, w: G, h: G });
        wie.push(`Edit${v.dx || v.dy ? ` (${v.dx}/${v.dy} px)` : ''}`);
      }
      fertig.push(`koerper: Hauttöne ${wie.map((w, i) => `${i + 1} ${w}`).join(', ')}`);
    } catch (err) {
      fehler.push(`koerper: ${(err as Error).message}`);
    }
  } else if (je.size || edits.size)
    fehler.push('koerper.png fehlt (die Glatzkopf-Grundfigur, auf die alles gemalt wird)');

  for (const t of TEILE) {
    const id = t.id;
    if (!je.has(id) || edits.has(id)) continue;
    try {
      const r = await laden(join(ordner, eins(je, id)!));
      const a = anpassen[id] ?? {};
      const weg = PLAETZE[t.slot].weg;
      let e: Roh;
      if (weg === 'flaeche') {
        const { data } = await roh(r).resize(G, G, { fit: 'cover' }).raw().toBuffer({ resolveWithObject: true });
        e = { data: new Uint8Array(data), w: G, h: G };
        for (let i = 3; i < e.data.length; i += 4) e.data[i] = 255;
      } else if (weg === 'figur') {
        e = await aufEbene(r);
        for (let p = 0; p < G * G; p++) e.data[p * 4 + 3] = Math.round((e.data[p * 4 + 3] * kleidungsMaske[p]) / 255);
      } else e = await einzeln(r, id, a);
      await speichern(id, e);
      fertig.push(id);
    } catch (err) {
      fehler.push(`${id}: ${(err as Error).message}`);
    }
  }

  // Edit pictures (parts, hair and mouths): compared with the raw base figure they were made from.
  let basis: Roh | undefined;
  for (const [id] of edits) {
    try {
      if (je.has(id))
        throw new Error(`liegt auch außerhalb von edit/ (${je.get(id)!.join(', ')}), bitte nur eins lassen`);
      const name = eins(edits, id, ' in edit/')!;
      const t = teil(id);
      const frisur = frisuren.includes(id) ? id.slice('haare-'.length) : undefined;
      const mund = munder.includes(id);
      if (!frisur && !mund && (!t || t.slot === 'hintergrund'))
        throw new Error('nur Teile auf der Figur, Frisuren und Münder gehen als Edit (Hintergründe als ganzes Bild)');
      if (!basisName)
        throw new Error('die Grundfigur koerper.png fehlt in lernquest-roh/ (das Bild, das ins Edit-Modell ging)');
      basis ??= await aufGrau(join(ordner, basisName));
      const [mb, me] = await Promise.all([
        sharp(join(ordner, basisName)).metadata(),
        sharp(join(ordner, 'edit', name)).metadata(),
      ]);
      if (mb.width !== me.width || mb.height !== me.height)
        throw new Error(
          `ist ${me.width} × ${me.height}, die Grundfigur ${mb.width} × ${mb.height}: das Edit-Bild muss genauso groß sein`,
        );
      const rohBild = await aufGrau(join(ordner, 'edit', name));
      const k = G / 240;
      const b = EDIT_BEREICH[frisur ? 'haare' : mund ? 'mund' : t!.slot];
      const box = {
        x: Math.round(b.x * k),
        y: Math.round(b.y * k),
        w: Math.round(b.width * k),
        h: Math.round(b.height * k),
      };
      const v = verschiebung(basis.data, rohBild.data, G, G, 12, box);
      const bild = v.dx || v.dy ? verschieben(rohBild.data, G, G, v.dx, v.dy) : rohBild.data;
      const a = anpassen[id] ?? {};
      // Only what changed; clothes also stay on the torso and shoulders, off the hands.
      const data = aenderung(basis.data, bild, G, G, box, a.schwelle);
      if (t && PLAETZE[t.slot].weg === 'figur')
        for (let p = 0; p < G * G; p++) data[p * 4 + 3] = Math.round((data[p * 4 + 3] * kleidungEditMaske[p]) / 255);
      if (!sichtbar(data, G, G)) throw new Error('keine Änderung gefunden (schwelle kleiner?)');
      const zurueck = v.dx || v.dy ? `, um ${v.dx}/${v.dy} px zurückgeschoben` : '';
      if (frisur) {
        // The hair in every colour: painted brown, the others recoloured from its typical colour.
        const quelle = mittelFarbe(data);
        for (let f = 0; f < HAARFARBEN.length; f++)
          await speichern(`haare-${frisur}-${f}`, {
            data: f ? haareUmfaerben(data, quelle, hexRgb(HAARFARBEN[f].farbe)) : data,
            w: G,
            h: G,
          });
        fertig.push(`${id} (Edit${zurueck}, ${HAARFARBEN.length} Haarfarben)`);
      } else {
        await speichern(id, { data, w: G, h: G });
        fertig.push(`${id} (Edit${zurueck})`);
      }
    } catch (err) {
      fehler.push(`${id} (edit/): ${(err as Error).message}`);
    }
  }
  await uebersicht(ordner);
  console.log(`Fertig: ${fertig.length} → src/lernquest/app/teile/`);
  for (const f of fertig) console.log(`  ✓ ${f}`);
  if (fremd.length) console.log(`Übersprungen (Name ist keine Teil-ID): ${fremd.join(', ')}`);
  const fehlen = TEILE.filter((t) => !existsSync(join(ZIEL, `${t.id}.webp`))).map((t) => t.id);
  if (fehlen.length) console.log(`Noch als Vektor: ${fehlen.join(', ')}`);
  if (fehler.length) {
    console.log('Fehler:');
    for (const f of fehler) console.log(`  ✗ ${f}`);
    process.exitCode = 1;
  }
  console.log(`Übersicht zum Prüfen: ${join(ordner, '_uebersicht.png')}`);
}

/** All finished layers, each on the base figure (or on grey when there is none), for a quick look. */
async function uebersicht(ordner: string) {
  const KACHEL = 200;
  const ids = [...FRISUREN.map((f) => `haare-${f.id}-0`), ...MUENDER.map((m) => `mund-${m.id}`), ...TEILE.map((t) => t.id)].filter((id) =>
    existsSync(join(ZIEL, `${id}.webp`)),
  );
  if (!ids.length) return;
  const koerper = join(ZIEL, 'koerper-0.webp');
  const hatKoerper = existsSync(koerper);
  const spalten = 8;
  const zeilen = Math.ceil(ids.length / spalten);
  const kacheln = await Promise.all(
    ids.map(async (id, i) => {
      const lagen: OverlayOptions[] = [];
      const hinten = teil(id)?.slot === 'hintergrund' || teil(id)?.slot === 'begleiter';
      if (hinten) lagen.push({ input: join(ZIEL, `${id}.webp`) });
      if (hatKoerper) lagen.push({ input: koerper });
      if (!hinten) lagen.push({ input: join(ZIEL, `${id}.webp`) });
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${G}" height="40"><rect width="100%" height="100%" fill="#fff" opacity=".85"/><text x="10" y="28" font-family="sans-serif" font-size="24">${id}</text></svg>`;
      lagen.push({ input: Buffer.from(svg), top: G - 40, left: 0 });
      const bild = await sharp({
        create: {
          width: G,
          height: G,
          channels: 4,
          background: HINTERGRUND_FARBE,
        },
      })
        .composite(lagen)
        .png()
        .toBuffer();
      return {
        input: await sharp(bild).resize(KACHEL, KACHEL).toBuffer(),
        left: (i % spalten) * KACHEL,
        top: Math.floor(i / spalten) * KACHEL,
      };
    }),
  );
  await sharp({
    create: {
      width: spalten * KACHEL,
      height: zeilen * KACHEL,
      channels: 4,
      background: '#ffffff',
    },
  })
    .composite(kacheln)
    .png()
    .toFile(join(ordner, '_uebersicht.png'));
}

/** Masks for ComfyUI and an overview of the places, on top of the vector figure (schablonen/figur.svg). */
async function schablonen() {
  const ordner = join(DOKU, 'schablonen');
  await mkdir(ordner, { recursive: true });
  const S = ROH_GROESSE;
  const weiss = async (form: string, datei: string) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 240 240"><rect width="240" height="240"/>${form}</svg>`;
    await sharp(Buffer.from(svg)).greyscale().png().toFile(join(ordner, datei));
  };
  await weiss(kleidungForm(), 'kleidung-maske.png');
  await weiss(augenForm(), 'augen-maske.png');
  const leinwand = (inhalt: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 240 240"><rect width="240" height="240" fill="${HINTERGRUND_FARBE}"/>${inhalt}</svg>`;
  // The bald vector figure (figur.svg, drawn by avatar.tsx) → the starting picture of the base figure.
  const figur = (await readFile(join(ordner, 'figur.svg'), 'utf8')).replace(/^<svg[^>]*>|<\/svg>\s*$/g, '');
  await sharp(Buffer.from(leinwand(figur)))
    .png()
    .toFile(join(ordner, 'grundfigur-vorlage.png'));
  const farben: Record<string, string> = {
    kopf: '#C4321F',
    augen: '#2F6FDB',
    werkzeug: '#13804A',
    begleiter: '#6A2FC4',
    kleidung: '#8A6100',
  };
  const kaesten = Object.entries(PLAETZE)
    .filter(([, p]) => p.weg !== 'flaeche')
    .map(([slot, p]) => {
      const f = farben[slot];
      if (p.weg === 'figur')
        return `<rect x="${KLEIDUNG_MASKE.x}" y="${KLEIDUNG_MASKE.y}" width="${KLEIDUNG_MASKE.width}" height="${KLEIDUNG_MASKE.height}" rx="${KLEIDUNG_MASKE.rx}" fill="${f}" fill-opacity=".18" stroke="${f}" stroke-width=".8"/><text x="${KLEIDUNG_MASKE.x + 2}" y="${KLEIDUNG_MASKE.y + KLEIDUNG_MASKE.height + 7}" font-family="sans-serif" font-size="6" fill="${f}">${slot} (Maske)</text>`;
      const top = p.anker === 'unten' ? p.y - p.hoehe : p.y - p.hoehe / 2;
      return `<rect x="${p.x - p.breite / 2}" y="${top}" width="${p.breite}" height="${p.hoehe}" fill="none" stroke="${f}" stroke-width=".8" stroke-dasharray="3 2"/><circle cx="${p.x}" cy="${p.y}" r="1.8" fill="${f}"/><text x="${p.x - p.breite / 2 + 2}" y="${top + 7}" font-family="sans-serif" font-size="6" fill="${f}">${slot}</text>`;
    })
    .join('');
  await sharp(Buffer.from(leinwand(figur + kaesten)))
    .png()
    .toFile(join(ordner, 'plaetze.png'));
  console.log(`Schablonen geschrieben: ${ordner}`);
}

if (args.includes('--prompts')) {
  await mkdir(DOKU, { recursive: true });
  await writeFile(join(DOKU, 'prompts.md'), promptListe());
  await writeFile(join(DOKU, 'edit-prompts.md'), editListe());
  console.log('docs/design/lernquest/bilder/prompts.md und edit-prompts.md geschrieben');
} else if (args.includes('--schablonen')) await schablonen();
else await bauen();
