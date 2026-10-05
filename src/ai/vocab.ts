// Vocabulary lists with Claude: from the worksheets of a lesson or a whole unit, Claude picks the words that are new
// for the class, sorts them into word fields and says which ones a picture suits. The Baukasten makes a
// "Vocabulary" page of them: one list per word field (with a picture column) and a word web to practise.
import { blockText } from '../library/search';
import { createBlock, createPage } from '../model/ops';
import { DocFormatError } from '../model/normalize';
import type { Doc, Lang, Page } from '../model/types';

export interface VocabWord {
  en: string;
  ipa: string;
  de: string;
  example: string;
  /** English search words for a free picture; '' when no picture suits the word. */
  picture: string;
}

export interface VocabField {
  name: string;
  words: VocabWord[];
}

export interface VocabDraft {
  topic: string;
  fields: VocabField[];
}

export interface VocabSource {
  title: string;
  doc: Doc;
}

/** "to live" and "live", "Live" are the same entry. */
export const wordKey = (en: string) => en.trim().toLowerCase().replace(/^to\s+/, '').replace(/\s+/g, ' ');

const MAX_TEXT = 24000;

/** The texts of the students' pages (teacher pages and existing vocabulary lists left out). */
export function sourceText(sources: VocabSource[]): string {
  const out: string[] = [];
  for (const s of sources) {
    const pages = s.doc.pages.filter((p) => p.type !== 'lehrkraft' && p.blocks.some((b) => b.type !== 'vocab'));
    if (!pages.length) continue;
    out.push(`## ${s.title}`);
    for (const p of pages) {
      out.push(`### ${p.title}`);
      for (const b of p.blocks) if (b.type !== 'vocab') out.push(...blockText(b));
    }
  }
  const text = out.join('\n');
  return text.length > MAX_TEXT ? text.slice(0, MAX_TEXT) + '\n…' : text;
}

/** The short, fixed instructions (cached). */
export function vocabSystem(): string {
  return [
    'Du erstellst Vokabellisten für den Englischunterricht an einer Realschule in Baden-Württemberg (Klasse 5–10) im „Arbeitsblatt-Baukasten“.',
    'Aus dem Material der Lehrkraft wählst du die englischen Wörter und Wendungen, die für die Klasse neu sind und die sie zum Verstehen und Bearbeiten braucht. Wörter aus der Liste „Schon gelernt“ nimmst du nicht auf, auch nicht in anderer Form (Plural, Zeitform). Eigennamen, Zahlen und sehr einfache Wörter der Klassenstufe lässt du weg.',
    'Ordne die Wörter in 2 bis 6 Wortfelder (englische Namen, kurz, z. B. „Family“, „At home“, „Free time“), je Wortfeld 3 bis 12 Wörter. Verben mit „to“ („to live“).',
    'Zu jedem Wort: Lautschrift (britisch, IPA, ohne Schrägstriche), deutsche Bedeutung (bei mehreren Bedeutungen die im Material gemeinte zuerst, mit Komma getrennt), ein kurzer, einfacher Beispielsatz (gern aus dem Material) und `picture`: ein englisches Suchwort für ein freies Bild, nur wenn das Wort anschaulich ist (Dinge, Tiere, Orte, Essen, Kleidung, klar zeichenbare Tätigkeiten), sonst "".',
    'Antworte nur mit einem JSON-Codeblock, ohne Rückfragen und ohne Text davor oder danach:',
    '```json\n{"topic": "My family", "fields": [{"name": "Family", "words": [{"en": "grandma", "ipa": "ˈɡrænmɑː", "de": "Oma", "example": "My grandma lives in Leeds.", "picture": "grandmother"}]}]}\n```',
    'Typografie: englische Anführungszeichen “…” in englischen Sätzen.',
  ].join('\n\n');
}

export interface VocabRequest {
  grade: number;
  /** Module title, e.g. "My family". */
  topic: string;
  scope: 'lesson' | 'module';
  sources: VocabSource[];
  /** English words of the vocabulary lists the class already has (this grade). */
  known: string[];
  wishes?: string;
}

