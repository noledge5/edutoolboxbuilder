// The hero's parts (Stufe 2): 40 parts on six places, five rarities, a few with small bonuses that count only in the
// game (never for marks or real rewards). The server holds the same catalogue (`lq_teil` in
// supabase/migrations/20261106b_lernquest_held.sql); a test checks both are the same.

export type Slot = 'hintergrund' | 'frisur' | 'kopf' | 'augen' | 'kleidung' | 'werkzeug' | 'begleiter';

/** The places in the editor's order. */
export const SLOTS: { slot: Slot; label: string }[] = [
  { slot: 'frisur', label: 'Frisur' },
  { slot: 'kopf', label: 'Kopf' },
  { slot: 'augen', label: 'Augen' },
  { slot: 'kleidung', label: 'Kleidung' },
  { slot: 'werkzeug', label: 'Werkzeug' },
  { slot: 'begleiter', label: 'Begleiter' },
  { slot: 'hintergrund', label: 'Hintergrund' },
];

/** Where a part comes from; 'keine' = not to be had (kept by who has it, or given away later). */
export type Herkunft = 'start' | 'truhe' | 'truhe_laden' | 'laden' | 'keine';

export const HERKUNFT: { v: Herkunft; label: string }[] = [
  { v: 'start', label: 'Start (alle haben es)' },
  { v: 'truhe', label: 'Nur Truhe' },
  { v: 'truhe_laden', label: 'Truhe und Laden' },
  { v: 'laden', label: 'Nur Laden' },
  { v: 'keine', label: 'Nicht erhältlich' },
];

/** Where the picture sits in its place's box: shift in percent of the box, size factor. */
export interface Lage {
  x: number;
  y: number;
  s: number;
}

export const LAGE_NORMAL: Lage = { x: 0, y: 0, s: 1 };

export interface Teil {
  id: string;
  slot: Slot;
  name: string;
  /** 0 Gewöhnlich … 4 Legendär. */
  seltenheit: number;
  herkunft: Herkunft;
  /** Bonus in the game: more coins (percent), more hearts per round. */
  muenzen?: number;
  herz?: number;
  /** Picture (WebP data URL, transparent), drawn into the place's box. */
  bild?: string;
  /** Hairstyles only: the short version worn under a hat. */
  bildKurz?: string;
  lage?: Lage;
}

