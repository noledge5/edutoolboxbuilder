// The hero's parts (Stufe 2, 16 more on 06.11.2026, 24 more on 09.11.2026): 80 parts on six places, five rarities, a few
// with small bonuses that count only in the game (never for marks or real rewards). Some are chest treasures (`nurTruhe`):
// not in the shop, and unknown (a question mark) until found. The server holds the same catalogue (`lq_teil` in
// supabase/migrations/20261106b_lernquest_held.sql, 20261109_lernquest_beute.sql and
// 20261116_lernquest_truhenschaetze.sql); a test checks both are the same.

export type Slot = 'kopf' | 'augen' | 'kleidung' | 'werkzeug' | 'begleiter' | 'hintergrund';

export const SLOTS: { slot: Slot; label: string }[] = [
  { slot: 'kopf', label: 'Kopf' },
  { slot: 'augen', label: 'Augen' },
  { slot: 'kleidung', label: 'Kleidung' },
  { slot: 'werkzeug', label: 'Werkzeug' },
  { slot: 'begleiter', label: 'Begleiter' },
  { slot: 'hintergrund', label: 'Hintergrund' },
];

export interface Teil {
  id: string;
  slot: Slot;
  name: string;
  /** 0 Gewöhnlich … 4 Legendär. */
  seltenheit: number;
  /** Everyone has it from the start. */
  start?: boolean;
  /** Bonus in the game: more coins (percent), more hearts per round, more damage per right answer in the boss fight. */
  muenzen?: number;
  herz?: number;
  schaden?: number;
  /** Only from chests, never in the shop (`lq_teil.nur_truhe`). */
  nurTruhe?: boolean;
  /** Made on the teacher page (`lq_teile_eigen`): always an uploaded picture, never a bonus. */
  eigen?: boolean;
  /** Taken out of the game: not in the shop or in chests any more; who has it keeps it. */
  aus?: boolean;
  /** Only in the shop, never in chests (`lq_teil.nur_laden`, set by the teacher). */
  nurLaden?: boolean;
}

