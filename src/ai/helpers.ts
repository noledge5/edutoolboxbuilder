// Helpers at a block (small jobs, Claude Sonnet): rewrite it (simpler, more technical, shorter, in English or German),
// make a version for level G, M or E, or add the solution and a tip. Claude gets the block, its field reference and
// the lesson around it, and answers with the block's new fields; pictures, the competence and the points stay.
import { blockEntry, DIDACTICS_BRIEF } from '../claude/instructions';
import { BLOCK_TYPES, type FieldDef } from '../model/blockTypes';
import { uid } from '../model/ops';
import type { Block, BlockProps, Lang } from '../model/types';
import type { Competence } from '../library/types';
import { DocFormatError } from '../model/normalize';

export type HelperKind = 'einfacher' | 'fachlicher' | 'kuerzer' | 'englisch' | 'deutsch' | 'G' | 'M' | 'E' | 'loesung';

export const HELPERS: { v: HelperKind; l: string; what: string }[] = [
  { v: 'einfacher', l: 'Einfacher', what: 'Umformulieren: einfacher' },
  { v: 'fachlicher', l: 'Fachlicher', what: 'Umformulieren: fachlicher' },
  { v: 'kuerzer', l: 'Kürzer', what: 'Umformulieren: kürzer' },
  { v: 'englisch', l: 'Auf Englisch', what: 'Umformulieren: Englisch' },
  { v: 'deutsch', l: 'Auf Deutsch', what: 'Umformulieren: Deutsch' },
  { v: 'G', l: '★ G', what: 'Fassung G' },
  { v: 'M', l: '★★ M', what: 'Fassung M' },
  { v: 'E', l: '★★★ E', what: 'Fassung E' },
  { v: 'loesung', l: 'Lösung und Tipp', what: 'Lösung und Tipp' },
];

export const isLevelHelper = (k: HelperKind): k is 'G' | 'M' | 'E' => k === 'G' || k === 'M' || k === 'E';
const LEVEL_VALUE = { G: '1', M: '2', E: '3' } as const;

/** Where the block sits, for Claude. */
export interface BlockContext {
  subject: string;
  grade: number;
  lang: Lang;
  pageTitle: string;
  /** The competence the task practises, with its G/M/E descriptions. */
  competence?: Competence;
}

const TASK: Record<HelperKind, string> = {
  einfacher:
    'Formuliere den Baustein einfacher: kurze Sätze, bekannte Wörter, ein Arbeitsschritt pro Satz, Operatoren beibehalten. Der Inhalt und die Lösungen bleiben fachlich gleich.',
  fachlicher: 'Formuliere den Baustein fachlicher: Fachbegriffe und Operatoren des Bildungsplans, genauer und anspruchsvoller formuliert. Der Inhalt bleibt gleich.',
  kuerzer: 'Kürze den Baustein: dieselbe Aufgabe in deutlich weniger Worten, nichts Wichtiges weglassen.',
  englisch: 'Übersetze den Baustein ins Englische, passend für die Klassenstufe (Schülertexte, Aufträge und Lösungen). Die deutsche Hilfe (`help`) bleibt deutsch.',
  deutsch: 'Übersetze den Baustein ins Deutsche, passend für die Klassenstufe (Schülertexte, Aufträge und Lösungen).',
  G: 'Mach eine Fassung für Niveau G (grundlegend): mehr Hilfen (Satzanfänge, Wortspeicher im Auftrag, Beispiele), weniger auf einmal, einfache Sprache. Dasselbe Lernziel.',
  M: 'Mach eine Fassung für Niveau M (mittel): eigenständiger als G, mit wenigen Hilfen. Dasselbe Lernziel.',
  E: 'Mach eine Fassung für Niveau E (erweitert): anspruchsvoller, mit Begründen, Vergleichen oder Beurteilen und ohne Hilfen. Dasselbe Lernziel.',
  loesung:
    'Ergänze die Lösung, so wie dieser Baustein sie festhält (siehe Felder, z. B. `solution`, `*` vor richtigen Antworten, `[[…]]` in Lücken), und einen hilfreichen Tipp (`tip`), der nicht die Lösung verrät. Der Rest bleibt wörtlich.',
};

