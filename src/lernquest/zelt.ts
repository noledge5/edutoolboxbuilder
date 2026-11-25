// The tent quiz (Klassendorf Teil B1, decided 25.11.2026): a child sets up its tent, the first house stage, by answering
// a short quiz about using Lernquest responsibly, media use, how the game works and how to use the app. Fixed questions
// in the app (the teacher checks them in the pull request); ZELT_RUNDE random ones, ZELT_RICHTIG_AB right sets the tent
// up, trying again costs nothing. Checked in the browser only: the tent is free, so there is nothing to cheat for.

export interface ZeltFrage {
  frage: string;
  /** Three answers; `richtig` is the index of the right one. */
  optionen: [string, string, string];
  richtig: 0 | 1 | 2;
  /** Shown after answering, right or wrong. */
  warum: string;
}

export const ZELT_RUNDE = 5;
export const ZELT_RICHTIG_AB = 4;

export const ZELT_FRAGEN: ZeltFrage[] = [
  // Umgang mit Lernquest
  {
    frage: 'Ein Kind aus deiner Klasse fragt nach deiner PIN. Was machst du?',
    optionen: ['Ich sage sie, wir sind ja befreundet.', 'Ich behalte sie für mich.', 'Ich schreibe sie an die Tafel.'],
    richtig: 1,
    warum: 'Mit deiner PIN kann jemand anderes in deinem Namen spielen. Sie gehört nur dir.',
  },
  {
    frage: 'Jemand anderes kennt deine PIN. Was tust du?',
    optionen: ['Ich sage es meiner Lehrkraft. Sie gibt mir eine neue.', 'Nichts, das ist egal.', 'Ich spiele ab jetzt mit seiner PIN.'],
    richtig: 0,
    warum: 'Deine Lehrkraft kann deine PIN zurücksetzen. Dann ist dein Spielstand wieder sicher.',
  },
  {
    frage: 'Wofür bekommst du Münzen und Truhen?',
    optionen: ['Für echtes Geld.', 'Fürs Lernen und Üben.', 'Für möglichst viele Klicks.'],
    richtig: 1,
    warum: 'In Lernquest verdienst du alles durchs Lernen. Echtes Geld gibt es hier nie.',
  },
  {
    frage: 'Du hast eine Aufgabe falsch beantwortet. Was stimmt?',
    optionen: ['Das ist schlimm, ich höre lieber auf.', 'Ich tippe ab jetzt einfach irgendwas.', 'Fehler gehören zum Lernen. Die Aufgabe kommt später wieder.'],
    richtig: 2,
    warum: 'Aus Fehlern lernst du am meisten. Lernquest legt die Aufgabe zum Wiederholen zurück.',
  },
  // Mediennutzung
  {
    frage: 'Du übst schon lange am Tablet und deine Augen sind müde. Was ist gut?',
    optionen: ['Eine Pause machen und aus dem Fenster schauen.', 'Den Bildschirm heller stellen und weitermachen.', 'Noch schneller tippen.'],
    richtig: 0,
    warum: 'Pausen tun Augen und Kopf gut. Danach lernst du wieder besser.',
  },
  {
    frage: 'Was gibst du im Internet nicht an Fremde weiter?',
    optionen: ['Deine Lieblingsfarbe.', 'Deine Adresse und deine Passwörter.', 'Ob dir ein Bild gefällt.'],
    richtig: 1,
    warum: 'Adresse, Telefonnummer und Passwörter bleiben privat. Fremde dürfen sie nicht wissen.',
  },
  {
    frage: 'Eine fremde Person schreibt dir im Internet und will sich mit dir treffen. Was tust du?',
    optionen: ['Ich treffe mich heimlich mit ihr.', 'Ich schicke ihr ein Foto von mir.', 'Ich antworte nicht und erzähle es einem Erwachsenen.'],
    richtig: 2,
    warum: 'Im Internet weißt du nie sicher, wer schreibt. Erzähl es deinen Eltern oder deiner Lehrkraft.',
  },
  {
    frage: 'Du siehst im Internet etwas, das dir Angst macht. Was hilft?',
    optionen: ['Mit einem Erwachsenen sprechen, dem ich vertraue.', 'Es für mich behalten.', 'Es an andere Kinder weiterschicken.'],
    richtig: 0,
    warum: 'Darüber reden hilft. Ein Erwachsener kann dir erklären, was du gesehen hast.',
  },
  // Wie das Spiel funktioniert
  {
    frage: 'Wie wird dein Haus im Dorf größer?',
    optionen: ['Es wächst von allein.', 'Mit Münzen, die du beim Lernen sammelst.', 'Die Lehrkraft baut es für dich.'],
    richtig: 1,
    warum: 'Mit deinen Münzen baust du dein Haus aus. Für große Häuser brauchst du auch eine höhere Heldenstufe.',
  },
  {
    frage: 'Was bringt dir „Wiederholen“?',
    optionen: ['Aufgaben, die du sonst vergessen würdest, kommen noch einmal.', 'Es löscht deinen Spielstand.', 'Es gibt dir sofort 100 Münzen.'],
    richtig: 0,
    warum: 'Wer kurz vor dem Vergessen wiederholt, behält es viel länger.',
  },
  {
    frage: 'Was passiert mit Münzen, die du für das Dorf spendest?',
    optionen: ['Sie sind einfach weg.', 'Ein anderes Kind bekommt sie.', 'Sie zählen 1,5-fach für das Gebäude der Klasse.'],
    richtig: 2,
    warum: 'Jede gespendete Münze zählt 1,5-fach. So baut ihr zusammen euer Dorf.',
  },
  // Die App benutzen
  {
    frage: 'Du bist fertig und das Tablet gehört der Schule. Was machst du zum Schluss?',
    optionen: ['Ich lasse die App offen.', 'Ich melde mich beim Helden ab.', 'Ich gebe das Tablet mit meinem Spiel weiter.'],
    richtig: 1,
    warum: 'Wenn du dich abmeldest, kann niemand in deinem Namen weiterspielen.',
  },
];

/** `n` different questions in random order (`zufall` returns 0 ≤ x < 1). */
export function zeltFragen(zufall: () => number = Math.random, n = ZELT_RUNDE): ZeltFrage[] {
  const alle = [...ZELT_FRAGEN];
  for (let i = alle.length - 1; i > 0; i--) {
    const j = Math.floor(zufall() * (i + 1));
    [alle[i], alle[j]] = [alle[j], alle[i]];
  }
  return alle.slice(0, Math.min(n, alle.length));
}

export const zeltBestanden = (richtig: number) => richtig >= ZELT_RICHTIG_AB;
