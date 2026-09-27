// Sample document shown on first start (the prototype's Treibhauseffekt worksheets).
import { createBlock as b } from './ops';
import type { Doc } from './types';
import { SLIDE_DEFAULTS, type Slide, type SlideLayout } from './slides';

export function seedDoc(): Doc {
  return {
    icon: 'thermometer-sun',
    lang: 'de',
    help: true,
    footer: 'Kuhl · Grafen-von-Zimmern-Realschule · Geographie',
    code: 'K9 · M1 · S2',
    pages: [
      {
        title: 'Versuchsprotokoll: Wärme einfangen',
        kicker: 'Klasse 9 · Modellversuch zum Treibhauseffekt',
        type: 'versuch',
        form: 'zu zweit',
        nameField: 'namen',
        blocks: [
          b('heading', { text: 'Aufbau' }),
          b('text', { text: 'Zwei gleiche Gläser, je ein Thermometer. Glas A bleibt offen. Glas B wird mit Klarsichtfolie verschlossen. Beide stehen gleich weit von der Lampe entfernt.' }, 7),
          b('image', { caption: 'Abb. 1: Versuchsaufbau', height: 90 }, 5),
          b('mc', { prompt: 'Unsere Vorhersage: Welches Glas wird nach 15 Minuten wärmer sein?', options: 'Glas A\n*Glas B\ngleich' }),
          b('table', {
            prompt: 'Messwerte',
            cols: 'Zeit\nGlas A (offen)\nGlas B (Folie)\nUnterschied',
            rows: '0 min (Start)\n3 min\n6 min\n9 min\n12 min\n15 min',
          }),
          b('open', { prompt: 'Welches Glas war am Ende wärmer, und um wie viel?', lines: 1, solution: 'Glas B (mit Folie), um einige Grad.' }),
          b('open', { prompt: 'Warum, glaubt ihr, war das so?', lines: 2, solution: 'Die Folie hält die Wärmestrahlung zurück, die Luft im Glas kühlt langsamer ab.' }),
          b('hint', {
            title: 'Wichtiger Hinweis',
            text: 'Dieser Versuch zeigt nur das allgemeine Prinzip — eine Barriere hält Wärmestrahlung zurück. Er beweist nicht, dass genau CO₂ das tut.',
          }),
        ],
      },
      {
        title: 'Fließschema: Der Treibhauseffekt',
        kicker: 'Klasse 9 · Sicherung fürs Lernjournal',
        type: 'sicherung',
        form: 'allein',
        nameField: 'name',
        blocks: [
          b('flow', { steps: 'Sonnenstrahlung | (kurzwellig)\nErdoberfläche | erwärmt sich\nWärmestrahlung | (langwellig)\nTreibhausgase | CO₂, Methan, Wasserdampf' }),
          b('draw', {
            prompt: 'Von den Treibhausgasen aus geht es in zwei Richtungen weiter. Zeichnet beide Pfeile ein: ein Teil entweicht … ein Teil wird zurückgestrahlt zur …',
            height: 130,
          }),
          b('wordbank', { words: 'Weltall\nErdoberfläche\nzusätzliche Erwärmung' }),
          b('heading', { text: 'Zwei Begriffe, ein Unterschied' }),
          b('gap', { prompt: 'natürlicher Treibhauseffekt', text: 'notwendig — ohne ihn läge die Erde bei etwa [[−18]] °C.' }, 6),
          b('gap', { prompt: 'zusätzlicher Treibhauseffekt', text: 'von Menschen verursacht — seit etwa [[1850]] messbar.' }, 6),
          b('merksatz', { text: 'Beobachtung + [[Mechanismus]] = eine Erklärung, die überzeugt.' }),
        ],
      },
    ],
  };
}