/** The short instructions for helpers (the same for every request, so they are cached). */
export function helperSystem(): string {
  return [
    'Du hilfst einer Lehrkraft an einer Realschule in Baden-Württemberg, einen Baustein eines Arbeitsblatts im „Arbeitsblatt-Baukasten“ zu überarbeiten.',
    'Ein Baustein hat einen Typ und Felder (`props`). Jedes Feld hat ein festes Format, das in der Feldtabelle steht: Zeilen mit `|` getrennt, richtige Antworten mit `*` davor, Lücken als `[[Lösung]]`, freie Lücken als `___`, Hervorhebungen wie dort beschrieben. Halte diese Formate genau ein.',
    'Antworte nur mit einem JSON-Codeblock: `{"props": { … }}` mit den Feldern, die du änderst (Text als Zeichenkette, mehrere Zeilen mit \\n). Felder, die du nicht nennst, bleiben. Keine Rückfragen, kein Text außerhalb des Codeblocks.',
    DIDACTICS_BRIEF,
    'Ändere nie Bilder, Bildquellen, die Kompetenz, das Niveau oder die Punkte. Typografie: deutsche Anführungszeichen „…“ in deutschen Texten, englische “…” in englischen.',
  ].join('\n\n');
}

/** Fields Claude may write for this helper: texts; for a level version also numbers (lines, rows). */
function writable(f: FieldDef, kind: HelperKind): boolean {
  if (['level', 'points', 'langPoints', 'competence', 'source'].includes(f.key)) return false;
  if (f.kind === 'text' || f.kind === 'area' || f.kind === 'ipa') return true;
  return isLevelHelper(kind) && f.kind === 'number';
}

/** The props of a block as Claude sees them: without pictures and fields that stay. */
const shownProps = (b: Block) => Object.fromEntries(BLOCK_TYPES[b.type].fields.filter((f) => f.kind !== 'image' && f.kind !== 'pics' && f.kind !== 'preset').map((f) => [f.key, b.props[f.key] ?? '']));

export function helperPrompt(kind: HelperKind, b: Block, c: BlockContext): string {
  const out = [
    `**Auftrag:** ${TASK[kind]}`,
    '',
    `**Wo:** ${c.subject}, Klasse ${c.grade}, Arbeitsblatt „${c.pageTitle}“, Sprache des Blatts: ${c.lang === 'en' ? 'Englisch' : 'Deutsch'}.`,
  ];
  if (c.competence) out.push(`**Kompetenz:** ${c.competence.area} (G: ${c.competence.g} · M: ${c.competence.m} · E: ${c.competence.e})`);
  out.push('', '**Felder dieses Bausteins:**', '', blockEntry(b.type), '', '**Der Baustein jetzt:**', '```json', JSON.stringify({ type: b.type, props: shownProps(b) }, null, 1), '```');
  return out.join('\n');
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/**
 * The block after Claude's answer: only fields Claude may write are taken. A level version is a new block with the
 * level set; the other helpers keep the block's id. Throws a German DocFormatError when nothing usable came back.
 */
export function blockFromAnswer(raw: unknown, b: Block, kind: HelperKind): Block {
  const got = isObj(raw) && isObj(raw.props) ? raw.props : isObj(raw) ? raw : null;
  if (!got) throw new DocFormatError('In der Antwort stehen keine Felder ("props").');
  const props: BlockProps = { ...b.props };
  let changed = 0;
  for (const f of BLOCK_TYPES[b.type].fields) {
    if (!(f.key in got) || !writable(f, kind)) continue;
    const v = got[f.key];
    if (f.kind === 'number') {
      const n = Math.round(Number(v));
      if (Number.isFinite(n)) props[f.key] = Math.min(f.max, Math.max(f.min, n));
    } else {
      const text = Array.isArray(v) ? v.map(String).join('\n') : typeof v === 'string' || typeof v === 'number' ? String(v) : null;
      if (text === null) continue;
      props[f.key] = text;
    }
    changed++;
  }
  if (!changed) throw new DocFormatError('Claude hat keine Felder dieses Bausteins geändert.');
  if (isLevelHelper(kind)) return { ...b, id: uid(), props: { ...props, level: LEVEL_VALUE[kind] } };
  return { ...b, props };
}
