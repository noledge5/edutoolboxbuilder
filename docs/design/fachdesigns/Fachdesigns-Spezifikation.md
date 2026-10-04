# Fachdesigns für Arbeitsblatt und Folien

*Stand 03.10.2026. Ergänzt `docs/design/README.md` (Design „Organisch“). Umsetzbare Quelle: `fachdesigns/fachdesigns.css`, liegt auf `sheet.css` und `slides.css`.*

## Überblick
Sechs Designs, je Fach zwei Altersstufen. Ein Fachdesign ändert nur Farbe, Radien, Hintergründe und ein bis zwei Motive. Figtree, Zeilenabstände, Innenabstände, Raster und Höhen bleiben wie in „Organisch“, damit vorhandene Blätter nicht neu umbrechen.

| Fach | Klasse 5–6 (`is-age-1`) | Klasse 7–10 (`is-age-2`) |
|---|---|---|
| Geographie `is-f-geo` | **Entdecker**: Kompassrose, Gradnetz | **Atlas**: Kartenrahmen mit Gradleiste, Höhenlinien |
| Englisch `is-f-eng` | drei Varianten zur Wahl: **Sprechblase** · **Sticker** · **Comic** | **Notizbuch**: Klebeband, Punktraster, Etiketten |
| Informatik `is-f-inf` | **Bausteine**: Programmblock mit Kerbe und Nase | **Terminal**: Leiterbahnen, Flussdiagramm-Formen |

## Aktivierung
```html
<div class="ws-page is-fd is-f-geo is-age-2 is-t-uebung" lang="de">…</div>
<div class="sl-slide is-task is-fd is-f-geo is-age-2 is-t-uebung" lang="de">…</div>
```
- `is-fd` schaltet die Abbildung auf die vorhandenen Variablen ein, `is-f-*` und `is-age-*` wählen die Palette, `is-t-<blatt-typ>` setzt die `--t-*`-Farben.
- **Wichtig:** Mit Fachdesign setzt der Baukasten die Blatt-Typ-Farben nicht mehr inline auf die Seite, sondern nur die Klasse `is-t-*`. Inline-Werte würden die Palette überschreiben.
- Hinweis und Merksatz bekommen statt der Inline-Variante die Klasse `is-v-p` (Fachfarbe, früher Terrakotta), `is-v-s` (Partnerfarbe, früher Salbei), `is-v-n` (neutral) oder neu `is-v-t` (Drittfarbe).
- Fließschema-Schritte bekommen `is-c1` bis `is-c4` statt der festen Farben.
- Die Altersstufe ergibt sich aus der Klasse: 5–6 → `is-age-1`, 7–10 → `is-age-2`. „Organisch“ ist die Seite ohne `is-fd`.

## Was gleich bleibt (±0 px)
- Figtree mit allen Größen; Überschriften siehe „Überschriften-Schrift“; A4 794 × 1123, Innenabstand 30/36/24, 12er-Raster, Abstände, Höhe von Kopfband, Namenszeile und Fußband.
- Linien und Rahmen sind **inset-Schatten** (`box-shadow: inset 0 0 0 2px …`), nie `border`. Das gilt auch für die S/W-Fassung: Dort setzt `sheet.css` heute `border` auf Kopfband, Pillen, Hinweis und Merksatz, was das Kopfband um 6 px erhöht. `fachdesigns.css` ersetzt diese Rahmen innerhalb von `.is-fd` durch inset-Schatten. Geprüft: Kopfband 92 px in Farbe und S/W, Inhaltsfläche 868 px in allen sechs Designs.
- Motive sind `::before`/`::after` mit `position:absolute` und brauchen keinen Platz. Kinder des Kopfbands bekommen `position:relative`, damit sie über dem Motiv liegen.
- Drehungen (`transform`) an Stickern und Etiketten ändern den Fluss nicht.

## Farben
Jede Palette hat vier Rampen auf der Helligkeitsskala von „Organisch“ (OKLCH-L 0,969 · 0,930 · 0,870 · 0,780 · 0,680 · 0,580 · 0,479 · 0,381 · 0,290), sodass dieselbe Stufe in allen Fächern gleich hell ist. Die Neutralrampe ist zur Fachfarbe hin getönt. Textfarbe bleibt #201e1d, Papier #ffffff.

**geo-1 · Entdecker**