/** The catalogue the server starts with (seed in supabase/migrations/20261110_lernquest_katalog.sql); the teacher changes it in the Baukasten. */
export const TEILE: Teil[] = [
  { id: 'kurzhaar', slot: 'frisur', name: 'Kurze Haare', seltenheit: 0, herkunft: 'start' },
  { id: 'zopf', slot: 'frisur', name: 'Zopf', seltenheit: 0, herkunft: 'start' },
  { id: 'locken', slot: 'frisur', name: 'Locken', seltenheit: 0, herkunft: 'truhe_laden' },
  { id: 'dutt', slot: 'frisur', name: 'Dutt', seltenheit: 0, herkunft: 'truhe_laden' },
  { id: 'langhaar', slot: 'frisur', name: 'Lange Haare', seltenheit: 1, herkunft: 'truhe_laden' },
  { id: 'irokese', slot: 'frisur', name: 'Irokese', seltenheit: 2, herkunft: 'truhe' },
  { id: 'wollmuetze', slot: 'kopf', name: 'Wollmütze', seltenheit: 0, herkunft: 'truhe_laden' },
  { id: 'stirnband', slot: 'kopf', name: 'Stirnband', seltenheit: 1, herkunft: 'truhe_laden' },
  { id: 'ritterhelm', slot: 'kopf', name: 'Ritterhelm', seltenheit: 1, herkunft: 'truhe_laden' },
  { id: 'entdeckerhut', slot: 'kopf', name: 'Entdeckerhut', seltenheit: 2, herkunft: 'truhe_laden', muenzen: 5 },
  { id: 'piratenhut', slot: 'kopf', name: 'Piratenhut', seltenheit: 2, herkunft: 'truhe_laden' },
  { id: 'zauberhut', slot: 'kopf', name: 'Zauberhut', seltenheit: 3, herkunft: 'truhe_laden', muenzen: 10 },
  { id: 'krone', slot: 'kopf', name: 'Krone', seltenheit: 4, herkunft: 'truhe_laden', muenzen: 10, herz: 1 },
  { id: 'punktaugen', slot: 'augen', name: 'Punktaugen', seltenheit: 0, herkunft: 'start' },
  { id: 'froehlich', slot: 'augen', name: 'Fröhliche Augen', seltenheit: 0, herkunft: 'truhe_laden' },
  { id: 'brille', slot: 'augen', name: 'Brille', seltenheit: 1, herkunft: 'truhe_laden' },
  { id: 'sternaugen', slot: 'augen', name: 'Sternaugen', seltenheit: 2, herkunft: 'truhe_laden' },
  { id: 'sonnenbrille', slot: 'augen', name: 'Sonnenbrille', seltenheit: 2, herkunft: 'truhe_laden' },
  { id: 'funkelaugen', slot: 'augen', name: 'Funkelaugen', seltenheit: 3, herkunft: 'truhe_laden', muenzen: 5 },
  { id: 'tshirt', slot: 'kleidung', name: 'T-Shirt', seltenheit: 0, herkunft: 'start' },
  { id: 'pulli', slot: 'kleidung', name: 'Pulli', seltenheit: 0, herkunft: 'truhe_laden' },
  { id: 'latzhose', slot: 'kleidung', name: 'Latzhose', seltenheit: 0, herkunft: 'truhe_laden' },
  { id: 'weste', slot: 'kleidung', name: 'Entdeckerweste', seltenheit: 1, herkunft: 'truhe_laden' },
  { id: 'ruestung', slot: 'kleidung', name: 'Ritterrüstung', seltenheit: 2, herkunft: 'truhe_laden', herz: 1 },
  { id: 'sternenmantel', slot: 'kleidung', name: 'Sternenmantel', seltenheit: 2, herkunft: 'truhe_laden', herz: 1 },
  { id: 'zauberrobe', slot: 'kleidung', name: 'Zauberrobe', seltenheit: 3, herkunft: 'truhe_laden', muenzen: 10 },
  { id: 'goldruestung', slot: 'kleidung', name: 'Goldrüstung', seltenheit: 4, herkunft: 'truhe_laden', muenzen: 10, herz: 1 },
  { id: 'lupe', slot: 'werkzeug', name: 'Lupe', seltenheit: 0, herkunft: 'truhe_laden' },
  { id: 'buch', slot: 'werkzeug', name: 'Buch', seltenheit: 0, herkunft: 'truhe_laden' },
  { id: 'fernrohr', slot: 'werkzeug', name: 'Fernrohr', seltenheit: 1, herkunft: 'truhe_laden' },
  { id: 'kompass', slot: 'werkzeug', name: 'Kompass', seltenheit: 2, herkunft: 'truhe_laden', muenzen: 5 },
  { id: 'zauberstab', slot: 'werkzeug', name: 'Zauberstab', seltenheit: 3, herkunft: 'truhe_laden', herz: 1 },
  { id: 'sternenschwert', slot: 'werkzeug', name: 'Sternenschwert', seltenheit: 4, herkunft: 'truhe_laden', muenzen: 5, herz: 1 },
  { id: 'schnecke', slot: 'begleiter', name: 'Schnecke', seltenheit: 0, herkunft: 'truhe_laden' },
  { id: 'katze', slot: 'begleiter', name: 'Katze', seltenheit: 1, herkunft: 'truhe_laden' },
  { id: 'eule', slot: 'begleiter', name: 'Eule', seltenheit: 2, herkunft: 'truhe_laden', muenzen: 5 },
  { id: 'fuchs', slot: 'begleiter', name: 'Fuchs', seltenheit: 2, herkunft: 'truhe_laden' },
  { id: 'roboter', slot: 'begleiter', name: 'Roboter', seltenheit: 3, herkunft: 'truhe_laden', herz: 1 },
  { id: 'drache', slot: 'begleiter', name: 'Drache', seltenheit: 4, herkunft: 'truhe_laden', muenzen: 10 },
  { id: 'wiese', slot: 'hintergrund', name: 'Wiese', seltenheit: 0, herkunft: 'start' },
  { id: 'strand', slot: 'hintergrund', name: 'Strand', seltenheit: 0, herkunft: 'truhe_laden' },
  { id: 'wald', slot: 'hintergrund', name: 'Wald', seltenheit: 1, herkunft: 'truhe_laden' },
  { id: 'berge', slot: 'hintergrund', name: 'Berge', seltenheit: 1, herkunft: 'truhe_laden' },
  { id: 'nacht', slot: 'hintergrund', name: 'Sternennacht', seltenheit: 2, herkunft: 'truhe_laden' },
  { id: 'weltall', slot: 'hintergrund', name: 'Weltall', seltenheit: 3, herkunft: 'truhe_laden', muenzen: 5 },
  { id: 'regenbogen', slot: 'hintergrund', name: 'Regenbogen', seltenheit: 4, herkunft: 'truhe_laden', muenzen: 10 },
];

