# Lernquest – Design-Prototyp

Design-Vorlage für die Schüler-App Lernquest (Plan: `docs/lernquest.md`). Entstanden am 06.11.2026 als
Design-Canvas auf claude.ai (privat, Lehrkraft: https://claude.ai/artifact/H586HwfxoGuewKukR4dRv4).
Die Dateien sind Referenz, kein Produktionscode; in `src/lernquest/` nachbauen.

| Datei | Bildschirm | Stufe |
|---|---|---|
| `Main.dc.html` | Klassencode → Name → PIN → Weltkarte → Station (antippen, Lücke mit Kacheln, Paare) → Ergebnis; klickbar | 1 |
| `Held.dc.html` | Avatar mit Ebenen, Teile mit fünf Seltenheiten, Truhe und Laden | 2 |
| `Truhe.dc.html` | Truhe öffnen, sichtbare Chancen, Garantie-Hinweis | 2 |
| `Boss-Beamer.dc.html` | Bosskampf am Beamer (1440 × 810) | 3 |
| `Boss-Handy.dc.html` | Antwortknöpfe am Handy | 3 |

`canvas.json` hält die Anordnung auf dem Canvas. Wie beim Baukasten-Prototyp fehlt `support.js` (Laufzeit des
Canvas); die Logik steht im `<script data-dc-script>`-Block jeder Datei.

## Look
- Eigener Spiel-Look, nicht `src/sheet/`. Handy zuerst (390 × 844), große Knöpfe (mind. 44 px), Knöpfe mit
  „Stufe“ darunter (`box-shadow: 0 4px 0 …`).
- Schriften: Überschriften **Fredoka** 600, Text **Nunito** 700/800 (in der App selbst hosten).
- Farben: Grund `#F3F0FF`, Schrift `#1F1A3D`, gedämpft `#57527A`, Linie `#DCD6F5`, Violett `#5B3FD9`/`#3F28A8`,
  Gold `#FFC531`/`#C98F00`, richtig `#13804A` auf `#DDF5E7`, falsch `#C4321F` auf `#FDE6E1`; Bosskampf und Truhe
  auf dunklem Grund `#1F1A3D`.
- Seltenheiten: Gewöhnlich, Ungewöhnlich, Selten, Episch, Legendär – Farbe **und** 1–5 Punkte.
- Rückmeldung nie nur über Farbe: Haken/Kreuz und Text; Antworten im Bosskampf mit Form (Dreieck, Raute, Kreis,
  Quadrat).
- Inhalte sind Beispiele (Erdkunde, Klasse 5b, erfundene Namen).

## Designregeln (Designrunde 06.11.2026)
Gelten für den Nachbau in `src/lernquest/app/lernquest.css`; der Prototyp bleibt Bildvorlage, diese Regeln gehen vor.

### Farben
- Tokens heißen nach ihrer Aufgabe, nicht nach dem Farbton: `--lq-primary` `#5B3FD9`, `--lq-primary-tief` `#3F28A8`,
  `--lq-gold` `#FFC531`, `--lq-gold-tief` `#C98F00`, `--lq-ok` `#0F7543` (siehe Barrierefreiheit) / `--lq-ok-flaeche` `#DDF5E7`,
  `--lq-fehler` `#C4321F` / `--lq-fehler-flaeche` `#FDE6E1`, dazu Grund, Karte, Schrift, gedämpft, Linie.
- Seltenheiten `--lq-selten-1` … `--lq-selten-5` (Werte wie `SELTENHEIT` in `src/lernquest/teile.ts`); dunkles Set
  für Truhe und Bosskampf `--lq-nacht` `#1F1A3D`, `--lq-nacht-ink`.
- Außerhalb von `:root` keine festen Farbwerte im CSS; ein Test prüft das.

### Schrift
- Sieben Stufen als Tokens, keine anderen Größen: `--lq-t-klein` 13 px (Untergrenze), `--lq-t-text` 16,
  `--lq-t-gross` 19 (Kacheln, Namen, Lückensatz), `--lq-t-knopf` 20, `--lq-t-h3` 24, `--lq-t-h2` 30, `--lq-t-h1` 40.
- Fredoka 600 für Überschriften und Knöpfe, Nunito 700 für Text, 800 zum Hervorheben.
- Ab 700 px Breite wachsen nur die Stufen ab `--lq-t-h3` um etwa 15 %; Lesegrößen bleiben gleich.

### Abstände, Ecken, Tippflächen
- Abstände im 4-px-Raster: `--lq-a-1` 4, `-2` 8, `-3` 12, `-4` 16, `-5` 24, `-6` 32 (10/14 → 12, 20 → 24, 34 → 32).
- Ecken: `--lq-r-klein` 10 px (Kacheln, Abzeichen), `--lq-r` 18 px (Karten, Knöpfe), `--lq-r-pille` 999 px
  (Münzen, Herzen, Wochenziel).
- Alles Antippbare mindestens 48 px hoch, Hauptknöpfe („Weiter“, „Prüfen“) 56 px, mindestens 8 px Luft dazwischen.

### Zustände
Jedes antippbare Teil hat dieselben Zustände, nie nur über Farbe unterschieden:
- **Normal:** Fläche mit Stufe darunter (`0 4px 0` in der tiefen Farbe).
- **Gedrückt:** rutscht 4 px nach unten, Stufe verschwindet.
- **Fokus** (Tastatur, `:focus-visible`): 3 px Rand `--lq-primary` mit 3 px Abstand, auf dunklem Grund `--lq-gold`.
- **Gewählt:** Rand `--lq-primary` und Haken.
- **Gesperrt** (deaktiviert): Fläche `--lq-line`, Schrift gedämpft, keine Stufe, Schloss-Symbol mit Text, warum
  (z. B. „Erst Station 2 schaffen“); keine bloße Transparenz.
- **Richtig / falsch:** Fläche `--lq-ok-flaeche` / `--lq-fehler-flaeche`, Haken / Kreuz und ein Satz Text.
- **Lädt:** Knopf behält seine Breite, Text „Einen Moment …“, `aria-busy`; nach 10 s Hinweis mit „Nochmal“.
- **Offline / Fehler:** Band oben mit Text und „Nochmal“; Fortschritt wartet im Gerät (wie gebaut).
- **Leer:** jeder leere Bereich (keine Teile, keine freien Stationen) sagt in einem Satz, was zu tun ist.

### Bewegung
- Drei Dauern: `--lq-dauer-kurz` 120 ms (Drücken), `--lq-dauer` 240 ms (Erscheinen, Wechsel),
  `--lq-dauer-lang` 600 ms (Belohnung). Truhe öffnen höchstens 2 s und per Tippen überspringbar.
- Kurven: `ease-out` für alles, federnd `cubic-bezier(.34, 1.56, .64, 1)` nur für Belohnungen (Sterne, Münzen, Teil).
- Nur `transform` und `opacity` animieren. Falsch = kurzes Wackeln, richtig = kurzes Hüpfen.
- „Bewegung reduzieren“: Animationen aus (wie gebaut); jeder Zustand ist auch ohne Animation sichtbar.

### Barrierefreiheit
- Kontrast nach WCAG AA (Kontrastnorm fürs Web): Text 4,5 : 1, große Schrift und Symbole 3 : 1. Daraus:
  - Gold nur als Fläche, nie als Schrift; goldene Zahlen in `--lq-gold-schrift` `#7A5600` (6,7 : 1).
  - `--lq-ok` wird `#0F7543` (5,0 : 1 auf der grünen Fläche; `#13804A` hatte nur 4,3 : 1).
  - Auf dunklem Grund ist Violett `--lq-primary-nacht` `#A99BFF` (6,9 : 1), nicht `#5B3FD9` (2,5 : 1).
- Symbol-Knöpfe haben ein `aria-label`; Rückmeldungen stehen zusätzlich in einem `aria-live`-Bereich.
- Bis 200 % Zoom kein seitliches Scrollen; Stationen ohne Zeitdruck (Zeitlimit nur im Bosskampf, Stufe 3).
- Alles geht auch mit Tastatur (Ziehen hat immer eine Antipp-Alternative).

### Layout
- Breiten: Handy bis 699 px eine Spalte (max. 560 px); ab 700 px (iPad hoch) eine Spalte, max. 640 px, Abstände
  eine Stufe größer; ab 1024 px (iPad quer, Laptop) zwei Spalten, wo es hilft.
- Zwei Spalten: Weltkarte + Seitenleiste (Held, Münzen, Wochenziel); Held-Seite Avatar links, Teile-Raster rechts.
- Stationen bleiben einspaltig und mittig (max. 720 px), damit die Aufgabe allein im Blick ist.
- Handy quer: Kopfzeile schrumpft auf eine Zeile, nichts wird abgeschnitten.

### Avatar-Stil (40 Teile)
- Flache Vektorgrafik ohne Umrisslinien, je Fläche zwei Töne (Grundton und Schatten), Formen rund und kindlich, Stil
  wie der Held in `Held.dc.html`.
- Eine gemeinsame Zeichenfläche (`viewBox` 0 0 240 240) für alle Teile; feste Ebenen von hinten nach vorn:
  Hintergrund, Begleiter, Körper/Haut, Kleidung, Augen, Kopf, Werkzeug. Jedes Teil ist eine eigene Gruppe, die
  ohne Nachbarteile richtig sitzt.
- Hautton ist kein Teil, sondern eine Wahl (`HAUT`); Teile berühren die Haut nur über die Ebenen.
- Seltenheit sieht man auch an der Zeichnung: Gewöhnlich schlicht, je höher desto mehr Details; ab Episch ein
  Akzent in Gold, Legendär mit kleinem Funkeln (still bei „Bewegung reduzieren“).
- Vorschaubild im Raster: dasselbe SVG mit einem Ausschnitt je Ebene, kein zweites Bild.
- Teile-Farben sind feste Werte in den Zeichnungen (TypeScript), nicht in den UI-Tokens.