| Rampe | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|
| `--fd-p` Meer | #eaf7fe | #ceedff | #a0deff | #65c4f2 | #24a5da | #0185b4 | #00668a | #014964 | #003044 |
| `--fd-s` Wiese | #e8fbe9 | #cef3d2 | #abe6b2 | #7fcd8b | #53af65 | #319047 | #15702f | #02511d | #003610 |
| `--fd-t` Sonne | #fff3e0 | #fce5bc | #f3cf8d | #deaf55 | #c38e01 | #9d7206 | #795700 | #573d00 | #3a2800 |
| `--fd-n` Nebel | #edf7fb | #e0eaee | #cdd6db | #b0b9be | #919a9e | #737c80 | #575f63 | #3c4448 | #252d30 |

**geo-2 · Atlas**

| Rampe | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|
| `--fd-p` Atlasblau | #eef6ff | #d8eafe | #b9d8f8 | #94bce5 | #6f9dcb | #527eab | #396088 | #254565 | #162d44 |
| `--fd-s` Tiefland | #f1f7ec | #e0edd7 | #c8dcba | #a8c196 | #87a272 | #6a8455 | #4f663c | #374928 | #233018 |
| `--fd-t` Höhenstufe | #fff2e8 | #fae3d0 | #f0cdaf | #daad87 | #be8d61 | #9e6e43 | #7d532b | #5c3a1a | #3d250e |
| `--fd-n` Kartenpapier | #f8f4ee | #ebe8e1 | #d7d4ce | #bab7b1 | #9b9892 | #7d7a74 | #605d58 | #45423d | #2d2b26 |

*Englisch 5–6: siehe Abschnitt „Englisch 5–6: drei Varianten“.*

**eng-2 · Notizbuch**

| Rampe | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|
| `--fd-p` Ink | #f0f5ff | #dee8fe | #c1d4ff | #9bb6f5 | #7896dd | #5b78bb | #425a96 | #2d4070 | #1c2a4c |
| `--fd-s` Tomato | #fff1ef | #ffe0da | #fec4b8 | #ff9782 | #e6715b | #c3513d | #9c3726 | #742315 | #4f140a |
| `--fd-t` Mint | #e8f9f3 | #d0f1e5 | #ade2d0 | #82c8b2 | #57ab92 | #368b74 | #1b6c58 | #094e3e | #033428 |
| `--fd-n` Concrete | #f2f5fb | #e5e8ee | #d1d4da | #b4b7bd | #96989e | #787a80 | #5b5d62 | #404348 | #292b30 |

**inf-1 · Bausteine**

| Rampe | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|
| `--fd-p` Block | #f6f2ff | #ece3ff | #dbcaff | #c4a4fd | #a780e6 | #8962c5 | #6a479e | #4d3076 | #331e51 |
| `--fd-s` Start | #eafbe4 | #d3f3c8 | #b2e5a1 | #8acc73 | #62af45 | #448f22 | #2b6f01 | #1c5000 | #0f3500 |
| `--fd-t` Schleife | #fff2eb | #fee1d1 | #fec7a6 | #fc9c5f | #e37726 | #bc5b03 | #914500 | #6a3000 | #481e00 |
| `--fd-n` Grau | #f6f3fc | #e9e6ef | #d5d3db | #b8b6be | #99979f | #7b7980 | #5e5c63 | #434148 | #2c2a31 |

**inf-2 · Terminal**

| Rampe | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|
| `--fd-p` Petrol | #e6f9fc | #ccf0f5 | #a7e0e9 | #79c6d1 | #4aa8b5 | #248996 | #066a75 | #034c54 | #003238 |
| `--fd-s` Signal | #fff3e5 | #ffe3c2 | #f8cc95 | #e4ab63 | #c9892b | #a76c01 | #805202 | #5d3a00 | #3e2500 |
| `--fd-t` Syntax | #f4f4fe | #e6e5fe | #d1cefe | #b4afec | #958ed3 | #7770b2 | #5b548e | #413b6a | #2a2647 |
| `--fd-n` Platine | #eef7f9 | #e1eaec | #cdd6d8 | #b1b9bb | #929a9c | #747c7e | #575f61 | #3d4446 | #262d2e |

