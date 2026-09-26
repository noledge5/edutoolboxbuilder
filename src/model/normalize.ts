// Validates and repairs a document coming from outside (JSON dialog, storage, later Claude handoffs).
// Unknown block types are dropped and missing props are filled from the defaults.
import { BLOCK_TYPES, isBlockType } from './blockTypes';
import { uid } from './ops';
import { THEMES, VARIANTS, WORK_FORMS } from './themes';
import { DEFAULT_TOPIC_ICON, isTopicIcon } from '../topicIcons';
import type { Block, BlockProps, Doc, NameField, Page, SheetType, WorkForm } from './types';

const NAME_FIELDS: NameField[] = ['name', 'namen', 'klasse', 'aus'];

/** Older documents stored the name field as true/false. */
function normalizeNameField(x: unknown): NameField {
  if (x === false) return 'aus';
  return NAME_FIELDS.includes(x as NameField) ? (x as NameField) : 'name';
}

export class DocFormatError extends Error {}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const asStr = (x: unknown, fallback: string): string => (typeof x === 'string' ? x : typeof x === 'number' ? String(x) : fallback);

function normalizeProps(type: Block['type'], raw: unknown): BlockProps {
  const T = BLOCK_TYPES[type];
  const props: BlockProps = { ...T.defaults };
  if (isObj(raw)) {
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === 'string' || (typeof v === 'number' && Number.isFinite(v))) props[k] = v;
      // Lists given as arrays (e.g. ["A", "B"]) become the one-per-line text the editor uses.
      else if (Array.isArray(v)) props[k] = v.map((x) => asStr(x, '')).join('\n');
    }
  }
  for (const f of T.fields) {
    const v = props[f.key];
    if (f.kind === 'number') {
      const n = typeof v === 'number' ? v : parseInt(String(v), 10);
      props[f.key] = Number.isFinite(n) ? Math.max(f.min, Math.min(f.max, n)) : T.defaults[f.key];
    } else if (f.kind === 'variant') {
      if (!(String(v) in VARIANTS)) props[f.key] = T.defaults[f.key];
    } else if (f.kind === 'seg') {
      // Accept 2 for "2" (hand-written or generated files).
      const o = f.options.find((o) => String(o.v) === String(v));
      props[f.key] = o ? o.v : T.defaults[f.key];
    } else if (typeof v !== 'string') {
      props[f.key] = v == null ? '' : String(v);
    }
  }
  return props;
}

function normalizeBlock(raw: unknown, seen: Set<string>): Block | null {
  if (!isObj(raw) || !isBlockType(raw.type)) return null;
  const type = raw.type;
  let id = typeof raw.id === 'string' && raw.id ? raw.id : uid();
  while (seen.has(id)) id = uid();
  seen.add(id);
  const span = typeof raw.span === 'number' && Number.isInteger(raw.span) && raw.span >= 1 && raw.span <= 12 ? raw.span : BLOCK_TYPES[type].span;
  return { id, type, span, props: normalizeProps(type, raw.props) };
}

function normalizePage(raw: unknown, index: number, seen: Set<string>): Page {
  if (!isObj(raw)) throw new DocFormatError(`Seite ${index + 1} ist kein Objekt.`);
  const type = typeof raw.type === 'string' && raw.type in THEMES ? (raw.type as SheetType) : 'uebung';
  const form = WORK_FORMS.includes(raw.form as WorkForm) ? (raw.form as WorkForm) : 'allein';
  const blocks = Array.isArray(raw.blocks) ? raw.blocks.map((b) => normalizeBlock(b, seen)).filter((b): b is Block => b !== null) : [];
  return {
    title: asStr(raw.title, 'Neues Arbeitsblatt'),
    kicker: asStr(raw.kicker, ''),
    type,
    form,
    nameField: normalizeNameField(raw.nameField),
    blocks,
  };
}

export function normalizeDoc(raw: unknown): Doc {
  if (!isObj(raw) || !Array.isArray(raw.pages)) throw new DocFormatError('Es fehlt die Liste "pages".');
  if (raw.pages.length === 0) throw new DocFormatError('Die Liste "pages" ist leer.');
  const seen = new Set<string>();
  return {
    icon: isTopicIcon(raw.icon) ? raw.icon : DEFAULT_TOPIC_ICON,
    footer: asStr(raw.footer, ''),
    code: asStr(raw.code, ''),
    pages: raw.pages.map((p, i) => normalizePage(p, i, seen)),
  };
}

/** Parses JSON text into a document; errors carry a German message for the user. */
export function parseDocJson(text: string): Doc {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    throw new DocFormatError(e instanceof Error ? e.message : String(e));
  }
  return normalizeDoc(raw);
}