export const teil = (id: string | undefined, katalog: Teil[] = TEILE) => katalog.find((t) => t.id === id);

/** Can come from a chest / be bought / everyone has it. */
export const ausTruhe = (t: Teil) => t.herkunft === 'truhe' || t.herkunft === 'truhe_laden';
export const imLaden = (t: Teil) => t.herkunft === 'laden' || t.herkunft === 'truhe_laden';
export const istStart = (t: Teil) => t.herkunft === 'start';

/** The five rarities: name and colour (colour and 1–5 dots, never colour alone). */
export const SELTENHEITEN = [
  { name: 'Gewöhnlich', kurz: 'Gewöhnl.', farbe: '#6E6990' },
  { name: 'Ungewöhnlich', kurz: 'Ungew.', farbe: '#13804A' },
  { name: 'Selten', kurz: 'Selten', farbe: '#2459B8' },
  { name: 'Episch', kurz: 'Episch', farbe: '#6A2FC4' },
  { name: 'Legendär', kurz: 'Legendär', farbe: '#8A6100' },
];

/** Chances in a chest in percent, shown in the chest. */
export const CHANCEN = [55, 28, 12, 4, 1];
/** At the latest every this many chests has something rare (Selten or better). */
export const GARANTIE = 5;
/** Price in the shop and coins for a twin from a chest, by rarity. */
export const PREISE = [40, 80, 160, 320, 800];
export const DOPPELT = [10, 20, 40, 80, 150];

/** Hearts per round without bonuses. */
export const HERZEN = 3;

export type Avatar = Partial<Record<Slot, string>> & { haut?: number; haar?: number };

/** Skin tones to choose freely (not collected). */
export const HAUT = ['#F2C9A0', '#E8B48A', '#C98E62', '#A86E45', '#7A4E2E', '#F6DCC4'];

/** Hair colours to choose freely; hair pictures are light grey and are tinted with these. */
export const HAARE = ['#3B2A20', '#6B4226', '#A0522D', '#D9A441', '#E8D9B5', '#2E2A3D'];

/** The start part worn when nothing is chosen: the one with the smallest id (as the server: `lq_erster_start`). */
export function ersterStart(slot: Slot, katalog: Teil[] = TEILE): Teil | undefined {
  return katalog.filter((x) => x.slot === slot && istStart(x)).sort((a, b) => (a.id < b.id ? -1 : 1))[0];
}

/** What is worn on a place: the chosen part, else the first start part (or nothing). */
export function angelegt(a: Avatar, slot: Slot, katalog: Teil[] = TEILE): Teil | undefined {
  const id = a[slot];
  if (id === '') return undefined;
  const t = teil(id, katalog);
  return t && t.slot === slot ? t : ersterStart(slot, katalog);
}

/** Bonuses of what is worn, capped: at most +20 % coins and +2 hearts (as `lq_bonus`). */
export function bonusVon(a: Avatar, katalog: Teil[] = TEILE): { muenzen: number; herz: number } {
  let muenzen = 0;
  let herz = 0;
  for (const { slot } of SLOTS) {
    const t = a[slot] ? teil(a[slot], katalog) : undefined;
    muenzen += t?.muenzen ?? 0;
    herz += t?.herz ?? 0;
  }
  return { muenzen: Math.min(20, muenzen), herz: Math.min(2, herz) };
}

/** A bonus as the child reads it: „+5 % Münzen, +1 Herz“; '' when there is none. */
export function bonusText(b: { muenzen?: number; herz?: number }): string {
  return [b.muenzen ? `+${b.muenzen} % Münzen` : '', b.herz ? `+${b.herz} ${b.herz === 1 ? 'Herz' : 'Herzen'}` : ''].filter(Boolean).join(', ');
}

/** Whether the child may wear a part: a start part or one in the inventory. */
export const hat = (inventar: string[], t: Teil) => istStart(t) || inventar.includes(t.id);

// — The teacher's catalogue editor —

/** Limits the server checks as well (`lq_teil_speichern`). */
export const BILD_MAX = 200_000;
export const BONUS_MUENZEN = [0, 5, 10, 15, 20];
export const BONUS_HERZ = [0, 1, 2];
const SLOT_IDS = new Set(SLOTS.map((s) => s.slot));
const HERKUNFT_IDS = new Set(HERKUNFT.map((h) => h.v));
const BILD = /^data:image\/webp;base64,[A-Za-z0-9+/]+={0,2}$/;

