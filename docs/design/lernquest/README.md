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
- **Zustände** (alle Knöpfe und Kacheln gleich): normal mit Stufe `0 4px 0` in `-deep`; gedrückt 4 px tiefer ohne
  Stufe; Fokus nur bei `:focus-visible`, Ring 3 px `--lq-gold`, 2 px Abstand; deaktiviert `--lq-line`/`--lq-muted`
  ohne Stufe, mit Grund als Text, wo nötig; gewählt innen 3 px `--lq-primary` + Haken; richtig/falsch `-bg` + Rand +
  Haken/Kreuz + Text; lädt: gleiche Größe, „…“ mit Punkt, Doppeltippen gesperrt; offline: gelbes Band oben
  („Offline – deine Runden werden später gesendet“), Spielen geht weiter.
- **Animationen:** Dauern als Tokens `--lq-t-fast` 80 ms, `--lq-t-mid` 250 ms, `--lq-t-slow` 600 ms. Nur diese
  Anlässe: Drücken (4 px), falsch (Wackeln), richtig/Münzen/neues Teil (Plopp), Rückmelde-Leiste (hochgleiten),
  nächste Station (Puls, nur diese), Truhe (aufspringen, Teil steigt, Strahlen drehen). Nie Eingabe blockieren;
  Truhe ≤ 2 s, per Tippen überspringbar. Weniger Bewegung: nicht abschalten, sondern ersetzen (Wackeln → roter Rand
  blinkt, Plopp → Einblenden, Puls/Strahlen stehen).
- **Barrierefreiheit:** Tippflächen ≥ 48 px, ≥ 8 px Abstand; Zoom bleibt erlaubt; Rückmeldungen über `aria-live`;
  Symbole ohne Text mit Beschriftung; Tab-Reihenfolge wie Bildschirm; Ziehen immer auch per Antippen lösbar.
  Vorlese-Knopf (Lautsprecher) an jeder Aufgabe, je Klasse abschaltbar, Standard an, nicht im Bosskampf.
- **Avatar-Stil:** Sticker-Look – flache Formen, Umriss 3 px `--lq-ink`, je Teil ≤ 3 Farben + ein Schattenton aus
  einer Avatar-Palette (~12 Töne), keine Verläufe. Alle Teile auf 200 × 200 mit festen Ankern je Ebene (Werkzeug
  rechte Hand, Begleiter unten links). Seltenheit über Rahmen und Punkte, nur Episch/Legendär mit Funkeln. Eigene
  SVGs in `src/lernquest/avatar/` als **Vorlage**: Grundfigur, Anker und 5 Probeteile. Die endgültigen Teile erzeugt
  die Lehrkraft später selbst mit einem Bildmodell (Vorlage + Prompt, img2img/Denoise). Deshalb kann jedes Teil
  entweder SVG oder Bild sein: PNG/WebP 512 × 512, transparenter Grund, gleiches Raster wie die Vorlage (200 × 200
  skaliert). Fehlt ein Bild, gilt die SVG-Vorlage.
- **Frisur:** frei wählbar wie die Hautfarbe, keine Beute: ~8 Frisuren (kurz, lang, Locken, Zöpfe, Dutt, Kopftuch,
  Afro, Iro) und 6 Haarfarben. Unter einem Hut die kurze Version; zum Kopftuch nur flache Kopfteile (Stirnband,
  Krone). Braucht eine kleine Migration (`frisur`, `haar` neben `haut`), einspielen erst nach Freigabe.
- **Abstände:** 4-px-Skala als Tokens `--lq-sp-1…7` = 4, 8, 12, 16, 24, 32, 48 px (Seitenrand Handy 16, iPad 24).
  Radien `--lq-r-s` 10 px, `--lq-r` 18 px, `--lq-r-full`. Krumme Werte (10, 14, 22, 34 …) auf die nächste Stufe.
