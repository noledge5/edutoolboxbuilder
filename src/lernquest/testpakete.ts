// Two test stations for the learning loop (Lehrkraft 12.11.2026): „to be“ and „Singular and plural“ for class 5
// English. They show how a station should be planned: help cards („So geht's“) before the first round, a tip and an
// explanation on every exercise, easy to hard (the first round leads the child by the hand), and in the second
// station repetition of the first mixed in. The KI-Fragenpool is asked to plan the same way (fragenpool.ts).
import { lueckeAus, readUebung, reihenfolgeAus } from './fragenpool';
import { PAKET_FORMAT, type Lernkarte, type Niveau, type Paket, type Uebung } from './types';

type Extra = { niveau: Niveau; tipp: string; erklaerung: string };
const mit = (u: Uebung | null, x: Extra): Uebung => {
  const r = u && readUebung({ ...u, ...x });
  if (!r || r.tipp !== x.tipp || r.erklaerung !== x.erklaerung) throw new Error(`Testübung kaputt: ${u?.id}`);
  return r;
};
const waehlen = (id: string, frage: string, optionen: string[], richtig: number, x: Extra, aussage = '') =>
  mit({ art: 'waehlen', id, frage, ...(aussage ? { aussage } : {}), optionen, richtig: [richtig] }, x);
const rf = (id: string, aussage: string, richtig: boolean, x: Extra) => mit({ art: 'richtigfalsch', id, frage: 'Stimmt das?', aussage, richtig }, x);
const luecke = (id: string, satz: string, ablenker: string[], x: Extra) => mit(lueckeAus(id, 'Ergänze die Lücke.', satz, ablenker), x);
const satz = (id: string, loesung: string, x: Extra) => mit(reihenfolgeAus(id, 'Bring die Wörter in die richtige Reihenfolge.', loesung), x);
const schreiben = (id: string, frage: string, aussage: string, loesungen: string[], x: Extra) => mit({ art: 'schreiben', id, frage, aussage, loesungen }, x);
const paare = (id: string, p: [string, string][], x: Extra) => mit({ art: 'paare', id, frage: 'Finde die Paare.', paare: p }, x);
const gruppen = (id: string, frage: string, g: string[], karten: [string, number][], x: Extra) => mit({ art: 'gruppen', id, frage, gruppen: g, karten }, x);

const MODUL = {
  id: 'test-grammatik-start',
  nummer: 1,
  titel: 'Test: Grammatik-Start',
  icon: '',
  stunden: [
    { nummer: 1, titel: 'The verb „to be“' },
    { nummer: 2, titel: 'Singular and plural' },
  ],
};

const HILFE_TO_BE: Lernkarte[] = [
  {
    titel: '„to be“ heißt „sein“',
    text: '„to be“ hat drei Formen: am, is und are. Welche du nimmst, hängt davon ab, wer gemeint ist.',
    beispiele: ['I {{am}} Tom.', 'You {{are}} my friend.', 'She {{is}} ten.', 'We {{are}} in class 5c.'],
  },
  {
    titel: 'Wer bekommt welche Form?',
    text: 'I → am. He, she, it (und ein Name oder ein Ding) → is. You, we, they (und mehrere) → are.',
    beispiele: ['Tom {{is}} tall.', 'The dog {{is}} brown.', 'They {{are}} at school.'],
  },
  {
    titel: 'Kurzformen',
    text: 'Beim Sprechen werden die Formen oft kurz. Der Apostroph steht für den Buchstaben, der wegfällt.',
    beispiele: ['I am → I{{’m}}', 'she is → she{{’s}}', 'we are → we{{’re}}'],
  },
];

