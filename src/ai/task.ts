// Tasks by instruction: the teacher says in her words what she wants ("Mach daraus eine Zuordnung mit Bildern"),
// Claude answers with one to three blocks of any type. They replace a block, go in after it, or are new.
import { blockReferenceText, DIDACTICS_BRIEF } from '../claude/instructions';
import { blockText } from '../library/search';
import { BLOCK_TYPES, isBlockType } from '../model/blockTypes';
import { DocFormatError, normalizeDoc } from '../model/normalize';
import { blockImages, uid } from '../model/ops';
import type { Block, Lang, Page } from '../model/types';
import type { Competence } from '../library/types';
import { isObj } from '../model/text';

/** Where the task goes and what is around it. */
export interface TaskContext {
  subject: string;
  grade: number;
  /** Module title. */
  topic: string;
  lang: Lang;
  page: Page;
  competences: Competence[];
  /** The class profile and the teacher's principles (`classNotes`), '' without. */
  notes?: string;
}

export function taskSystem(): string {
  return [
    'Du hilfst einer Lehrkraft an einer Realschule in Baden-Württemberg, Aufgaben für ein Arbeitsblatt im „Arbeitsblatt-Baukasten“ zu bauen. Ein Blatt besteht aus Bausteinen; jeder hat einen Typ und Felder (`props`) mit festem Format (siehe Referenz unten). Halte die Formate genau ein: Zeilen mit `|` getrennt, richtige Antworten mit `*` davor, Lücken als `[[Lösung]]`, Lösungen in den Lösungsfeldern.',
    'Du bekommst eine Anweisung der Lehrkraft und, falls es ihn gibt, den Baustein, um den es geht. Folge der Anweisung. Du darfst den Typ wechseln, wenn die Anweisung es nahelegt, und 1 bis 3 Bausteine liefern (z. B. eine Abbildung und die Aufgabe dazu). Aufgaben sind eindeutig lösbar und enthalten ihre Lösung.',
    'Bilder kannst du nicht liefern: Bei Abbildungen und Bildimpulsen schreibst du in `describe` eine englische Bildbeschreibung für eine Illustration (ohne Text im Bild) und in `search` zwei, drei englische Suchwörter; `image` und `pics` bleiben leer. Bei Bild-Vokabeln nimmst du Emojis als Platzhalter.',
    'Klasse 5 und 6: anschaulich und abwechslungsreich, kurze Sätze, gern mit Bild, Rätsel oder Spiel. Sprache der Aufgaben wie das Blatt; deutsche Hilfe (`help`) bei englischen Blättern, wenn sie hilft. Verknüpfe Aufgaben über `competence` mit einer ID aus dem Kompetenzraster, wenn eine passt.',
    DIDACTICS_BRIEF,
    'Antworte nur mit einem JSON-Codeblock, ohne Rückfragen: ```json\n{"blocks": [{"type": "match", "span": 12, "props": {…}}]}\n```',
    '# Referenz der Bausteine',
    blockReferenceText(),
  ].join('\n\n');
}

/** The other blocks of the page in short, so the new task fits in. */
function pageSummary(page: Page, skip?: string): string {
  return page.blocks
    .filter((b) => b.id !== skip)
    .map((b) => `- ${BLOCK_TYPES[b.type].label}: ${blockText(b).join(' / ').slice(0, 220)}`)
    .join('\n');
}

const leanBlock = (b: Block) => ({ type: b.type, span: b.span, props: Object.fromEntries(Object.entries(b.props).filter(([k, v]) => v !== '' && k !== 'image' && k !== 'pics')) });

export function taskPrompt(instruction: string, c: TaskContext, block?: Block): string {
  return [
    `**Anweisung der Lehrkraft:** ${instruction.trim()}`,
    '',
    `**Wo:** ${c.subject}, Klasse ${c.grade}, Modul „${c.topic}“, Arbeitsblatt „${c.page.title}“, Sprache des Blatts: ${c.lang === 'en' ? 'Englisch' : 'Deutsch'}.`,
    c.competences.length ? `**Kompetenzraster:** ${c.competences.map((k) => `\`${k.id}\` ${k.area}`).join(' · ')}` : '',
    block ? `**Der Baustein, um den es geht:**\n\`\`\`json\n${JSON.stringify(leanBlock(block))}\n\`\`\`` : '**Neu:** Die Aufgabe kommt neu auf das Blatt.',
    `**Was sonst auf der Seite steht:**\n${pageSummary(c.page, block?.id) || '(noch nichts)'}`,
    c.notes ? `\n${c.notes}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}


/**
 * The blocks in Claude's answer, with new ids. A task without competence or level takes the old block's; pictures
 * stay only where Claude kept the old block's own; competences must be in the grid.
 */
export function blocksFromAnswer(raw: unknown, competences: Competence[], old?: Block): Block[] {
  const list = isObj(raw) && Array.isArray(raw.blocks) ? raw.blocks : isObj(raw) && isBlockType(raw.type) ? [raw] : null;
  if (!list) throw new DocFormatError('In der Antwort fehlen die Bausteine ("blocks").');
  const known = list.filter((b) => isObj(b) && isBlockType(b.type)).slice(0, 3);
  if (!known.length) throw new DocFormatError('Claude hat keinen Baustein geliefert, den der Baukasten kennt.');
  const blocks = normalizeDoc({ pages: [{ title: 'x', blocks: known }] }).pages[0].blocks;
  const oldImages = new Set(old ? blockImages(old) : []);
  const ids = new Set(competences.map((k) => k.id));
  return blocks.map((b) => {
    const props = { ...b.props };
    if (props.image && !oldImages.has(String(props.image))) props.image = '';
    if (props.pics) props.pics = String(props.pics).split('\n').map((x) => (oldImages.has(x.trim()) ? x.trim() : '')).join('\n');
    if (BLOCK_TYPES[b.type].task && old) {
      if (!props.competence && old.props.competence) props.competence = old.props.competence;
      if (!props.level && old.props.level) props.level = old.props.level;
    }
    if (props.competence && !ids.has(String(props.competence))) props.competence = '';
    return { ...b, id: uid(), props };
  });
}
