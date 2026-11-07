# Handoff – 07.11.2026 (Nacht)

## Ziel
Lernquest (Lern-App der Schüler, `docs/lernquest.md`): gemalte Bilder für den Held. Nächstes Thema: Mund als eigene
Ebene, weil die neue Grundfigur ein leeres Gesicht hat.

## Stand
- Live: Stufen 1–5, Stufe-4-Reste (#32: Punkte-Dialog, Gutscheine gleichzeitig, +Schaden mit Migration
  `lernquest_schaden`), Bilder-Prompts aufgeteilt (#34), erste 26 gemalte Ebenen (Merge vom 07.11.2026, Nacht).
- Gemalt (`src/lernquest/app/teile/`): Grundfigur + Hauttöne, 8 Frisuren, T-Shirt, Pulli, Latzhose, Weste,
  Sternenmantel, Goldrüstung, 8 Kopf-Teile, Funkel-/Herzaugen, Taucherbrille. Sitz in `src/lernquest/bilder/anpassen.json`.
- Tests: grün (338), Typprüfung, Build, CI grün. In der echten App (Held-Seite) noch nicht angesehen.

## Nächste Schritte
1. **Mund als eigene Ebene** (Wunsch der Lehrkraft): Figuren haben seit dem Merge keinen Mund. Wie die Frisur bauen:
   Liste wie `FRISUREN`, frei wählbar auf der Held-Seite, Ebene über Grundfigur und Augen, unter Kopf-Teil, Edits
   `edit/mund-<id>.png`, Suchbereich in `EDIT_BEREICH`, Prompts in `vorlagen.ts` (Bäckchen gehören mit in den Mund).
   Server: `lq_avatar_setzen` muss den Schlüssel `mund` annehmen (Migration nur nach OK der Lehrkraft, vor dem Merge).
2. Neu malen lassen: Blumenkranz (als stehender Ring gemalt, bleibt Vektor), Hautton 3 (grau-oliv, Fleck), 4 (rosa
   Unterhemd), 6 (Bäckchen); Hautton 2 ist vom Skript umgefärbt. Entdeckerhut hat leichten Schatten unter der Krempe.
3. Ton am iPad: Vorlesen und Klick-Töne stumm. Erst `navigator.audioSession.type = 'playback'`, Vorlesen ohne
   `cancel()` davor, Knopf „Ton testen“; sonst Ton-Dateien beim Senden des Pakets erzeugen und mit `<audio>` spielen.

## Wichtig zu wissen
- Rohbilder: Google Drive, Ordner `lernquest-roh` (Grundfigur, Hauttöne, Kopf/Werkzeug/Begleiter einzeln) mit
  Unterordner `edit` (Frisuren, Augen, Kleidung). Dateien heißen wie in ComfyUI → anhand der Bilder zuordnen.
  `download_file_content` legt große Dateien als JSON ab (base64 in `content`), dann dekodieren.
- Zuordnung 07.11.: Drive-Nr. 05 Grundfigur, 06 h2, 08 h3, 07 h4, 10 h5, 12 verworfen; 16 Stirnband-Ring und
  39 große Locken nicht genommen.
- Weg je Teil (`EINZELN` in `vorlagen.ts`, `bilder.md`): Kopf, Werkzeug, Begleiter einzeln; Rest als Edit von
  `koerper.png`. Bodenschatten einzelner Teile: `toleranz` 60 in `anpassen.json`; weiße Teile (Bommel) leiden darunter.
- `main` = veröffentlichen. PR und Merge nur auf Wunsch. Force-Push ist gesperrt: nach einem Squash-Merge `origin/main`
  in den Branch mergen statt ihn neu zu setzen.
- Die `lq_*`-Tabellen nie direkt lesen (echte Kindernamen); nur über die Server-Funktionen mit Wegwerf-Schlüssel.
