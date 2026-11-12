# Kritik und Plan (11.11.2026)

Grundlage: der ganze Code, `docs/roadmap.md`, `docs/lernquest.md`, Typprüfung und Tests (360 grün, 6 Live-Tests
übersprungen), dazu die offene Übung `lernquest/#probe=englisch5` am Handy-Format durchgespielt. Die angemeldete
Kinder-Ansicht (Karte mit Held, Truhe, Bosskampf) habe ich nur im Code gelesen, nicht live gesehen, weil dafür ein
Klassenkonto am Server nötig ist.

Entscheidungen der Lehrkraft vom 11.11.2026 (Fragerunde):

Nachgezogen am 11.11.2026 nach Stufe A: Teil 1 und 2 beschreiben den Stand **vor** Stufe A. Was seitdem erledigt
ist, trägt ein ✅ mit Datum. Einzelheiten stehen in `docs/lernquest.md`.

| Frage | Entscheidung |
|---|---|
| Spielkern | **Duolingo-Pfad, perfektioniert.** Kein Umbau zum Kampf-Rollenspiel; Held, Truhen und Boss bleiben Beiwerk, das Üben selbst wird Spitzenniveau. |
| Nutzung | Im Unterricht fest eingeplant **und** zuhause freiwillig. |
| Reichweite | Erst die eigenen Klassen, aber so gebaut, dass später andere Lehrkräfte dazukommen können. |
| Inhalte | Die KI füllt jede Stunde automatisch auf, die Lehrkraft prüft grob (alles freigeben, Schlechtes rausnehmen). |

## Teil 1: Das ganze Projekt

### Was gut ist

- **Klare Linie auf dem Papier.** Jede Entscheidung steht mit Grund und Datum in der Roadmap. Das ist selten und viel wert.
- **Solides Fundament.** Typprüfung und 360 Tests laufen bei jedem Stand automatisch, die Veröffentlichung auch.
- **Datenschutz von Anfang an mitgedacht.** Ergebnisse verschlüsselt, PINs und Schlüssel nur als Prüfsumme, der Server
  ist nur über feste Funktionen erreichbar, keine Kinderdaten an die KI.
- **Etwas, das es so nicht gibt:** Übungen entstehen aus den eigenen Stunden, Belohnungen wirken im echten
  Klassenzimmer, Antwortkarten ohne Geräte. Keine der großen Apps kann das.

### Was nicht gut ist

1. **Breite statt Tiefe.** Vier große Produkte in einem (Arbeitsblätter, KI-Planung, Folien, Lernquest, dazu
   Austeilen, Abgleich, Kartenfrage). Lernquest ist in allen fünf Stufen an einem einzigen Tag entstanden
   (06.11.2026). Alles ist da, aber kaum etwas ist im Unterricht erprobt und danach geschliffen worden.
2. **Viel gebaut und wieder abgerissen.** KI-Helfer am Baustein, Folienvorschlag nach Regeln, „Stunde komplett“, die
   eigenen Folien (jetzt eingefroren, Präsis kommen aus Canva). Die eingefrorenen Folien sind noch rund 7.500 Zeilen
   Code, die bei jeder Änderung mitgeschleppt werden.
3. **Es wird nichts gemessen.** Niemand weiß, ob Kinder wiederkommen, wie lange sie üben und ob sie danach mehr
   können. Ohne diese Zahlen ist jede Verbesserung geraten.
4. **Die Arbeitsregeln fehlen.** `AGENTS.md`, `CLAUDE.md` und `README.md` wurden gelöscht; die Roadmap verweist noch
   darauf. Jede neue Sitzung (auch von mir) startet ohne die harten Regeln und Fallstricke des Projekts.
5. **Auf eine Lehrkraft zugeschnitten.** Der Lehrkraft-Schlüssel liegt nur auf den eigenen Geräten, es gibt kein
   Konto. Für „später andere“ fehlt ein Weg; das ist lösbar, muss aber geplant werden, bevor mehr darauf aufbaut.