export const TEILE: Teil[] = [
  { id: 'wollmuetze', slot: 'kopf', name: 'Wollmütze', seltenheit: 0 },
  { id: 'stirnband', slot: 'kopf', name: 'Stirnband', seltenheit: 1 },
  { id: 'ritterhelm', slot: 'kopf', name: 'Ritterhelm', seltenheit: 1, schaden: 1 },
  { id: 'entdeckerhut', slot: 'kopf', name: 'Entdeckerhut', seltenheit: 2, muenzen: 5 },
  { id: 'piratenhut', slot: 'kopf', name: 'Piratenhut', seltenheit: 2 },
  { id: 'zauberhut', slot: 'kopf', name: 'Zauberhut', seltenheit: 3, muenzen: 10 },
  { id: 'krone', slot: 'kopf', name: 'Krone', seltenheit: 4, muenzen: 10, herz: 1 },
  { id: 'punktaugen', slot: 'augen', name: 'Punktaugen', seltenheit: 0, start: true },
  { id: 'froehlich', slot: 'augen', name: 'Fröhliche Augen', seltenheit: 0 },
  { id: 'brille', slot: 'augen', name: 'Brille', seltenheit: 1 },
  { id: 'sternaugen', slot: 'augen', name: 'Sternaugen', seltenheit: 2 },
  { id: 'sonnenbrille', slot: 'augen', name: 'Sonnenbrille', seltenheit: 2 },
  { id: 'funkelaugen', slot: 'augen', name: 'Funkelaugen', seltenheit: 3, muenzen: 5 },
  { id: 'tshirt', slot: 'kleidung', name: 'T-Shirt', seltenheit: 0, start: true },
  { id: 'pulli', slot: 'kleidung', name: 'Pulli', seltenheit: 0 },
  { id: 'latzhose', slot: 'kleidung', name: 'Latzhose', seltenheit: 0 },
  { id: 'weste', slot: 'kleidung', name: 'Entdeckerweste', seltenheit: 1 },
  { id: 'ruestung', slot: 'kleidung', name: 'Ritterrüstung', seltenheit: 2, herz: 1 },
  { id: 'sternenmantel', slot: 'kleidung', name: 'Sternenmantel', seltenheit: 2, herz: 1 },
  { id: 'zauberrobe', slot: 'kleidung', name: 'Zauberrobe', seltenheit: 3, muenzen: 10 },
  { id: 'goldruestung', slot: 'kleidung', name: 'Goldrüstung', seltenheit: 4, muenzen: 10, herz: 1 },
  { id: 'lupe', slot: 'werkzeug', name: 'Lupe', seltenheit: 0 },
  { id: 'buch', slot: 'werkzeug', name: 'Buch', seltenheit: 0 },
  { id: 'fernrohr', slot: 'werkzeug', name: 'Fernrohr', seltenheit: 1, schaden: 1 },
  { id: 'kompass', slot: 'werkzeug', name: 'Kompass', seltenheit: 2, muenzen: 5 },
  { id: 'zauberstab', slot: 'werkzeug', name: 'Zauberstab', seltenheit: 3, herz: 1, schaden: 2 },
  { id: 'sternenschwert', slot: 'werkzeug', name: 'Sternenschwert', seltenheit: 4, muenzen: 5, herz: 1, schaden: 3 },
  { id: 'schnecke', slot: 'begleiter', name: 'Schnecke', seltenheit: 0 },
  { id: 'katze', slot: 'begleiter', name: 'Katze', seltenheit: 1 },
  { id: 'eule', slot: 'begleiter', name: 'Eule', seltenheit: 2, muenzen: 5 },
  { id: 'fuchs', slot: 'begleiter', name: 'Fuchs', seltenheit: 2 },
  { id: 'roboter', slot: 'begleiter', name: 'Roboter', seltenheit: 3, herz: 1 },
  { id: 'drache', slot: 'begleiter', name: 'Drache', seltenheit: 4, muenzen: 10 },
  { id: 'wiese', slot: 'hintergrund', name: 'Wiese', seltenheit: 0, start: true },
  { id: 'strand', slot: 'hintergrund', name: 'Strand', seltenheit: 0 },
  { id: 'wald', slot: 'hintergrund', name: 'Wald', seltenheit: 1 },
  { id: 'berge', slot: 'hintergrund', name: 'Berge', seltenheit: 1 },
  { id: 'nacht', slot: 'hintergrund', name: 'Sternennacht', seltenheit: 2 },
  { id: 'weltall', slot: 'hintergrund', name: 'Weltall', seltenheit: 3, muenzen: 5 },
  { id: 'regenbogen', slot: 'hintergrund', name: 'Regenbogen', seltenheit: 4, muenzen: 10 },
  // Added 06.11.2026 (supabase/migrations/20261109_lernquest_beute.sql)
  { id: 'kappe', slot: 'kopf', name: 'Schirmmütze', seltenheit: 0 },
  { id: 'blumenkranz', slot: 'kopf', name: 'Blumenkranz', seltenheit: 1 },
  { id: 'wikingerhelm', slot: 'kopf', name: 'Wikingerhelm', seltenheit: 2, herz: 1 },
  { id: 'herzaugen', slot: 'augen', name: 'Herzaugen', seltenheit: 1 },
  { id: 'taucherbrille', slot: 'augen', name: 'Taucherbrille', seltenheit: 2 },
  { id: 'kapuzenpulli', slot: 'kleidung', name: 'Kapuzenpulli', seltenheit: 0 },
  { id: 'trikot', slot: 'kleidung', name: 'Trikot', seltenheit: 1 },
  { id: 'drachenruestung', slot: 'kleidung', name: 'Drachenrüstung', seltenheit: 3, muenzen: 5, herz: 1 },
  { id: 'pinsel', slot: 'werkzeug', name: 'Pinsel', seltenheit: 0 },
  { id: 'laterne', slot: 'werkzeug', name: 'Laterne', seltenheit: 1 },
  { id: 'dreizack', slot: 'werkzeug', name: 'Dreizack', seltenheit: 3, muenzen: 10, schaden: 2 },
  { id: 'hamster', slot: 'begleiter', name: 'Hamster', seltenheit: 0 },
  { id: 'pinguin', slot: 'begleiter', name: 'Pinguin', seltenheit: 1 },
  { id: 'phoenix', slot: 'begleiter', name: 'Phönix', seltenheit: 4, muenzen: 10, herz: 1 },
  { id: 'unterwasser', slot: 'hintergrund', name: 'Unterwasser', seltenheit: 2 },
  { id: 'burg', slot: 'hintergrund', name: 'Burghof', seltenheit: 3, muenzen: 5 },
  // Added 09.11.2026 (supabase/migrations/20261116_lernquest_truhenschaetze.sql): per place two to buy, two chest treasures
  { id: 'kochmuetze', slot: 'kopf', name: 'Kochmütze', seltenheit: 0 },
  { id: 'cowboyhut', slot: 'kopf', name: 'Cowboyhut', seltenheit: 1 },
  { id: 'raumhelm', slot: 'kopf', name: 'Raumhelm', seltenheit: 3, muenzen: 5, nurTruhe: true },
  { id: 'eiskrone', slot: 'kopf', name: 'Eiskrone', seltenheit: 4, muenzen: 10, herz: 1, nurTruhe: true },
  { id: 'schlaefrig', slot: 'augen', name: 'Schläfrige Augen', seltenheit: 0 },
  { id: 'zwinkern', slot: 'augen', name: 'Zwinkern', seltenheit: 1 },
  { id: 'monokel', slot: 'augen', name: 'Monokel', seltenheit: 2, muenzen: 5, nurTruhe: true },
  { id: 'feueraugen', slot: 'augen', name: 'Feueraugen', seltenheit: 3, schaden: 1, nurTruhe: true },
  { id: 'regenjacke', slot: 'kleidung', name: 'Regenjacke', seltenheit: 0 },
  { id: 'ninjaanzug', slot: 'kleidung', name: 'Ninja-Anzug', seltenheit: 1 },
  { id: 'raumanzug', slot: 'kleidung', name: 'Raumanzug', seltenheit: 2, herz: 1, nurTruhe: true },
  { id: 'kristallruestung', slot: 'kleidung', name: 'Kristallrüstung', seltenheit: 4, muenzen: 10, herz: 1, nurTruhe: true },
  { id: 'angel', slot: 'werkzeug', name: 'Angel', seltenheit: 0 },
  { id: 'bumerang', slot: 'werkzeug', name: 'Bumerang', seltenheit: 1 },
  { id: 'hammer', slot: 'werkzeug', name: 'Zwergenhammer', seltenheit: 2, schaden: 1, nurTruhe: true },
  { id: 'blitzstab', slot: 'werkzeug', name: 'Blitzstab', seltenheit: 4, muenzen: 10, schaden: 3, nurTruhe: true },
  { id: 'igel', slot: 'begleiter', name: 'Igel', seltenheit: 0 },
  { id: 'papagei', slot: 'begleiter', name: 'Papagei', seltenheit: 1 },
  { id: 'axolotl', slot: 'begleiter', name: 'Axolotl', seltenheit: 2, muenzen: 5, nurTruhe: true },
  { id: 'einhorn', slot: 'begleiter', name: 'Einhorn', seltenheit: 3, herz: 1, nurTruhe: true },
  { id: 'wueste', slot: 'hintergrund', name: 'Wüste', seltenheit: 0 },
  { id: 'winterwald', slot: 'hintergrund', name: 'Winterwald', seltenheit: 1 },
  { id: 'vulkan', slot: 'hintergrund', name: 'Vulkaninsel', seltenheit: 3, muenzen: 5, nurTruhe: true },
  { id: 'wolkenschloss', slot: 'hintergrund', name: 'Wolkenschloss', seltenheit: 4, muenzen: 10, nurTruhe: true },
];

