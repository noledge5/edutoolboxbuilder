// The symbol system of the worksheets (26.11.2026). Each task gets one action symbol for what to do, taken from its
// first operator ("Lies …" → Lesen) or else from its kind, and a symbol for the social form where the class does not
// work alone. Rules from docs/design/arbeitsblatt-prinzipien.md: a small fixed set, always the same meaning, always
// beside the written instruction (never instead of it), always in the same place, explained once on the Symbolkarte.
import type { Block, BlockType, Lang } from '../model/types';
import { str } from '../model/text';

export type SymKey = 'lesen' | 'markieren' | 'schreiben' | 'ankreuzen' | 'ergaenzen' | 'zuordnen' | 'ordnen' | 'eintragen' | 'zeichnen' | 'rechnen' | 'sprechen' | 'hoeren' | 'recherchieren';
export type FormKey = 'allein' | 'partner' | 'gruppe' | 'klasse';

/** Whole words only; \b does not know umlauts, so letters are checked with Unicode classes. */
const words = (list: string[]) => new RegExp(`(?<!\\p{L})(?:${list.join('|')})(?!\\p{L})`, 'iu');

export interface SymbolDef {
  key: SymKey;
  de: string;
  en: string;
  /** Operators that call for it, as the Symbolkarte shows them. */
  examples: { de: string; en: string };
  /** Its operators, German and English (singular and plural imperative). */
  ops: string[];
  /** Where they stand in an instruction (built from ops, Zuordnen also finds "Ordne … zu"). */
  match: RegExp;
}

const sym = (key: SymKey, de: string, en: string, examples: { de: string; en: string }, ops: string[], match = words(ops)): SymbolDef => ({ key, de, en, examples, ops, match });

/** The action symbols, in the order of the Symbolkarte. Where two match at the same word, the earlier wins (Zuordnen before Ordnen). */
export const SYMBOLS: SymbolDef[] = [
  sym('lesen', 'Lesen', 'Read', { de: 'lies, lies ab', en: 'read' }, ['lies', 'lest', 'read']),
  sym('markieren', 'Markieren', 'Mark', { de: 'markiere, unterstreiche, kreise ein', en: 'highlight, underline, circle' }, [
    'markiere', 'markiert', 'unterstreiche', 'unterstreicht', 'kreise', 'kreist', 'highlight', 'underline', 'circle', 'mark',
  ]),
  sym('ankreuzen', 'Ankreuzen', 'Tick', { de: 'kreuze an, wähle aus', en: 'tick, choose' }, ['kreuze', 'kreuzt', 'wähle', 'wählt', 'tick', 'choose']),
  sym('ergaenzen', 'Ergänzen', 'Complete', { de: 'ergänze, setze ein, vervollständige', en: 'complete, fill in' }, [
    'ergänze', 'ergänzt', 'vervollständige', 'vervollständigt', 'setze', 'setzt', 'fülle', 'füllt', 'complete', 'fill',
  ]),
  sym(
    'zuordnen',
    'Zuordnen',
    'Match',
    { de: 'ordne zu, verbinde', en: 'match, connect' },
    ['ordne', 'ordnet', 'verbinde', 'verbindet', 'match', 'connect'],
    /(?<!\p{L})(?:ordne|ordnet)(?!\p{L})[^.!?\n]*(?<!\p{L})zu(?!\p{L})|(?<!\p{L})(?:verbinde|verbindet|match|connect)(?!\p{L})/iu,
  ),
  sym('ordnen', 'Ordnen', 'Put in order', { de: 'ordne, nummeriere, sortiere', en: 'put in order, number' }, [
    'ordne', 'ordnet', 'nummeriere', 'nummeriert', 'sortiere', 'sortiert', 'order', 'number', 'sort',
  ]),
  sym('eintragen', 'Eintragen', 'Fill in', { de: 'trage ein, übertrage', en: 'copy into' }, ['trage', 'tragt', 'übertrage', 'übertragt', 'copy']),
  sym('zeichnen', 'Zeichnen', 'Draw', { de: 'zeichne, skizziere, beschrifte', en: 'draw, label' }, [
    'zeichne', 'zeichnet', 'skizziere', 'skizziert', 'beschrifte', 'beschriftet', 'male', 'malt', 'draw', 'label', 'sketch',
  ]),
  sym('rechnen', 'Rechnen', 'Calculate', { de: 'rechne, berechne', en: 'calculate' }, ['rechne', 'rechnet', 'berechne', 'berechnet', 'calculate', 'work out']),
  sym('sprechen', 'Sprechen', 'Talk', { de: 'besprecht, erzählt, präsentiert', en: 'talk, ask, tell' }, [
    'besprecht', 'besprich', 'diskutiert', 'diskutiere', 'sprecht', 'sprich', 'erzähle', 'erzählt', 'präsentiere', 'präsentiert', 'interviewe', 'interviewt',
    'talk', 'discuss', 'ask', 'tell', 'say', 'act out', 'present',
  ]),
  sym('hoeren', 'Hören', 'Listen', { de: 'hör zu', en: 'listen' }, ['hör', 'höre', 'hört', 'listen']),
  sym('recherchieren', 'Recherchieren', 'Find out', { de: 'recherchiere, informiere dich', en: 'find out, look up' }, [
    'recherchiere', 'recherchiert', 'informiere', 'informiert', 'research', 'find out', 'look up',
  ]),
  sym('schreiben', 'Schreiben', 'Write', { de: 'schreibe, notiere, beantworte, begründe', en: 'write, answer, explain' }, [
    'schreibe', 'schreibt', 'notiere', 'notiert', 'beantworte', 'beantwortet', 'erkläre', 'erklärt', 'beschreibe', 'beschreibt', 'begründe', 'begründet', 'nenne', 'nennt',
    'fasse', 'fasst', 'formuliere', 'formuliert', 'vergleiche', 'vergleicht', 'erläutere', 'erläutert', 'beurteile', 'beurteilt', 'bewerte', 'bewertet', 'gib', 'gebt',
    'write', 'answer', 'explain', 'describe', 'note', 'compare',
  ]),
];

