# Lernquest: gemalte Bilder für Held und Teile

Anleitung, um Grundfigur, Hauttöne, Frisuren und die 56 Teile lokal in ComfyUI zu malen, am besten mit einem
Edit-Modell (FLUX.2 Klein Image Edit), und in die App zu bringen. Was noch kein Bild hat, zeichnet die App weiter als
Vektor. Man kann also Stück für Stück austauschen.

## So hängt alles zusammen

```
ComfyUI (Edit auf koerper.png)      lernquest-roh/              npm run lq:bilder            src/lernquest/app/teile/
Glatzkopf-Figur                ──►  koerper.png            ──►  freistellen             ──►  koerper-0.webp
… in Hautton 2–6               ──►  koerper_h1 … _h5.png   ──►  ausrichten, freistellen ──►  koerper-1 … -5.webp
… mit Zopf                     ──►  edit/haare-zopf.png    ──►  nur die Änderung, 5 Farben ► haare-zopf-0 … -4.webp
… mit Krone                    ──►  edit/krone.png         ──►  nur die Änderung        ──►  krone.webp
Text zu Bild                   ──►  wiese.png              ──►  ganzes Bild             ──►  wiese.webp
```

- **Verknüpfung = Dateiname.** Teile heißen wie in `src/lernquest/teile.ts` (`krone`, `katze` …), Frisuren
  `haare-<id>` (`FRISUREN`: kurz, zopf, locken, lang, zoepfe, dutt, stacheln, bob). `src/lernquest/app/teilBilder.ts`
  findet die Dateien von selbst, eine Liste im Code braucht es nicht.
- **Ebenen.** Jedes fertige Bild ist eine ganze Ebene (480 × 480, durchsichtig, wo nichts ist). Die App legt sie
  übereinander: Hintergrund, Begleiter, Grundfigur, Kleidung, Haare, Augen, Kopf, Werkzeug. Darum passt jede
  Kombination aus Hautton, Frisur, Haarfarbe und Teilen.
- **Hautton, Frisur und Haarfarbe** wählt das Kind frei (Held-Seite). Die Grundfigur ist kahl; jede Frisur ist eine
  eigene Haar-Ebene darüber. Haare werden braun gemalt, das Skript macht daraus die fünf Haarfarben (`HAARFARBEN`).
- **Offline und aktuell.** Beim Bauen bekommen die Bilder einen Namen mit Prüfsumme (`assets/krone-Ab12.webp`). Der
  Offline-Speicher hält sie, und ein neues Bild ersetzt das alte sofort.

## Der Stil: „weich gemalt“

Kindgerechter Spielstil für 10- bis 12-Jährige (`STIL` in `src/lernquest/bilder/vorlagen.ts`). Beim Edit-Weg kommt
der Stil aus der Grundfigur, darum passen alle Teile zueinander.

- Runde, kräftige, freundliche Formen mit klarer Silhouette, die auch auf dem Handy in 64 px lesbar ist.
- Weiche gemalte Schatten, Licht von **links oben**, leichte warme Kante. **Keine schwarzen Umrisse.**
- Helle, warme, satte Farben, kein Neon. Keine Schrift, kein Rahmen, kein Wasserzeichen.
- **Seltenheit sieht man** (`SELTENHEIT_DETAILS`): Gewöhnlich schlicht → Ungewöhnlich ein kleiner Schmuck → Selten
  Muster oder Stein → Episch Gold und Leuchten → Legendär verziertes Gold und Funkeln (die App setzt bei Legendär
  noch ein animiertes Funkeln darüber, still bei „Bewegung reduzieren“).
- Eigener Stil, **keine bekannten Spielfiguren** oder Marken nachmachen.

## Mit einem Edit-Modell (Hauptweg)

Alle Prompts: [`bilder/edit-prompts.md`](bilder/edit-prompts.md). Reihenfolge:

1. **Grundfigur `koerper.png` mit Glatze**: aus einer fertigen Figur mit Haaren („Remove all the hair …“) oder aus
   `schablonen/grundfigur-vorlage.png`. Das wichtigste Bild: Ändert es sich später, müssen alle Edits neu gemacht
   werden. Ohne Augen, grauer Hintergrund, Kopf, Hände und Füße wie in der Vorlage (`schablonen/plaetze.png`).
2. **Hauttöne `koerper_h1.png` … `koerper_h5.png`**: je ein Edit von `koerper.png`, Ablage in `lernquest-roh/`.
   Fehlt einer, färbt das Skript ihn automatisch um (sieht bei dunklen Tönen an den Rändern schlechter aus).
3. **Frisuren `haare-<id>.png`**: je ein Edit von `koerper.png`, immer braun, Ablage in `lernquest-roh/edit/`.
4. **Teile `<id>.png`**: je ein Edit von `koerper.png` (also auf der Glatze), Ablage in `lernquest-roh/edit/`.
   Ein Hut sitzt dann auf dem kahlen Kopf; mit Haaren schauen die Haare darunter hervor.
5. **Hintergründe**: kein Edit, sondern Text zu Bild (Prompts in `bilder/prompts.md`), Ablage in `lernquest-roh/`.

**So müssen die Edit-Ergebnisse sein:**

1. **Eingabe ist immer dieselbe `koerper.png`** (1024 × 1024, grauer Hintergrund, nicht freigestellt). Genau diese
   Datei liegt auch in `lernquest-roh/`, denn mit ihr vergleicht das Skript.
2. **Ausgabe genauso groß** (1024 × 1024), nicht zuschneiden, nicht zoomen. Ein anderes Format lehnt das Skript ab.
3. **Eine Änderung je Bild.** Was das Modell zusätzlich ändert (Gesicht, Hintergrund), kommt im Suchbereich mit in
   die Ebene. Also lieber neu würfeln.
