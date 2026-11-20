# Handoff – 20.11.2026 (PR #83 gemergt: Landkarte isometrisch, UMRISS gelöscht; nächster Schritt lösbare Fragen)

## Ziel
Alle Lernquest-Grafiken nach `docs/design/prinzipien.md` (erledigt), jetzt jede Frage ohne Arbeitsblatt lösbar machen
(Plan: `docs/plan-lernquest-fragen.md`).

## Stand
- Erledigt und **gemergt (PR #83, live)**: Wahrzeichen der Karte isometrisch aus `iso.tsx` (neue runde Teile `walze`,
  `ring`, `kegel`, `kuppel`, `rundSchlag`, `bogenTor`), kleine Teile flach ohne Umriss, Bäume/Palme/Kaktus gemeinsam
  in `figuren/pflanzen.tsx`, Weg mit hartem Schatten, Start-Landschaft mit flachen Himmelsbändern; `UMRISS` aus
  `stil.ts` gelöscht. Branch `claude/jolly-planck-0jqcot`. Vergleichsbild: `docs/design/lernquest/stilprobe/karte-v1.png`.
- Tests grün (622), Typecheck, Build, CI und Deploy grün.

## Nächste Schritte (je einer pro Session, neuer Branch von `main`)
1. Fragen-Schritte: Claude schreibt lösbare Fragen aus dem Blatt (`fragenpool.ts`, `poolPrompt`; Testfall Englisch
   Präpositionen), dann `UMBAU = false`; Vokabeln getrennt; Wiederholung mit Maß; Fuchs in den Aufgaben; Lehrerseite neu.
2. Offen bei der Lehrkraft: Werkstatt mit den neuen Kartenteilen veröffentlichen? (Version 17 zeigt noch die alte Karte:
   https://claude.ai/artifact/WmzYWa5W6igWNwv2iUZdnG). Feinschliff Karte (Reifegrad 50 %): Raumstation-Kuppel groß und
   hell, Fenster am Zauberturm wenig Kontrast – erst nach Rückmeldung ändern.

## Wichtig zu wissen
- Entscheidung Lehrkraft 19.11.: Kompass Metall, Mondsichelstab Gold, Golem dunkle Augen, Zöpfe glatt bleiben so.
- Vorschau ohne Werkstatt: `VORSCHAU=<ordner> VORSCHAU_TEIL=dorf|karte|hintergrund|held|… VORSCHAU_NUR=<id>,<id> npx vitest run src/lernquest/figuren/vorschau`.
- Die Karte erscheint in der App nur mit `UMBAU = false` (`app/LernquestApp.tsx`): zum Ansehen lokal umschalten, nie committen.
- Werkstatt veröffentlichen braucht die Zustimmung der Lehrkraft; die Live-Fassung vorher lesen (Artifact `read`).
- Gemergte Branches `claude/admiring-fermi-fcitkp`, `claude/eloquent-davinci-xlogq4`, `claude/jolly-planck-0jqcot`;
  löschen nur nach Rückfrage. Ebenso 3D-Skripte (`.claude/skills/grafik/skripte/`) und `haus-3d-probe.png`.
- Worker-Agenten mit `isolation: worktree` starten auf `main`: `git reset --hard <arbeits-branch>`, `ln -s <repo>/node_modules node_modules`.
- Lernquest ist live im Umbau (`UMBAU = true`). Mergen = live.
- Server-Regeln doppelt (SQL und `rules.ts`/`dorf.ts`); Supabase-Migrationen braucht die Bestätigung der Lehrkraft.
- Lokale DB: Postgres 16 (`/usr/lib/postgresql/16/bin`, Nutzer `postgres`) mit Ersatz für `auth`, `extensions`, `cron`
  und Rollen `anon`, `authenticated`, `service_role`; Windows: PGlite. `poolTipps` wirkungslos (in Schritt 1 aufräumen).
- Kein Figma (18.11.). App prüfen: `npm run spieltest`. Windows: keine Dateinamen, die sich nur in Groß-/Kleinschreibung unterscheiden.
