# Lernquest: gemalte Bilder für Held und Teile

Anleitung, um die Grundfigur und die 40 Teile mit **Krea 2** in **ComfyUI** (lokal) zu malen und in die App zu bringen.
Bis ein Teil ein Bild hat, zeichnet die App es weiter als Vektor. Man kann also Teil für Teil austauschen.

## So hängt alles zusammen

```
ComfyUI (Krea 2)          lernquest-roh/            npm run lq:bilder          src/lernquest/app/teile/
krone_00003_.png   ──►    krone.png         ──►     freistellen, einpassen ──► krone.webp  ──► App
koerper.png               koerper.png               6 Hauttöne                 koerper-0 … koerper-5.webp
```

- **Verknüpfung = Dateiname.** Das Bild heißt wie die Teil-ID aus `src/lernquest/teile.ts` (`krone`, `zauberhut`,
  `katze` …). Eine Liste mit Code ist dafür nicht nötig. `src/lernquest/app/teilBilder.ts` findet alle Dateien in
  `src/lernquest/app/teile/` von selbst.
- **Ebenen bleiben.** Jedes fertige Bild ist eine ganze Ebene (480 × 480 Pixel, durchsichtig, wo nichts ist). Die App
  legt sie wie bisher übereinander: Hintergrund, Begleiter, Grundfigur, Kleidung, Augen, Kopf, Werkzeug. Darum passt
  jede Kombination.
- **Hautton bleibt frei wählbar.** Du malst die Grundfigur einmal. Das Skript misst die Haut und färbt sie in die
  sechs Hauttöne um, die Schattierung bleibt dabei erhalten.
- **Offline und aktuell.** Beim Bauen bekommen die Bilder einen Namen mit Prüfsumme (`assets/krone-Ab12.webp`). Der
  Offline-Speicher hält sie, und ein neues Bild ersetzt das alte sofort.

## Der Stil: „weich gemalt“

Kindgerechter Spielstil für 10- bis 12-Jährige. Er liegt als fester englischer Satz in `STIL`
(`src/lernquest/bilder/vorlagen.ts`), und **jeder** Prompt endet damit. Gleiche Wörter ergeben gleichen Look.

- Runde, kräftige, freundliche Formen mit klarer Silhouette, die auch auf dem Handy in 64 px lesbar ist.
- Weiche gemalte Schatten mit sanften Verläufen. Licht kommt immer von **links oben**, dazu eine leichte warme Kante.
- **Keine schwarzen Umrisse.** Die Kanten sind nur eine dunklere Stufe der Füllfarbe.
- Helle, warme, satte Farben, aber kein Neon. Keine Schrift, kein Rahmen, kein Wasserzeichen.
- **Seltenheit sieht man** (Satz in `SELTENHEIT_DETAILS`): Gewöhnlich schlicht in ein bis zwei Farben → Ungewöhnlich
  mit einem kleinen Schmuck → Selten mit Muster oder Stein → Episch mit Gold und leichtem Leuchten → Legendär mit
  verziertem Gold und Funkeln. Bei Legendär setzt die App zusätzlich das animierte Funkeln darüber (still bei
  „Bewegung reduzieren“).
- Eigener Stil, **keine bekannten Spielfiguren** oder Marken nachmachen (Entscheidung in `docs/lernquest.md`).

## Schablonen

Alle liegen in `docs/design/lernquest/bilder/schablonen/` und sind 1024 × 1024 groß (die App-Fläche 240 × 240 mal 4,27).

| Datei | Wofür |
| - | - |
| `grundfigur-vorlage.png` | Die heutige Vektorfigur auf grauem Grund. Startbild für die Grundfigur (Bild zu Bild). |
| `kleidung-maske.png` | Weiß = Rumpf. Maske zum Übermalen auf der Grundfigur. Das Skript schneidet die Kleidung genau so aus. |
| `augen-maske.png` | Weiß = Augenbereich. Damit übermalst du Augen, falls Krea der Grundfigur welche malt. |
| `plaetze.png` | Übersicht: Kasten je Platz, Punkt = Ankerpunkt. So setzt das Skript einzeln gemalte Teile ein. |