### Wofür welche Farbe
| Variable | Organisch | Fachdesign |
|---|---|---|
| `--color-neutral-100…900` | warm | `--fd-n-*` |
| `--color-accent`, `-100…900` (Lösungsfarbe, Markierung) | Terrakotta | `--fd-p-*`, Lösungen in `--fd-p-700` |
| `--color-accent-2-*` (Antwortpillen der Folien, Exit, Lösungsfeld) | Salbei | `--fd-s-*` |
| `--color-surface` (Ankreuz- und Zuordnen-Pillen, Bildfeld) | #ebddc5 | `--fd-surface` (Unterstufe: p-100 bzw. t-100; Mittelstufe: n-200) |
| Tabellenkopf | surface | `--fd-head` (p-100, Englisch 5–6: s-100) |
| Wortspeicher-Pille | surface | `--fd-word` |
| Fußband | neutral-200 | `--fd-foot` (Unterstufe p-100, Mittelstufe n-200) |
| Folienhintergrund | Papier | `--fd-slide` = n-200 55 % in n-100 |

### Blatt-Typen
Vier Farbfamilien × drei Stärken: **voll** (Band 200), **flach** (Band 100), **Rahmen** (weißes Band mit 2 px Linie). Zusammen mit dem Text der Pille bleiben alle neun Typen unterscheidbar.

| Typ | Band | Linie | Symbolkreis | Pille | Kicker | Nummer |
|---|---|---|---|---|---|---|
| Übung | p-200 | – | p-700 | p-800 | p-800 | p-700 |
| Versuch | p-100 | – | p-600 | p-700 | p-700 | p-700 |
| Test | Papier | p-800 | p-900 | p-900 | p-800 | p-800 |
| Sicherung | s-200 | – | s-700 | s-800 | s-800 | s-700 |
| Hören | s-100 | – | s-600 | s-700 | s-700 | s-700 |
| Wortschatz | t-100 | – | t-600 | t-700 | t-700 | t-700 |
| Grammatik | t-200 | – | t-800 | t-800 | t-800 | t-800 |
| Sprechen | Papier | t-600 | t-700 | t-700 | t-700 | t-700 |
| Für die Lehrkraft | n-200 | – | n-800 | n-800 | n-700 | n-800 |

Heller Text auf Kreis, Pille und Nummer ist immer Stufe 100 derselben Rampe.

**Kontrast (WCAG 2.1), jeweils der schwächste Wert über alle neun Typen:**

| Design | Kicker auf Band | Pillentext | Nummer | Titel auf Band | Text auf n-200 |
|---|---|---|---|---|---|
| geo-1 | 5.3 | 5.7 | 5.7 | 13.5 | 13.6 |
| geo-2 | 5.4 | 5.8 | 5.8 | 13.4 | 13.6 |
| eng-1 | 5.4 | 6.0 | 6.0 | 13.4 | 13.5 |
| eng-2 | 5.4 | 5.8 | 5.8 | 13.4 | 13.5 |
| inf-1 | 5.3 | 5.8 | 5.8 | 13.4 | 13.5 |
| inf-2 | 5.3 | 5.8 | 5.8 | 13.4 | 13.6 |

Alles erfüllt AA (4,5 : 1) für kleinen Text.

## Formen je Design
| Variable | Organisch | Entdecker | Atlas | Sprechblase | Sticker | Comic | Notizbuch | Bausteine | Terminal |
|---|---|---|---|---|---|---|---|---|---|
| `--fd-r-band` Kopfband | 28 | 999 | 10 | 26 | 20 | 12 | 14 | 16 | 6 |
| `--fd-r-box` Hinweis | 22 | 26 | 10 | 22 | 20 | 12 | 14 | 18 | 6 |
| `--fd-r-solid` Merksatz | 28 | 32 | 10 | 26 | 22 | 14 | 14 | 18 | 999 |
| `--fd-r-chip` Pillen | 999 | 999 | 4 | 999 | 999 | 8 | 6 | 10 | 4 |
| `--fd-r-num` Nummer | 50 % | 50 % | 5 | 50 % 50 % 50 % 4 px | 50 % | 50 % | 8 | 9 | 3 |
| `--fd-r-table` Tabelle, Bild | 18 | 20 | 8 | 18 | 16 | 12 | 12 | 14 | 6 |
| `--fd-r-foot` Fußband | 999 | 999 | 6 | 999 | 999 | 10 | 10 | 12 | 4 |
| `--fd-r-pill` Typ-/Sozialform-Pille | 999 | 999 | 4 | 999 | 999 | 8 | 4 | 10 | 3 |

