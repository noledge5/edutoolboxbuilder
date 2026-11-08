# Handoff – 08.11.2026

## Ziel
Lernquest (Lern-App der Schüler, `docs/lernquest.md`): gemalte Bilder für den Held und der Bosskampf am Beamer.

## Stand
- Live: Stufen 1–5, Stufe-4-Reste (#32: Punkte-Dialog, Gutscheine gleichzeitig, +Schaden mit Migration
  `lernquest_schaden`), Bilder-Prompts aufgeteilt (#34), erste 26 gemalte Ebenen (#35, 07.11.2026).
- Gemalt (`src/lernquest/app/teile/`): Grundfigur + Hauttöne, 8 Frisuren, T-Shirt, Pulli, Latzhose, Weste,
  Sternenmantel, Goldrüstung, 8 Kopf-Teile, Funkel-/Herzaugen, Taucherbrille. Sitz in `src/lernquest/bilder/anpassen.json`.
- **Mund als eigene Ebene: live (#36, 08.11.2026).** Sechs Münder (`MUENDER` in `teile.ts`), Auswahl auf der Held-Seite,
  bis zu gemalten Bildern `mund-<id>.webp` als Vektor gezeichnet. Migration `lernquest_mund` (`lq_avatar_setzen` kennt
  den Schlüssel `mund`) ist am 08.11.2026 eingespielt, nach ausdrücklichem OK der Lehrkraft im Chat (die
  Berechtigungsprüfung blockiert Produktiv-Änderungen sonst); die Funktion im Projekt war vorher byte-gleich mit
  `20261110_lernquest_frisur.sql`, jetzt mit `20261112_lernquest_mund.sql`. In der echten Held-Seite noch nicht angesehen.
- **Bosskampf: QR-Code zum Beitritt: live (#37, 08.11.2026).** In der Warte-Ansicht am Beamer steht der Klassenlink als QR-Code
  (`#beamer=<id>&klasse=<Code>`, `QrBild.tsx`, `beamerAusHash`/`beitrittsLink` in `karte.ts`). Kein Server-Teil.
- Tests: grün; auf einem Windows-Checkout (CRLF) schlagen zwei Anleitungs-Tests in `src/claude` und der Prompts-Test
  in `bilder.test.ts` an, auf Linux/CI nicht. Typprüfung und Build laufen. Münder und QR-Layout nur als Standbild
  geprüft, nicht in der echten App (Kinder-Login nötig).

## Nächste Schritte
1. **Münder und QR-Code in der echten App ansehen** (Held-Seite „Mund“; Bosskampf starten, Warte-Ansicht am Beamer,
   mit dem Handy scannen).
2. **Zweite Funktion für den Bosskampf, „wie Plickers“** (noch nichts entschieden, nichts gebaut): siehe den Abschnitt
   „Plickers“ unten. Zuerst die Lehrkraft fragen, nichts davon annehmen.
3. Neu malen lassen: Blumenkranz (als stehender Ring gemalt, bleibt Vektor), Hautton 3 (grau-oliv, Fleck), 4 (rosa
   Unterhemd), 6 (Bäckchen); Hautton 2 ist vom Skript umgefärbt. Entdeckerhut hat leichten Schatten unter der Krempe.
   Dazu die Münder als Edits (`edit/mund-<id>.png`, Prompts in `docs/design/lernquest/bilder/edit-prompts.md`, Abschnitt 4).
4. Ton am iPad: Vorlesen und Klick-Töne stumm. Erst `navigator.audioSession.type = 'playback'`, Vorlesen ohne
   `cancel()` davor, Knopf „Ton testen“; sonst Ton-Dateien beim Senden des Pakets erzeugen und mit `<audio>` spielen.
   Nicht ohne iPad prüfbar, darum bisher nicht angefasst.

## Plickers (Wunsch der Lehrkraft, 08.11.2026, noch nicht beschrieben)
- **Was gesagt wurde** (einziger Stand): Für den Bosskampf soll es neben dem QR-Code zum Beitreten (live, #37) „eine
  zweite Funktion“ geben; „das gibt es als Plickers“. Die Lehrkraft beschreibt sie selbst in einer neuen Sitzung. Mehr
  ist nicht bekannt.
- **Was Plickers ist** (Orientierung von Claude, von der Lehrkraft nicht bestätigt): Jedes Kind hat eine Papierkarte mit
  einem eckigen Muster, das sich in vier Drehungen (A bis D) unterscheidet. Es hält die Karte so hoch, dass seine
  Antwort oben steht. Die Lehrkraft scannt die Klasse mit der Handykamera, die App wertet sofort aus. Die Kinder
  brauchen dafür kein Gerät.
- **Anknüpfungspunkte im Code**, falls es das ist: Bosskampf `src/lernquest/app/Boss.tsx`, `boss.ts` (Fragen, `FORMEN`),
  `rules.ts`, Server `lq_boss_…`; Kinder antworten bisher am eigenen Gerät (`bossAntworten`, 20 s je Frage, Schaden nach
  Tempo und Serie). Karten zum Ausdrucken gibt es schon (`teacher/PinCards.tsx`, QR mit `uqr`). Kamera-Scan gibt es
  schon (`src/sync/QrScanner` mit BarcodeDetector oder jsQR, in `LernquestApp` für den Klassen-QR).
- **Vor dem Bauen mit der Lehrkraft klären:** Ersetzt es die Geräte der Kinder oder ergänzt es sie? Wem gehört eine Karte
  (ein Kind = ein Konto, oder nur eine Nummer ohne Konto)? Wer scannt, mit welchem Gerät? Zählen die Antworten wie im
  Bosskampf (Schaden, Klassen-Herzen, Truhe) oder nur als Abstimmung? Muss es ohne Netz gehen? Datenschutz: keine
  Kindernamen am Beamer (Regel im Bosskampf).

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
