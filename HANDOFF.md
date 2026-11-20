# Handoff – 20.11.2026 (PR #84 lösbare Fragen, PR #85 Umbau-Schalter; Klassen noch im Umbau)

## Ziel
Jede Lernquest-Frage ohne Arbeitsblatt lösbar (Plan: `docs/plan-lernquest-fragen.md`), dann Kinder-App wieder an.

## Stand
- Erledigt und **gemergt (PR #84, live)**: Fragenpool-Auftrag schickt die Schülerseiten als JSON (Bausteine mit Lösungen,
  Bildbeschreibung, Suchwörter, Bilder `img:<id>`), Kompetenzraster und Bilder der Stunde (`seitenJson`,
  `bilderFuerClaude`, `kompetenzText` in `src/lernquest/fragenpool.ts`). Regel „ohne das Blatt lösbar“; Format `bild`
  für Claude (Emoji oder Bilder der Stunde, sonst verworfen), Prüfansicht zeigt die Bilder. `poolTipps` entfernt.
  Branch `claude/dreamy-bardeen-2fmcg4`.
- Erledigt und **gemergt (PR #85, live)**: Umbau-Schalter je Klasse auf der Lehrerseite („Kinder-App: im Umbau / live“,
  `teacher/UmbauSchalter.tsx`); Konstante `UMBAU` ist weg. Server `lq_klasse.umbau`, `lq_umbau_setzen`
  (`20261202_lernquest_umbau.sql`, live eingespielt als `lernquest_umbau`); die eine bestehende Klasse steht im Umbau.
  Branch `claude/umbau-schalter`.
- Tests grün (627), Typecheck, Build, CI grün.
- Nicht geprüft: echte Fragen von Claude (braucht den Schlüssel der Lehrkraft in der App).

## Nächste Schritte (je einer pro Session, neuer Branch von `main`)
1. Lehrkraft pflegt gerade neue Aufgaben ein (alte Pool-Fragen löschen, neu erzeugen, prüfen, Stationen neu
   veröffentlichen) und schaltet die Klasse dann selbst live. Nächste Session: fragen, wie die Fragen von Claude waren,
   und Rückmeldungen zum Auftrag (`poolSystem` in `fragenpool.ts`) einarbeiten.
2. Plan Schritt 2: Vokabeln getrennt von anderen Inhalten; Geografie u. a. nach Kompetenzen statt nach Blatt.
3. Danach Plan Schritte 3–5 (Wiederholung mit Maß, Fuchs, Lehrerseite neu).
4. Offen bei der Lehrkraft: Werkstatt mit den neuen Kartenteilen veröffentlichen? (Version 17 zeigt noch die alte Karte:
   https://claude.ai/artifact/WmzYWa5W6igWNwv2iUZdnG). Feinschliff Karte (Raumstation-Kuppel, Fenster Zauberturm) erst
   nach Rückmeldung.

## Wichtig zu wissen
- Mergen = live. Kinder-App: Umbau-Seite nach der Anmeldung, solange die Klasse nicht live ist (`imUmbau` in
  `rules.ts`: nur ausdrückliches `umbau: false` öffnet). Neue Klassen sind gleich live.
- `seitenJson` lässt `source` und `mat` weg (keine Verweise wie „M1“), kürzt je Feld auf 4.000 Zeichen und ganze
  Bausteine bis 16.000 Zeichen. Frühere Stunden gehen weiter als Text (`stundenText`, ohne Lösungen).
- Entscheidung Lehrkraft 19.11.: Kompass Metall, Mondsichelstab Gold, Golem dunkle Augen, Zöpfe glatt bleiben so.
- Vorschau ohne Werkstatt: `VORSCHAU=<ordner> VORSCHAU_TEIL=dorf|karte|hintergrund|held|… VORSCHAU_NUR=<id>,<id> npx vitest run src/lernquest/figuren/vorschau`.
- Werkstatt veröffentlichen braucht die Zustimmung der Lehrkraft; die Live-Fassung vorher lesen (Artifact `read`).
- Gemergte Branches `claude/admiring-fermi-fcitkp`, `claude/eloquent-davinci-xlogq4`, `claude/jolly-planck-0jqcot`,
  `claude/dreamy-bardeen-2fmcg4`, `claude/umbau-schalter`; löschen nur nach Rückfrage. Ebenso 3D-Skripte (`.claude/skills/grafik/skripte/`).
- Worker-Agenten mit `isolation: worktree` starten auf `main`: `git reset --hard <arbeits-branch>`, `ln -s <repo>/node_modules node_modules`.
- Server-Regeln doppelt (SQL und `rules.ts`/`dorf.ts`); Supabase-Migrationen braucht die Bestätigung der Lehrkraft.
- Lokale DB: Postgres 16 (`/usr/lib/postgresql/16/bin`, als Nutzer `postgres`: initdb, pg_ctl -o '-p 5499'); vorher
  Rollen `anon`, `authenticated`, `service_role`, Schema `extensions` mit pgcrypto, `cron.schedule` als Attrappe; dann alle
  Migrationen der Reihe nach. Lehrer-Schlüssel sind 64 Hex-Zeichen. Windows: PGlite.
- Kein Figma (18.11.). App prüfen: `npm run spieltest`. Windows: keine Dateinamen, die sich nur in Groß-/Kleinschreibung unterscheiden.