6. **Der Server muss wachgehalten werden.** Eine tägliche Aktion verhindert, dass er einschläft. Für einen
   Bosskampf vor 28 Kindern ist das zu wacklig; dazu fragen Beamer und alle Handys den Server jede Sekunde.
7. **Kein Test der echten Oberfläche.** Die Tests prüfen Regeln, nicht, ob ein Kind sich anmelden und eine Runde
   spielen kann. Steht seit Oktober als offen in der Roadmap.
8. **Kleinkram:** 36 alte Entwicklungszweige auf GitHub, 19 Schriftfamilien im Paket, Lernquest-Regeln doppelt
   gepflegt (App und Server). Die freie Kartenfrage gibt noch keine Klassenpunkte (der Bosskampf mit Karten ist seit
   08.11.2026 gebaut und gibt Schaden und Truhe).

## Teil 2: Lernquest gegen den Stand der Kunst

Vergleich mit Duolingo, Anton, Kahoot/Blooket und Lern-Rollenspielen wie Prodigy.

| Thema | Was die Besten machen | Lernquest heute | Urteil |
|---|---|---|---|
| Einstieg | Erst spielen, dann anmelden; Figur bauen; erster Erfolg nach zwei Minuten | Code, Name, PIN, dann die Karte. Kein Willkommen, keine Figur am Anfang | Anmeldung gut, Einstieg fehlt |
| Fehler in der Runde | Falsche Aufgaben kommen am Ende wieder, bis sie sitzen | Lösung wird gezeigt, dann weiter. 1 von 5 richtig heißt trotzdem „Runde geschafft!“ | **Größte Lücke**, ✅ behoben mit Stufe A |
| Erklärung bei Fehlern | Kurzer Grund, warum es falsch war | Nur „Richtig wäre: …“. Im Plan versprochen, nicht gebaut | Lücke. Seit Stufe A zeigt die Runde eine Erklärung, wenn die Aufgabe eine hat; geschrieben wird sie erst mit Stufe B |
| Schwierigkeit | Steigt je Lektion, passt sich an (leicht, mittel, schwer; erst erkennen, dann selbst schreiben) | Die Runden sind Scheiben derselben Liste in Blatt-Reihenfolge. Die Niveaus G/M/E der Aufgaben gehen beim Senden verloren | Lücke |
| Lernspirale | Altes taucht von selbst im Pfad wieder auf, gemischt mit Neuem | Wiederholen ist ein eigener Reiter, den ein Kind selbst finden muss. Eine fertige Station bleibt für immer fertig | Technik da, falsch platziert |
| Aufgabenformate | Erkennen **und** selbst erzeugen (tippen, sprechen) | 8 Formate, alle zum Antippen. Nichts zum Selbstschreiben | Für Vokabeln zu schwach |
| Inhaltsmenge | Viele Varianten je Thema | So viel, wie das Arbeitsblatt hergibt; dieselben Aufgaben wortgleich wieder | Wird durch den KI-Pool gelöst |
| Tagesanreiz | Tagesaufgaben, kleine Überraschungen, „noch eine Runde“ | Nur das Wochenziel. Nach der Runde führt der Hauptknopf zurück zur Karte | Lücke. ✅ Hauptknopf ist seit Stufe A „Nächste Runde“; Tagesaufgaben fehlen weiter |
| Stufen und Punkte | Stufen schalten etwas frei | Die Heldenstufe ändert nur den Titel | Wirkt hohl |
| Herzen | Echte Folge (oder bewusst keine) | Drei Herzen, die nur ein paar Münzen kosten | Unklar für Kinder |
| Gefühl | Figur reagiert, Jubel, echte Töne, lebendige Karte | 10 kleine Animationen, Pieptöne aus dem Browser, Karte ist eine Liste von Kreisen (seit 09.11.2026 mit Fußspuren, Sternen je Region und „Nächste Truhe“) | Sauber, aber kühl. ✅ Der eigene Held steht seit 09.11.2026 oben und reagiert seit Stufe A in der Runde |
| Miteinander | Ligen, Freunde, Team-Ziele | Klassenliste zum Anschauen; Bosskampf als Team | Boss stark, Alltag leer |
| Belohnung | Nur virtuell | Truhen fair (Chancen sichtbar, Garantie), **echte Gutscheine in der Klasse** | **Besser als die Großen** |
| Lehrkraft | Aufgaben zuweisen, sehen, wer Hilfe braucht | Freischalten, Auswertung je Kompetenz. Keine Aufträge mit Termin, kein „diese drei Kinder hängen“ | Brauchbar, ausbaufähig |
| Bedienung | Zurück-Taste geht einen Schritt zurück | Die Zurück-Taste des Handys verlässt die App | Fehler, ✅ behoben mit Stufe A |

