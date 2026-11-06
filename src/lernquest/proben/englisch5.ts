// Englisch Klasse 5, Probe vor der Klassenarbeit (Wunsch der Lehrkraft, 06.11.2026): Zahlen, Farben, Classroom English,
// there is / there are. Written by Claude, not taken from the teacher's lessons. Instructions in German (Klasse 5),
// the language practised in English.
import type { Probe } from '../probe';
import type { Uebung } from '../types';

const waehlen = (id: string, frage: string, aussage: string, optionen: string[], richtig = 0): Uebung => ({ art: 'waehlen', id, frage, aussage, optionen, richtig: [richtig] });
const rf = (id: string, aussage: string, richtig: boolean, frage = 'Stimmt das?'): Uebung => ({ art: 'richtigfalsch', id, frage, aussage, richtig });
const paare = (id: string, frage: string, p: [string, string][]): Uebung => ({ art: 'paare', id, frage, paare: p });
/** A gap: `vor [lösung] nach`, with the tiles to choose from (the solution among them). */
const luecke = (id: string, frage: string, vor: string, loesung: string, nach: string, kacheln: string[]): Uebung => ({
  art: 'luecke',
  id,
  frage,
  teile: [vor, loesung, nach],
  kacheln,
});
/** Word order: the tiles are the words of the sentence (the app mixes them). */
const satz = (id: string, loesung: string, hinweis: string, frage = 'Bilde den Satz.'): Uebung => ({
  art: 'reihenfolge',
  id,
  frage,
  hinweis,
  kacheln: loesung.split(' '),
  loesung,
});

