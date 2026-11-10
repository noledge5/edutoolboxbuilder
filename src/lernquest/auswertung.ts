// Progress per child and competence (Stufe 4), for the teacher's page. The server only knows the review cards of each
// child (Leitner box 1–5 per exercise); which competence an exercise trains is known only here, from the task's
// `competence` field in the module. So the link never goes to the server. Pure, so it is tested without a browser.
import type { Lesson, Module } from '../library/types';
import { exercisesOf } from './paket';
import { karteKey } from './rules';
import type { Stand } from './types';

/** From this box on an exercise counts as mastered: right at least twice in a row. */
export const BOX_SITZT = 3;

export interface KindKompetenz {
  /** Exercises of the competence in the unlocked lessons, practised ones, mastered ones, last answered wrong. */
  aufgaben: number;
  geuebt: number;
  sitzt: number;
  wackelt: number;
  /** Share mastered of all exercises; null while nothing is practised. */
  anteil: number | null;
  /** Practised, and at least half of it was last answered wrong. */
  hilfe: boolean;
}

export interface KompetenzZeile {
  id: string;
  name: string;
  aufgaben: number;
  /** Mean share of the children who practised; null when nobody did. */
  anteil: number | null;
  kinder: Record<string, KindKompetenz>;
}

export interface Auswertung {
  zeilen: KompetenzZeile[];
  /** Exercises in the unlocked lessons whose task links no competence. */
  ohneKompetenz: number;
}

/** Review keys (`karteKey`) per competence id, from the exercises of the lessons. */
export function kartenJeKompetenz(lessons: Lesson[]): { je: Map<string, string[]>; ohne: number } {
  const je = new Map<string, string[]>();
  let ohne = 0;
  for (const l of lessons) {
    const comp = new Map<string, string>();
    for (const p of l.doc.pages) for (const b of p.blocks) comp.set(b.id, String(b.props.competence ?? ''));
    for (const u of exercisesOf(l.doc.pages)) {
      // Exercise ids are the block id or `<block id>:<n>`.
      const c = comp.get(u.id) ?? comp.get(u.id.slice(0, u.id.lastIndexOf(':'))) ?? '';
      if (!c) {
        ohne++;
        continue;
      }
      je.set(c, [...(je.get(c) ?? []), karteKey(l.id, u.id)]);
    }
  }
  return { je, ohne };
}

export function kindKompetenz(keys: string[], leitner: Stand['leitner']): KindKompetenz {
  let geuebt = 0;
  let sitzt = 0;
  let wackelt = 0;
  for (const k of keys) {
    const box = leitner[k]?.[0];
    if (!box) continue;
    geuebt++;
    if (box >= BOX_SITZT) sitzt++;
    if (box === 1) wackelt++;
  }
  return { aufgaben: keys.length, geuebt, sitzt, wackelt, anteil: geuebt ? sitzt / keys.length : null, hilfe: geuebt > 0 && wackelt * 2 >= geuebt };
}

/** The competences of the module in its order, each with the children's progress; competences without exercises are left out. */
export function auswerten(m: Module, lessons: Lesson[], kinder: { id: string; leitner: Stand['leitner'] }[]): Auswertung {
  const { je, ohne } = kartenJeKompetenz(lessons.filter((l) => l.moduleId === m.id));
  const zeilen: KompetenzZeile[] = [];
  for (const c of m.competences) {
    const keys = je.get(c.id);
    if (!keys?.length) continue;
    const proKind: Record<string, KindKompetenz> = {};
    for (const k of kinder) proKind[k.id] = kindKompetenz(keys, k.leitner ?? {});
    const werte = Object.values(proKind).flatMap((x) => (x.anteil === null ? [] : [x.anteil]));
    zeilen.push({
      id: c.id,
      name: c.area.trim() || 'Kompetenz ohne Namen',
      aufgaben: keys.length,
      anteil: werte.length ? werte.reduce((a, b) => a + b, 0) / werte.length : null,
      kinder: proKind,
    });
  }
  // Links to competences no longer in the module count as without competence.
  const bekannt = new Set(m.competences.map((c) => c.id));
  let fremd = 0;
  for (const [id, keys] of je) if (!bekannt.has(id)) fremd += keys.length;
  return { zeilen, ohneKompetenz: ohne + fremd };
}