Zwei Dinge, die ich beim Spielen selbst gesehen habe (beide ✅ behoben mit Stufe A):

- **Paare finden:** Ein einziger Fehlgriff, danach alle fünf Paare richtig gefunden, Ergebnis: „Nicht ganz“, ein
  Herz weg, und die Lösung wird noch einmal komplett vorgelesen, obwohl sie schon auf dem Bildschirm steht. Das
  bestraft Ausprobieren.
- **Runde mit 1 von 5 richtig:** Überschrift „Runde geschafft!“, Knopf „Nächste Runde“. Das Kind hat nichts
  gelernt, bekommt aber Erfahrung und Münzen.

### Was funktioniert und bleibt

Anmeldung ohne Konto, die acht Formate mit sofortiger Rückmeldung, verteiltes Wiederholen im Hintergrund, Wochenziel
ohne Strafe, Belohnungen nur vom Server (kein Schummeln), faire Truhen, Gutscheine, Bosskampf als Team ohne
Rangliste, Weiterspielen ohne Netz.

### Wo das größte Potenzial liegt

Lernquest muss Duolingo nicht bei den Inhalten schlagen, sondern beim **Bezug zum Unterricht**: Die App weiß, was
gestern dran war, was jedes Kind noch nicht kann und was die Klassenarbeit verlangt. Wenn die Runde selbst gut lehrt
und der Pfad von allein wiederholt, ist das stärker als jede fertige Lern-App.

## Teil 3: Plan

Jede Stufe ist für sich im Unterricht nutzbar. Vor jeder Änderung am Server frage ich wie bisher.
Stufe C soll auch lösen, dass eine schwache Runde (unter 60 %) beim Server als gespielt gilt und den ersten Stern
gibt; das ist eine Server-Änderung.

### Stufe A: Die Runde, die wirklich lehrt (Neubau der Übungsrunde) ✅ gebaut am 11.11.2026

- Falsch beantwortete Aufgaben kommen am Ende der Runde wieder, bis sie richtig sind. Für Sterne zählt der erste
  Versuch.
- Ehrliches Ergebnis: unter 60 % heißt es „Fast. Nochmal?“, nicht „geschafft“.
- Paare und Punkte im Bild fair werten (ein Fehlgriff ist kein Totalausfall), keine doppelte Lösung.
- Kurze Erklärung bei Fehlern (neues Feld an jeder Aufgabe, die KI schreibt es mit).
- Serie in der Runde („5 richtig in Folge“), der eigene Held reagiert auf richtig und falsch.
- Hauptknopf nach der Runde: „Nächste Runde“. Zurück-Taste des Handys geht einen Schritt zurück.
- Herzen: bleiben als Münz-Bonus, sperren nie aus (Schule, kein Bezahlmodell), werden aber so erklärt.

### Stufe B: Inhalte, die reichen (KI-Pool automatisch) ✅ gebaut am 11.11.2026, bis auf „Frage melden“

- Beim Freischalten einer Stunde entstehen automatisch rund 30 Fragen in drei Schwierigkeiten (wie G/M/E), mit
  Erklärung und typischen Denkfehlern als falsche Antworten.
