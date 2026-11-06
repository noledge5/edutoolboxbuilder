// Turns pictures from ComfyUI into the hero's layers (docs/design/lernquest/bilder.md). Runs in plain Node (>= 22.18):
//   npm run lq:bilder                     raw pictures from lernquest-roh/ → src/lernquest/app/teile/<id>.webp
//   npm run lq:bilder -- --ordner <pfad>  raw pictures from another folder
//   npm run lq:bilder -- --prompts        writes docs/design/lernquest/bilder/prompts.md
//   npm run lq:bilder -- --schablonen     writes the masks and the overview of places next to it
// A raw picture is named after its part (`krone.png`, also `krone_00003_.png` as ComfyUI saves it); the base figure is
// `koerper.png`. Every layer is the whole canvas (480 × 480, transparent where empty), so the app only stacks them.
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import sharp, { type OverlayOptions } from 'sharp';
import {
  einpassen,
  freistellen,
  hatTransparenz,
  hautMessen,
  hautUmfaerben,
  hexRgb,
  sichtbar,
  type Anpassung,
} from '../src/lernquest/bilder/pixel.ts';
import {
  AUGEN_MASKE,
  EBENE_GROESSE as G,
  HAUT_PUNKTE,
  HINTERGRUND_FARBE,
  KLEIDUNG_MASKE,
  PLAETZE,
  promptListe,
  ROH_GROESSE,
} from '../src/lernquest/bilder/vorlagen.ts';
import { HAUT, teil, TEILE } from '../src/lernquest/teile.ts';

const WURZEL = resolve(import.meta.dirname, '..');
const ZIEL = join(WURZEL, 'src/lernquest/app/teile');
const DOKU = join(WURZEL, 'docs/design/lernquest/bilder');
const args = process.argv.slice(2);
const wert = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

/** Fine-tuning per part from src/lernquest/bilder/anpassen.json; `toleranz` and `loecher` for cutting away the
 *  background (`loecher`: also enclosed grey patches, e.g. between the legs). */
interface Anpassungen extends Anpassung {
  toleranz?: number;
  loecher?: boolean;
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
const augenForm = () =>
  `<ellipse cx="${AUGEN_MASKE.cx}" cy="${AUGEN_MASKE.cy}" rx="${AUGEN_MASKE.rx}" ry="${AUGEN_MASKE.ry}" fill="#fff"/>`;

/** Resized to the layer, the whole picture (the base figure and clothes are painted on the canvas itself). */
async function aufEbene(r: Roh): Promise<Roh> {
  if (Math.abs(r.w - r.h) > 2) throw new Error(`muss quadratisch sein (ist ${r.w} × ${r.h})`);
  const { data } = await roh(r).resize(G, G).raw().toBuffer({ resolveWithObject: true });
  return { data: new Uint8Array(data), w: G, h: G };
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
  const gueltig = new Set(['koerper', ...TEILE.map((t) => t.id)]);
  const je = new Map<string, string[]>();
  const fremd: string[] = [];
  for (const name of (await readdir(ordner)).sort()) {
    const m = /^([a-z0-9]+)(?:[_-][0-9_]*)?\.(png|webp|jpe?g)$/i.exec(name);
    if (!m) continue;
    const id = m[1].toLowerCase();
    if (!gueltig.has(id)) {
      fremd.push(name);
      continue;
    }
    je.set(id, [...(je.get(id) ?? []), name]);
  }
  await mkdir(ZIEL, { recursive: true });
  const fertig: string[] = [];
  const fehler: string[] = [];
  const kleidungsMaske = await maske(kleidungForm(), G);
  // The base figure first, so the overview can use it.
  for (const id of ['koerper', ...TEILE.map((t) => t.id)]) {
    const namen = je.get(id);
    if (!namen) continue;
    if (namen.length > 1) {
      fehler.push(`${id}: mehrere Bilder (${namen.join(', ')}), bitte nur eins lassen`);
      continue;
    }
    try {
      const r = await laden(join(ordner, namen[0]));
      const a = anpassen[id] ?? {};
      if (id === 'koerper') {
        if (!hatTransparenz(r.data)) freistellen(r.data, r.w, r.h, a.toleranz, a.loecher);
        const e = await aufEbene(r);
        const haut = hautMessen(e.data, G, HAUT_PUNKTE);
        for (let i = 0; i < HAUT.length; i++)
          await speichern(`koerper-${i}`, {
            ...e,
            data: hautUmfaerben(e.data, haut, hexRgb(HAUT[i])),
          });
        fertig.push(`koerper (Haut gemessen: rgb(${haut.join(', ')}), ${HAUT.length} Hauttöne)`);
        continue;
      }
      const weg = PLAETZE[teil(id)!.slot].weg;
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
  const ids = TEILE.map((t) => t.id).filter((id) => existsSync(join(ZIEL, `${id}.webp`)));
  if (!ids.length) return;
  const koerper = join(ZIEL, 'koerper-0.webp');
  const hatKoerper = existsSync(koerper);
  const spalten = 8;
  const zeilen = Math.ceil(ids.length / spalten);
  const kacheln = await Promise.all(
    ids.map(async (id, i) => {
      const lagen: OverlayOptions[] = [];
      const hinten = teil(id)!.slot === 'hintergrund' || teil(id)!.slot === 'begleiter';
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
  const figur = (await readFile(join(ordner, 'figur.svg'), 'utf8')).replace(/^<svg[^>]*>|<\/svg>\s*$/g, '');
  const leinwand = (inhalt: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 240 240"><rect width="240" height="240" fill="${HINTERGRUND_FARBE}"/>${inhalt}</svg>`;
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
  console.log('docs/design/lernquest/bilder/prompts.md geschrieben');
} else if (args.includes('--schablonen')) await schablonen();
else await bauen();