/** Operators that call for no symbol of their own (the kind of task decides it), for the check "has an operator". */
const MORE_OPERATORS = [
  'vermute', 'vermutet', 'überlege', 'überlegt', 'prüfe', 'prüft', 'überprüfe', 'überprüft', 'finde', 'findet', 'entscheide', 'entscheidet', 'stelle', 'stellt',
  'analysiere', 'analysiert', 'werte', 'wertet', 'untersuche', 'untersucht', 'erörtere', 'erörtert', 'nimm', 'nehmt', 'ermittle', 'ermittelt', 'bestimme', 'bestimmt',
  'gestalte', 'gestaltet', 'entwickle', 'entwickelt', 'plane', 'plant', 'führe', 'führt', 'beobachte', 'beobachtet', 'miss', 'messt', 'probiere', 'probiert',
  'teste', 'testet', 'korrigiere', 'korrigiert', 'verbessere', 'verbessert', 'übersetze', 'übersetzt', 'verorte', 'verortet', 'lokalisiere', 'lokalisiert',
  'charakterisiere', 'charakterisiert', 'interpretiere', 'interpretiert', 'kennzeichne', 'kennzeichnet', 'sammle', 'sammelt', 'suche', 'sucht', 'schau', 'schaut',
  'sieh', 'seht', 'betrachte', 'betrachtet', 'benenne', 'benennt', 'definiere', 'definiert', 'wiederhole', 'wiederholt', 'löse', 'löst', 'spiele', 'spielt',
  'baue', 'baut', 'schneide', 'schneidet', 'klebe', 'klebt', 'erstelle', 'erstellt', 'stelle dar', 'arbeite', 'arbeitet',
  'find', 'correct', 'translate', 'look', 'think', 'check', 'guess', 'decide', 'solve', 'use', 'play', 'sing', 'name', 'put', 'give', 'make', 'work', 'try', 'imagine', 'write down',
];

/** Every operator the check knows, as the first word of a clause ("Lies M1 und beschreibe …": both count). */
const OPERATOR_START = new RegExp(
  `^(?:${[...SYMBOLS.flatMap((s) => s.ops), ...MORE_OPERATORS].sort((a, b) => b.length - a.length).join('|')})(?!\\p{L})`,
  'iu',
);