export const ENGLISCH5: Probe = {
  id: 'englisch5',
  titel: 'Mini-Quest Englisch 5',
  untertitel: 'Übe für die Klassenarbeit: Numbers, Colours, Classroom English und there is / there are.',
  fach: 'Englisch',
  stationen: [
    {
      titel: 'Numbers',
      uebungen: [
        paare('z1', 'Finde die Paare.', [
          ['3', 'three'],
          ['8', 'eight'],
          ['11', 'eleven'],
          ['12', 'twelve'],
          ['15', 'fifteen'],
        ]),
        waehlen('z2', 'Welches Wort ist richtig geschrieben?', '40', ['forty', 'fourty', 'fourteen']),
        luecke('z3', 'Rechne und lege die Zahl.', 'Six plus seven is ', 'thirteen', '.', ['thirteen', 'thirty', 'three']),
        waehlen('z4', 'Welche Zahl ist das?', 'seventeen', ['17', '70', '7']),
        rf('z5', '15 = fifty', false),
        paare('z6', 'Finde die Paare. Achtung bei -teen und -ty!', [
          ['13', 'thirteen'],
          ['30', 'thirty'],
          ['14', 'fourteen'],
          ['40', 'forty'],
          ['19', 'nineteen'],
        ]),
        waehlen('z7', 'Welches Wort ist richtig geschrieben?', '12', ['twelve', 'twelf', 'twenty']),
        luecke('z8', 'Rechne und lege die Zahl.', 'Ten plus ten is ', 'twenty', '.', ['twenty', 'twelve', 'two']),
        waehlen('z9', 'Welche Zahl ist das?', 'eighty-five', ['85', '58', '18']),
        rf('z10', '11 = eleven', true),
        paare('z11', 'Finde die Paare.', [
          ['20', 'twenty'],
          ['21', 'twenty-one'],
          ['50', 'fifty'],
          ['99', 'ninety-nine'],
          ['100', 'a hundred'],
        ]),
        luecke('z12', 'Rechne und lege die Zahl.', 'Five times ten is ', 'fifty', '.', ['fifty', 'fifteen', 'five']),
        waehlen('z13', 'Wie antwortest du? „Ich bin 11.“', 'How old are you? – I’m …', ['eleven.', 'twelve.', 'seven.']),
        satz('z14', 'How old are you?', 'Frag: Wie alt bist du?'),
      ],
    },
    {
      titel: 'Colours',
      uebungen: [
        paare('f1', 'Finde die Paare.', [
          ['red', 'rot'],
          ['blue', 'blau'],
          ['green', 'grün'],
          ['yellow', 'gelb'],
          ['black', 'schwarz'],
        ]),
        waehlen('f2', 'Wähle die richtige Farbe.', 'What colour is a banana? – It’s …', ['yellow.', 'blue.', 'purple.']),
        luecke('f3', 'Ergänze die Farbe.', 'The sky is ', 'blue', '.', ['blue', 'brown', 'black']),
        waehlen('f4', 'Was heißt „lila“?', 'lila', ['purple', 'pink', 'brown']),
        rf('f5', 'pink = rot', false),
        paare('f6', 'Finde die Paare.', [
          ['white', 'weiß'],
          ['brown', 'braun'],
          ['grey', 'grau'],
          ['pink', 'rosa'],
          ['purple', 'lila'],
        ]),
        waehlen('f7', 'Wähle die richtige Farbe.', 'What colour is grass? – It’s …', ['green.', 'grey.', 'red.']),
        luecke('f8', 'Ergänze die Farbe.', 'Tomatoes are ', 'red', '.', ['red', 'white', 'pink']),
        waehlen('f9', 'Was heißt „grau“?', 'grau', ['grey', 'green', 'gold']),
        rf('f10', 'brown = braun', true),
        waehlen('f11', 'Wähle die richtige Farbe.', 'What colour is snow? – It’s …', ['white.', 'black.', 'brown.']),
        satz('f12', 'What colour is your bag?', 'Frag nach der Farbe der Tasche.'),
        satz('f13', 'My favourite colour is green.', 'Meine Lieblingsfarbe ist Grün.'),
      ],
    },
    {
      titel: 'Classroom English',
      uebungen: [
        paare('c1', 'Was sagt die Lehrkraft? Finde die Paare.', [
          ['Open your books.', 'Öffnet eure Bücher.'],
          ['Close the door, please.', 'Schließ bitte die Tür.'],
          ['Listen.', 'Hört zu.'],
          ['Look at the board.', 'Schaut an die Tafel.'],
          ['Work with a partner.', 'Arbeitet mit einem Partner.'],
        ]),
        waehlen('c2', 'Was sagst du?', 'Du kommst zu spät in den Unterricht.', ['Sorry, I’m late.', 'Sorry, I’m early.', 'Good night.']),
        waehlen('c3', 'Was sagst du?', 'Du kennst das Wort „Lineal“ nicht.', ['What’s ‘Lineal’ in English?', 'What’s your name?', 'Where’s my ruler?']),
        luecke('c4', 'Ergänze.', '', 'Listen', ' and repeat.', ['Listen', 'Look', 'Open']),
        satz('c5', 'Can I open the window, please?', 'Frag, ob du das Fenster öffnen darfst.'),
        paare('c6', 'Was sagst du? Finde die Paare.', [
          ['Sorry, I’m late.', 'Entschuldigung, ich bin zu spät.'],
          ['I don’t understand.', 'Ich verstehe das nicht.'],
          ['Can you help me, please?', 'Kannst du mir bitte helfen?'],
          ['Can you say that again, please?', 'Kannst du das bitte wiederholen?'],
          ['What page, please?', 'Welche Seite, bitte?'],
        ]),
        waehlen('c7', 'Was sagst du?', 'Du musst auf die Toilette.', ['Can I go to the toilet, please?', 'Can I go home, please?', 'Open the window, please.']),
        waehlen('c8', 'Was sagst du?', 'Du hast etwas nicht verstanden.', ['Can you say that again, please?', 'Close your books.', 'See you tomorrow.']),
        luecke('c9', 'Ergänze.', 'Can I ', 'have', ' a pencil, please?', ['have', 'has', 'am']),
        satz('c10', 'Can you help me, please?', 'Bitte um Hilfe.'),
        waehlen('c11', 'Was sagst du?', 'Du hast dein Heft vergessen.', ['Sorry, I haven’t got my exercise book.', 'Sorry, I’ve got my exercise book.', 'Here’s my exercise book.']),
        satz('c12', 'Sorry, I don’t understand.', 'Entschuldigung, ich verstehe das nicht.'),
      ],
    },
    {
      titel: 'There is / There are',
      uebungen: [
        luecke('t1', 'is oder are?', 'There ', 'is', ' a cat under the table.', ['is', 'are']),
        luecke('t2', 'is oder are?', 'There ', 'are', ' two books on my desk.', ['is', 'are']),
        rf('t3', 'There are a dog in the garden.', false, 'Ist der Satz richtig?'),
        waehlen('t4', 'Wähle die richtige Antwort.', 'Is there a map on the wall?', ['Yes, there is.', 'Yes, there are.', 'Yes, it is.']),
        luecke('t5', 'Is oder Are?', '', 'Is', ' there a ruler on the desk?', ['Is', 'Are']),
        satz('t6', 'There are five red pens on the desk.', 'Auf dem Tisch liegen fünf rote Stifte.'),
        luecke('t7', 'is oder are?', 'There ', 'is', ' an apple in my bag.', ['is', 'are']),
        luecke('t8', 'is oder are?', 'There ', 'are', ' three windows in our classroom.', ['is', 'are']),
        rf('t9', 'There are four chairs in the kitchen.', true, 'Ist der Satz richtig?'),
        luecke('t10', 'Is oder Are?', '', 'Are', ' there pens in your pencil case?', ['Is', 'Are']),
        waehlen('t11', 'Wähle die richtige Antwort.', 'Are there any posters in your classroom?', ['No, there aren’t.', 'No, there isn’t.', 'No, they not.']),
        luecke('t12', 'isn’t oder aren’t?', 'There ', 'isn’t', ' a computer in my room.', ['isn’t', 'aren’t']),
        rf('t13', 'There is two pencils on the table.', false, 'Ist der Satz richtig?'),
        luecke('t14', 'isn’t oder aren’t?', 'There ', 'aren’t', ' any chairs in the room.', ['isn’t', 'aren’t']),
        satz('t15', 'Is there a blue bag under the chair?', 'Frag: Liegt eine blaue Tasche unter dem Stuhl?'),
        luecke('t16', 'is oder are?', 'There ', 'is', ' a whiteboard in the classroom.', ['is', 'are']),
      ],
    },
  ],
};