Die Prompts für alle 40 Teile und die Grundfigur stehen fertig in [`bilder/prompts.md`](bilder/prompts.md).

## Einstellungen in ComfyUI

- Modell: **Krea 2 Turbo** (`krea2_turbo_fp8_scaled.safetensors`), 8 Schritte, Bildgröße **1024 × 1024**
  (quadratisch, auch für Hintergründe).
- In der Vorlage „Text to Image (Krea-2 Turbo)“ die **Prompt-Erweiterung (`prompt_enhance`) ausschalten**. Sonst
  schreibt das Sprachmodell den Stil-Satz jedes Mal anders, und die Teile passen nicht mehr zueinander.
- Keine Stil-LoRA nötig. Wer eine ausprobiert, nimmt sie dann für **alle** Teile.
- Das sind Startwerte, noch nicht mit Krea 2 erprobt. Was gut klappt, hier nachtragen.

## Ablauf

### 1. Grundfigur (`koerper.png`), das wichtigste Bild

1. Vorlage „Text to Image (Krea-2 Turbo)“ öffnen und den Subgraph entpacken (Rechtsklick → *Unpack Subgraph*).
2. `Empty Latent Image` ersetzen durch `Load Image` (`grundfigur-vorlage.png`) → `VAE Encode` → in den Sampler.
3. Prompt: Abschnitt „Grundfigur“ aus `prompts.md`. Stärke (`denoise`) etwa **0,55–0,7**. Weniger hält die Form
   genauer, mehr malt schöner. Wichtig ist, dass Kopf, Rumpf, Hände und Füße ungefähr an derselben Stelle bleiben.
4. Malt Krea Augen dazu: dasselbe Bild noch einmal mit `augen-maske.png` übermalen (wie in Schritt 3 unten), Prompt
   „smooth skin, no eyes, no eyebrows“. Die Augen kommen später als eigenes Teil.
5. Das beste Bild als `koerper.png` speichern. Seed (Startzahl) und Einstellungen notieren.

### 2. Stil festhalten

Für alle weiteren Teile die Vorlage **„Image Style Reference (Krea-2 Turbo)“** mit `koerper.png` als Referenzbild
nehmen. Dann sehen Farben und Pinselstrich gleich aus. Pro Platz einen festen Seed verwenden. Ein Bild, das sehr gut
gelungen ist, kann später als zweite Referenz dienen.

### 3. Kleidung (8 Teile): auf der Grundfigur übermalen

1. `Load Image` mit `koerper.png` → `VAE Encode`.
2. `Load Image` mit `kleidung-maske.png` → `Convert Image to Mask` (Kanal *red*).
3. `Set Latent Noise Mask` (Latent aus 1., Maske aus 2.) → Sampler mit `denoise` **0,9–1,0**.
4. Prompt aus `prompts.md` (Abschnitt Kleidung). Speichern als `tshirt.png`, `ruestung.png` …

Das Skript nimmt von diesem Bild nur den Rumpf (Maske). Darum muss es genau so groß sein wie `koerper.png` und darf
nicht verschoben sein.

### 4. Kopf, Augen, Werkzeug, Begleiter (26 Teile): einzeln

Text zu Bild, Prompt aus `prompts.md`. Das Teil steht allein und mittig auf hellgrauem Grund.

- Am saubersten ist ein Freistell-Knoten (z. B. *ComfyUI-RMBG* mit BiRefNet) vor dem Speichern. Dann ist der Grund
  schon durchsichtig.
- Ohne Freistell-Knoten schneidet das Skript den grauen Grund selbst weg (alles Graue, das mit dem Rand verbunden ist).
- Das Skript schneidet das Teil zu, skaliert es auf die Breite seines Platzes und setzt es an den Ankerpunkt
  (`plaetze.png`): Hüte mit der Unterkante auf die Stirn, Werkzeug mit dem unteren Ende an die rechte Hand,
  Begleiter unten links auf den Boden, Augen mittig ins Gesicht.

