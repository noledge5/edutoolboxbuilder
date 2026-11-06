// Bosskampf (Stufe 3): the questions of a fight, made on the teacher's device from the Lernpakete of a region (module).
// Only what can be answered with one tap on the phone becomes a question: one right answer of up to four, true/false,
// one pair of a pairs exercise, a single gap with its tiles. The solutions go to the server with the fight; the
// children's phones only ever get the options (lq_boss_stand).
import { seeded, shuffle } from '../model/language';
import { BOSS_FRAGEN } from './rules';
import type { Paket, Uebung } from './types';

/** One question of a fight; as stored in `lq_boss.fragen`. */
export interface BossFrage {
  /** The task line (small on the projector). */
  frage: string;
  /** The statement or word asked about (big), '' when the task line is the question. */
  aussage: string;
  /** Two to four answers; the projector and the phones show them with a shape each. */
  optionen: string[];
  richtig: number;
}

/** At most this many answers: four shapes (triangle, diamond, circle, square). */
export const OPTIONEN_MAX = 4;
/** Fewer questions do not make a fight. */
export const BOSS_FRAGEN_MIN = 3;
/** Text limits of the server (`lq_boss_starten`). */
const FRAGE_MAX = 300;
const OPTION_MAX = 120;

const kurz = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Up to 3 wrong answers next to the right one, in an order picked by `seed`. */
function mit(right: string, wrong: string[], seed: string): { optionen: string[]; richtig: number } | null {
  const others = shuffle(
    [...new Set(wrong.filter((w) => w && w.toLowerCase() !== right.toLowerCase()))],
    seeded(`${seed}:w`),
  ).slice(0, OPTIONEN_MAX - 1);
  if (!others.length) return null;
  const optionen = shuffle([right, ...others], seeded(`${seed}:o`));
  return { optionen, richtig: optionen.indexOf(right) };
}

/** The questions one exercise gives (none for word order: that needs more than one tap). */
export function fragenAus(u: Uebung, seed = u.id): BossFrage[] {
  const make = (frage: string, aussage: string, o: { optionen: string[]; richtig: number } | null): BossFrage[] =>
    o ? [{ frage: kurz(frage, FRAGE_MAX), aussage: kurz(aussage, FRAGE_MAX), optionen: o.optionen.map((x) => kurz(x, OPTION_MAX)), richtig: o.richtig }] : [];
  switch (u.art) {
    case 'waehlen': {
      if (u.richtig.length !== 1) return [];
      const right = u.optionen[u.richtig[0]];
      if (u.optionen.length <= OPTIONEN_MAX) return make(u.frage, u.aussage || u.hoeren || '', { optionen: u.optionen, richtig: u.richtig[0] });
      return make(u.frage, u.aussage || u.hoeren || '', mit(right, u.optionen.filter((_, i) => i !== u.richtig[0]), seed));
    }
    case 'richtigfalsch':
      return make(u.frage, u.aussage, { optionen: ['richtig', 'falsch'], richtig: u.richtig ? 0 : 1 });
    case 'paare':
      return u.paare.flatMap(([links, rechts], i) =>
        make(
          'Was gehört dazu?',
          links,
          mit(
            rechts,
            u.paare.map(([, r]) => r),
            `${seed}:${i}`,
          ),
        ),
      );
    case 'luecke': {
      if (u.teile.length !== 3) return [];
      const [vor, right, nach] = u.teile;
      return make(u.frage, `${vor}___${nach}`.trim(), mit(right, u.kacheln, seed));
    }
    case 'gruppen':
      // Each card a question „Wohin gehört …?“, as long as the groups fit as answers.
      if (u.gruppen.length > OPTIONEN_MAX) return [];
      return u.karten.flatMap(([text, g]) => make(u.frage, text, { optionen: u.gruppen, richtig: g }));
    case 'reihenfolge':
    case 'bild':
      return [];
  }
}

/** Up to `n` questions from the packages of a region, mixed by `seed` (a new fight gets other ones). */
export function bossFragen(pakete: Paket[], seed: string, n = BOSS_FRAGEN): BossFrage[] {
  const all = pakete.flatMap((p) => p.uebungen.flatMap((u) => fragenAus(u, `${p.stunde}/${u.id}`)));
  return shuffle(all, seeded(seed)).slice(0, n);
}

/** The bosses; a region gets one by its module number. */
export const BOSSE = [
  { name: 'Der Kompass-Golem' },
  { name: 'Die Tintenkrake' },
  { name: 'Der Rätseldrache' },
] as const;

export const bossVon = (modulNummer: number) => ((Math.round(modulNummer) % BOSSE.length) + BOSSE.length) % BOSSE.length;

/** Shapes of the four answers (never colour alone). */
export const FORMEN = ['Dreieck', 'Raute', 'Kreis', 'Quadrat'] as const;