/**
 * Whether an instruction names what to do (an operator), as the guidelines ask of every task. Only at the start of a
 * sentence or clause, where an instruction puts it: "Wie hat sich … entwickelt?" ends in a participle that looks like
 * the plural imperative, and does not count.
 */
export const hasOperator = (prompt: string): boolean =>
  prompt
    .split(/[.!?:;\n]+|,\s*(?=dann\b)|(?<!\p{L})(?:und|and|then|dann)(?!\p{L})/iu)
    .map((c) => c.replace(/^[\s„“"'(–-]*(?:[a-z]\)|\d+[.)])?\s*/iu, ''))
    .some((c) => OPERATOR_START.test(c));

/** What a task does when its instruction names no operator. */
const BY_TYPE: Partial<Record<BlockType, SymKey>> = {
  open: 'schreiben',
  mc: 'ankreuzen',
  truefalse: 'ankreuzen',
  gap: 'ergaenzen',
  wordweb: 'ergaenzen',
  table: 'eintragen',
  match: 'zuordnen',
  jumble: 'ordnen',
  syntax: 'ordnen',
  draw: 'zeichnen',
  bingo: 'sprechen',
  foldtest: 'schreiben',
  picvocab: 'schreiben',
  transform: 'schreiben',
  writing: 'schreiben',
  mediation: 'schreiben',
};

export interface FormDef {
  key: FormKey;
  de: string;
  en: string;
  /** Words in the instruction that name it (only clear phrases: "Gruppe" alone is often content). */
  match: RegExp;
}

export const FORMS: FormDef[] = [
  { key: 'allein', de: 'allein', en: 'alone', match: /$^/ },
  {
    key: 'partner',
    de: 'zu zweit',
    en: 'in pairs',
    match: /zu zweit|mit deine[mr] (?:partner|partnerin|nachbar|nachbarin|sitznachbar|sitznachbarin)|partnerarbeit|with (?:a|your) partner|in pairs/iu,
  },
  { key: 'gruppe', de: 'Gruppe', en: 'group', match: /in (?:der|eurer|einer) gruppe|in gruppen|gruppenarbeit|in groups|in your group/iu },
  { key: 'klasse', de: 'Klasse', en: 'class', match: /mit der (?:ganzen )?klasse|in der klasse|with the (?:whole )?class/iu },
];

export const isSymKey = (x: unknown): x is SymKey => SYMBOLS.some((s) => s.key === x);
export const isFormKey = (x: unknown): x is FormKey => FORMS.some((f) => f.key === x);

/** The action symbol the Baukasten picks: the first operator in the instruction, else the kind of task. */
export function detectSymbol(prompt: string, type: BlockType): SymKey | null {
  let best: SymKey | null = null;
  let at = Infinity;
  for (const s of SYMBOLS) {
    const m = s.match.exec(prompt);
    if (m && m.index < at) {
      at = m.index;
      best = s.key;
    }
  }
  return best ?? BY_TYPE[type] ?? null;
}

/** The social form named in the instruction, if any. */
export const detectForm = (prompt: string): FormKey | null => FORMS.find((f) => f.match.test(prompt))?.key ?? null;

/** A task's action symbol: chosen (`sym`), switched off (`"none"`) or picked by the Baukasten (`""`). */
export function symbolOf(block: Block): SymKey | null {
  const v = str(block.props.sym);
  if (v === 'none') return null;
  if (isSymKey(v)) return v;
  return detectSymbol(str(block.props.prompt), block.type);
}

/** A task's social form: chosen (`form`), switched off (`"none"`) or named in the instruction (`""`). */
export function formOf(block: Block): FormKey | null {
  const v = str(block.props.form);
  if (v === 'none') return null;
  if (isFormKey(v)) return v;
  return detectForm(str(block.props.prompt));
}

export const symbolLabel = (k: SymKey, lang: Lang) => SYMBOLS.find((s) => s.key === k)![lang === 'en' ? 'en' : 'de'];
export const formLabel = (k: FormKey, lang: Lang) => FORMS.find((f) => f.key === k)![lang === 'en' ? 'en' : 'de'];