// — Parts the admin teacher made on the teacher page (supabase/migrations/20261118_lernquest_eigene_teile.sql). The app
// loads them with the uploaded pictures (app/hochgeladen.tsx) and keeps them here, next to the built-in catalogue. —
let EIGENE: Teil[] = [];

/** The parts made on the teacher page, as last loaded. */
export const eigeneTeile = () => EIGENE;
export const setzeEigene = (liste: Teil[]) => {
  EIGENE = liste;
  MIT_WERTEN = null;
};
// — What the admin teacher set for each part on the teacher page (supabase/migrations/20261121_lernquest_teile_einstellen.sql):
// rarity, where it comes from and bonuses, for built-in and own parts and for hairstyles (`frisur-<id>`). Loaded with the
// pictures; they go before the values written here. —

export interface TeilWerte {
  seltenheit: number;
  start: boolean;
  nurTruhe: boolean;
  nurLaden: boolean;
  aus: boolean;
  muenzen: number;
  herz: number;
  schaden: number;
}
let WERTE: Record<string, TeilWerte> = {};
let MIT_WERTEN: Teil[] | null = null;

export const teilWerte = () => WERTE;
export const setzeWerte = (w: Record<string, TeilWerte>) => {
  WERTE = w;
  MIT_WERTEN = null;
};

