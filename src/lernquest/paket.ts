// The Lernpaket of a lesson: its answerable task blocks turned into short exercises in the style of Anton/Duolingo
// (tap, pairs, gap with tiles, word order, true/false, pick the picture). Pure, so it is tested without a browser. Only tasks with a
// solution become exercises; the teacher pages ("lehrkraft") never go out.
import { jumble, seeded, shuffle, statements } from '../model/language';
import { choices, lines, matchNumbers, rows, segments, str } from '../model/text';
import type { Block, Page } from '../model/types';
import type { Lesson, Module } from '../library/types';
import { PAKET_FORMAT, UEBUNGS_ARTEN, type Paket, type Uebung } from './types';

/** A picture of the teacher's own (not an emoji) in a „Bild wählen“ exercise: its key in `Paket.bilder`. */
export const BILD_KEY = 'img:';
/** Side of the small pictures in a package, in pixels; a dozen of them stay well below the server's 300 KB. */
export const BILD_SEITE = 160;
/** Most own pictures in one package. */
export const BILDER_MAX = 24;
/** A picture with places to tap: its key in `Paket.bilder`; larger, so a child can hit the places on a phone. */
export const KARTE_KEY = 'karte:';
export const KARTE_SEITE = 720;
/** Most pictures with places in one package (each about 40–80 KB). */
export const KARTEN_MAX = 3;

/** The keys of own pictures an exercise needs. */
const bildKeys = (u: Uebung): string[] => (u.art === 'bild' ? u.bilder.filter((x) => x.startsWith(BILD_KEY)) : u.art === 'punkt' ? [u.bild] : []);

/** Pairs per exercise: more do not fit on a phone. */
const PAARE_MAX = 5;
/** Tiles that are not in the gap sentence, so the last gap is not a gift. */
const ABLENKER = 2;

const prompt = (b: Block, fallback: string) => str(b.props.prompt).trim() || fallback;

/** Words for distractors: the solutions of all gaps and vocabulary of the lesson. */
function wordPool(blocks: Block[]): string[] {
  const out: string[] = [];
  for (const b of blocks) {
    if (b.type === 'gap') for (const s of segments(b.props.text)) if (s.blank && s.solution) out.push(firstForm(s.solution));
    if (b.type === 'foldtest') for (const [, w = ''] of rows(b.props.rows)) if (w) out.push(firstForm(w));
  }
  return unique(out);
}

/** "a / b" (alternatives) → "a". */
const firstForm = (s: string) => s.split(/\s+\/\s+/)[0].trim();