- „Alle freigeben“ mit einem Klick, Schlechtes einzeln rausnehmen. Kinder können eine Frage melden; die Meldung
  landet bei der Lehrkraft (offen: braucht eine Server-Änderung).
- Neues Format „Selbst schreiben“ (Wort oder kurzer Satz tippen, nachsichtig bei Groß- und Kleinschreibung), zuerst
  für Vokabeln.

### Stufe C: Die Lernspirale im Pfad (Neubau der Karte und der Stationen) – ✅ gebaut am 11.11.2026

- Jede Station hat drei Stufen statt gleichförmiger Runden: **Kennenlernen** (leicht, antippen), **Anwenden**
  (mittel, legen und sortieren), **Meistern** (schwer, selbst schreiben). Daraus werden die drei Sterne.
- Wiederholen wandert in den Pfad: Zwischen den Stationen erscheinen von selbst Wiederholungs-Stationen mit
  gemischtem Stoff aus früheren Stunden. Eine alte Station verblasst, wenn dort etwas fällig ist, und glänzt nach dem
  Auffrischen wieder.
- Am Ende jeder Region ein Meilenstein (gemischter Test über alles), bevor der Boss kommt.
- Vor einer Klassenarbeit schaltet die Lehrkraft einen „Probetest“ über gewählte Stunden frei (die Technik gibt es
  schon in der offenen Übung).

### Stufe D: Gründe zum Wiederkommen

- Einstieg: Held bauen, erste Mini-Runde, erste Truhe, alles in zwei Minuten.
- Drei kleine Tagesaufgaben („eine Runde ohne Fehler“, „5 Wiederholungen“), das Wochenziel bleibt.
- Klassen-Aufgabe der Woche: Alle zusammen sammeln Sterne für ein gemeinsames Ziel. Weiter keine Einzel-Rangliste.
- Heldenstufen schalten etwas frei (Begleiter wachsen, neue Laden-Regale, Titel am Beamer).
- Der eigene Held läuft auf der Karte mit (oben in der Leiste steht er seit 09.11.2026).
- Offen, deine Entscheidung: Erinnerungen aufs Handy (nur wenn die App installiert ist und Kind und Eltern es wollen).

### Stufe E: Aussehen und Gefühl

- Karte als Landschaft je Fach und Region statt Kreisen auf Flieder; echte Töne statt Pieptönen; Jubel bei Sternen,
  Stufenaufstieg und Truhe. Alles steht still bei „Bewegung reduzieren“.

Nachtrag 11.11.2026 (Wünsche der Lehrkraft während Stufe A):
- Held und Teile wieder als im Code gezeichnete Vektorgrafik, detailreich, Stil wie Duolingo; die gemalten Bilder
  aus ComfyUI fallen weg.
- Zielbild ist ein Mockup der Lehrkraft: Fuchs-Maskottchen, Grün und Creme, Karte als Landschaft mit Burgen,
  Tagesaufgaben, Truhen-Bild. Richtung, nicht Vorgabe.

Plan, entschieden mit der Lehrkraft am 12.11.2026 (Mockup: `docs/design/lernquest/mockup-stufe-e.png`):
- **Lernweg bleibt** (Stufe A–C), wird aber sichtbarer: Die Karte zeigt die drei Stufen je Station als Wegpunkte,
  der Fuchs sagt, was dran ist.
- **Stufe D, Teil 2 wird übernommen** (Klassen-Aufgabe und Willkommen von `claude/lucid-galileo-0dvocr`, Migration
  ist live) als Reiter „Woche“ im Aufgaben-Bildschirm.
- **Spielstände bleiben** (Sterne, Münzen, Teile); jedes alte Teil bekommt seine Vektor-Zeichnung.
- **Keine Rangliste, keine Tagesserie:** statt Rangliste das Klassen-Ziel, statt „7 Tage“ das Wochenziel im
  Mockup-Look. Edelsteine im Mockup = unsere Münzen; keine Booster.
