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

## Designrunde 10.11.2026 (Entscheidungen)
Gilt vor dem Prototyp, wo beide sich widersprechen.

- **Farben als Tokens, zwei Ebenen.** Grundfarben mit ehrlichen Namen (`--lq-violett`, `--lq-violett-dunkel`,
  `--lq-gold`, `--lq-gold-dunkel`, `--lq-tinte`, `--lq-grau`, `--lq-linie`, `--lq-grund`, `--lq-nacht`), darüber
  Rollen (`--lq-knopf`, `--lq-knopf-stufe`, `--lq-richtig`/`-grund`, `--lq-falsch`/`-grund`, `--lq-auswahl`,
  `--lq-selten-1` … `-5`). Im CSS sonst keine festen Farbwerte. Eigene Datei für Lernquest, nicht `src/styles/tokens.css`.
- **Neuer Platz „Frisur“.** Liegt unter dem Kopfteil; jede Frisur gibt es ganz und kurz (unter Hut/Helm). Haar- und
  Hautfarbe frei wählbar, keine Beute. Frisuren sind Teile wie alle anderen (Start, Truhe, Laden).
- **Herkunft je Teil:** Start, Truhe, Truhe + Laden oder Laden. Dazu wie bisher Seltenheit und Bonus.
- **Die Lehrkraft stellt die Teile im Baukasten ein** (Seite „Teile“ im Lernquest-Bereich): Seltenheit, Herkunft, Bonus.
