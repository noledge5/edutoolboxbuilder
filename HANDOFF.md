# Handoff – 19.11.2026 (Gestaltungsprinzipien festgelegt; nächster Schritt: Stilprobe 2 ohne Umriss)

## Ziel
Lernquest nach festen Gestaltungsregeln (Vorbild Duolingo, eigener Look) umbauen und danach jede Frage ohne das
Arbeitsblatt lösbar machen (Plan: `docs/plan-lernquest-fragen.md`).

## Stand
- Neu, Branch `claude/sweet-hypatia-axj6ax` (**nicht gemergt**, kein PR): `docs/design/prinzipien.md` (Regeln für
  Grafik, Bewegung, Oberfläche, Verträge, Prüfliste, Umstellung), `docs/adr/0001-flache-figuren-iso-umgebung.md`,
  Skills `grafik` (ohne 3D) und `figur` angepasst, Roadmap-Eintrag, Stilprobe 1 `docs/design/lernquest/stilprobe/umriss-v1.png`
  mit Generator `src/lernquest/figuren/stilprobe.test.tsx` (nur mit `STILPROBE=<ordner>`).
- Entschieden (Lehrkraft, 19.11.): Figuren flach, Umgebung isometrisch, gleiche Regeln; kein 3D; **kein Umriss**,
  auch nicht an Figuren; Arme vor dem Körper **einen Ton dunkler** (`tief`) als der Rumpf.
- PR #81 (Lernquest im Umbau, `UMBAU = true`) ist gemergt und live.
- Tests: grün (619), Typecheck grün. CI Commit 1 grün, spätere Commits beim Schreiben noch offen.

## Nächste Schritte (je einer pro Session, Skill `aufgabe` bzw. `figur`)
1. **Stilprobe 2** (`umriss-v2.png`): wie Probe 1, aber Arme/Ärmel einen Ton dunkler, `hell`-Kante an dunklen Haaren,
   Zacken an der Schwanzspitze des Fuchses neu. Befunde aus Probe 1: `prinzipien.md`, Abschnitt „Stilprobe ohne
   Umriss“. Lehrkraft zeigen (Reifegrad nennen), dann Umstellung Satz für Satz (`prinzipien.md`, „Umstellung“).
2. **Claude schreibt die Fragen aus dem Blatt:** `fragenpool.ts` (`poolPrompt`, bisher nur `blockText`) bekommt die
   JSON-Struktur der Schülerseiten samt Bildhinweisen; ohne Blatt lösbar, curriculumsnah, verschiedene Formate.
   Testfall: Englisch Präpositionen (Ball/Box). Danach `UMBAU = false`, Stationen neu veröffentlichen (Lehrkraft).
3. Vokabeln getrennt von anderen Inhalten; Geografie u. a. nach Kompetenzen.
4. Wiederholung mit Maß (fällige deckeln, Vorschlag ≤ ⅓ der Lernzeit).
5. Fuchs während der Aufgaben + Fuchs-Challenges je Landkarte; flüssigere Animationen.
6. Lehrerseite neu gestalten, übersichtlicher.

## Wichtig zu wissen
- Probe 1 entfernt den Umriss nur im Browser-Bild; im Code für die Umstellung Formen 1,5 Einheiten größer zeichnen.
- Dorf nutzt noch Verläufe (`IsoVerlaeufe`), Landkarte ist noch flach mit Umriss: beides steht in der Umstellungsliste.
- 3D-Skripte (`.claude/skills/grafik/skripte/`) und `haus-3d-probe.png` ungenutzt; löschen nur nach Rückfrage.
- Pool-Tipps für Blatt-Aufgaben (`poolTipps`) sind wirkungslos; in Schritt 2 aufräumen.
- Server-Regeln stehen doppelt (SQL und `rules.ts`/`dorf.ts`), Tests vergleichen sie: beide zusammen ändern.
- Supabase-Migrationen brauchen eine Bestätigung der Lehrkraft in ihrer App. Lokale DB: Postgres 16 (siehe Git-Verlauf).
- Kein Figma (18.11.). Werkstatt: https://claude.ai/artifact/WmzYWa5W6igWNwv2iUZdnG
- Windows: keine zwei Dateien, die sich nur in Groß-/Kleinschreibung unterscheiden.
- App prüfen: `npm run spieltest`, Daten `scripts/spieltest-daten.js`, Helfer `scripts/spieltest-helfer.js`.