Alle Werte in px. Unterstufe: weicher und farbiger (Flächen in 100/200). Mittelstufe: kleinere Radien, Flächen meist neutral.

## Motive
Alle Motive sind einfache Vektorformen. Flächenmotive liegen als SVG-Maske (`mask: var(--fd-m-…)`) auf einem Pseudo-Element und übernehmen so die Farbe des Blatt-Typs (`--t-circle`). Die SVGs stehen als `--fd-m-compass`, `--fd-m-contour`, `--fd-m-circuit`, `--fd-m-blocks` in `:root`.

| Design | Motiv | Ort, Maß | Farbe, Deckkraft |
|---|---|---|---|
| Entdecker | Kompassrose (Vier- und Diagonalstern, viewBox 80) | hinter dem Symbolkreis, 100 × 100 px, Mitte des Kreises; Folie 132 px | `--t-circle`, 28 % (Folie 30 %) |
| Entdecker | Ring um Symbolkreis und Nummer („Kartenpunkt“) | Schatten 3 px Papier + 2 px Farbe (Nummer 2 + 1,5 px) | `--t-circle` / `--t-num` |
| Entdecker | Gradnetz | ganze Seite, 40 px Raster, 1 px Linien; Folie 80 px, 2 px | p-200 bei 55 % (Folie n-200) |
| Atlas | Kartenrahmen mit Gradleiste | 17 px vom Seitenrand: 1 px Linie n-500, innen 3 px Balken n-700 im Wechsel 40/40 px; Folie 22 px, 2 px/6 px, 96/96 px | voll |
| Atlas | Höhenlinien (6 konzentrische Ellipsen, −10°, Strich 1,5) | rechte 62 % des Kopfbands, Höhe 180 % (angeschnitten) | `--t-circle`, 22 % |
| Notizbuch | Klebeband | 78 × 20 px, bei 40 % der Bandbreite, 9 px über dem Band, −3°, gerissene Enden (clip-path); Folie 180 × 44 | s-300 bei 80 % |
| Notizbuch | Punktraster | ganze Seite, 5 mm Raster, Punkt 1,8 px; Folie 40 px, Punkt 4 px | n-300 |
| Notizbuch | Etikett | Typ-Pille Radius 4 px, −2° gedreht | `--t-pill` |
| Bausteine | Kerbe und Nase | Kopfband: Kerbe oben x 28–70 px, 7 px tief (clip-path), Nase unten gleiches Maß (`::after` in `--t-band`) ragt 7 px in den Abstand zur Namenszeile; Folie 52–124 px, 12 px | `--t-band` |
| Bausteine | bunte Bausteine | Wortspeicher-Pillen im Wechsel p-100, s-100, t-100 | – |
| Terminal | Leiterbahnen (5 Bahnen, Strich 2, Lötpunkte r 4,5, viewBox 240 × 100) | rechte 58 % des Kopfbands, volle Höhe | `--t-circle`, 20 % |
| Terminal | Flussdiagramm-Formen | Nummer als Prozesskästchen (Radius 3), Hinweis-Symbol als Raute (45°), Merksatz als Terminator (Radius 999) | – |

Titelfolien nutzen die freien Flächen `.sl-deco.is-one/.is-two` für eine große Fassung des Motivs (Kompassrose 900 px p-200, Höhenlinien 1200 px p-300 75 %, Sprechblase + Klebeband, drei Programmblöcke p-300, Leiterbahnen p-300).

## S/W-Kopiervorlage (`.is-bw`)
- Alle Flächen weiß, Kopfband, Hinweis und Merksatz mit 2 px Linie `--color-text`, Pillen und Fußband mit 1,5 px Linie n-600. Alles als inset-Schatten, daher kein Umbruch.
- Flächenmotive (Kompassrose, Höhenlinien, Leiterbahnen) werden n-500 bei 35 %, also feine graue Linien. Papiermuster (Gradnetz, Punktraster) entfallen.
- Atlas: der Kartenrahmen bleibt, aber als 1,5-px-Balken n-600.
- Notizbuch: Klebeband als weißer Streifen mit grauer Linie.
- Bausteine: Kerbe und Nase entfallen, damit die Rahmenlinie geschlossen bleibt.