- Bau in sechs Teilen, je eigener Branch: (1) Farben, Schrift, Knöpfe, Fuchs als Vektor mit 4–5 Posen, Start und
  Anmeldung; (2) Karte als Landschaft mit Burgen, Held auf dem Weg, Leiste unten; (3) Runde im neuen Look;
  (4) Held und alle Teile als Vektor; (5) Aufgaben, Wochenziel, Truhe, Laden, Klasse; (6) Töne, Jubel, „Bewegung
  reduzieren“, dann `UMBAU = false`. Lehrkraft-Seite, Boss-Regeln und Fragenpool bleiben draußen.
- Stand: Teil 1 gebaut (12.11.2026, `claude/amazing-newton-h940fp`, mit Figuren-Werkstatt); Teil 2 gebaut
  (12.11.2026, `claude/clever-hamilton-ztdfgt`): Karte als Landschaft je Region mit Burg, Weg, Bäumen, Boss-Burg mit
  dem Meilenstein, drei Sterne je Station als Bogen, Held neben der aktuellen Station, Fuchs sagt, was dran ist,
  Leiste unten im Mockup-Look. Die Reiter der Leiste bleiben vorerst (Karte, Wiederholen, Held, Klasse); „Aufgaben“
  und „Inventar“ kommen mit Teil 5, wenn es die Bildschirme gibt.
- Erfolg: Bildschirmfotos am Handy-Format je Teil an die Lehrkraft; Tests, Typprüfung, Build grün; Spieltest ohne
  Server über jeden Bildschirm; Kontrast WCAG AA; alte Spielstände zeigen alles richtig.

### Stufe F: Klassenzimmer

- ✅ Bosskampf mit Karten (gebaut am 08.11.2026): Schaden und Truhe. Offen: Klassenpunkte für richtige Antworten
  in der freien Kartenfrage.
- Schnellrunde wie Kahoot aus denselben Fragen, mit Geräten oder Karten.
- Lehrkraft-Bereich in der App (schon entschieden, noch nicht gebaut): Boss steuern, scannen, Fortschritt, schnelle
  Hilfe.
- Aufträge mit Termin („bis Freitag Station 3“) und eine Liste „diese Kinder brauchen Hilfe“.

### Stufe G: Fundament (läuft nebenher)

- Arbeitsregeln (`AGENTS.md`) knapp wiederherstellen.
- Die Kinder-App in überschaubare Teile zerlegen (nach Stufe A: eine Datei mit 1.170 Zeilen und ein Stilblatt mit 3.490; die Runde liegt schon in `Runde.tsx`).
- Ein Test, der wie ein Kind anmeldet und eine Runde spielt, bei jeder Änderung automatisch.
- Zahlen für die Lehrkraft: Lerntage je Kind und Woche, Anteil der Fehler, die in derselben Runde behoben wurden,
  Aufgaben, die sitzen. Aus Daten, die der Server schon hat.
- Alte Zweige aufräumen (am 11.11.2026 sind es 45 auf GitHub). Entscheidung offen: eingefrorene Folien ganz entfernen?
- Später, erst wenn Kolleginnen wirklich mitmachen wollen: Lehrkraft-Konto statt Geräteschlüssel.

### Reihenfolge und warum

A → B → C → D → E → F, G nebenher. A zuerst, weil dort gelernt wird und fast nichts am Server zu ändern ist. B vor
C, weil die drei Stufen je Station genug Fragen in drei Schwierigkeiten brauchen. Aussehen (E) bewusst nach dem
Lernkern: Eine schöne Karte über einer Runde, die nichts lehrt, wäre Schminke.

### Woran wir Erfolg messen

- Mindestens 80 % der Fehler werden in derselben Runde noch richtig beantwortet.
- Die Hälfte der Klasse erreicht das Wochenziel ohne Erinnerung durch die Lehrkraft.
- Der Anteil der Aufgaben, die „sitzen“ (Kasten 3 und höher), steigt von Woche zu Woche.
