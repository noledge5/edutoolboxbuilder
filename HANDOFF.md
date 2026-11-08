# Handoff – 08.11.2026

## Ziel
Lernquest (Lern-App der Schüler, `docs/lernquest.md`): gemalte Bilder für den Held und der Bosskampf am Beamer.

## Stand
- Live: Stufen 1–5, Stufe-4-Reste (#32: Punkte-Dialog, Gutscheine gleichzeitig, +Schaden mit Migration
  `lernquest_schaden`), Bilder-Prompts aufgeteilt (#34), erste 26 gemalte Ebenen (#35, 07.11.2026).
- Gemalt (`src/lernquest/app/teile/`): Grundfigur + Hauttöne, 8 Frisuren, T-Shirt, Pulli, Latzhose, Weste,
  Sternenmantel, Goldrüstung, 8 Kopf-Teile, Funkel-/Herzaugen, Taucherbrille. Sitz in `src/lernquest/bilder/anpassen.json`.
- **Mund als eigene Ebene: PR #36, noch nicht gemergt.** Sechs Münder (`MUENDER` in `teile.ts`), Auswahl auf der Held-Seite,
  bis zu gemalten Bildern `mund-<id>.webp` als Vektor gezeichnet. Wartet auf die Migration
  `supabase/migrations/20261112_lernquest_mund.sql` (`lq_avatar_setzen` kennt den Schlüssel `mund`). Das Einspielen mit
  dem Supabase-Werkzeug (Projekt „baukasten“, Name `lernquest_mund`) hat die Berechtigungsprüfung als Produktiv-Änderung
  blockiert: Die Lehrkraft spielt sie ein oder erlaubt es ausdrücklich, danach #36 mergen (nie davor, sonst zeigt die
  Mund-Auswahl einen Fehler). Die Funktion im Projekt war vorher byte-gleich mit `20261110_lernquest_frisur.sql`.
- **Bosskampf: QR-Code zum Beitritt**, PR dazu. In der Warte-Ansicht am Beamer steht der Klassenlink als QR-Code
  (`#beamer=<id>&klasse=<Code>`, `QrBild.tsx`, `beamerAusHash`/`beitrittsLink` in `karte.ts`). Kein Server-Teil.
- Tests: grün; auf einem Windows-Checkout (CRLF) schlagen zwei Anleitungs-Tests in `src/claude` und der Prompts-Test
  in `bilder.test.ts` an, auf Linux/CI nicht. Typprüfung und Build laufen. Münder und QR-Layout nur als Standbild
  geprüft, nicht in der echten App (Kinder-Login nötig).

## Nächste Schritte
1. **Migration `lernquest_mund` einspielen, dann #36 mergen** (siehe oben).
2. **Plickers-artige Funktion für den Bosskampf**: Die Lehrkraft beschreibt sie in einer neuen Sitzung (noch nichts
   entschieden, nichts gebaut).
3. Neu malen lassen: Blumenkranz (als stehender Ring gemalt, bleibt Vektor), Hautton 3 (grau-oliv, Fleck), 4 (rosa
   Unterhemd), 6 (Bäckchen); Hautton 2 ist vom Skript umgefärbt. Entdeckerhut hat leichten Schatten unter der Krempe.
   Dazu die Münder als Edits (`edit/mund-<id>.png`, Prompts in `docs/design/lernquest/bilder/edit-prompts.md`, Abschnitt 4).
4. Ton am iPad: Vorlesen und Klick-Töne stumm. Erst `navigator.audioSession.type = 'playback'`, Vorlesen ohne
   `cancel()` davor, Knopf „Ton testen“; sonst Ton-Dateien beim Senden des Pakets erzeugen und mit `<audio>` spielen.
   Nicht ohne iPad prüfbar, darum bisher nicht angefasst.

## Wichtig zu wissen
- Rohbilder: Google Drive, Ordner `lernquest-roh` (Grundfigur, Hauttöne, Kopf/Werkzeug/Begleiter einzeln) mit
  Unterordner `edit` (Frisuren, Augen, Kleidung). Dateien heißen wie in ComfyUI → anhand der Bilder zuordnen.
  `download_file_content` legt große Dateien als JSON ab (base64 in `content`), dann dekodieren.
- Zuordnung 07.11.: Drive-Nr. 05 Grundfigur, 06 h2, 08 h3, 07 h4, 10 h5, 12 verworfen; 16 Stirnband-Ring und
  39 große Locken nicht genommen.
- Weg je Teil (`EINZELN` in `vorlagen.ts`, `bilder.md`): Kopf, Werkzeug, Begleiter einzeln; Rest als Edit von
  `koerper.png`. Bodenschatten einzelner Teile: `toleranz` 60 in `anpassen.json`; weiße Teile (Bommel) leiden darunter.
- `main` = veröffentlichen. Force-Push ist gesperrt: nach einem Squash-Merge `origin/main` in den Branch mergen
  statt ihn neu zu setzen.
- Die `lq_*`-Tabellen nie direkt lesen (echte Kindernamen); nur über die Server-Funktionen mit Wegwerf-Schlüssel.
- Der Hauptordner `C:\Users\Ludwig\Workspace\edutoolboxbuilder` steht auf einem alten Branch
  (`claude/youthful-johnson-ddv7bo`, 80 Commits hinter `main`) mit uncommitteten Änderungen am Diagramm-Baustein und
  an der Material-Anzeige. Nicht angefasst; gearbeitet wurde im Worktree `.claude/worktrees/lernquest-mund`.
