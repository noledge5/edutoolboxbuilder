// "Präsi in Canva" (Runde 9): the request the teacher pastes into a Claude chat with the Canva connection. Claude
// imports the lesson's pictures from short-lived links, shows the outline and builds the presentation in Canva.
import { BLOCK_TYPES } from '../model/blockTypes';
import { str } from '../model/text';
import type { Doc } from '../model/types';
import type { Lesson, Module, Settings } from '../library/types';
import { packagePages } from '../ai/lesson';

/** The Canva connection takes at most this many pictures into a new presentation. */
export const MAX_IMAGES = 10;

export interface LessonImage {
  id: string;
  /** What the picture is, for Claude: material number and caption, else the block's label. */
  label: string;
}

/**
 * The pictures of the lesson's student pages, numbered material first (it is what the slides show large), then the
 * rest in page order; each picture once, at most `MAX_IMAGES`. Teacher pages count only for the hook picture.
 */
export function lessonImages(doc: Doc): LessonImage[] {
  const found: (LessonImage & { mat: boolean; order: number })[] = [];
  const seen = new Set<string>();
  doc.pages.forEach((page) =>
    page.blocks.forEach((b) => {
      const def = BLOCK_TYPES[b.type];
      if (!def || (page.type === 'lehrkraft' && b.type !== 'hook')) return;
      for (const f of def.fields) {
        if (f.kind !== 'image') continue;
        const id = str(b.props[f.key]).trim();
        if (!id || seen.has(id)) continue;
        seen.add(id);
        const mat = str(b.props.mat).trim();
        const caption = str(b.props.caption).trim();
        const label = b.type === 'hook' ? 'Einstieg' : [mat, caption || def.label].filter(Boolean).join(': ');
        found.push({ id, label, mat: !!mat, order: found.length });
      }
    }),
  );
  return found
    .sort((a, b) => Number(b.mat) - Number(a.mat) || a.order - b.order)
    .slice(0, MAX_IMAGES)
    .map(({ id, label }) => ({ id, label }));
}

/** The design id in a Canva link ("https://www.canva.com/design/DAG…/…/edit" → "DAG…"), else ''. */
export function canvaDesignId(url: string): string {
  return /^https:\/\/(?:www\.)?canva\.com\/design\/([A-Za-z0-9_-]+)/.exec(url.trim())?.[1] ?? '';
}

/** The template for a module's presentations: its own, else its subject's, else none. */
export function canvaTemplateOf(settings: Settings, m: Module): string {
  return m.canvaTemplate || settings.canvaTemplates?.[m.subject] || '';
}

/** The request for the chat. `links` are the uploaded pictures in the order of `lessonImages`. */
export function canvaPrompt(m: Module, l: Lesson, template: string, links: { label: string; url: string }[]): string {
  const id = canvaDesignId(template);
  const out: string[] = [
    `Bitte baue mir in Canva eine Präsentation für diese Stunde: ${m.subject}, Klasse ${m.grade}, Modul ${m.number} „${m.title}“, Stunde ${l.number} „${l.title}“.`,
    '',
    '## So gehst du vor',
    links.length
      ? `1. Lade ${links.length === 1 ? 'das Bild' : `die ${links.length} Bilder`} unten mit ${links.length === 1 ? 'seinem Link' : 'ihren Links'} in Canva hoch (die Links gelten nur etwa eine Stunde). Es sind die Bilder vom Arbeitsblatt; sie gehören groß auf die Folien.`
      : '1. Die Stunde hat keine eigenen Bilder. Nimm passende Bilder aus Canva.',
    '2. Überlege kurz, wie die Stunde im Raum läuft, und zeig mir die Gliederung zum Prüfen. Frag höchstens ein, zwei Dinge, wenn etwas wirklich unklar ist.',
    `3. Erzeuge danach die Präsentation${links.length ? ' mit den hochgeladenen Bildern' : ''}${id ? ` im Stil meiner Vorlage (Canva-Design \`${id}\`)` : ''}. Fehlt ein Bild auf der passenden Folie, setz es danach ein.`,
    '4. Lösungen als Zwillingsfolie: direkt nach einer Auftragsfolie dieselbe Folie noch einmal, nur mit dem Lösungskasten an derselben Stelle. Schreib in die Notizen dieser Folie „Lösung auf Klick“.',
    '5. Gib mir am Ende den Link zur Präsentation.',
    '',
    '## Was auf die Folien kommt',
    '- Einstieg: ein großes Bild oder eine Frage, wenig Text.',
    '- Material groß: Bilder, Karten und Diagramme der Stunde, jeweils bildschirmfüllend.',
    '- Auftragsfolien: nur der kurze Auftrag in Schülersprache, klein dazu Sozialform und Zeit als Symbol (z. B. „👥 zu zweit · 10 min“).',
    '- Lösungen (als Zwillingsfolie, siehe oben) und, wenn die Stunde einen hat, der Merksatz.',
    '- Etwa 8–12 Folien, wenig Text, große Schrift. Deutsch' + (m.lang === 'en' ? ', bei dieser Englisch-Stunde die Folien auf Englisch, die Notizen auf Deutsch.' : '.'),
    '- Nicht auf die Folien: Niveaus oder Sterne, Kompetenzen, M-Nummern ohne Material, Lernziele in Lehrersprache, Ablaufpläne. Hinweise für mich gehören in die Notizen.',
  ];
  if (links.length) out.push('', '## Bilder', ...links.map((x, i) => `${i + 1}. ${x.label}: ${x.url}`));
  out.push(
    '',
    '## Die Stunde',
    'Die Seiten aus dem Arbeitsblatt-Baukasten (JSON): zuerst die Seite für die Lehrkraft mit Ziel, Einstieg, Lernweg und Verlauf, dann die Schülerseiten mit Material und Aufgaben. Lösungen stehen in `[[…]]`, bei `*` markierten Antworten und in `solution`. Bilder sind nur als ID genannt; nimm dafür die Bilder oben.',
    '```json',
    JSON.stringify(packagePages(l.doc.pages.filter((p) => p.blocks.length > 0))),
    '```',
  );
  return out.join('\n');
}