/** Values from the server or the device, checked: unknown or broken entries are left out. */
export function readWerte(raw: unknown): Record<string, TeilWerte> {
  const out: Record<string, TeilWerte> = {};
  if (!Array.isArray(raw)) return out;
  const zahl = (x: unknown, max: number) => (typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= max ? x : null);
  for (const x of raw) {
    if (!x || typeof x !== 'object') continue;
    const r = x as Record<string, unknown>;
    if (typeof r.id !== 'string' || !/^[a-z0-9-]{1,40}$/.test(r.id)) continue;
    const seltenheit = zahl(r.seltenheit, 4);
    if (seltenheit === null) continue;
    out[r.id] = {
      seltenheit,
      start: r.start === true,
      nurTruhe: r.nurTruhe === true,
      nurLaden: r.nurLaden === true,
      aus: r.aktiv === false,
      muenzen: zahl(r.muenzen, 20) ?? 0,
      herz: zahl(r.herz, 2) ?? 0,
      schaden: zahl(r.schaden, 3) ?? 0,
    };
  }
  return out;
}

/** A part with the teacher's values (a copy; without values the part as it is). */
export function mitWerten(t: Teil): Teil {
  const w = WERTE[t.id];
  if (!w) return t;
  const { start: _s, nurTruhe: _t, nurLaden: _l, aus: _a, muenzen: _m, herz: _h, schaden: _d, ...rest } = t;
  return {
    ...rest,
    seltenheit: w.seltenheit,
    ...(w.start ? { start: true } : {}),
    ...(w.nurTruhe ? { nurTruhe: true } : {}),
    ...(w.nurLaden ? { nurLaden: true } : {}),
    ...(w.aus ? { aus: true } : {}),
    ...(w.muenzen ? { muenzen: w.muenzen } : {}),
    ...(w.herz ? { herz: w.herz } : {}),
    ...(w.schaden ? { schaden: w.schaden } : {}),
  };
}

/** Built-in and own parts, with the teacher's values. */
export const alleTeile = (): Teil[] => (MIT_WERTEN ??= [...TEILE, ...EIGENE].map(mitWerten));

/** Own parts from the server or the device, checked: unknown or broken entries are left out. */
export function readEigene(raw: unknown): Teil[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((x): Teil[] => {
    if (!x || typeof x !== 'object') return [];
    const r = x as { id?: unknown; slot?: unknown; name?: unknown; seltenheit?: unknown; nurTruhe?: unknown; aktiv?: unknown; aus?: unknown };
    if (typeof r.id !== 'string' || !/^e[0-9a-f]{10}$/.test(r.id)) return [];
    if (!SLOTS.some((s) => s.slot === r.slot) || typeof r.name !== 'string' || !r.name.trim() || r.name.length > 30) return [];
    if (typeof r.seltenheit !== 'number' || !Number.isInteger(r.seltenheit) || r.seltenheit < 0 || r.seltenheit > 4) return [];
    const aus = r.aktiv === false || r.aus === true;
    return [{ id: r.id, slot: r.slot as Slot, name: r.name.trim(), seltenheit: r.seltenheit, eigen: true, ...(r.nurTruhe === true ? { nurTruhe: true } : {}), ...(aus ? { aus: true } : {}) }];
  });
}

export const teil = (id: string | undefined) => (id ? alleTeile().find((t) => t.id === id) : undefined);

/** The five rarities: name and colour (colour and 1–5 dots, never colour alone). */
export const SELTENHEITEN = [
  { name: 'Gewöhnlich', kurz: 'Gewöhnl.', farbe: '#6E6990' },
  { name: 'Ungewöhnlich', kurz: 'Ungew.', farbe: '#13804A' },
  { name: 'Selten', kurz: 'Selten', farbe: '#2459B8' },
  { name: 'Episch', kurz: 'Episch', farbe: '#6A2FC4' },
  { name: 'Legendär', kurz: 'Legendär', farbe: '#8A6100' },
];

/** Chances in a chest in percent, shown in the chest: only coins (`MUENZ_CHANCEN`), else a part by rarity
 *  (`CHANCEN`). Coins take the place of a common or uncommon part, so a rarity is still 55 / 28 / 12 / 4 / 1. */
export const MUENZ_CHANCEN = [26, 14];
export const CHANCEN = [29, 14, 12, 4, 1];
/** Coins in a chest that holds only coins, by its rarity (Gewöhnlich, Ungewöhnlich). */
export const MUENZ_TRUHE = [25, 40];
/** At the latest every this many chests has something rare (Selten or better). */
export const GARANTIE = 5;
/** Price in the shop and coins for a twin from a chest, by rarity. */
export const PREISE = [80, 160, 320, 640, 1600];
export const DOPPELT = [10, 20, 40, 80, 150];

