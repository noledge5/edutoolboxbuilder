// Made-up data for `npm run spieltest` (Lernquest offline, no server): paste into the browser console on
// http://localhost:4174/lernquest/ and reload. A child „Mia K.“ with two subjects and every exercise format, also the
// awkward cases (long texts, several gaps, several right answers, two pairs only).
(() => {
  // Real pixels like the JPEGs of a package (720 px for places, 160 px for „Bild wählen“).
  const jpeg = (w, h, draw) => {
    const c = Object.assign(document.createElement('canvas'), { width: w, height: h });
    draw(c.getContext('2d'));
    return c.toDataURL('image/jpeg', 0.8);
  };
  const karte = jpeg(720, 480, (g) => {
    g.fillStyle = '#bfe3f5';
    g.fillRect(0, 0, 720, 480);
    g.fillStyle = '#cfe8b0';
    g.fillRect(90, 90, 540, 300);
    g.fillStyle = '#333';
    for (const [x, y] of [[460, 170], [330, 330]]) g.fillRect(x - 8, y - 8, 16, 16);
  });
  const bild = (f) => jpeg(160, 160, (g) => {
    g.fillStyle = f;
    g.fillRect(0, 0, 160, 160);
  });
  const modulE = { id: 'm-e1', nummer: 1, titel: 'Unser Planet Erde', icon: '', stunden: [1, 2, 3, 4].map((n) => ({ nummer: n, titel: ['Himmelsrichtungen', 'Kontinente und Ozeane', 'Das Gradnetz', 'Karten lesen'][n - 1] })) };
  const modulEn = { id: 'm-en1', nummer: 1, titel: 'Welcome to school', icon: '', stunden: [{ nummer: 1, titel: 'At school' }] };
  const paket = (stunde, nummer, titel, modul, fach, uebungen, extra = {}) => ({ format: 'lernquest-paket', v: 1, stunde, nummer, titel, modul, fach, uebungen, ...extra });
  const pakete = {
    s1: paket('s1', 1, 'Himmelsrichtungen', modulE, 'Geographie', [
      { art: 'waehlen', id: 'a1', frage: 'Wo geht die Sonne auf?', optionen: ['Im Osten', 'Im Westen', 'Im Norden', 'Im Süden'], richtig: [0], erklaerung: 'Merkspruch: Im Osten geht die Sonne auf.' },
      { art: 'richtigfalsch', id: 'a2', frage: 'Stimmt das?', aussage: 'Auf den meisten Karten ist **Norden** oben.', richtig: true },
      { art: 'paare', id: 'a3', frage: 'Finde die Paare.', paare: [['N', 'Norden'], ['O', 'Osten'], ['S', 'Süden'], ['W', 'Westen']] },
      { art: 'luecke', id: 'a4', frage: 'Ergänze die Lücken.', teile: ['Zwischen Norden und Osten liegt ', 'Nordosten', ', zwischen Süden und Westen liegt ', 'Südwesten', '.'], kacheln: ['Südwesten', 'Nordosten', 'Nordwesten', 'Südosten'] },
      { art: 'reihenfolge', id: 'a5', frage: 'Bring die Wörter in die richtige Reihenfolge.', hinweis: '', kacheln: ['Kompass', 'Der', 'Norden', 'zeigt', 'nach', '.'], loesung: 'Der Kompass zeigt nach Norden.' },
      { art: 'gruppen', id: 'a6', frage: 'Sortiere: Haupt- oder Nebenhimmelsrichtung?', gruppen: ['Haupt', 'Neben'], karten: [['Norden', 0], ['Südwest', 1], ['Osten', 0], ['Nordost', 1]] },
      { art: 'waehlen', id: 'a7', frage: 'Welche sind Hauptimmelsrichtungen? Diese Frage ist absichtlich sehr lang, damit man sieht, ob ein langer Auftrag am Handy sauber umbricht und nichts abgeschnitten wird.', optionen: ['Norden', 'Nordosten', 'Süden', 'Eine sehr lange Antwortmöglichkeit, die über mehrere Zeilen geht und trotzdem lesbar bleiben muss'], richtig: [0, 2] },
      { art: 'paare', id: 'a8', frage: 'Finde die Paare.', paare: [['oben', 'Norden'], ['unten', 'Süden']] },
      { art: 'richtigfalsch', id: 'a9', frage: 'Stimmt das?', aussage: 'Die Sonne geht im Westen auf.', richtig: false, erklaerung: 'Sie geht im Osten auf und im Westen unter.' },
      { art: 'waehlen', id: 'a10', frage: 'Wo geht die Sonne unter?', optionen: ['Im Westen', 'Im Osten'], richtig: [0] },
      { art: 'punkt', id: 'a11', frage: 'Finde die Orte auf der Karte.', bild: 'karte:k1', punkte: [[64, 35, 'Berg'], [46, 69, 'See']] },
      { art: 'luecke', id: 'a12', frage: 'Ergänze die Lücke.', teile: ['Die Nadel im Kompass zeigt nach ', 'Norden', '.'], kacheln: ['Norden', 'Süden', 'Osten'] },
    ], { bilder: { 'karte:k1': karte } }),
    s2: paket('s2', 2, 'Kontinente und Ozeane', modulE, 'Geographie', [
      { art: 'waehlen', id: 'b1', frage: 'Wie viele Kontinente gibt es?', optionen: ['7', '5', '3'], richtig: [0] },
      { art: 'richtigfalsch', id: 'b2', frage: 'Stimmt das?', aussage: 'Der Pazifik ist der größte Ozean.', richtig: true },
      { art: 'gruppen', id: 'b3', frage: 'Kontinent oder Ozean?', gruppen: ['Kontinent', 'Ozean', 'Keins'], karten: [['Afrika', 0], ['Atlantik', 1], ['Bodensee', 2], ['Asien', 0], ['Pazifik', 1]] },
      { art: 'paare', id: 'b4', frage: 'Finde die Paare.', paare: [['big', 'groß'], ['large', 'groß'], ['small', 'klein']] },
    ]),
    e1: paket('e1', 1, 'At school', modulEn, 'Englisch', [
      { art: 'bild', id: 'c1', frage: 'Welches Bild passt?', wort: 'apple', bilder: ['🍎', '🐕', '📚', 'img:x'], richtig: 0 },
      { art: 'waehlen', id: 'c2', frage: 'Hör zu. Was hörst du?', hoeren: 'Open your books, please.', optionen: ['Open your books, please.', 'Close the door, please.', 'Sit down, please.'], richtig: [0] },
      { art: 'reihenfolge', id: 'c3', frage: 'Forme um.', hinweis: 'There is a book. → Frage', kacheln: ['a', 'Is', 'book', 'there', '?'], loesung: 'Is there a book?' },
      { art: 'luecke', id: 'c4', frage: 'Fill in.', teile: ['There ', 'are', ' two pens.'], kacheln: ['is', 'are', 'am'] },
      { art: 'richtigfalsch', id: 'c5', frage: 'Stimmt das?', aussage: '12 = twelve', richtig: true },
    ], { lang: 'en', bilder: { 'img:x': bild('#e8b04a') } }),
  };
  const heute = Math.floor(Date.now() / 86400000);
  const stand = {
    xp: 230, xpHeute: 0, bestwerte: { s2: [100] }, tage: [], leitner: { 's2/b1': [2, heute - 1], 's2/b2': [1, heute], 's2/b3': [3, heute + 5] },
    muenzen: 85, muenzenHeute: 0, truhen: 1, pech: 0, inventar: [], avatar: {}, klassenpunkte: 2, sterneRest: 0, sterneStationen: { s2: 3 },
  };
  localStorage.setItem('lernquest:sitzung', JSON.stringify({ code: 'TESTTEST', kind: 'k1', name: 'Mia K.', token: 'a'.repeat(64) }));
  localStorage.setItem('lernquest:daten', JSON.stringify({ name: 'Mia K.', klasse: '5b', stand, pakete, seit: null }));
  localStorage.removeItem('lernquest:warteschlange');
  return 'ok';
})();