const unique = (xs: string[]) => {
  const seen = new Set<string>();
  return xs.filter((x) => {
    const k = x.toLowerCase();
    if (!x || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

/** Up to `n` words from `pool` that are not in `not`, picked by `seed`. */
function pick(pool: string[], not: string[], n: number, seed: string): string[] {
  const no = new Set(not.map((x) => x.toLowerCase()));
  return shuffle(
    pool.filter((w) => !no.has(w.toLowerCase())),
    seeded(seed),
  ).slice(0, n);
}

function fromBlock(b: Block, page: Page, pool: string[]): Uebung[] {
  const p = b.props;
  switch (b.type) {
    case 'mc': {
      const cs = choices(p.options);
      const richtig = cs.flatMap((c, i) => (c.correct ? [i] : []));
      if (cs.length < 2 || !richtig.length) return [];
      return [
        {
          art: 'waehlen',
          id: b.id,
          frage: prompt(b, 'Tippe die richtige Antwort an.'),
          optionen: cs.map((c) => c.text),
          richtig,
        },
      ];
    }
    case 'truefalse': {
      // Statements about a reading or listening text cannot be answered without it.
      if (page.blocks.some((x) => x.type === 'reading' || x.type === 'listening')) return [];
      return statements(str(p.items)).flatMap((s, i): Uebung[] => {
        if (!s.text || !s.answer) return [];
        if (str(p.mode) !== 'tf') {
          const optionen = ['richtig', 'falsch', 'steht nicht im Text'];
          return [
            {
              art: 'waehlen',
              id: `${b.id}:${i}`,
              frage: prompt(b, 'Stimmt das?'),
              aussage: s.text,
              optionen,
              richtig: [{ T: 0, F: 1, NG: 2 }[s.answer]],
            },
          ];
        }
        return [
          {
            art: 'richtigfalsch',
            id: `${b.id}:${i}`,
            frage: prompt(b, 'Stimmt das?'),
            aussage: s.text,
            richtig: s.answer === 'T',
          },
        ];
      });
    }
    case 'match': {
      const left = lines(p.left);
      const right = lines(p.right);
      const sol = matchNumbers(p.solution);
      const paare = right.flatMap((r, j): [string, string][] => (sol[j] && left[sol[j] - 1] ? [[left[sol[j] - 1], r]] : []));
      if (paare.length < 2) return [];
      const out: Uebung[] = [];
      // Chunks of at most PAARE_MAX, the last one not smaller than 2.
      const n = Math.ceil(paare.length / PAARE_MAX);
      const size = Math.ceil(paare.length / n);
      for (let k = 0; k < n; k++)
        out.push({
          art: 'paare',
          id: n > 1 ? `${b.id}:${k}` : b.id,
          frage: prompt(b, 'Finde die Paare.'),
          paare: paare.slice(k * size, (k + 1) * size),
        });
      return out.filter((u) => u.art !== 'paare' || u.paare.length >= 2);
    }
    case 'gap': {
      // One exercise per line with a gap; every gap needs its answer.
      return str(p.text)
        .split('\n')
        .flatMap((line, i): Uebung[] => {
          const segs = segments(line);
          const gaps = segs.filter((s) => s.blank);
          if (!gaps.length || gaps.some((g) => !g.solution)) return [];
          const teile: string[] = [];
          let text = '';
          for (const s of segs) {
            if (s.blank) {
              teile.push(text, firstForm(s.solution!));
              text = '';
            } else text += s.text;
          }
          teile.push(text);
          const answers = gaps.map((g) => firstForm(g.solution!));
          const kacheln = shuffle([...answers, ...pick(pool, answers, ABLENKER, `${b.id}:${i}`)], seeded(`${b.id}:${i}:k`));
          return [
            {
              art: 'luecke',
              id: `${b.id}:${i}`,
              frage: prompt(b, 'Ergänze die Lücken.'),
              teile,
              kacheln,
            },
          ];
        });
    }
    case 'jumble':
      return lines(p.items).flatMap((line, i): Uebung[] => {
        const j = jumble(line);
        if (!j.solution || j.parts.length < 2) return [];
        return [
          {
            art: 'reihenfolge',
            id: `${b.id}:${i}`,
            frage: prompt(b, 'Bring die Wörter in die richtige Reihenfolge.'),
            hinweis: '',
            kacheln: j.parts,
            loesung: j.solution,
          },
        ];
      });
    case 'transform':
      return rows(p.items).flatMap(([source = '', target = '', solution = ''], i): Uebung[] => {
        const words = sentenceTiles(firstForm(solution));
        if (words.length < 2) return [];
        return [
          {
            art: 'reihenfolge',
            id: `${b.id}:${i}`,
            frage: prompt(b, 'Forme um.'),
            hinweis: target ? `${source} → ${target}` : source,
            kacheln: shuffledTiles(words, `${b.id}:${i}`),
            loesung: firstForm(solution),
          },
        ];
      });
    case 'foldtest': {
      const pairs = rows(p.rows).filter(([g = '', w = '']) => g && w);
      const answers = unique(pairs.map(([, w = '']) => firstForm(w)));
      return pairs.flatMap(([given = '', wanted = ''], i): Uebung[] => {
        const right = firstForm(wanted);
        const wrong = pick(unique([...answers, ...pool]), [right], 3, `${b.id}:${i}`);
        if (wrong.length < 1) return [];
        const optionen = shuffle([right, ...wrong], seeded(`${b.id}:${i}:o`));
        return [
          {
            art: 'waehlen',
            id: `${b.id}:${i}`,
            frage: given,
            optionen,
            richtig: [optionen.indexOf(right)],
          },
        ];
      });
    }
    case 'picvocab': {
      // „Bild wählen“: the word, and its picture among up to three others of the block.
      const pics = str(p.pics).split('\n');
      const items = rows(p.items).flatMap(([emoji = '', word = ''], k) => {
        const id = pics[k]?.trim() ?? '';
        const bild = id ? `${BILD_KEY}${id}` : emoji.trim();
        return bild && word.trim() ? [{ bild, wort: firstForm(word), k }] : [];
      });
      if (items.length < 2) return [];
      return items.map(({ bild, wort, k }): Uebung => {
        const andere = shuffle(
          items.filter((x) => x.bild !== bild && x.wort.toLowerCase() !== wort.toLowerCase()),
          seeded(`${b.id}:${k}`),
        ).slice(0, 3);
        const bilder = shuffle([bild, ...andere.map((x) => x.bild)], seeded(`${b.id}:${k}:o`));
        return { art: 'bild', id: `${b.id}:${k}`, frage: 'Welches Bild passt?', wort, bilder, richtig: bilder.indexOf(bild) };
      }).filter((u) => u.art === 'bild' && u.bilder.length >= 2);
    }
    default:
      return [];
  }
}

/** A sentence as tiles: words, with the end mark as a tile of its own. */
export function sentenceTiles(sentence: string): string[] {
  const end = /[.?!]$/.exec(sentence)?.[0] ?? '';
  const words = (end ? sentence.slice(0, -1) : sentence).split(/\s+/).filter(Boolean);
  return end ? [...words, end] : words;
}

/** Tiles in an order that is not already the solution. */
export function shuffledTiles(words: string[], seed: string): string[] {
  for (let t = 0; t < 8; t++) {
    const s = shuffle(words, seeded(seed + t));
    if (s.join(' ') !== words.join(' ')) return s;
  }
  return words;
}

/** The exercises of a lesson's pages, in reading order (teacher pages left out). */
export function exercisesOf(pages: Page[]): Uebung[] {
  const student = pages.filter((p) => p.type !== 'lehrkraft');
  const pool = wordPool(student.flatMap((p) => p.blocks));
  return student.flatMap((page) => page.blocks.flatMap((b) => fromBlock(b, page, pool)));
}

/**
 * The Lernpaket of a lesson; `lessons` are the module's lessons, for the locked stations on the map, without those
 * hidden from the class (`versteckt`, never the lesson itself).
 */
export function buildPaket(m: Module, l: Lesson, lessons: Lesson[] = [l], versteckt: readonly string[] = []): Paket {
  const stunden = lessons
    .filter((x) => x.moduleId === m.id && (x.id === l.id || !versteckt.includes(x.id)))
    .sort((a, b) => a.number - b.number)
    .map((x) => ({ nummer: x.number, titel: x.title }));
  return {
    format: PAKET_FORMAT,
    v: 1,
    stunde: l.id,
    nummer: l.number,
    titel: l.title,
    modul: { id: m.id, nummer: m.number, titel: m.title, icon: m.icon, stunden },
    fach: m.subject,
    lang: m.lang,
    // The released exercises of the KI-Fragenpool come after the lesson's own ones.
    // Easy ones first, so the rounds of a station get harder (the sort is stable; no level counts as the middle).
    uebungen: [
      ...exercisesOf(l.doc.pages),
      ...(l.pool ?? [])
        .filter((e) => e.frei)
        .map((e) => e.u)
        .sort((a, b) => (a.niveau ?? 2) - (b.niveau ?? 2)),
    ],
  };
}

/** A Lernpaket from the server, or null when it is not one (an older or broken one is skipped, not shown). */
export function readPaket(x: unknown): Paket | null {
  if (!x || typeof x !== 'object') return null;
  const p = x as Partial<Paket>;
  if (p.format !== PAKET_FORMAT || typeof p.stunde !== 'string' || !Array.isArray(p.uebungen) || !p.modul) return null;
  // Kinds of a newer Baukasten are left out (this page could not show them); pictures only as data URLs.
  const bilder = p.bilder && typeof p.bilder === 'object' ? Object.fromEntries(Object.entries(p.bilder).filter(([, v]) => typeof v === 'string' && v.startsWith('data:image/'))) : {};
  const uebungen = p.uebungen.filter((u) => {
    if (!u || !UEBUNGS_ARTEN.includes(u.art)) return false;
    if (u.art === 'bild') return Array.isArray(u.bilder) && u.bilder.every((x) => typeof x === 'string' && (!x.startsWith(BILD_KEY) || x in bilder));
    if (u.art === 'punkt') return typeof u.bild === 'string' && u.bild in bilder && Array.isArray(u.punkte) && u.punkte.length > 0;
    return true;
  });
  return { ...(p as Paket), uebungen, bilder };
}

/**
 * The package with its own pictures as JPEGs (`thumb` makes one from an image id and a longest side, null when the
 * picture is gone). Exercises whose pictures are missing or over the limits are left out.
 */
export async function mitBildern(p: Paket, thumb: (id: string, seite: number) => Promise<string | null>): Promise<Paket> {
  const keys = [...new Set(p.uebungen.flatMap(bildKeys))];
  const klein = keys.filter((k) => k.startsWith(BILD_KEY)).slice(0, BILDER_MAX);
  const gross = keys.filter((k) => k.startsWith(KARTE_KEY)).slice(0, KARTEN_MAX);
  const bilder: Record<string, string> = {};
  for (const k of [...klein, ...gross]) {
    const id = k.slice(k.indexOf(':') + 1);
    const url = await thumb(id, k.startsWith(KARTE_KEY) ? KARTE_SEITE : BILD_SEITE).catch(() => null);
    if (url) bilder[k] = url;
  }
  const uebungen = p.uebungen.filter((u) => bildKeys(u).every((x) => !(x.startsWith(BILD_KEY) || x.startsWith(KARTE_KEY)) || x in bilder));
  return { ...p, uebungen, ...(Object.keys(bilder).length ? { bilder } : {}) };
}
