// Sample document shown on first start (the prototype's Treibhauseffekt worksheets).
import { createBlock as b } from './ops';
import type { Doc } from './types';

export function seedDoc(): Doc {
  return {
    icon: 'thermometer-sun',
    footer: 'Kuhl · Grafen-von-Zimmern-Realschule · Geographie',
    code: 'K9 · M1 · S2',
    pages: [
      {
        title: 'Versuchsprotokoll: Wärme einfangen',
        kicker: 'Klasse 9 · Modellversuch zum Treibhauseffekt',
        type: 'versuch',
        form: 'zu zweit',
        nameField: true,
        blocks: [
          b('heading', { text: 'Aufbau' }),
          b(
            'text',
            { text: 'Zwei gleiche Gläser, je ein Thermometer. Glas A bleibt offen. Glas B wird mit Klarsichtfolie verschlossen. Beide stehen gleich weit von der Lampe entfernt.' },
            7,
          ),
          b('image', { caption: 'Abb. 1: Versuchsaufbau', height: 90 }, 5),
          b('mc', { prompt: 'Unsere Vorhersage: Welches Glas wird nach 15 Minuten wärmer sein?', options: 'Glas A\nGlas B\ngleich' }),
          b('table', {
            prompt: 'Messwerte',
            cols: 'Zeit\nGlas A (offen)\nGlas B (Folie)\nUnterschied',
            rows: '0 min (Start)\n3 min\n6 min\n9 min\n12 min\n15 min',
          }),
          b('open', { prompt: 'Welches Glas war am Ende wärmer, und um wie viel?', lines: 1 }),
          b('open', { prompt: 'Warum, glaubt ihr, war das so?', lines: 2 }),
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
        nameField: true,
        blocks: [
          b('flow', { steps: 'Sonnenstrahlung | (kurzwellig)\nErdoberfläche | erwärmt sich\nWärmestrahlung | (langwellig)\nTreibhausgase | CO₂, Methan, Wasserdampf' }),
          b('draw', {
            prompt: 'Von den Treibhausgasen aus geht es in zwei Richtungen weiter. Zeichnet beide Pfeile ein: ein Teil entweicht … ein Teil wird zurückgestrahlt zur …',
            height: 130,
          }),
          b('wordbank', { words: 'Weltall\nErdoberfläche\nzusätzliche Erwärmung' }),
          b('heading', { text: 'Zwei Begriffe, ein Unterschied' }),
          b('gap', { prompt: 'natürlicher Treibhauseffekt', text: 'notwendig — ohne ihn läge die Erde bei etwa ___ °C.' }, 6),
          b('gap', { prompt: 'zusätzlicher Treibhauseffekt', text: 'von Menschen verursacht — seit etwa ___ messbar.' }, 6),
          b('merksatz', { text: 'Beobachtung + ___ = eine Erklärung, die überzeugt.' }),
        ],
      },
    ],
  };
}
