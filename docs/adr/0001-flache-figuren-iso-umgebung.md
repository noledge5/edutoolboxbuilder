# ADR 0001: Figuren flach, Umgebung isometrisch, gleiche Regeln

*ADR = Architecture Decision Record: eine kurze Notiz, die eine Entscheidung und ihren Grund festhält.*

- **Datum:** 19.11.2026
- **Status:** angenommen (Lehrkraft), Umriss entschieden am selben Tag
- **Regeln im Detail:** [docs/design/prinzipien.md](../design/prinzipien.md)

## Ausgangslage

Lernquest hatte drei Wege für Grafik (Skill `grafik`): flache 2D-Vektoren (Figuren), 2.5D-Iso-Vektoren (Dorf) und
gerenderte 3D-Bilder aus freien CC0-Paketen (Häuser). Die Wege folgten verschiedenen Regeln: Figuren mit Umriss und
hartem Schatten, Dorf ohne Umriss mit Farbverläufen, 3D als Pixelbild mit eigenem Licht und eigenen Farben. Die
Lehrkraft hatte am 18.11. bemängelt, dass Teile nicht zusammenpassen. Vorbild für den Stil ist Duolingo
(Shape-Language-Beitrag und weitere Beiträge, ausgewertet am 19.11.2026).

## Entscheidung

1. **Figuren flach, von vorn** (Fuchs, Held, Teile, Bosse, Symbole, Bilder in Fragen), als Vektor-Code im Gerüst
   `src/lernquest/figuren/`.
2. **Umgebung isometrisch 2:1** (Dorf, Häuser, Anbauten, später auch Landkarte und Landschaften), als Vektor-Code aus
   dem Bausatz `figuren/iso.tsx`.
3. **Gleiche Regeln für beide:** eine Palette (`stil.ts`), Licht von oben links, je Fläche höchstens Grundton + hell +
   tief, harte Kanten, **keine Farbverläufe**, keine Unschärfe, wenige Formen, Silhouette bei 48 px erkennbar.
4. **Kein 3D-Rendering mehr.** Der 3D-Weg mit Blender und CC0-Paketen entfällt.
5. **Kein Umriss**, weder an Figuren noch in der Umgebung; Trennung durch Ton und harte Schatten. Umstellung der
   Figuren erst nach einer Stilprobe (`docs/design/lernquest/stilprobe/umriss-v1.png`).
6. **Gegen Verträge bauen:** Jede Teilart (Farbe, Figur, Gegenstand, Gebäude, Bewegung, Oberfläche) hat eine
   schriftliche, getestete Abmachung; Änderungen gehen durch Doku, Test und Bestand zugleich.

## Gründe

- **Zusammenpassen:** Eine Welt aus einer Palette und einem Licht sieht wie eins aus; zwei Ansichten (flach und
  iso) sind klar getrennt und dürfen nebeneinander stehen, so wie Spielfiguren auf einem Spielbrett.
- **Iso für die Umgebung** war der Wunsch der Lehrkraft (18.11.: „schräg von oben“) und zeigt Häuser und Anbauten
  mit Tiefe, was zum Bauen und Ausbauen passt.
- **Flach für Figuren** hält sie schnell zu zeichnen, gut zu bewegen (Gerüst mit Drehpunkten) und bei 48 px lesbar.
- **Kein 3D:** Pixelbilder folgen nicht der Palette, lassen sich nicht im Code umfärben oder bewegen, brauchen eine
  eigene Pipeline (Blender, ~1 GB) und passten im Licht nicht zu den Vektorfiguren.
- **Keine Verläufe:** Ein Schatten als harte Form ist einfacher zu bauen, bleibt klein scharf und folgt derselben
  Regel wie bei den Figuren. Tiefe entsteht durch drei flache Töne je Fläche und flache Schattenformen.

## Folgen

- Skill `grafik` kennt nur noch zwei Wege; der 3D-Teil ist entfernt (steht in der Git-Geschichte vor diesem Commit).
- Das Dorf (`iso.tsx`, `IsoVerlaeufe`) muss von Verläufen auf flache Töne umgestellt werden.
- Landkarte und Landschaften (`gelaende.tsx`, `welten.tsx`) sind heute flach von vorn und wandern später auf den
  Iso-Bausatz.
- Die 3D-Skripte (`.claude/skills/grafik/skripte/`) und die 3D-Probe werden nicht mehr genutzt; Löschen nach Rückfrage.
- Reihenfolge der Umstellung: [prinzipien.md, Abschnitt Umstellung](../design/prinzipien.md#umstellung-des-bestands).

## Umriss (entschieden 19.11.2026)

Figuren und Karte hatten einen Umriss (aus dem Mockup der Lehrkraft), das Dorf nicht. Gewählt: **überall ohne**, wie
Duolingo, weil so Figuren und Dorf eins werden und kleine Formen weniger schwer wirken. Preis: großer Umbau, der
Umriss steckt in fast allen Figuren-Dateien; deshalb erst die Stilprobe, dann Satz für Satz. Befunde der Probe:
[prinzipien.md, Stilprobe ohne Umriss](../design/prinzipien.md#stilprobe-ohne-umriss).
