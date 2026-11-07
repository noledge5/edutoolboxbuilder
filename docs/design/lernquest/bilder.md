# Lernquest: gemalte Bilder für Held und Teile

Anleitung, um die drei Grundfiguren und die 56 Teile mit **Krea 2** in **ComfyUI** (lokal) zu malen und in die App zu bringen.
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
- **Hautton und Frisur bleiben frei wählbar.** Du malst jede Grundfigur einmal: `koerper.png` (kurze Haare),
  `koerper2.png` (Zopf), `koerper3.png` (Locken). Das Skript misst die Haut und färbt sie in die sechs Hauttöne um,
  die Schattierung bleibt dabei erhalten. Körper und Haltung sind bei allen drei gleich, darum passt jedes Teil.
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
| `grundfigur-vorlage.png`, `…2.png`, `…3.png` | Die Vektorfiguren (kurze Haare, Zopf, Locken) auf grauem Grund. Startbilder für die Grundfiguren (Bild zu Bild). |
| `haar-maske.png` | Weiß = Haare und der Platz für den Zopf. Damit machst du aus `koerper.png` die anderen Frisuren. |
| `kleidung-maske.png` | Weiß = Rumpf. Maske zum Übermalen auf der Grundfigur. Das Skript schneidet die Kleidung genau so aus. |
| `augen-maske.png` | Weiß = Augenbereich. Damit übermalst du Augen, falls Krea der Grundfigur welche malt. |
| `plaetze.png` | Übersicht: Kasten je Platz, Punkt = Ankerpunkt. So setzt das Skript einzeln gemalte Teile ein. |

Die Prompts für alle 56 Teile und die drei Grundfiguren stehen fertig in [`bilder/prompts.md`](bilder/prompts.md).

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
6. **Zopf und Locken:** Am besten `koerper.png` mit `haar-maske.png` übermalen (wie bei der Kleidung in Schritt 3),
   Prompt „Oder besser …“ aus `prompts.md`. Dann bleiben Gesicht und Körper genau gleich. Speichern als
   `koerper2.png` (Zopf) und `koerper3.png` (Locken). Notfalls geht auch Bild zu Bild aus `grundfigur-vorlage2.png`
   bzw. `…3.png`.

### 2. Stil festhalten

Für alle weiteren Teile die Vorlage **„Image Style Reference (Krea-2 Turbo)“** mit `koerper.png` als Referenzbild
nehmen. Dann sehen Farben und Pinselstrich gleich aus. Pro Platz einen festen Seed verwenden. Ein Bild, das sehr gut
gelungen ist, kann später als zweite Referenz dienen.

### 3. Kleidung (11 Teile): auf der Grundfigur übermalen

1. `Load Image` mit `koerper.png` → `VAE Encode`.
2. `Load Image` mit `kleidung-maske.png` → `Convert Image to Mask` (Kanal *red*).
3. `Set Latent Noise Mask` (Latent aus 1., Maske aus 2.) → Sampler mit `denoise` **0,9–1,0**.
4. Prompt aus `prompts.md` (Abschnitt Kleidung). Speichern als `tshirt.png`, `ruestung.png` …

Das Skript nimmt von diesem Bild nur den Rumpf (Maske). Darum muss es genau so groß sein wie `koerper.png` und darf
nicht verschoben sein.

### 4. Kopf, Augen, Werkzeug, Begleiter (36 Teile): einzeln

Text zu Bild, Prompt aus `prompts.md`. Das Teil steht allein und mittig auf hellgrauem Grund.

- Am saubersten ist ein Freistell-Knoten (z. B. *ComfyUI-RMBG* mit BiRefNet) vor dem Speichern. Dann ist der Grund
  schon durchsichtig.
- Ohne Freistell-Knoten schneidet das Skript den grauen Grund selbst weg (alles Graue, das mit dem Rand verbunden ist).
- Das Skript schneidet das Teil zu, skaliert es auf die Breite seines Platzes und setzt es an den Ankerpunkt
  (`plaetze.png`): Hüte mit der Unterkante auf die Stirn, Werkzeug mit dem unteren Ende an die rechte Hand,
  Begleiter unten links auf den Boden, Augen mittig ins Gesicht.