### 5. Hintergründe (7 Teile)

Text zu Bild, 1024 × 1024, Prompt aus `prompts.md`. Das ganze Bild wird übernommen.

## Ins Projekt bringen

1. Bilder in den Ordner `lernquest-roh/` im Projekt legen. Er wird nicht ins Git übernommen. Ein anderer Ordner geht
   mit `npm run lq:bilder -- --ordner <pfad>`.
   Erlaubte Namen: `krone.png` oder so, wie ComfyUI speichert (`krone_00003_.png`). Gehen auch: `.webp`, `.jpg`.
   Liegen zwei Bilder für dasselbe Teil im Ordner, bricht das Skript für dieses Teil ab. Lass nur das beste liegen.
   Tipp: In ComfyUI beim `Save Image` als `filename_prefix` gleich die Teil-ID eintragen.
2. `npm run lq:bilder`. Das Skript meldet, was fertig ist, was noch Vektor ist und welche Namen es nicht kennt.
3. `lernquest-roh/_uebersicht.png` ansehen: jedes Teil auf der Grundfigur.
4. Sitzt etwas schief, in `src/lernquest/bilder/anpassen.json` nachjustieren und das Skript noch einmal laufen lassen:

   ```json
   {
     "koerper": { "loecher": true },
     "krone": { "s": 0.85, "dy": -6 },
     "zauberstab": { "dx": 4 },
     "sonnenbrille": { "toleranz": 20 }
   }
   ```

   `s` = Größe (1 = wie der Platz vorgibt), `dx`/`dy` = verschieben in App-Punkten (240 = ganze Breite, minus = nach
   links bzw. oben), `toleranz` = wie grau noch als Hintergrund gilt (Standard 36, kleiner bei hellgrauen Teilen),
   `loecher` = auch eingeschlossenen grauen Grund entfernen (zwischen den Beinen, in einem Henkel).
5. `npm test` prüft Namen, Größe (480 × 480, unter 150 KB) und dass die Grundfigur in allen sechs Hauttönen da ist.

Ohne eigenen Rechner mit dem Projekt: Lade die Rohbilder in eine Claude-Sitzung hoch. Claude führt das Skript aus,
schickt dir die Übersicht und legt die fertigen Bilder auf einen Branch.

## Neue Teile

Ein neues Teil braucht mehr als ein Bild: einen Eintrag in `TEILE` (`src/lernquest/teile.ts`), denselben Eintrag im
Server-Katalog `lq_teil` (Migration in `supabase/`, ein Test vergleicht beide), eine Beschreibung in `BESCHREIBUNG`
(`vorlagen.ts`, sonst schlägt ein Test fehl) und eine Vektorzeichnung als Ersatz in `avatar.tsx`. Danach
`npm run lq:bilder -- --prompts`. Weil der Server dabei geändert wird, vorher absprechen.

## Technik kurz

- `src/lernquest/bilder/vorlagen.ts`: Stil, Prompt-Bausteine, Beschreibungen, Plätze, Masken.
- `src/lernquest/bilder/pixel.ts`: Freistellen, Einpassen, Haut messen und umfärben (getestet in `bilder.test.ts`).
- `scripts/lq-bilder.ts`: das Skript (Node ab 22.18, nutzt `sharp`). `--prompts` schreibt `prompts.md`,
  `--schablonen` schreibt die Masken und `plaetze.png` neu (aus `schablonen/figur.svg`, der Vektor-Grundfigur).
- `src/lernquest/app/teilBilder.ts` + `avatar.tsx`: Bild, wenn vorhanden, sonst Vektor. Größe: etwa 3–40 KB je
  Ebene, zusammen grob 1 MB. Geladen wird nur, was gerade zu sehen ist.