/** A new id from the name: „Roter Schal“ → „roter-schal-x7k2“ (unique enough, never changes afterwards). */
export function neueId(name: string, zufall = Math.random): string {
  const base =
    name
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30) || 'teil';
  const tail = Array.from({ length: 4 }, () => 'abcdefghijkmnpqrstuvwxyz23456789'[Math.floor(zufall() * 32)]).join('');
  return `${base}-${tail}`;
}

const clamp = (n: unknown, lo: number, hi: number, d: number) => (typeof n === 'number' && Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d);

/** A part as the server or the editor gives it, made safe; null when it cannot be a part. */
export function leseTeil(x: unknown): Teil | null {
  if (!x || typeof x !== 'object') return null;
  const r = x as Record<string, unknown>;
  if (typeof r.id !== 'string' || !/^[a-z0-9-]{1,40}$/.test(r.id)) return null;
  if (typeof r.slot !== 'string' || !SLOT_IDS.has(r.slot as Slot)) return null;
  const name = typeof r.name === 'string' ? r.name.trim().slice(0, 40) : '';
  const t: Teil = {
    id: r.id,
    slot: r.slot as Slot,
    name: name || r.id,
    seltenheit: Math.round(clamp(r.seltenheit, 0, 4, 0)),
    herkunft: HERKUNFT_IDS.has(r.herkunft as Herkunft) ? (r.herkunft as Herkunft) : 'keine',
  };
  const m = Math.round(clamp(r.muenzen, 0, 20, 0));
  const h = Math.round(clamp(r.herz, 0, 2, 0));
  if (m) t.muenzen = m;
  if (h) t.herz = h;
  if (typeof r.bild === 'string' && r.bild.length <= BILD_MAX && BILD.test(r.bild)) t.bild = r.bild;
  if (t.slot === 'frisur' && typeof r.bildKurz === 'string' && r.bildKurz.length <= BILD_MAX && BILD.test(r.bildKurz)) t.bildKurz = r.bildKurz;
  if (r.lage && typeof r.lage === 'object') {
    const l = r.lage as Record<string, unknown>;
    const lage = { x: clamp(l.x, -50, 50, 0), y: clamp(l.y, -50, 50, 0), s: clamp(l.s, 0.4, 2.5, 1) };
    if (lage.x || lage.y || lage.s !== 1) t.lage = lage;
  }
  return t;
}

/** The catalogue from the server, safe; the built-in one when the server has none yet. */
export function leseKatalog(x: unknown): Teil[] {
  const list = Array.isArray(x) ? x.map(leseTeil).filter((t): t is Teil => !!t) : [];
  return list.length ? list : TEILE;
}

/** What each place's picture must look like, for the image model (English, like the other picture prompts). */
const SLOT_PROMPT: Record<Slot, string> = {
  frisur: 'a hairstyle only (no head, no face, no body), front view, with an empty opening where the face would be, in light grey shades so it can be tinted later',
  kopf: 'a hat or helmet only (no head, no hair), front view, as worn on a big round cartoon head',
  augen: 'a pair of cartoon eyes or glasses only, side by side, front view, nothing else',
  kleidung: 'a piece of clothing only (no body, no head, no hands), front view, for a small chubby cartoon character',
  werkzeug: 'a single hand-held item only (no hand, no person), slightly tilted',
  begleiter: 'a small cute companion creature or pet, full body, sitting, facing the viewer',
  hintergrund: 'a landscape scene as a background, filling the whole square, no characters',
};

/** The prompt for a part's picture; `kurz` = the short version of a hairstyle, worn under a hat. */
export function teilPrompt(slot: Slot, was: string, kurz = false): string {
  const bg = slot === 'hintergrund' ? 'Fill the whole picture, no empty background.' : 'Isolated on one flat pure green background (#00FF00), no shadow on the background, no gradient, nothing else in the picture, centred and filling most of the square.';
  return [
    `Game item for a children's avatar maker: ${was.trim()}.`,
    kurz ? 'Show only the part of this hairstyle that shows under a hat: short hair at the sides and the neck, nothing on top, in light grey shades.' : `It is ${SLOT_PROMPT[slot]}.`,
    "Style: friendly flat cartoon for 10 to 12 year olds, clean dark outlines, soft simple shading, bright friendly colours, like a children's mobile game.",
    bg,
    'No text, no letters, no watermark, nothing frightening.',
  ].join(' ');
}