## Folien
Gleiche Klassen auf `.sl-slide`. Zusätzlich je Design `--fd-r-bar`, `--fd-r-sl-pill`, `--fd-r-sl-chip` (Antwortpillen, Karten, Ich–Du–Wir-Schritte), `--fd-r-sl-box`, `--fd-r-clock` (großer Minutenkreis), `--fd-r-num`.
- **Hintergrund** ist leicht getönt (`--fd-slide`, L ≈ 0,95), nie weiß und nie dunkel: hell genug für den Beamer im hellen Raum, dunkel genug, dass der weiße und der gelbe Stift auf dem iPad noch sichtbar sind. Schwarz, Rot, Blau, Grün und Orange liegen weit über 3 : 1.
- **Karten** haben die Phasenfarbe `--t-pill` mit Nummer; Form je Design (Pille, Etikett −1,5°, Kästchen).
- **Arbeitsauftrag**: Minutenkreis `--t-num`; Entdecker mit Kartenpunkt-Ring, Atlas/Terminal/Bausteine als abgerundetes Quadrat.
- Für den PowerPoint-Export sind alle Motive Vektorformen. Masken und `clip-path` sollte der Export als Bild übernehmen (`data-om-raster` auf `.sl-deco` und `.sl-bar`), falls er sie nicht als Form nachbauen kann.
- Die Foliendesigns Klar, Heft, Tafel und Kontrast bleiben unverändert und schließen sich mit `is-fd` aus.

## Englisch 5–6: drei Varianten
Die Postkarte ist ersetzt. Zur Wahl stehen drei Varianten, jede mit eigener Palette, eigenem Motiv und zwei Überschriften-Schriften. Aktiviert wird eine mit `.is-x-bubble`, `.is-x-sticker` oder `.is-x-comic` zusätzlich zu `.is-f-eng.is-age-1`. Alle drei verzichten auf Muster am Rand.

**Sprechblase** (`.is-x-bubble`)

| Rampe | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|
| `--fd-p` Lagoon | #e3fafb | #c5f2f4 | #9ae3e7 | #65cacf | #20acb3 | #048b91 | #016b6f | #034d50 | #003335 |
| `--fd-s` Berry | #fff0f6 | #ffddeb | #ffbfda | #f296bf | #d871a1 | #b65283 | #913965 | #6c2449 | #491630 |
| `--fd-t` Sunshine | #fdf5dc | #f7e7b8 | #ebd387 | #d5b44a | #b79406 | #937702 | #715b00 | #514102 | #362a00 |
| `--fd-n` Paper | #eef7f7 | #e1eaea | #cdd6d7 | #b0b9ba | #929a9b | #747c7d | #575f5f | #3d4445 | #262d2d |

**Sticker** (`.is-x-sticker`)

| Rampe | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|
| `--fd-p` Tomato | #fff1ef | #ffe0da | #ffc4b9 | #fe9786 | #ea6c5a | #c74c3d | #a03225 | #771e14 | #51110a |
| `--fd-s` Cobalt | #eff5ff | #dbe9fe | #bbd6fe | #8ab9ff | #5f99ed | #417acc | #2a5ca4 | #18417b | #0d2a54 |
| `--fd-t` Lime | #eefae2 | #dcf1c4 | #c1e19b | #9fc76a | #7da937 | #608a05 | #486a00 | #334c01 | #203200 |
| `--fd-n` Paper | #fbf3f0 | #eee6e3 | #dad2cf | #bdb5b3 | #9e9694 | #807876 | #635c59 | #48413f | #302a28 |

**Comic** (`.is-x-comic`)

| Rampe | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|
| `--fd-p` Sky | #ebf7ff | #d2ecfe | #a8dcff | #65c2fb | #26a3e4 | #0383bd | #046491 | #00486a | #002f47 |
| `--fd-s` Pow | #fef1f0 | #fee0dd | #ffc3be | #fe968e | #f3625d | #cf4040 | #a72528 | #7d1217 | #55080c |
| `--fd-t` Yellow | #fcf5d9 | #f7e8b2 | #ebd47b | #d5b531 | #b39609 | #907904 | #6f5c00 | #504200 | #352b00 |
| `--fd-n` Newsprint | #f8f4f1 | #ebe7e4 | #d7d3d0 | #bab6b4 | #9b9795 | #7d7977 | #605d5a | #45423f | #2e2b28 |