/** The slides of the sample lesson, after the design's slide reference (Präsentation Treibhauseffekt). */
export function seedSlides(): Slide[] {
  const s = (id: string, layout: SlideLayout, fields: Partial<Slide>): Slide => ({ ...SLIDE_DEFAULTS, id, layout, ...fields });
  return [
    s('f1', 'title', {
      type: 'versuch',
      title: 'Der Treibhauseffekt',
      text: 'Wie genau hängen CO₂ und Temperatur zusammen?',
      notes: 'Stunde 2 im Modul Das Klima kippt. Ziel: Mechanismus des Treibhauseffekts erarbeiten und die offene Frage aus Stunde 1 beantworten.',
    }),
    s('f2', 'list', {
      type: 'lehrkraft',
      phase: 'Abrufphase',
      form: 'allein',
      minutes: 5,
      title: 'Aus dem Gedächtnis',
      text: 'Schreibt eure Antworten ins Lernjournal.',
      items: [
        'Welche Einheit hat der CO₂-Wert in unserer ersten Kurve? | ppm',
        'Reicht ein zeitlicher Zusammenhang aus, um eine Ursache zu beweisen? | Nein',
        'Aus Klasse 8: Was entsteht, wenn zwei Platten auseinanderdriften? | neue Kruste / Mittelozeanischer Rücken',
      ].join('\n'),
      reveal: true,
      notes: '0–5 min, Einzel. Drei Fragen aus dem Gedächtnis ins Lernjournal, dann Selbstkorrektur: Antworten mit einem Klick aufdecken.',
    }),
    s('f3', 'quote', {
      type: 'lehrkraft',
      phase: 'Einstieg',
      form: 'Plenum',
      minutes: 5,
      label: 'Aus Stunde 1',
      text: '„Was müsste man wissen, damit der Zusammenhang belegt ist?“',
      title: 'Wie genau erwärmt CO₂ die Luft?',
      notes: '5–10 min, Plenum. Whiteboard-Antworten aus Stunde 1 kurz zeigen, dann die Leitfrage stellen.',
    }),
    s('f4', 'compare', {
      type: 'versuch',
      phase: 'Versuch',
      form: 'zu zweit',
      minutes: 5,
      title: 'Wärme einfangen',
      items: 'Glas A | bleibt offen\nGlas B | wird mit Klarsichtfolie verschlossen',
      text: 'Je ein Thermometer. Beide stehen gleich weit von der Lampe entfernt. Unsere Vorhersage: Welches Glas wird nach 15 Minuten wärmer sein?',
      notes: '10–15 min, Partner. Material: 2 Gläser, Folie, 2 Thermometer, Lampe. Vorhersage auf dem Versuchsprotokoll ankreuzen lassen.',
    }),
    s('f5', 'list', {
      type: 'versuch',
      phase: 'Messwerte & Deutung',
      form: 'Plenum',
      minutes: 8,
      title: 'Was habt ihr gemessen?',
      items: 'Welches Glas war am Ende wärmer, und um wie viel?\nWarum, glaubt ihr, war das so?',
      notes: '30–38 min, Plenum. Werte der Paare vergleichen, dann die Deutung gemeinsam erarbeiten.',
    }),
    s('f6', 'statement', {
      type: 'versuch',
      phase: 'Messwerte & Deutung',
      form: 'Plenum',
      label: 'Deutung',
      title: 'Die Folie hält Wärmestrahlung zurück — genau das tun Treibhausgase in der Atmosphäre, nur ohne Folie.',
      text: '**Wichtiger Hinweis:** Dieser Versuch zeigt nur das allgemeine Prinzip — eine Barriere hält Wärmestrahlung zurück. Er beweist nicht, dass genau CO₂ das tut.',
      notes: 'Wichtig: Der Versuch zeigt das Prinzip, nicht dass es speziell CO₂ ist. Diese Unterscheidung ist selbst ein Lernziel.',
    }),
    s('f7', 'flow', {
      type: 'sicherung',
      phase: 'Sicherung',
      form: 'allein',
      minutes: 4,
      title: 'Wie erwärmt CO₂ die Luft?',
      items: 'Sonnenstrahlung | kurzwellig\nErdoberfläche | erwärmt sich\nWärmestrahlung | langwellig\nTreibhausgase | CO₂, Methan, Wasserdampf',
      text: 'Ein Teil entweicht ins Weltall — ein Teil wird zur Erdoberfläche zurückgestrahlt.',
      notes: '38–42 min, Einzel. Fließschema fertig ins Lernjournal übertragen (Fließschema-Arbeitsblatt).',
    }),
    s('f8', 'compare', {
      type: 'sicherung',
      phase: 'Sicherung',
      form: 'allein',
      title: 'Zwei Begriffe, ein Unterschied',
      items: 'natürlicher Treibhauseffekt | notwendig — ohne ihn läge die Erde bei etwa **−18 °C**.\nzusätzlicher Treibhauseffekt | von Menschen verursacht — seit etwa **1850** messbar.',
      notes: 'Begriffe natürlicher und zusätzlicher Treibhauseffekt sichern. Fehlvorstellung aufgreifen: Ohne Treibhauseffekt wäre es nicht angenehmer.',
    }),
    s('f9', 'exit', {
      type: 'sicherung',
      phase: 'Exit',
      form: 'Plenum',
      minutes: 3,
      text: 'Rückbezug Stunde 1: Jetzt gibt es einen Mechanismus.',
      label: 'Merksatz',
      title: 'Beobachtung + Mechanismus = Erklärung.',
      notes: '42–45 min, Plenum. Rückbezug auf Stunde 1: Jetzt gibt es einen Mechanismus. Merksatz ins Lernjournal.',
    }),
  ];
}