4. **Figur bleibt an ihrem Platz.** Kleine Verschiebungen bis etwa 25 px gleicht das Skript aus und meldet sie.
5. **Dateiname = Kennung**, ComfyUI-Endungen gehen (`edit/krone_00001_.png`, `koerper_h3_00002_.png`). Nur ein Bild
   je Kennung, ein Teil nicht zugleich in `lernquest-roh/` und in `edit/`.
6. **Wo gesucht wird** (`EDIT_BEREICH`, `KLEIDUNG_EDIT_MASKE` in `vorlagen.ts`): Haare rund um den Kopf bis zu den
   Schultern, Kopf-Teile oben, Augen im Gesicht, Werkzeug rechts (Hand auf der rechten Bildseite), Begleiter unten
   links, Kleidung an Rumpf und Schultern (die Hände bleiben frei, sonst trüge jede Figur dieselbe Hautfarbe). Was
   außerhalb gemalt wird, fällt weg.

Bleiben Reste stehen (z. B. Schatten am Boden) oder fehlen zarte Stellen, hilft `schwelle` in `anpassen.json`: größer
= nur deutliche Änderungen (Standard 30), kleiner = auch zarte.

## Ins Projekt bringen

1. Bilder in den Ordner `lernquest-roh/` im Projekt legen (Edits in `lernquest-roh/edit/`). Er wird nicht ins Git
   übernommen. Ein anderer Ordner geht mit `npm run lq:bilder -- --ordner <pfad>`.
2. `npm run lq:bilder`. Das Skript meldet, was fertig ist, wie jeder Hautton entstand, was noch Vektor ist und welche
   Namen es nicht kennt.
3. `lernquest-roh/_uebersicht.png` ansehen: jedes Teil und jede Frisur auf der Grundfigur.
4. Sitzt etwas schief, in `src/lernquest/bilder/anpassen.json` nachjustieren und das Skript noch einmal laufen lassen:

   ```json
   {
     "koerper": { "loecher": true },
     "krone": { "schwelle": 40 },
     "zauberstab": { "dx": 4 },
     "sonnenbrille": { "toleranz": 20 }
   }
   ```

   `schwelle` (Edits) siehe oben; `toleranz` = wie grau noch als Hintergrund gilt (Standard 36); `loecher` = auch
   eingeschlossenen grauen Grund entfernen (zwischen den Beinen); `s`, `dx`, `dy` nur für einzeln erzeugte Teile
   (unten).
5. `npm test` prüft Namen, Größe (480 × 480, unter 150 KB) und dass die Grundfigur in allen Hauttönen und jede
   Frisur in allen Haarfarben da ist.

Ohne eigenen Rechner mit dem Projekt: Rohbilder in eine Claude-Sitzung hochladen; Claude führt das Skript aus,
schickt die Übersicht und legt die fertigen Bilder auf einen Branch.

## Ohne Edit-Modell (Text zu Bild, z. B. Krea 2)

Prompts in [`bilder/prompts.md`](bilder/prompts.md). Krea 2 Turbo: 8 Schritte, 1024 × 1024, `prompt_enhance` aus.

- **Grundfigur**: Bild zu Bild aus `schablonen/grundfigur-vorlage.png`, Stärke etwa 0,55–0,7.
- **Kopf, Augen, Werkzeug, Begleiter**: einzeln auf grauem Grund; das Skript stellt frei, schneidet zu und setzt das
  Teil an seinen Platz (`PLAETZE`, Übersicht `schablonen/plaetze.png`). Feinjustieren mit `s`, `dx`, `dy`.
- **Kleidung**: auf `koerper.png` mit `schablonen/kleidung-maske.png` übermalen (`Set Latent Noise Mask`).
- Frisuren und Hauttöne gehen auf diesem Weg nicht sauber; dafür das Edit-Modell nehmen.

## Neue Teile und Frisuren

- **Neue Frisur**: Eintrag in `FRISUREN` (`teile.ts`), Beschreibung in `FRISUR_BESCHREIBUNG` und Vektorzeichnung in
  `HAAR_ZEICHNUNG` (`avatar.tsx`; Tests prüfen beides), dann `npm run lq:bilder -- --prompts`. Keine
  Server-Änderung: Der Server speichert jede Kennung aus Kleinbuchstaben und Ziffern.
- **Neues Teil**: Eintrag in `TEILE` und im Server-Katalog `lq_teil` (Migration, ein Test vergleicht beide),
  `BESCHREIBUNG` in `vorlagen.ts` und eine Vektorzeichnung in `avatar.tsx`; danach `--prompts`. Weil der Server
  geändert wird, vorher absprechen.

## Technik kurz

- `src/lernquest/bilder/vorlagen.ts`: Stil, Prompt-Bausteine, Beschreibungen, Plätze, Suchbereiche, Masken.
- `src/lernquest/bilder/pixel.ts`: Freistellen, Einpassen, Haut umfärben, Verschiebung finden, Änderung herauslösen,
  Haare umfärben (getestet in `bilder.test.ts`).
- `scripts/lq-bilder.ts`: das Skript (Node ab 22.18, `sharp`). `--prompts` schreibt `prompts.md` und
  `edit-prompts.md`, `--schablonen` die Masken, die Vorlage und `plaetze.png` (aus `schablonen/figur.svg`).
- `src/lernquest/app/teilBilder.ts` + `avatar.tsx`: Bild, wenn vorhanden, sonst Vektor. Gemalte Haare erscheinen nur
  zusammen mit der gemalten Grundfigur, auf der sie entstanden sind.