| Variante | Motiv | Maße | S/W |
|---|---|---|---|
| Sprechblase | Zipfel unten am Kopfband (`::after`, clip-path-Dreieck) | 24 × 12 px, 46 px vom linken Rand, ragt 11 px in den Abstand zur Namenszeile; bei Rahmen-Typen in `--t-line`; Folie 46 × 24 px bei 84 px | Zipfel entfällt |
| Sprechblase | Nummern, Hinweis- und Merksatz-Symbol als Sprechblase | Radius 50 % 50 % 50 % 4 px (Folie 10 px) | bleibt |
| Sticker | weißer Rand + Schatten | Kopfband 4 px Papier + 3 px Schatten n-900 16 %; Symbol und Nummer 3/2,5 px; Folie 8 px + 6 px | nur inset-Linie, kein Schatten |
| Sticker | Typ-Pille aufgeklebt | −3°, 2,5 px Papierrand | Linie, Drehung bleibt |
| Comic | Konturen | 2,5 px inset #201e1d an Kopfband, Hinweis, Merksatz; 2 px an Pillen, Wortspeicher, Fußband; Tabellenrand in Tinte; harter Versatzschatten 4 px (Kopfband), 3 px (Kästen), 2 px (Nummern); Folie 5/8 px | bleibt (ist schon Linie) |
| Comic | Halbton-Punkte | rechte 52 % des Kopfbands, Punkt r 1,4 px im 7-px-Raster, `--t-circle` 50 %, nach links ausgeblendet; Folie r 3 px / 16 px | Punkte n-500 60 % |

Geprüft: alle 9 Kombinationen (3 Varianten × Schrift A, B, Caprasimo) mit Kopfband 92 px und Inhaltsfläche 868/868 px in Farbe und S/W.

**Begründung**
- **Sprechblase:** Englisch in Klasse 5 ist vor allem Sprechen. Eine einzige Form trägt das: Das Kopfband ist eine Sprechblase, Nummern und Symbole sind kleine Sprechblasen. Kein Rand, kein Muster.
- **Sticker:** wie ein Namensschild-Aufkleber zum Kennenlernen. Das Motiv steckt nur in weißem Rand, kleinem Schatten und der schräg aufgeklebten Typ-Pille; die Flächen bleiben ruhig.
- **Comic:** Comics sind für viele Kinder die erste englische Lektüre. Dunkle Konturen und harter Schatten machen das Blatt kräftig; das Halbton-Raster läuft nur im Kopfband aus. In S/W bleibt fast alles erhalten.

## Überschriften-Schrift (zwei Vorschläge je Design)
Nur Überschriften ändern die Schrift: Kopfband-Titel (`.ws-title`), Zwischenüberschrift (`.ws-h3`), Rückseiten-Titel, Aufgabennummern, Titel von Grammatik-, Formen- und Redemittel-Kästen und alle Folienüberschriften. Fließtext, Kicker, Pillen und Fußband bleiben Figtree.

Aktiviert wird ein Vorschlag mit `.is-fh-a` oder `.is-fh-b` an der Seite, der Folie oder einem Vorfahren; ohne Klasse bleibt Caprasimo.

| Design | Vorschlag A | Vorschlag B |
|---|---|---|
| Entdecker | Baloo 2 Bold, × 1,07 | Nunito ExtraBold, × 1,00 |
| Atlas | Archivo Bold, × 1,085 | IBM Plex Sans Condensed SemiBold, × 1,20 |
| Englisch 5–6 Sprechblase | Sniglet ExtraBold, × 0,875 | Patrick Hand, × 1,20 |
| Englisch 5–6 Sticker | Rubik ExtraBold, × 1,005 | Lilita One, × 1,20 |
| Englisch 5–6 Comic | Bangers, × 1,20 | Luckiest Guy, × 1,019 |
| Notizbuch | DM Serif Display, × 1,158 | Bricolage Grotesque Bold, × 1,174 |
| Bausteine | Fredoka SemiBold, × 1,14 | Lilita One, × 1,20 |
| Terminal | JetBrains Mono Bold, × 0,876 | Space Grotesk Bold, × 1,061 |