const TO_BE: Uebung[] = [
  waehlen('tb-1', 'Welche Form von „to be“ passt zu „I“?', ['am', 'is', 'are'], 0, { niveau: 1, tipp: 'Schau auf die erste Karte: I hat seine ganz eigene Form.', erklaerung: 'Zu I gehört immer am: I am.' }),
  waehlen('tb-2', 'Welche Form passt zu „she“?', ['am', 'is', 'are'], 1, { niveau: 1, tipp: 'He, she und it teilen sich eine Form.', erklaerung: 'she → is: She is ten.' }),
  waehlen('tb-3', 'Welche Form passt zu „they“?', ['am', 'is', 'are'], 2, { niveau: 1, tipp: '„they“ meint mehrere Personen.', erklaerung: 'you, we und they → are.' }),
  paare('tb-4', [['I', 'am'], ['she', 'is'], ['they', 'are']], { niveau: 1, tipp: 'Jede Person bekommt ihre Form – die zweite Karte hilft.', erklaerung: 'I am, she is, they are.' }),
  rf('tb-5', 'He is my brother.', true, { niveau: 1, tipp: 'Welche Form gehört zu he?', erklaerung: 'he → is. Der Satz stimmt.' }),
  rf('tb-6', 'We is in class 5c.', false, { niveau: 1, tipp: 'Bei „we“ sind mehrere gemeint.', erklaerung: 'Richtig ist: We are in class 5c.' }),
  luecke('tb-7', 'I [am] eleven years old.', ['is', 'are'], { niveau: 2, tipp: 'Wer spricht hier? I → …', erklaerung: 'Zu I gehört am.' }),
  luecke('tb-8', 'My sister [is] at home.', ['am', 'are'], { niveau: 2, tipp: '„my sister“ ist eine Person – wie she.', erklaerung: 'my sister = she → is.' }),
  luecke('tb-9', 'Tom and Lisa [are] friends.', ['is', 'am'], { niveau: 2, tipp: 'Zwei Personen: Tom und Lisa = they.', erklaerung: 'Mehrere Personen → are.' }),
  gruppen('tb-10', 'Sortiere: is oder are?', ['is', 'are'], [['he', 0], ['it', 0], ['my dog', 0], ['we', 1], ['you', 1], ['my friends', 1]], { niveau: 2, tipp: 'Einer (he, she, it) → is. Mehrere oder you → are.', erklaerung: 'he, it, my dog → is; we, you, my friends → are.' }),
  satz('tb-11', 'She is my best friend.', { niveau: 2, tipp: 'Der Satz fängt mit „She“ an, danach kommt die Form von to be.', erklaerung: 'She is my best friend.' }),
  waehlen('tb-12', 'Was passt in die Frage?', ['Are', 'Is', 'Am'], 0, { niveau: 2, tipp: 'Bei Fragen rückt die Form von to be nach vorn. Wer ist gemeint?', erklaerung: 'you → are: Are you twelve?' }, '___ you twelve?'),
  schreiben('tb-13', 'Schreib die richtige Form von „to be“.', 'The cat ___ black.', ['is'], { niveau: 3, tipp: '„the cat“ ist ein Tier – wie it.', erklaerung: 'the cat = it → is.' }),
  schreiben('tb-14', 'Schreib die richtige Form von „to be“.', 'I ___ from Germany.', ['am'], { niveau: 3, tipp: 'I hat seine eigene Form.', erklaerung: 'I am from Germany.' }),
  schreiben('tb-15', 'Schreib die Kurzform.', 'we are', ['we’re', "we're"], { niveau: 3, tipp: 'Das a fällt weg, dafür kommt ein Apostroph.', erklaerung: 'we are → we’re.' }),
];

const HILFE_PLURAL: Lernkarte[] = [
  {
    titel: 'Einzahl und Mehrzahl',
    text: 'Singular heißt Einzahl (eins), Plural heißt Mehrzahl (mehrere). Meistens hängst du einfach -s an.',
    beispiele: ['one cat → two cat{{s}}', 'a book → three book{{s}}', 'a girl → many girl{{s}}'],
  },
  {
    titel: '-es nach s, x, sh und ch',
    text: 'Endet das Wort auf s, x, sh oder ch, hängst du -es an. So kann man es besser sprechen.',
    beispiele: ['a box → two box{{es}}', 'a bus → two bus{{es}}', 'a watch → two watch{{es}}'],
  },
  {
    titel: 'Ausnahmen',
    text: 'Ein paar Wörter sind ganz anders. Die lernst du am besten auswendig.',
    beispiele: ['a man → two {{men}}', 'a child → two {{children}}', 'a mouse → two {{mice}}'],
  },
];

