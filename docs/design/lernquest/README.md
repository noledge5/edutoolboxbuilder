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

## Designrunde 06.11.2026 (Entscheidungen)
- **Geräte:** Handy zuerst, das bleibt so. Auf iPad/Laptop kein eigenes Layout, nur breitere Spalte (etwa 720 px),
  Antwortkacheln zweispaltig, alles etwas größer. Einzige Ausnahme: Bosskampf am Beamer (eigener Bildschirm).
- **Schriftgrößen:** 7 Stufen als Tokens `--lq-fs-*`: klein 13, neben 15, text 17, knopf 20, titel-s 24, titel 30,
  zahl 44 px. Nichts unter 13 px. iPad/Laptop: alles × 1,125. Zeilenhöhe 1,4 (Text), 1,15 (Überschriften).
- **Farb-Tokens** nach Bedeutung (Werte wie oben): `--lq-bg`, `--lq-surface`, `--lq-ink`, `--lq-muted`, `--lq-line`,
  `--lq-primary`/`-deep`/`-soft`, `--lq-gold`/`-deep`/`-ink`, `--lq-right`/`-bg`, `--lq-wrong`/`-bg`, `--lq-night`,
  `--lq-rarity-0…4`. Keine Farbwerte mehr direkt im CSS; `#77729a` entfällt (zu wenig Kontrast) → `--lq-muted`.
- **Seltenheitsfarben:** Gewöhnlich `#6E6990`, Ungewöhnlich `#0A6F78` (Türkis, nicht das Richtig-Grün), Selten
  `#2459B8`, Episch `#A3218F` (Magenta, nicht das Knopf-Violett), Legendär `#8A6100`. Alle ≥ 4,5:1 auf Grund und
  Weiß; dazu immer 1–5 Punkte.