/** Hearts per round without bonuses. */
export const HERZEN = 3;

/** What is worn: a part per place, the skin tone (`HAUT`), the hair (`FRISUREN`) and its colour (`HAARFARBEN`) and the
 *  mouth (`MUENDER`). `figur` (0–2) is the older way to say the hair; it still counts when `frisur` is missing. */
export type Avatar = Partial<Record<Slot, string>> & {
  haut?: number;
  frisur?: string;
  haarfarbe?: number;
  mund?: string;
  figur?: number;
};

/** Hair to choose freely (not collected); a layer of its own over the bald base figure, so every hair fits every skin
 *  tone and every part. Pictures are painted brown and recoloured (`HAARFARBEN`). New ones need no server change. */
export const FRISUREN: { id: string; name: string }[] = [
  { id: 'kurz', name: 'Kurze Haare' },
  { id: 'zopf', name: 'Zopf' },
  { id: 'locken', name: 'Locken' },
  { id: 'lang', name: 'Lange Haare' },
  { id: 'zoepfe', name: 'Zwei Zöpfe' },
  { id: 'dutt', name: 'Dutt' },
  { id: 'stacheln', name: 'Stachelhaare' },
  { id: 'bob', name: 'Bob' },
  { id: 'glatze', name: 'Keine' },
];
/** The older `figur` 0–2 as hair. */
export const FIGUR_FRISUR = ['kurz', 'zopf', 'locken'];

/** Mouths to choose freely (not collected); a layer of its own over the blank face of the base figure, with the cheeks
 *  that belong to it, under the head part. New ones need no server change. */
export const MUENDER: { id: string; name: string }[] = [
  { id: 'laecheln', name: 'Lächeln' },
  { id: 'grinsen', name: 'Grinsen' },
  { id: 'lachen', name: 'Lachen' },
  { id: 'staunen', name: 'Staunen' },
  { id: 'frech', name: 'Zunge raus' },
  { id: 'ernst', name: 'Ernst' },
];

/** Hair colours to choose freely: the first is the colour the pictures are painted in. */
export const HAARFARBEN = [
  { name: 'Braun', farbe: '#4A2E1A' },
  { name: 'Schwarz', farbe: '#1E1A1A' },
  { name: 'Hellbraun', farbe: '#8A5A32' },
  { name: 'Blond', farbe: '#D9B061' },
  { name: 'Rot', farbe: '#A8441E' },
];

/** A hair made on the teacher page (`lq_frisuren_eigen`): only painted (uploaded), never a vector drawing. */
export interface Frisur {
  id: string;
  name: string;
  eigen?: boolean;
  /** No longer to choose; who wears it keeps it. */
  aus?: boolean;
}
let EIGENE_FRISUREN: Frisur[] = [];
export const eigeneFrisuren = () => EIGENE_FRISUREN;
export const setzeEigeneFrisuren = (liste: Frisur[]) => {
  EIGENE_FRISUREN = liste;
};
/** Built-in and own hair (the own ones before „Keine“). */
export const alleFrisuren = (): Frisur[] =>
  EIGENE_FRISUREN.length ? [...FRISUREN.filter((f) => f.id !== 'glatze'), ...EIGENE_FRISUREN, ...FRISUREN.filter((f) => f.id === 'glatze')] : FRISUREN;

/** Own hair from the server or the device, checked: unknown or broken entries are left out. */
export function readEigeneFrisuren(raw: unknown): Frisur[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((x): Frisur[] => {
    if (!x || typeof x !== 'object') return [];
    const r = x as { id?: unknown; name?: unknown; aktiv?: unknown; aus?: unknown };
    if (typeof r.id !== 'string' || !/^f[0-9a-f]{10}$/.test(r.id) || typeof r.name !== 'string' || !r.name.trim() || r.name.length > 30) return [];
    return [{ id: r.id, name: r.name.trim(), eigen: true, ...(r.aktiv === false || r.aus === true ? { aus: true } : {}) }];
  });
}

/** The hair worn: `frisur` if known, else the older `figur`, else short hair. */
export function frisurVon(a: Avatar): string {
  if (a.frisur && alleFrisuren().some((f) => f.id === a.frisur)) return a.frisur;
  return FIGUR_FRISUR[a.figur ?? 0] ?? 'kurz';
}
/** The mouth worn: `mund` if known, else the smile. */
export const mundVon = (a: Avatar): string => (MUENDER.some((m) => m.id === a.mund) ? a.mund! : MUENDER[0].id);
export const haarfarbeVon = (a: Avatar) => (a.haarfarbe !== undefined && a.haarfarbe >= 0 && a.haarfarbe < HAARFARBEN.length ? a.haarfarbe : 0);