// Every fourth exercise repeats „to be“ (station 1): repetition mixed in, not saved for the end.
const PLURAL: Uebung[] = [
  waehlen('pl-1', 'Was ist Plural (mehrere)?', ['cats', 'cat'], 0, { niveau: 1, tipp: 'Plural heißt: mehr als eins.', erklaerung: 'cats sind mehrere Katzen.' }),
  waehlen('pl-2', 'Wie heißt der Plural von „book“?', ['books', 'bookes', 'book'], 0, { niveau: 1, tipp: 'Meistens hängst du nur -s an.', erklaerung: 'book → books.' }),
  rf('pl-3', 'one dog – two dogs', true, { niveau: 1, tipp: 'dog ist ein ganz normales Wort.', erklaerung: 'dog + s = dogs.' }),
  waehlen('pl-4', 'Wiederholung: Was passt?', ['are', 'is'], 0, { niveau: 1, tipp: 'Mehrere Hunde = they.', erklaerung: 'Plural → are: The dogs are hungry.' }, 'The dogs ___ hungry.'),
  paare('pl-5', [['cat', 'cats'], ['box', 'boxes'], ['man', 'men'], ['pen', 'pens']], { niveau: 1, tipp: 'Achte auf die Endung – und denk an die Ausnahmen.', erklaerung: 'cats, boxes, men, pens.' }),
  gruppen('pl-6', 'Sortiere: -s oder -es?', ['-s', '-es'], [['book', 0], ['apple', 0], ['girl', 0], ['box', 1], ['bus', 1], ['watch', 1]], { niveau: 2, tipp: 'Endet das Wort auf s, x, sh oder ch? Dann -es.', erklaerung: 'books, apples, girls – aber boxes, buses, watches.' }),
  luecke('pl-7', 'I have got two [sisters].', ['sister', 'sisteres'], { niveau: 2, tipp: '„two“ heißt: mehr als eins.', erklaerung: 'two sisters: Plural mit -s.' }),
  luecke('pl-8', 'My brothers [are] at school.', ['is', 'am'], { niveau: 2, tipp: 'Wiederholung: „my brothers“ sind mehrere = they.', erklaerung: 'Mehrere → are.' }),
  luecke('pl-9', 'There are three [boxes] on the table.', ['boxs', 'box'], { niveau: 2, tipp: 'box endet auf x – schau auf die zweite Karte.', erklaerung: 'box → boxes.' }),
  waehlen('pl-10', 'Wie heißt der Plural von „child“?', ['children', 'childs', 'childes'], 0, { niveau: 2, tipp: 'child ist eine Ausnahme – schau auf die Karte „Ausnahmen“.', erklaerung: 'child → children.' }),
  rf('pl-11', 'two mans', false, { niveau: 2, tipp: 'man ist unregelmäßig.', erklaerung: 'Richtig ist: two men.' }),
  satz('pl-12', 'The cats are black.', { niveau: 2, tipp: 'Wiederholung: Fang mit „The cats“ an. Mehrere Katzen → are.', erklaerung: 'The cats are black.' }),
  schreiben('pl-13', 'Schreib den Plural.', 'a bus', ['buses'], { niveau: 3, tipp: 'bus endet auf s.', erklaerung: 'bus → buses.' }),
  schreiben('pl-14', 'Schreib den Plural.', 'a girl', ['girls'], { niveau: 3, tipp: 'Ganz normal: nur -s.', erklaerung: 'girl → girls.' }),
  schreiben('pl-15', 'Schreib den Plural.', 'a mouse', ['mice'], { niveau: 3, tipp: 'Ausnahme! Schau auf die Karte „Ausnahmen“.', erklaerung: 'mouse → mice.' }),
  schreiben('pl-16', 'Schreib die richtige Form von „to be“.', 'The children ___ happy.', ['are'], { niveau: 3, tipp: 'Wiederholung: children sind mehrere = they.', erklaerung: 'children → are.' }),
];

const paket = (stunde: string, nummer: number, titel: string, hilfe: Lernkarte[], uebungen: Uebung[]): Paket => ({
  format: PAKET_FORMAT,
  v: 1,
  stunde,
  nummer,
  titel,
  modul: MODUL,
  fach: 'Englisch',
  lang: 'en',
  hilfe,
  uebungen,
});

export const TESTPAKETE: Paket[] = [
  paket('test-to-be', 1, 'The verb „to be“', HILFE_TO_BE, TO_BE),
  paket('test-plural', 2, 'Singular and plural', HILFE_PLURAL, PLURAL),
];
