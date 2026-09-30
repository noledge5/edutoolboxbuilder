// Language of the printed sheet: fixed labels in German or English, and typographic quotation marks.
import { createContext, useContext } from 'react';
import type { Doc, Lang } from '../model/types';

/** The document whose page is drawn: its language and help switch, and the whole sheet for blocks that sum it up (points, tips). */
export const SheetDocContext = createContext<Doc | null>(null);

export const useSheetDoc = () => useContext(SheetDocContext);
export const useSheetLang = (): Lang => useContext(SheetDocContext)?.lang ?? 'de';

/** Fixed texts printed on the sheet. Teacher-only parts (teacher blocks, competence tags) stay German. */
export const SHEET_TEXT = {
  de: {
    name: 'Name:',
    names: 'Namen:',
    klasse: 'Klasse:',
    date: 'Datum:',
    page: (n: number) => `Seite ${n}`,
    solution: 'Lösung',
    group: (g: string) => `Gruppe ${g}`,
    back: 'Rückseite',
    merksatz: 'Merksatz',
    wordbank: 'Wortspeicher',
    imageSource: 'Quelle',
    points: 'P.',
    content: 'Inhalt',
    language: 'Sprache',
    vocabCols: ['Englisch', 'Lautschrift', 'Deutsch', 'Beispielsatz'],
    fold: 'hier knicken',
    rule: 'Regel',
    signal: 'Signalwörter',
    examples: 'Beispiele',
    stages: { pre: 'Vor dem Hören', while: 'Beim Hören', post: 'Nach dem Hören' } as Record<string, string>,
    transcript: 'Transkript',
    tf: ['richtig', 'falsch', 'steht nicht im Text'],
    checklist: 'Meine Checkliste',
    source: 'Deutscher Text',
    line: 'Z.',
    nameLine: 'Name',
    tip: (n: number, page: number | null) => `Tipp zu Aufgabe ${n}${page ? ` · Seite ${page}` : ''}`,
  },
  en: {
    name: 'Name:',
    names: 'Names:',
    klasse: 'Class:',
    date: 'Date:',
    page: (n: number) => `Page ${n}`,
    solution: 'Key',
    group: (g: string) => `Group ${g}`,
    back: 'Back',
    merksatz: 'Remember',
    wordbank: 'Word bank',
    imageSource: 'Source',
    points: 'pts',
    content: 'Content',
    language: 'Language',
    vocabCols: ['English', 'Pronunciation', 'German', 'Example'],
    fold: 'fold here',
    rule: 'Rule',
    signal: 'Signal words',
    examples: 'Examples',
    stages: { pre: 'Before you listen', while: 'While you listen', post: 'After you listen' } as Record<string, string>,
    transcript: 'Transcript',
    tf: ['true', 'false', 'not in the text'],
    checklist: 'My checklist',
    source: 'German text',
    line: 'l.',
    nameLine: 'Name',
    tip: (n: number, page: number | null) => `Tip for task ${n}${page ? ` · page ${page}` : ''}`,
  },
} satisfies Record<Lang, Record<string, unknown>>;

export type SheetText = (typeof SHEET_TEXT)['de'];

export const useSheetText = (): SheetText => SHEET_TEXT[useSheetLang()];

const QUOTES: Record<Lang, [string, string, string]> = {
  de: ['„', '“', '‚'],
  en: ['“', '”', '‘'],
};

/**
 * Straight quotes as typographic ones: "…" becomes „…“ (German) or “…” (English), an opening ' becomes ‚ or ‘,
 * and every other ' the apostrophe ’ (it’s, geht’s). A quote counts as opening at the start or after a space or bracket.
 */
export function typo(s: string, lang: Lang): string {
  if (!s.includes('"') && !s.includes("'")) return s;
  const [open, close, single] = QUOTES[lang];
  return s.replace(/["']/g, (q, i: number) => {
    const opening = i === 0 || /[\s([{\-–—/]/.test(s[i - 1]);
    if (q === '"') return opening ? open : close;
    return opening ? single : '’';
  });
}