export function vocabPrompt(r: VocabRequest): string {
  const known = [...new Set(r.known.map((w) => w.trim()).filter(Boolean))];
  return [
    `**Auftrag:** Vokabelliste für Klasse ${r.grade}, Thema „${r.topic}“, aus ${r.scope === 'lesson' ? 'den Arbeitsblättern dieser Stunde' : 'allen Arbeitsblättern dieser Unit'}.`,
    r.wishes?.trim() ? `**Wünsche der Lehrkraft:** ${r.wishes.trim()}` : '',
    `**Schon gelernt (nicht aufnehmen):** ${known.length ? known.join(', ') : '(noch keine Vokabellisten)'}`,
    '',
    '**Material:**',
    sourceText(r.sources) || '(kein Text auf den Arbeitsblättern)',
  ]
    .filter((l) => l !== '')
    .join('\n');
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const s = (x: unknown) => (typeof x === 'string' ? x.replace(/\s+/g, ' ').trim() : '');

/** Reads Claude's answer: words without English or German are dropped, known words and repeats left out. */
export function vocabFromAnswer(raw: unknown, known: string[], topic: string): VocabDraft {
  if (!isObj(raw) || !Array.isArray(raw.fields)) throw new DocFormatError('In der Antwort fehlen die Wortfelder ("fields").');
  const seen = new Set(known.map(wordKey));
  const fields: VocabField[] = [];
  for (const f of raw.fields) {
    if (!isObj(f) || !Array.isArray(f.words)) continue;
    const words: VocabWord[] = [];
    for (const w of f.words) {
      if (!isObj(w)) continue;
      const word: VocabWord = { en: s(w.en), ipa: s(w.ipa).replace(/^[/[]|[/\]]$/g, ''), de: s(w.de), example: s(w.example), picture: s(w.picture) };
      const key = wordKey(word.en);
      if (!word.en || !word.de || seen.has(key)) continue;
      seen.add(key);
      words.push(word);
    }
    if (words.length) fields.push({ name: s(f.name) || 'Words', words });
  }
  if (!fields.length) throw new DocFormatError('Claude hat keine neuen Wörter gefunden.');
  return { topic: s(raw.topic) || topic, fields };
}

const cell = (x: string) => x.replace(/\|/g, '/');

/** Rough height of a vocabulary list on the page (px), to share the lists out over pages. */
function listHeight(words: VocabWord[]): number {
  return 56 + words.reduce((h, w) => h + Math.max(w.picture ? 50 : 0, w.example.length > 46 || w.de.length > 22 ? 48 : 33), 0);
}
const WEB_HEIGHT = 430;
const GAP = 14;
const BODY = 860;

export interface VocabPageOptions {
  lang: Lang;
  /** Line above the title: "Class 5 · Unit 2". */
  kicker: string;
}

/**
 * The pages for the chosen words: one list per word field (split when it does not fit), then a word web with the
 * word fields to complete. Fields left empty by the choice are dropped.
 */
export function vocabPages(d: VocabDraft, o: VocabPageOptions): Page[] {
  const en = o.lang === 'en';
  const fields = d.fields.filter((f) => f.words.length);
  const blocks: { block: ReturnType<typeof createBlock>; h: number }[] = [];
  for (const f of fields) {
    // A long word field goes on in a second list (it may land on the next page).
    for (let at = 0; at < f.words.length; ) {
      let n = 0;
      while (at + n < f.words.length && listHeight(f.words.slice(at, at + n + 1)) <= BODY - 40) n++;
      const part = f.words.slice(at, at + Math.max(1, n));
      blocks.push({
        block: createBlock('vocab', {
          title: f.name,
          rows: part.map((w) => [w.en, w.ipa, w.de, w.example].map(cell).join(' | ')).join('\n'),
          picwords: part.map((w) => w.picture).join('\n'),
          pics: '',
        }),
        h: listHeight(part),
      });
      at += part.length;
    }
  }
  const branches = fields.map((f) => {
    const shown = f.words.slice(0, 2).map((w) => w.en);
    const gaps = f.words.slice(2, 3).map((w) => `[[${w.en}]]`);
    return `${cell(f.name)} | ${[...shown, ...gaps].map((x) => x.replace(/,/g, ' ')).join(', ')}`;
  });
  if (fields.length >= 2)
    blocks.push({
      block: createBlock('wordweb', {
        prompt: en ? 'Complete the word web. Add more words you know.' : 'Ergänze das Wortnetz. Schreib weitere Wörter dazu.',
        center: d.topic,
        branches: branches.join('\n'),
        height: 380,
      }),
      h: WEB_HEIGHT,
    });
  const title = `${en ? 'Vocabulary' : 'Wortschatz'}: ${d.topic}`;
  const pages: Page[] = [];
  let used = BODY;
  for (const b of blocks) {
    if (!pages.length || used + GAP + b.h > BODY) {
      pages.push({ ...createPage(), title, kicker: o.kicker, type: 'vocab', form: 'allein', nameField: 'name', blocks: [] });
      used = -GAP;
    }
    pages[pages.length - 1].blocks.push(b.block);
    used += GAP + b.h;
  }
  return pages;
}

/** All words of a draft, for counting. */
export const draftWords = (d: VocabDraft) => d.fields.reduce((n, f) => n + f.words.length, 0);
