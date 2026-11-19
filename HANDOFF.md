# Handoff – 19.11.2026 (Stilprobe 2 freigegeben; nächster Schritt: Fuchs im Code ohne Umriss)

## Ziel
Alle Lernquest-Grafiken nach `docs/design/prinzipien.md` umstellen (kein Umriss, keine Verläufe, Umgebung isometrisch),
danach jede Frage ohne das Arbeitsblatt lösbar machen (Plan: `docs/plan-lernquest-fragen.md`).

## Stand
- Branch `claude/sweet-hypatia-axj6ax` (**nicht gemergt**, kein PR): `docs/design/prinzipien.md`, ADR 0001,
  Skills `grafik`/`figur`, Roadmap, Stilproben `docs/design/lernquest/stilprobe/umriss-v1.png` und `umriss-v2.png`,
  Generator `src/lernquest/figuren/stilprobe.test.tsx` (nur mit `STILPROBE=<ordner>`, ändert alles nur im Bild).
- Lehrkraft 19.11.: kein Umriss, Arme vor dem Körper einen Ton dunkler, **Stilprobe 2 freigegeben**.
- Tests grün (619), Typecheck grün, CI grün bis Commit `023c8ae`.

## Nächste Schritte (je einer pro Session, Skill `figur`, Arbeit auf diesem Branch weiter)
1. **Fuchs im Code ohne Umriss** (`figuren/fuchs.tsx`), wie Probe 2: `UMRISS`/`UMRISS_FEIN` an Flächen weg, Formen
   1,5 Einheiten größer; `Glied` ohne dunklen Unterstrich (Breite 19 in der Farbe); Ärmel `olivTief`; Kopf wirft harten
   Schatten nur auf den Körper (als Form zeichnen, nicht als Filter); Zackenlinie am Schwanz weg. Vergleich vorher/
   nachher mit dem Generator, Werkstatt-Fotos, Lehrkraft zeigen (Reifegrad nennen).
2. **Held** (`held.tsx`) samt Kopf-, Werkzeug-Teilen und Begleitern (`items-kopf.tsx`, `items-werkzeug.tsx`,
   `begleiter.tsx`, `items.tsx`): Ärmel `tief`, `hell`-Kante an allen dunklen Teilen (Haare, Hüte, Kleidung).
   Ein Satz erst mergen, wenn er ganz umgestellt ist (sonst gemischt).
3. Bosse und Truhe (`golem`, `tintenkrake`, `raetseldrache`, `truhe`), Hintergründe (`hintergruende.tsx`).
4. Dorf ohne Verläufe (`iso.tsx`, `IsoVerlaeufe`), dann Landkarte isometrisch (`gelaende.tsx`, `welten.tsx`).
5. Danach die Fragen-Schritte: Claude schreibt lösbare Fragen aus dem Blatt (`fragenpool.ts`, `poolPrompt`;
   Testfall Englisch Präpositionen), dann `UMBAU = false`; Vokabeln getrennt; Wiederholung mit Maß; Fuchs in den
   Aufgaben; Lehrerseite neu.

## Wichtig zu wissen
- Umriss-Vorkommen je Datei (`grep -c UMRISS`): begleiter 137, hintergruende 90, held 58, welten 46, items-werkzeug 70,
  items-kopf 61, items 33, fuchs 22, raetseldrache 19, golem 16, gelaende 13, tintenkrake 8, truhe 8. `Glied` nutzen
  fuchs und held. Dunkle Detail-Linien (Mund, Brauen, Schnur) bleiben erlaubt.
- Idee für einen Vertrag: Test, dass umgestellte Dateien `UMRISS` nicht mehr importieren; am Ende `UMRISS` aus `stil.ts` löschen.
- 3D-Skripte (`.claude/skills/grafik/skripte/`) und `haus-3d-probe.png` ungenutzt; löschen nur nach Rückfrage.
- Lernquest ist live im Umbau (`UMBAU = true`, PR #81 gemergt). Mergen = live.
- Server-Regeln doppelt (SQL und `rules.ts`/`dorf.ts`); Supabase-Migrationen braucht die Bestätigung der Lehrkraft.
- Lokale DB: Postgres 16 (`/usr/lib/postgresql/16/bin`, Nutzer `postgres`) mit Ersatz für `auth`, `extensions`, `cron`
  und Rollen `anon`, `authenticated`, `service_role`; Windows: PGlite. `poolTipps` sind wirkungslos (in Schritt 5 aufräumen).
- Kein Figma (18.11.). Werkstatt: https://claude.ai/artifact/WmzYWa5W6igWNwv2iUZdnG · App prüfen: `npm run spieltest`.
- Windows: keine zwei Dateien, die sich nur in Groß-/Kleinschreibung unterscheiden.
