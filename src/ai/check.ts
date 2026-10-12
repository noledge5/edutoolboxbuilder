// "Stunde prüfen": Claude reads the finished lesson and lists what would break it in class: tasks the sheet gives
// no material for, knowledge that comes after the task needing it, tasks too hard or too easy for the class. Each
// finding names a block and an instruction that "Mit Anweisung neu machen" can carry out.
import { DIDACTICS_BRIEF } from '../claude/instructions';
import { blockText } from '../library/search';
import { BLOCK_TYPES } from '../model/blockTypes';
import { DocFormatError } from '../model/normalize';
import type { Doc } from '../model/types';
import type { TaskContext } from './task';

export type CheckContext = Omit<TaskContext, 'page'>;

export interface Finding {
  /** The block it is about, null if Claude named none the lesson has. */
  blockId: string | null;
  /** "S2.4": page 2, block 4. */
  ref: string;
  kind: string;
  problem: string;
  /** What to do, as an instruction for "Mit Anweisung neu machen". */
  fix: string;
}

export const KINDS: Record<string, string> = { loesbar: 'Nicht lösbar', reihenfolge: 'Reihenfolge', niveau: 'Niveau', sonst: 'Sonstiges' };

export function checkSystem(): string {
  return [
    'Du prüfst eine fertige Unterrichtsstunde aus dem „Arbeitsblatt-Baukasten“ für eine Lehrkraft an einer Realschule in Baden-Württemberg, bevor sie sie hält. Suche nur, was die Stunde im Unterricht scheitern lässt:',
    '- `loesbar`: Eine Aufgabe braucht Wissen oder Material, das nicht auf den Blättern steht (Infotext, Material, Abbildung, Tabelle, Wortspeicher) und nicht offensichtlich aus früheren Stunden bekannt ist.',
    '- `reihenfolge`: Das Wissen steht zwar da, aber erst nach der Aufgabe, die es braucht, oder der Stundenverlauf passt nicht zur Reihenfolge der Blätter.',
    '- `niveau`: Eine Aufgabe passt nicht zur Klasse (Klassenprofil, Klassenstufe) oder nicht zu ihrem Niveau-Stern (G/M/E): zu schwer, zu leicht, zu viel Text.',
    '- `sonst`: Lösung falsch oder fehlt, Auftrag mehrdeutig, Bild nötig, aber nur als Platzhalter beschrieben.',
    'Bausteine heißen `S<Seite>.<Nummer>`, z. B. `S2.4`. Bilder siehst du nicht, nur ihre Beschreibung; sie gelten als vorhanden, wenn `image` gesetzt ist. Melde nur echte Probleme, keine Geschmacksfragen, höchstens zehn, die wichtigsten zuerst. Für jedes schreibst du `fix` als kurze Anweisung an den Baustein, die ein zweiter Schritt ausführt (z. B. „Ergänze vor der Aufgabe einen kurzen Infotext zu …“ oder „Stütze die Aufgabe auf Material M2 und frag nur nach …“).',
    DIDACTICS_BRIEF,
    'Antworte nur mit einem JSON-Codeblock: ```json\n{"findings": [{"ref": "S2.4", "kind": "loesbar", "problem": "…", "fix": "…"}]}\n``` Ist alles in Ordnung: `{"findings": []}`.',
  ].join('\n\n');
}

const refs = (doc: Doc) => doc.pages.flatMap((p, pi) => p.blocks.map((b, bi) => ({ ref: `S${pi + 1}.${bi + 1}`, block: b })));

export function checkPrompt(doc: Doc, c: CheckContext): string {
  const pages = doc.pages.map((p, pi) => {
    const lines = p.blocks.map((b, bi) => {
      const T = BLOCK_TYPES[b.type];
      const extra = [b.props.level && `Niveau ${b.props.level}`, b.props.image ? 'Bild gesetzt' : T.fields.some((f) => f.key === 'image') && 'ohne Bild'].filter(Boolean).join(', ');
      return `- S${pi + 1}.${bi + 1} ${T.label}${extra ? ` (${extra})` : ''}: ${blockText(b).join(' / ')}`;
    });
    return `### Seite ${pi + 1}: ${p.title}${p.type === 'lehrkraft' ? ' (für die Lehrkraft)' : ''}\n${lines.join('\n') || '(leer)'}`;
  });
  return [
    `**Stunde:** ${c.subject}, Klasse ${c.grade}, Modul „${c.topic}“, Sprache der Blätter: ${c.lang === 'en' ? 'Englisch' : 'Deutsch'}.`,
    c.competences.length ? `**Kompetenzraster:** ${c.competences.map((k) => `\`${k.id}\` ${k.area}`).join(' · ')}` : '',
    c.notes ? c.notes : '',
    '',
    ...pages,
  ]
    .filter((x) => x !== '')
    .join('\n');
}

const text = (x: unknown) => (typeof x === 'string' ? x.trim() : '');

/** The findings in Claude's answer, each with its block (refs the lesson does not have keep blockId null). */
export function findingsFromAnswer(raw: unknown, doc: Doc): Finding[] {
  const list = typeof raw === 'object' && raw !== null && Array.isArray((raw as { findings?: unknown }).findings) ? (raw as { findings: unknown[] }).findings : null;
  if (!list) throw new DocFormatError('In der Antwort fehlt die Liste der Befunde ("findings").');
  const byRef = new Map(refs(doc).map((r) => [r.ref, r.block.id]));
  return list.flatMap((f) => {
    if (typeof f !== 'object' || f === null) return [];
    const o = f as Record<string, unknown>;
    const ref = text(o.ref).toUpperCase();
    const problem = text(o.problem);
    if (!problem) return [];
    return [{ blockId: byRef.get(ref) ?? null, ref, kind: KINDS[text(o.kind)] ? text(o.kind) : 'sonst', problem, fix: text(o.fix) }];
  });
}
