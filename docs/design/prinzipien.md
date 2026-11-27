# Lernquest – Gestaltungsprinzipien und Architektur

Festgelegt am 19.11.2026. Gilt ab jetzt für alles, was in Lernquest gezeichnet, bewegt oder gebaut wird.
Entscheidung und Gründe: [ADR 0001](../adr/0001-flache-figuren-iso-umgebung.md). Die Regeln für die Oberfläche
(Tokens, Zustände, Barrierefreiheit) stehen weiter in [lernquest/README.md](lernquest/README.md#designregeln-designrunde-06112026);
dieses Dokument steht darüber und sagt, *warum* und *wie alles zusammenpasst*.

Gelernt von Duolingo (Quellen unten). Wir übernehmen die **Regeln**, nicht den Look: keine Eule, keine Duolingo-Figuren,
keine Duolingo-Farbwerte. Lernquest hat eigene Farben (`stil.ts`), den Fuchs und den eigenen Helden.

## Die drei Ziele

Jede Grafik und jeder Bildschirm muss alle drei erfüllen. Bei Streit gewinnt das frühere Ziel.

1. **Sofort verständlich.** Lernquest ist eine Lern-App: Ist ein Bild unklar, antwortet das Kind falsch oder findet
   den Weg nicht. *Unser Fehler wird zum Fehler des Kindes.*
2. **Macht Spaß.** Humor und Übertreibung nehmen die Angst vor Fehlern; die Kinder kommen gern wieder.
3. **Schnell zu bauen.** Ein schlichter Stil aus wenigen Formen, als Vektor-Code (Grafik aus Formeln, beliebig
   skalierbar), damit Claude viele Teile in gleicher Qualität zeichnen kann.

## Eine Welt, drei Ebenen

| Ebene | Was | Ansicht | Code | Prüfung |
|---|---|---|---|---|
| **Oberfläche** | Knöpfe, Karten, Kopfbereiche, Schrift | flach | `src/lernquest/app/lernquest.css` (Tokens) | `lernquest.css.test.ts` |
| **Figuren** | Fuchs, Held, Teile, Bosse, Begleiter, Symbole, Bilder in Fragen | **flach, von vorn** | `src/lernquest/figuren/` (Gerüst: `typen.ts`, `bewegung.ts`, `Figur.tsx`) | `figuren.test.tsx`, `held.test.tsx`, Werkstatt |
| **Umgebung** | Dorf, Häuser, Anbauten, Landkarte, Landschaften | **isometrisch 2:1** (schräg von oben) | Bausatz `figuren/iso.tsx`, Gebäude `figuren/dorf.tsx`, Wahrzeichen `figuren/gelaende.tsx` und `welten.tsx` | `dorf.test.tsx`, `welten.test.tsx`, Werkstatt |

Alle drei Ebenen teilen: **eine Palette** (`stil.ts`, Oberfläche über die Tokens), **ein Licht** (von oben links),
**dieselben Formregeln** (unten). Figuren stehen in der Umgebung, also müssen sie dazu passen.
3D-Renderings gibt es nicht mehr (ADR 0001).

## Formregeln (für Figuren und Umgebung gleich)

### Formen
- Aus wenigen Grundformen bauen: Rechtecke mit runden Ecken, Kreise, Kapseln, dicke Schläuche mit runden Enden.
  **Keine spitzen Ecken**, keine dünnen Linien unter 2 Einheiten.
- **So wenige Formen wie möglich, so viele wie nötig.** Vorbild ist die Katze bei Duolingo: 6 Formen sind zu
  abstrakt, 14 sind gut, 30 sind zu viel. Richtwert für einen Gegenstand: um 15 Flächen ohne Licht und Schatten.
  Die eigentliche Prüfung ist die nächste Regel.
- **Silhouette zuerst:** Die Form muss als reine Fläche ohne Innenleben erkennbar sein, bei 48 px. Erst dann kommen
  Details dazu.
- Gliedmaßen sind gleich dicke Schläuche, Hände einfache runde Formen.

### Fläche und Licht
- **Licht von oben links.** Je Fläche höchstens drei Töne aus `stil.ts`: Grundton, `hell` (ein Lichtfleck oder eine
  Lichtkante oben links), `tief` (eine Schattenform unten rechts).
- **Harte Kanten:** Schatten und Licht sind eigene Formen. **Keine Farbverläufe, keine Unschärfe, kein Glanz**, keine
  Schlagschatten mit weichem Rand.
- **Kein reines Schwarz:** das Dunkelste ist `P.linie` / `P.auge` (Dunkelbraun).
- **Kein Umriss** (entschieden 19.11.2026, [Stilprobe](#stilprobe-ohne-umriss)). Formen trennen sich durch Ton:
  Arme vor dem Körper sind einen Ton dunkler (`tief`) als der Rumpf, der Kopf wirft einen harten Schatten nach unten
  rechts, der nur auf den Körper fällt;
  dunkle Teile vor dunklem Grund bekommen eine `hell`-Kante oben links. Dunkle **Linien** für Details (Mund, Brauen,
  Schnur) bleiben erlaubt, sie umranden nichts.
- Bis zur Umstellung haben die Figuren noch ihren Umriss. Neue Teile folgen ihrem Satz (Held-Teile mit Umriss, Dorf
  ohne), damit nichts gemischt aussieht; die Umstellung macht einen Satz immer ganz. **Umgestellt: Fuchs** (19.11.2026, danach auf große Flächen reduziert: ohne Nähte, Tasche, Brosche, Stiefelkappen,
  Ohrbüschel, Haarschopf; etwa 19 Formen plus Gesicht) und **Held mit allen Teilen** (Kleidung, Frisuren, Kopf, Werkzeug,
  Begleiter, `items.tsx`; 19.11.2026, ebenfalls auf wenige Formen reduziert: Begleiter 11–15 mit Gesicht, Hüte und
  Werkzeuge 3–7, Kleider Rumpf plus 1–5 Merkmale, Frisuren 1–3 Flächen), dazu **Bosse** (Golem, Tintenkrake, Rätseldrache; je etwa 20–28 Flächen mit
  Gesicht) und **Truhe** (Deckel `holzHell`, Kasten `holz`), **Hintergründe** (je 10–22 Flächen, Tiefe über Töne:
  hinten blasser, vorne kräftiger; ruhig, damit der Held vorne steht). Dunkle Teile: `<Flaeche>` aus `flaeche.tsx` setzt die
  `hell`-Kante selbst (`istDunkel`); Kinnschatten: `<Schlagschatten>`.
  Im Code: `{...flaeche(P.x)}` (Fläche behält die Größe, die sie mit dem alten Umriss hatte), `STRICH` für Detail-Linien.
  Seit 19.11.2026 ist alles umgestellt und `UMRISS` aus `stil.ts` gelöscht; ein Test (`figuren.test.tsx`) hält jede
  Zeichnung in `figuren/` frei davon.

### Farbe
- **Weiße Dinge** (Kochmütze, Hase, Einhorn, Netz) werden in `wolke` (blasses Grau) mit `wolkeHell`-Licht und
  `wolkeTief`-Schatten gezeichnet, nicht in reinem Weiß: sonst verschwinden sie auf weißen Karten und auf Creme.
- Nur Farben aus `stil.ts` (`P.*`); ein Test schlägt bei jedem anderen Farbwert an. Neue Farbe: immer Grundton, `hell`
  und `tief` zusammen anlegen.
- **Wenige Farben je Motiv:** höchstens vier Grundtöne (mit ihren Schattierungen), Haut und Haar nicht mitgezählt.
- Farbe trägt Bedeutung (Seltenheit, richtig/falsch) nie allein, immer auch Form oder Text.

### Seltenheit am Teil (Standard, 27.11.2026)
Die Seltenheit zeigt sich am Teil selbst, nicht nur an der Platte im Laden. Geprüft in `figuren/seltenheit.test.tsx`
(Farben werden aus der Zeichnung gelesen):

| Seltenheit | Dinge (Hüte, Werkzeuge) | Begleiter |
|---|---|---|
| Gewöhnlich | schlichte Stoffe (Holz, Stoff, Leder), kein Gold, kein Funkeln; nur Lichter (Laterne, Fackel) leuchten | schlicht |
| Ungewöhnlich | schlicht, ein farbiger Akzent | schlicht |
| Selten | Metall, Glas oder ein magischer Akzent (Gold, Edelsteinton) | – |
| Episch | Gold oder Edelsteinton, dazu Bewegung (Funkeln oder Wirkung) | bewegt sich |
| Legendär | Gold, dazu Bewegung | bewegt sich |

Für alle Teile: keine sichtbaren Linien unter 2 Einheiten; Gehaltenes ist mindestens 56 Einheiten groß (`rahmen`).
Gelb (`P.gelb`) ist eine Farbe, Gold (`P.gold*`) ein Material.

### Bildaufbau
- **Luft um das Motiv:** Freiraum statt Hintergrund. Figuren außerhalb der Karte stehen auf einem flachen
  Bodenschatten (Pille), nicht in einer Szene.
- **Blick lenken:** Schräge Linien und Haltungen zeigen auf das, worauf es ankommt (die Frage, den Knopf).
- Ein Bild im Kopfbereich nur, wenn es etwas sagt. Bilder sind nie Füllmaterial.

### Gesichter, Humor, Übertreibung
- **Held 4 (27.11.2026, Inspiration der Lehrkraft):** Kopf als abgerundeter Block statt Kugel, **weiße Augen mit dunkler
  Pupille** (weiter ohne Glanzpunkt, Regel vom 12.11.), kräftige Nase als eigene Form, Brauen als dicke Balken, gerade
  Beine und Pillen-Füße. Eigener Bau und eigene Palette, keine fremden Figuren nachgebaut. Stilprobe:
  `lernquest/stilprobe/held-v4.png` (`STILPROBE_HELD=<ordner> npx vitest run src/lernquest/figuren/stilprobe-held4`).
  Den Ausdruck machen die **Lider** (eine flache Form in Hautfarbe über oder unter dem Auge: froh, sanft, nachdenklich,
  traurig), die Brauen und der Mund.
- Der Gesichtsausdruck ist ein austauschbares Teil (`gesichter`), der Körper wird dafür nicht neu gezeichnet.
- **Übertreiben** fast bis zur Karikatur, mit **Rhythmus**: Größen bewusst kontrastieren (riesiger Hund, winziger
  Knochen), Varianten aus derselben Grundform in anderen Proportionen (hoch, breit, rund, klein).
- **Geschichte statt Abbildung:** Zu einem Satz nicht den Normalfall zeichnen, sondern einen kleinen Witz („Ich mag
  dieses Hemd“ → Rocker mit rosa Katzen-Shirt).
- **Aber Klarheit geht vor:** In Bildern zu Fragen darf der Witz die Antwort nie verdecken oder eine zweite Lesart
  öffnen. Lässt sich das Bild falsch lesen, wird es schlichter.
- Kultur zeigen: Zu Sprache und Erdkunde gehören Essen, Kleidung, Bauwerke des Landes als eigene kleine Motive.

## Klassendorf (Richtung A, 25.11.2026)

- **Dorf 4 (27.11.2026, mit Held 4):** große, ruhige Formen statt vieler kleiner: Dächer als Flächen mit zwei breiten
  Ziegelbändern und heller First (keine Bogenziegel, keine dunklen Kanten), Fachwerk mit weniger, kräftigeren Balken,
  Fenster mit einer Sprosse, große Mauersteine, Zäune mit weniger, dickeren Pfosten, etwa halb so viel Deko auf dem Boden.
  Leben: der eigene Held vor dem eigenen Haus, bis zu vier Mitschüler (ohne Namen, jeden Tag andere) laufen auf dem Weg
  hin und her, Enten und ein Boot am Dorfplatz; alles still bei „Bewegung reduzieren“.
- **Dorf 5 (27.11.2026):** Gemeinschaftsgebäude sind auf der Karte nicht höher als ein Kinderhaus (etwa 130 statt 145,
  `GEBAEUDE_MASS` in `dorf.tsx`; leerer Platz und Baustelle gleich groß). Der Weg ist ein Zug vom Inselrand bis zum Ende,
  ohne Naht; im Dorf und Marktflecken liegt ein runder Platz im Blickwinkel des Bodens (wie die kleinen Plätze) mitten
  zwischen den Gemeinschaftsgebäuden, der Weg läuft hindurch, die Marktstände stehen links und rechts davon; in der Stadt
  liegt das Pflaster über dem Weg. Der Schwung des Wegs setzt ohne Knick ein (`wegX`).
- **Hüte und Haare am Held 4 (27.11.2026):** Jeder Hut nennt die Weite des Teils, das auf dem Kopf sitzt (`weite`), und
  wird auf die Kopfbreite gebracht (Krempen, Federn, Hörner stehen über); Kronen sitzen groß auf dem Kopf statt klein auf
  dem Haar. Ein hoher Hut wird nie abgeschnitten: das Bild des Helden wächst nach oben, der Held wird etwas kleiner.
  Frisuren in kräftigen, runden Formen: Zöpfe aus drei Gliedern, Stacheln als geschwungene Büschel, die Bürste so breit
  wie der Kopf, Regenbogenhaar in Bändern entlang der Haarkante.
- **Aufbau rechnet, Zeichnung zeichnet:** `dorfplan.ts` legt Weg, Grundstücke, Plätze, Laternen und Deko fest (reine Geometrie,
  getestet: nichts überlappt, Bäume stehen nie vor einem Haus, die Karte wächst nur nach oben); `figuren/dorf.tsx` zeichnet.
- **Abend ohne Verläufe:** Jedes Ding bekommt eine einfarbige Kopie in `nachtTief` darüber (halb durchsichtig,
  `figuren/nacht.tsx`). Was leuchtet (Fenster, Laternenglas, Feuer), trägt `data-licht` und wird darüber neu gezeichnet. Neue
  Teile mit Licht setzen `data-licht`, sonst bleiben sie abends dunkel.
- **Winter:** `isoStift(…, { schnee })` legt Schnee auf Sattel- und Zeltdächer; Boden, Bäume und Zäune fragen `s.wetter`.
- **Häuser gestalten:** Farben und Teile kommen nur aus den Listen in `figuren/haeuser.tsx` (je Wahl aus `AUSSEHEN` genau ein
  Eintrag); Zaun vorne, Garten rechts, Schmuck vorne rechts, so dass sich nichts mit dem Haus schneidet (Grundstück 64 × 64).

## Bewegung

- **Bewegung lenkt den Blick**, sie schmückt nicht. Das Auge geht zuerst auf das, was sich bewegt. Darum bewegt sich
  während einer Aufgabe nur, was zur Aufgabe gehört.
- **Ruhe-Schleife klein:** blinzeln (macht die Engine), atmen, kurz wippen. Nahtlos, nie hektisch.
- **Aktion in drei Teilen:** Anlauf (kurz zusammenziehen, `strecken`) → Bewegung → Nachfedern zurück in die Ruhe.
- Dauern und Kurven aus den Tokens (`--lq-dauer-*`, federnd nur für Belohnungen); nur `transform` und `opacity`.
- Im Dorf: Rauch (`lq-rauch`), Fahnen (`lq-fahne`), Wasser (`lq-glitzer`), Hühner (`lq-huhn`), „Du“ (`lq-du`), Neues
  (`lq-neu` mit `lq-staub`). Sparsam: die Karte ist kein Lernbildschirm, aber das Auge soll das eigene Haus zuerst finden.
- **Belohnungen (27.11.2026):** Erfahrung und Münzen zählen hoch (`zaehler.ts`, `app/Zaehler.tsx`: erst schnell, dann
  langsam, höchstens 1,2 s, am Ende ein kleiner Hüpfer und ein Münzklang); die Münzen in der Statuszeile zählen vom
  zuletzt gezeigten Stand weiter. Truhe: beim Rütteln nimmt das Licht die Farbe der Seltenheit an, beim Öffnen ein Blitz,
  das Teil springt groß heraus und federt nach, ab „Selten“ funkeln Sterne, der Text gleitet nach.
- „Bewegung reduzieren“ im App-Menü hält alles an; jede Pose muss allein lesbar sein.

## Oberfläche

Die Tokens und Zustände in `lernquest/README.md` gelten weiter. Dazu aus der Tab-Überarbeitung bei Duolingo:
- **Einheitlich, aber mit Zweck:** Gleiche Bausteine überall, aber nicht dort, wo sie nichts sagen.
- **Einfach, aber klar:** Wissen, was weg darf und was bleiben muss. Im Zweifel bleibt, was das Kind zum Verstehen braucht.
- **Kopfbereich in Stufen:** klein (Titel), mittel (Titel + eine Kennzahl), groß (Titel + Bild mit Aussage). Welche
  Stufe, entscheidet der Zweck des Bildschirms. **Der Titel steht immer an derselben Stelle** (links oben, `--lq-t-h2`).
- **Weißraum statt Kästen:** Abschnitte durch Abstand trennen, nicht jeden Inhalt einrahmen. Karten nur für Dinge,
  die man antippen oder als Einheit sehen soll.
- **Wenige Schriftstile:** nur die sieben Größen-Tokens, keine Sondergrößen.
- Persönlichkeit steckt in den kleinen Dingen: kurze Texte in Kindersprache, Töne, kleine Animationen beim Antippen.

## Architektur: gegen Verträge bauen

Ein **Vertrag** ist eine schriftliche, getestete Abmachung, wie ein Teil aussehen muss, damit es ohne Nacharbeit
passt. Wer gegen den Vertrag baut, kann mit Platzhaltern anfangen und später das echte Teil einsetzen.

| Teil | Vertrag | Wo festgelegt |
|---|---|---|
| Farbe | nur `P.*`, je Grundton `hell` und `tief` | `stil.ts`, Test in `figuren.test.tsx` |
| Figur | Baum aus Teilen mit Drehpunkt, Ruhepose, Posen, Bewegungen, Gesichter | `typen.ts`, Skill `figur` |
| Gegenstand | um (0, 0) auf einem Anker (`hut`, `hand-rechts`, `hand-links`, `begleiter`), enger `rahmen` | `typen.ts`, `items*.tsx` |
| Held-Teil | jedes Teil aus `teile.ts` hat eine Zeichnung | `held.test.tsx` |
| Gebäude, Anbau | 2:1-Raster, Bausatz-Helfer aus `iso.tsx`, gleiche Wandhöhen-Stufen wie das Haus | `iso.tsx`, Skill `grafik` |
| Bewegung | endlos = nahtlos, begrenzt = startet und endet in Ruhe | Tests in `figuren/` |
| Oberfläche | nur Tokens, keine festen Farbwerte außerhalb von `:root` | `lernquest.css`, Test |

Regeln dazu:
- **Eine Quelle je Wert.** Farben in `stil.ts`, Oberflächen-Werte in `lernquest.css`. Nichts doppelt abtippen.
- **Reine Logik getrennt vom Zeichnen.** Was rechnet (Bewegung, Wege, Karte, Regeln), ist reiner, getesteter Code
  (`bewegung.ts`, `weg.ts`, `karte.ts`); Zeichnungen rechnen nicht, die App setzt nur zusammen.
- **Baukasten statt Einzelstücke:** Held und Häuser bestehen aus austauschbaren Teilen auf festen Ankern, so wie die
  Avatare bei Duolingo. Ein neues Teil braucht keinen Umbau am Rest.
- **Ändert sich ein Vertrag, ändern sich Doku, Test und Bestand zusammen.** Ein Vertrag, der nur im Kopf steht, bricht
  beim nächsten Teil (bei Duolingo: eine Animation, die die nicht aufgeschriebenen Regeln verfehlte).

## Arbeitsweise

- **Erst breit, dann eng:** Für neue Richtungen zwei bis vier deutlich verschiedene Stilproben
  (`docs/design/lernquest/stilprobe/`), auf dem Handy ansehen, dann eine wählen und ausbauen.
- **Reifegrad nennen** beim Zeigen: 10 % = nur Richtung, 50 % = Aufbau, 99 % = Feinschliff. So kommt die passende Rückmeldung.
- **Klein anfangen:** Die erste Fassung ist klein und zum Wegwerfen gedacht; was bis zur fertigen Fassung fehlt, wird
  benannt.
- **Früh auf echten Größen prüfen:** Werkstatt mit Größenprobe (32/48 px), Handybreite, Nacht-Hintergrund;
  `npm run spieltest` für die App.
- **Rückmeldung der Lehrkraft** läuft über die Werkstatt (Sammlung `pruefung`, Skill `figur`).
- **Für Claude:** erst die Regeln des Bereichs lesen (Skill, `typen.ts`, dieses Dokument), dann bauen; vor dem Abgeben
  selbst prüfen (Tests, Werkstatt-Fotos, Prüfliste unten); Zwischenstände als Dateien festhalten, nicht im Gespräch.
  Eine Aufgabe je Sitzung (Skill `aufgabe`).

## Prüfliste für jede neue Grafik

- [ ] Als Silhouette bei 48 px erkennbar?
- [ ] So wenige Formen wie möglich? Fällt eine weg, ohne dass das Bild unklar wird?
- [ ] Nur Farben aus `stil.ts`, höchstens vier Grundtöne?
- [ ] Licht oben links, ein Schatten unten rechts, harte Kanten, kein Verlauf?
- [ ] Kein Umriss; Teile vor gleichfarbigem Grund durch Ton oder harten Schatten getrennt?
- [ ] Figur flach von vorn bzw. Umgebung im 2:1-Raster aus dem Bausatz?
- [ ] Passt neben den Fuchs und vor das Dorf (Werkstatt nebeneinander)?
- [ ] Bei Bildern zu Fragen: nur eine Lesart möglich?
- [ ] Bewegung mit Zweck, Ruhe nahtlos, ohne Bewegung lesbar?

## Umstellung des Bestands

Nicht auf einmal, je ein Schritt pro Sitzung, jeweils mit Stilprobe und Blick der Lehrkraft:
1. **Dorf ohne Verläufe – erledigt 19.11.2026:** `IsoVerlaeufe` in `iso.tsx` durch flache Töne ersetzt (Dach: Lichtkante am First als Form;
   Wand: rechte Seite `tief`; Band unter Traufe als flache Form; Schlagschatten als eine Fläche mit fester Deckkraft).
2. **Landkarte isometrisch – erledigt 19.11.2026:** Die Wahrzeichen (Burgen, Pyramide, Leuchtturm, Raumstation, Baumhaus,
   Zauberturm) sind aus dem Iso-Bausatz gebaut, der dafür runde Teile bekam (`walze`, `ring`, `kegel`, `kuppel`,
   `rundSchlag`, `bogenTor`). Kleine Teile (Bäume, Büsche, Steine) bleiben flach von vorn wie Spielfiguren auf dem Brett,
   ohne Umriss. Baum, Tanne, Palme und Kaktus kommen für Karte und Hintergründe aus `figuren/pflanzen.tsx`. Der Weg hat
   statt Rand einen harten Schatten nach unten rechts; die Start-Landschaft (`app/Landschaft.tsx`) hat einen Himmel aus
   flachen Bändern, dieselbe Burg und dieselben Bäume. `welten.test.tsx` verbietet Verläufe und Umriss.
   Vorschau: `VORSCHAU=<ordner> VORSCHAU_TEIL=karte npx vitest run src/lernquest/figuren/vorschau`.
3. **Figuren ohne Umriss** wie Stilprobe 2 (freigegeben von der Lehrkraft am 19.11.2026, [Stilprobe](#stilprobe-ohne-umriss)): Fuchs, Held mit allen Teilen,
   Bosse, Begleiter, Gegenstände. **Erledigt 19.11.2026:** Fuchs, Held mit allen Teilen, Bosse, Truhe, Hintergründe und
   Landkarte; danach `UMRISS`/`UMRISS_FEIN` aus `stil.ts` und die `umriss`-Option von `Glied` gelöscht. Vergleichsbilder
   macht weiter `STILPROBE=<ordner> npx vitest run src/lernquest/figuren/stilprobe`.
4. 3D-Teile aufräumen: die Skripte in `.claude/skills/grafik/skripte/` und `stilprobe/haus-3d-probe.png` werden nicht
   mehr gebraucht (Löschen nach Rückfrage).

## Stilprobe ohne Umriss

Entschieden am 19.11.2026: **überall ohne Umriss**, erst eine Stilprobe. Stand: 10 % (nur Richtung).
Bild: [`lernquest/stilprobe/umriss-v1.png`](lernquest/stilprobe/umriss-v1.png), erzeugt aus den echten Figuren mit
`src/lernquest/figuren/stilprobe.test.tsx` (der Umriss wird nur im Bild entfernt, der Code bleibt). Je Figur drei
Fassungen: heute, nur ohne Umriss, Vorschlag (ohne Umriss + harter Schatten von Armen und Kopf auf den Körper).

Was die Probe zeigt:
- **Kopf und Silhouette** lesen sich ohne Umriss gut, auch bei 48 und 32 px; Fuchs und Held wirken weicher und
  passen besser zum Dorf.
- **Arme vor gleichfarbigem Körper verschwinden** (rote Ärmel auf rotem Pulli, Ärmel des Fuchses auf der Tunika).
  Der Schatten auf den Körper hilft am Kinn deutlich, an den Armen nur wenig. **Entschieden (19.11.):** Ärmel und
  Arme vor dem Körper sind einen Ton dunkler (`tief`) als der Rumpf; der Schatten bleibt für Kopf und Kinn.
- **Dunkle Haare vor dunklem Grund** (Nacht, Boss) verlieren die Kontur: Haare brauchen eine `hell`-Kante oben links.
- **Offene Detail-Linien** stehen ohne Umriss allein da (Zacken an der Schwanzspitze des Fuchses): neu zeichnen oder weg.
- Ohne Strich werden Formen 1,5 Einheiten kleiner; im Code die Formen entsprechend größer zeichnen, nicht den Strich
  in der Füllfarbe stehen lassen.

**Stilprobe 2** (19.11.2026, 10 %, **freigegeben**): [`lernquest/stilprobe/umriss-v2.png`](lernquest/stilprobe/umriss-v2.png), Spalten
heute · Probe 1 · Probe 2. Probe 2 = ohne Umriss, Arme vor dem Körper einen Ton dunkler (Kleidung: Grundton → `tief`,
`hell` → Grundton; Haut und Fell bleiben), Kopf wirft seinen Schatten auf den Körper, dunkle Haare (`haar0`, `haar1`)
mit `hell`-Kante oben links (harte Kante, 2,5 Einheiten), ohne die Zackenlinie am Fuchsschwanz.
- **Arme** heben sich jetzt klar ab, auch bei 48 px; der Schatten an den Armen ist nicht mehr nötig.
- **Haare** behalten auf Nacht und Dunkelgrün ihre Form; Locken und Zöpfe wirken plastischer.
- **Neu gesehen:** dunkle Hüte (Piratenhut) verschwinden auf dem Nachtgrund wie vorher die Haare. Regel daraus: die
  `hell`-Kante gilt für **alle** dunklen Teile (Haare, Hüte, dunkle Kleidung), nicht nur für Haare.
- Ärmel in `tief` verlieren ihren eigenen Schatten; das ist gewollt (eine Fläche, ein Ton).

## Quellen

- Duolingo: [Shape language](https://blog.duolingo.com/shape-language-duolingos-art-style/) (Stil, Formenzahl, Humor),
  [Core tabs redesign](https://blog.duolingo.com/core-tabs-redesign/) (Einheitlichkeit gegen Zweck, Einfachheit gegen Klarheit),
  [Avatar creator](https://blog.duolingo.com/avatar-creator/) (Baukasten),
  [Duologues](https://blog.duolingo.com/duologues-design-conversations/) (Handwerk, Persönlichkeit in Details),
  [Engineering velocity](https://blog.duolingo.com/improve-engineering-velocity/) (Verträge, 10/50/99, kleine erste Fassung),
  [AI bug fixing agent](https://blog.duolingo.com/ai-bug-fixing-agent/) (erst Konventionen lesen, Zwischenstände als Dateien, Selbstprüfung).
