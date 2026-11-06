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
  `--lq-gold` `#FFC531`, `--lq-gold-tief` `#C98F00`, `--lq-ok` `#13804A` / `--lq-ok-flaeche` `#DDF5E7`,
  `--lq-fehler` `#C4321F` / `--lq-fehler-flaeche` `#FDE6E1`, dazu Grund, Karte, Schrift, gedämpft, Linie.
- Seltenheiten `--lq-selten-1` … `--lq-selten-5` (Werte wie `SELTENHEIT` in `src/lernquest/teile.ts`); dunkles Set
  für Truhe und Bosskampf `--lq-nacht` `#1F1A3D`, `--lq-nacht-ink`.
- Außerhalb von `:root` keine festen Farbwerte im CSS; ein Test prüft das.

### Schrift
- Sieben Stufen als Tokens, keine anderen Größen: `--lq-t-klein` 13 px (Untergrenze), `--lq-t-text` 16,
  `--lq-t-gross` 19 (Kacheln, Namen, Lückensatz), `--lq-t-knopf` 20, `--lq-t-h3` 24, `--lq-t-h2` 30, `--lq-t-h1` 40.
- Fredoka 600 für Überschriften und Knöpfe, Nunito 700 für Text, 800 zum Hervorheben.
- Ab 700 px Breite wachsen nur die Stufen ab `--lq-t-h3` um etwa 15 %; Lesegrößen bleiben gleich.