### 5. Hintergründe (9 Teile)

Text zu Bild, 1024 × 1024, Prompt aus `prompts.md`. Das ganze Bild wird übernommen.

## Mit einem Edit-Modell (empfohlen, z. B. FLUX.2 Klein Image Edit)

Das Edit-Modell malt jedes Teil direkt auf die Grundfigur. Das Skript vergleicht das Ergebnis mit der Grundfigur und
behält **nur, was sich geändert hat**. So liegt das Teil genau dort, wo das Modell es gemalt hat, ganz ohne Figur,
Haut oder Hintergrund in der Ebene. Einpassen, Masken oder Freistellen sind nicht nötig. Den Stil übernimmt das Modell
aus der Grundfigur, darum passen die Teile zueinander.

Prompts: [`bilder/edit-prompts.md`](bilder/edit-prompts.md) (jedes Teil, Grundfigur, Zopf, Locken).

**So müssen die Ergebnisse sein:**

1. **Eingabe ist immer dieselbe `koerper.png`** (kurze Haare, 1024 × 1024, grauer Hintergrund, nicht freigestellt).
   Genau diese Datei liegt auch in `lernquest-roh/`, denn mit ihr vergleicht das Skript. Ändert sich die
   Grundfigur, müssen die Edits neu gemacht werden.
2. **Ausgabe genauso groß wie die Eingabe** (1024 × 1024), nicht zuschneiden, nicht ranzoomen. Die Vorlage von
   ComfyUI macht das so, solange die Eingabe 1024 × 1024 ist. Ein anderes Format lehnt das Skript ab.
3. **Eine Änderung je Bild.** Nur das eine Teil kommt dazu, sonst bleibt alles gleich. Was das Modell zusätzlich
   ändert (Gesicht, Haare, Hintergrund), kommt im Teil-Bereich mit in die Ebene. Also lieber neu würfeln.
4. **Figur bleibt an ihrem Platz.** Kleine Verschiebungen bis etwa 25 px (im 1024er-Bild) gleicht das Skript aus.
   Es meldet, um wie viel es zurückgeschoben hat.
5. **Dateiname = Teil-ID**, Ablage in **`lernquest-roh/edit/`** (`edit/krone.png` oder `edit/krone_00001_.png`).
   Nur ein Bild je Teil, und dasselbe Teil nicht zusätzlich in `lernquest-roh/`.
6. **Wo gesucht wird:** Kopf oben über dem Gesicht, Augen im Gesicht, Werkzeug rechts (Hand auf der rechten
   Bildseite), Begleiter unten links, Kleidung am Rumpf. Was außerhalb gemalt wird, fällt weg (`EDIT_BEREICH` in
   `vorlagen.ts`).
7. **Hintergründe nicht als Edit**, sondern als ganzes Bild mit Text zu Bild (`prompts.md`) nach `lernquest-roh/`.
8. **Teile auf Figur 1 machen**, auch für Zopf und Locken: Die Ebene enthält nur das Teil und passt auf alle drei.
   Ein Hut verdeckt bei Locken dann einfach die Locken darunter.
9. **Grundfiguren** kommen ebenfalls aus dem Edit-Modell: `koerper.png` aus `schablonen/grundfigur-vorlage.png`,
   `koerper2.png` und `koerper3.png` aus `koerper.png` (Prompts oben in `edit-prompts.md`). Sie liegen in
   `lernquest-roh/`, nicht in `edit/`.

Bleiben an einem Teil Reste stehen (z. B. Schatten am Boden) oder fehlen blasse Stellen, hilft `schwelle` in
`anpassen.json`: größer = nur deutliche Änderungen (Standard 30), kleiner = auch zarte.

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
5. `npm test` prüft Namen, Größe (480 × 480, unter 150 KB) und dass jede Grundfigur in allen sechs Hauttönen da ist.
   Fehlt eine Frisur als Bild, zeichnet die App sie weiter als Vektor.

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