**Kein Umbruch durch die Schrift:**
- Der Faktor (`--fd-hs`) multipliziert die Schriftgröße so, dass Beispieltitel gleich breit laufen wie in Caprasimo 400. Er ist höchstens 1,2; schmalere Schriften werden also nie breiter als Caprasimo.
- Die Zeilenhöhe ist in px festgeschrieben (`.ws-title` 31,36 px, `.ws-h3` 23,52 px, Folientitel 150 px usw.). Dadurch bleiben Kopfband und Bausteine gleich hoch, auch wenn die Schrift größer gesetzt wird.
- Geprüft in allen 18 Kombinationen (6 Designs × A, B, Caprasimo): Kopfband 92 px, Inhaltsfläche 868/868 px, Folientitel mit gleicher Zeilenzahl.
- Bei sehr langen Titeln kann eine Zeile früher oder später brechen, weil die Laufweite nur im Mittel gleich ist. Darum gilt: einmal je Blatt prüfen (Ihre Vorgabe „klein, je Blatt geprüft“). Die Warnung „Seite ist voll“ des Baukastens greift wie bisher.

Alle Schriften kommen von Google Fonts. Ein Design lädt nur seine eine Überschriften-Schrift (ein Schnitt).

## Neuer Baustein: Code (nur Informatik)
`<pre class="ws-code"><span>…</span>…</pre>`, eine Zeile je `span`, Zeilennummern per CSS-Zähler. JetBrains Mono 13 px / 22 px (Google Fonts), Hintergrund p-100, Radius `--fd-r-table`, Schlüsselwörter `<b>` in p-800, Werte `<i>` in s-700. S/W: weiß mit Linie, alles schwarz. Ist eine Ergänzung, keine Änderung an bestehenden Blättern.

## Was sich gegenüber „Organisch“ ändert
- Überschriften-Schrift je Design (zwei Vorschläge), breitengleich zu Caprasimo und mit fester Zeilenhöhe.
- Paletten je Fach statt Terrakotta/Salbei/Creme; Neutrale zur Fachfarbe getönt.
- Blatt-Typen per Klasse statt Inline-Farben, neun Typen nach festem Schema.
- Radien je Design über Variablen; Motive als Pseudo-Elemente.
- S/W-Fassung mit inset-Linien (behebt zugleich die 6 px Höhenänderung des Kopfbands in der heutigen S/W-Fassung).
- Folien mit getöntem Hintergrund und Motiven statt der zwei Kreise.

## Begründung je Design
- **Entdecker (Geographie 5–6):** Meerblau, Wiesengrün und Sonnengelb sind die Farben einer physischen Karte für Einsteiger. Die Kompassrose sitzt nur hinter dem Symbol, das Gradnetz liegt so hell auf dem Papier, dass es unter Text verschwindet. Weiche Pillenformen und Ringe um die Nummern wirken freundlich, ohne Bildchen oder Figuren.
- **Atlas (Geographie 7–10):** Gedämpfte Atlasfarben, gerade Kanten und eine Gradleiste am Seitenrand: Das Blatt sieht aus wie eine gute Kartenseite. Die Höhenlinien sind dünne Linien bei 22 % nur im Kopfband; Legendenkästchen ersetzen die runden Nummern.
- **Notizbuch (Englisch 7–10):** Tintenblau mit Tomatenrot wie ein gutes Notizbuch. Das Punktraster ist das Papier, das Jugendliche selbst kaufen, und heller als jede Schreiblinie. Ein Streifen Klebeband und leicht schräge Etiketten geben Lässigkeit ohne Sticker.
- **Bausteine (Informatik 5–6):** Ein Block mit Kerbe oben und Nase unten heißt in der Blockprogrammierung „hier steckt etwas an“. Diese Form bekommt nur das Kopfband. Violett, Grün und Orange sind Blockfarben, aber in hellen Stufen; kräftig sind nur Symbol und Nummern.
- **Terminal (Informatik 7–10):** Petrol und Signal-Bernstein von Terminal und Platine, kleine Radien wie in technischen Zeichnungen. Leiterbahnen als dünne Linien im Kopfband; Prozesskästchen, Entscheidungsraute und Terminator nutzen die Flussdiagramm-Formen, die die Klasse lernt.

## Offene Punkte
- Farbdruck auf dem Schulfarbdrucker testen, vor allem p-100/p-200-Flächen (Laser druckt helle Töne oft blasser).
- Kopierer-Test der S/W-Fassung (feine Linien bei 35 % können verschwinden; dann auf 50 % erhöhen).
- PowerPoint-Export der Masken prüfen.