/** Skin tones to choose freely (not collected). */
export const HAUT = ['#F2C9A0', '#E8B48A', '#C98E62', '#A86E45', '#7A4E2E', '#F6DCC4'];

/** The start part a place shows when nothing is chosen: the one with the smallest id (as `lq_standard_teil`). */
export function standardTeil(slot: Slot): Teil | undefined {
  return alleTeile()
    .filter((t) => t.slot === slot && t.start)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))[0];
}

/** What is worn on a place: the chosen part, else the start part (or nothing). */
export function angelegt(a: Avatar, slot: Slot): Teil | undefined {
  const id = a[slot];
  if (id === '') return undefined;
  return teil(id) ?? standardTeil(slot);
}

/** Most extra damage per right answer in the boss fight from what is worn (as `lq_bonus_schaden`). */
export const SCHADEN_MAX = 3;

/** Bonuses of what is worn, capped: at most +20 % coins, +2 hearts (as `lq_bonus`) and +3 damage (`lq_bonus_schaden`). */
export function bonusVon(a: Avatar): { muenzen: number; herz: number; schaden: number } {
  let muenzen = 0;
  let herz = 0;
  let schaden = 0;
  for (const { slot } of SLOTS) {
    const t = a[slot] ? teil(a[slot]) : undefined;
    muenzen += t?.muenzen ?? 0;
    herz += t?.herz ?? 0;
    schaden += t?.schaden ?? 0;
  }
  return { muenzen: Math.min(20, muenzen), herz: Math.min(2, herz), schaden: Math.min(SCHADEN_MAX, schaden) };
}

/** A bonus as the child reads it: „+5 % Münzen, +1 Herz, +2 Schaden“; '' when there is none. */
export function bonusText(b: { muenzen?: number; herz?: number; schaden?: number }): string {
  return [b.muenzen ? `+${b.muenzen} % Münzen` : '', b.herz ? `+${b.herz} ${b.herz === 1 ? 'Herz' : 'Herzen'}` : '', b.schaden ? `+${b.schaden} Schaden` : '']
    .filter(Boolean)
    .join(', ');
}

// — Hairstyles as parts: `frisur-<id>` in the catalogue. Without values from the server every hairstyle is free. —

export const frisurTeilId = (f: string) => `frisur-${f}`;
/** The hairstyle of a catalogue id (`frisur-locken` → its entry in `FRISUREN`), or undefined. */
export const frisurAusTeil = (id: string | null | undefined) => (id?.startsWith('frisur-') ? alleFrisuren().find((f) => `frisur-${f.id}` === id) : undefined);

/** A hairstyle as a part (slot only for its type; it is worn as `avatar.frisur`). */
export function frisurTeil(f: { id: string; name: string }): Teil {
  return mitWerten({ id: frisurTeilId(f.id), slot: 'kopf', name: f.name, seltenheit: 0, start: true });
}
/** Whether the child may wear a hairstyle: free, in the inventory, or worn already. */
export const hatFrisur = (inventar: string[], f: string, a?: Avatar) => !!frisurTeil({ id: f, name: '' }).start || inventar.includes(frisurTeilId(f)) || (!!a && frisurVon(a) === f);

/** Hairstyles the shop sells: not free, not had yet, not only from chests, in the game. */
export const ladenFrisuren = (inventar: string[]) =>
  alleFrisuren()
    .map((f) => ({ f, t: frisurTeil(f) }))
    .filter(({ f, t }) => !t.start && !t.nurTruhe && !t.aus && !inventar.includes(frisurTeilId(f.id)))
    .sort((a, b) => a.t.seltenheit - b.t.seltenheit);

/** What the shop sells on a place: what the child does not have yet, chest treasures and parts out of the game never. */
export const ladenWare = (inventar: string[], slot: Slot) =>
  alleTeile()
    .filter((t) => t.slot === slot && !t.nurTruhe && !t.aus && !hat(inventar, t))
    .sort((a, b) => a.seltenheit - b.seltenheit);

/** Whether the child may wear a part: a start part or one in the inventory. */
export const hat = (inventar: string[], t: Teil) => !!t.start || inventar.includes(t.id);
