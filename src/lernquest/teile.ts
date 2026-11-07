// The hero's parts (Stufe 2, 16 more on 06.11.2026): 56 parts on six places, five rarities, a few with small bonuses that count only in the
// game (never for marks or real rewards). The server holds the same catalogue (`lq_teil` in
// supabase/migrations/20261106b_lernquest_held.sql and 20261109_lernquest_beute.sql); a test checks both are the same.

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
];

export const teil = (id: string | undefined) => TEILE.find((t) => t.id === id);

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

/** What is worn: a part per place, the skin tone (`HAUT`), the hair (`FRISUREN`) and its colour (`HAARFARBEN`).
 *  `figur` (0–2) is the older way to say the hair; it still counts when `frisur` is missing. */
export type Avatar = Partial<Record<Slot, string>> & { haut?: number; frisur?: string; haarfarbe?: number; figur?: number };

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

/** Hair colours to choose freely: the first is the colour the pictures are painted in. */
export const HAARFARBEN = [
  { name: 'Braun', farbe: '#4A2E1A' },
  { name: 'Schwarz', farbe: '#1E1A1A' },
  { name: 'Hellbraun', farbe: '#8A5A32' },
  { name: 'Blond', farbe: '#D9B061' },
  { name: 'Rot', farbe: '#A8441E' },
];

/** The hair worn: `frisur` if known, else the older `figur`, else short hair. */
export function frisurVon(a: Avatar): string {
  if (a.frisur && FRISUREN.some((f) => f.id === a.frisur)) return a.frisur;
  return FIGUR_FRISUR[a.figur ?? 0] ?? 'kurz';
}
export const haarfarbeVon = (a: Avatar) => (a.haarfarbe !== undefined && a.haarfarbe >= 0 && a.haarfarbe < HAARFARBEN.length ? a.haarfarbe : 0);

/** Skin tones to choose freely (not collected). */
export const HAUT = ['#F2C9A0', '#E8B48A', '#C98E62', '#A86E45', '#7A4E2E', '#F6DCC4'];

/** What is worn on a place: the chosen part, else the start part (or nothing). */
export function angelegt(a: Avatar, slot: Slot): Teil | undefined {
  const id = a[slot];
  if (id === '') return undefined;
  return teil(id) ?? TEILE.find((t) => t.slot === slot && t.start);
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

/** Whether the child may wear a part: a start part or one in the inventory. */
export const hat = (inventar: string[], t: Teil) => !!t.start || inventar.includes(t.id);
