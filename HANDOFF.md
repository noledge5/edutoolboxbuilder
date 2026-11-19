# Handoff – 19.11.2026 (Figuren ohne Umriss, wenige Formen; nächster Schritt: Durchsicht der Lehrkraft, dann Merge)

## Ziel
Alle Lernquest-Grafiken nach `docs/design/prinzipien.md` (kein Umriss, wenige große Formen wie Duolingo, keine Verläufe,
Umgebung isometrisch), danach jede Frage ohne Arbeitsblatt lösbar machen (Plan: `docs/plan-lernquest-fragen.md`).

## Stand
- Branch `claude/admiring-fermi-fcitkp` (**nicht gemergt**, kein PR; enthält auch `claude/sweet-hypatia-axj6ax`):
  Fuchs, Held (Kleidung, Frisuren, Gesicht), Hüte, Werkzeuge, Begleiter, Bosse, Truhe, Hintergründe ohne Umriss und
  auf wenige Formen reduziert. Nur die Landkarte (`gelaende.tsx`, `welten.tsx`) hat noch Umriss.
- Neu: `figuren/flaeche.tsx` (`<Flaeche>` = helle Kante oben links für dunkle Farben über `istDunkel`,
  `<Schlagschatten>` = Kinnschatten, `ovalPfad`); in `stil.ts` `flaeche()`, `STRICH`, Töne `wolke*` (weiße Dinge)
  und `holzHell`; Test `OHNE_UMRISS` in `figuren.test.tsx`.
- Werkstatt aktualisiert (Version 15): https://claude.ai/artifact/WmzYWa5W6igWNwv2iUZdnG – die Lehrkraft sieht durch.
- Tests grün (620), Typecheck grün, CI grün bis `26aceb3`.

## Nächste Schritte (je einer pro Session)
1. Rückmeldung aus der Werkstatt einarbeiten (ArtifactData `list`, Sammlung `pruefung`, Status `aendern`). Offene
   Prüfpunkte: Samurai-Schultern rosa, Zöpfe glatt statt geflochten, Hase blass, Golem ohne Leuchtaugen, Hintergrund
   Nacht/Wald schwach, Bibliothek klobig, Kompass Metall statt Gold, Mondsichelstab Gold statt Silber. Danach auf Wunsch
   PR anlegen; die Lehrkraft merged.
2. Dorf ohne Verläufe (`iso.tsx`, `IsoVerlaeufe`), dann Landkarte isometrisch ohne Umriss (`gelaende.tsx`,
   `welten.tsx`); dabei Bäume/Palme/Kaktus mit `hintergruende.tsx` wieder auf gemeinsame Teile bringen. Danach
   `UMRISS`/`UMRISS_FEIN` aus `stil.ts` und die `umriss`-Option von `Glied` (`fuchs.tsx`, keiner nutzt sie mehr) löschen.
3. Fragen-Schritte: Claude schreibt lösbare Fragen aus dem Blatt (`fragenpool.ts`, `poolPrompt`; Testfall Englisch
   Präpositionen), dann `UMBAU = false`; Vokabeln getrennt; Wiederholung mit Maß; Fuchs in den Aufgaben; Lehrerseite neu.

## Wichtig zu wissen
- Formen-Richtwerte (Begleiter 11–15, Hut/Werkzeug 3–7, Kleid Rumpf + 1–5, Frisur 1–3) in prinzipien.md und Skill `figur`.
- Worker-Agenten mit `isolation: worktree` starten auf altem Stand (`main`): im Auftrag zuerst
  `git reset --hard <arbeits-branch>` und `ln -s <repo>/node_modules node_modules`. Vorlage:
  Auftragsdateien hatten Regeln + Prüfschritte (Vorschau `VORSCHAU_TEIL=…`) – hat gut funktioniert.
- `stilprobe.test.tsx` wendet die Probe auf schon umgestellte Figuren an; nur noch als Archiv nützlich.
- 3D-Skripte (`.claude/skills/grafik/skripte/`) und `haus-3d-probe.png` ungenutzt; löschen nur nach Rückfrage.
- Lernquest ist live im Umbau (`UMBAU = true`). Mergen = live.
- Server-Regeln doppelt (SQL und `rules.ts`/`dorf.ts`); Supabase-Migrationen braucht die Bestätigung der Lehrkraft.
- Lokale DB: Postgres 16 (`/usr/lib/postgresql/16/bin`, Nutzer `postgres`) mit Ersatz für `auth`, `extensions`, `cron`
  und Rollen `anon`, `authenticated`, `service_role`; Windows: PGlite. `poolTipps` wirkungslos (in Schritt 3 aufräumen).
- Kein Figma (18.11.). App prüfen: `npm run spieltest`. Windows: keine Dateinamen, die sich nur in Groß-/Kleinschreibung unterscheiden.
