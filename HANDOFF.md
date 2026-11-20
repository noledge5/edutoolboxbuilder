# Handoff – 20.11.2026 (PR #84 gemergt: lösbare Fragen; Kinder-App bleibt im Umbau)

## Ziel
Jede Lernquest-Frage ohne Arbeitsblatt lösbar (Plan: `docs/plan-lernquest-fragen.md`), dann Kinder-App wieder an.

## Stand
- Erledigt und **gemergt (PR #84, live)**: Fragenpool-Auftrag schickt die Schülerseiten als JSON (Bausteine mit Lösungen,
  Bildbeschreibung, Suchwörter, Bilder `img:<id>`), Kompetenzraster und Bilder der Stunde (`seitenJson`,
  `bilderFuerClaude`, `kompetenzText` in `src/lernquest/fragenpool.ts`). Regel „ohne das Blatt lösbar“; Format `bild`
  für Claude (Emoji oder Bilder der Stunde, sonst verworfen), Prüfansicht zeigt die Bilder. `poolTipps` entfernt.
  Branch `claude/dreamy-bardeen-2fmcg4`.
- Tests grün (626, davon 4 neue mit Testfall Präpositionen Ball/Box), Typecheck, Build, CI grün.
- Nicht geprüft: echte Fragen von Claude (braucht den Schlüssel der Lehrkraft in der App).

## Nächste Schritte (je einer pro Session, neuer Branch von `main`)
1. Wartet auf die Lehrkraft: Fragen der laufenden Stationen neu erzeugen (alte Pool-Fragen löschen, sonst füllt nichts
   automatisch), prüfen, Stationen neu veröffentlichen. Erst danach `UMBAU = false` (`app/LernquestApp.tsx`) als
   eigene Ein-Zeilen-Änderung (entschieden 20.11.). Vorher fragen, ob sie fertig ist und wie die Fragen waren.
2. Plan Schritt 2: Vokabeln getrennt von anderen Inhalten; Geografie u. a. nach Kompetenzen statt nach Blatt.
3. Danach Plan Schritte 3–5 (Wiederholung mit Maß, Fuchs, Lehrerseite neu).
4. Offen bei der Lehrkraft: Werkstatt mit den neuen Kartenteilen veröffentlichen? (Version 17 zeigt noch die alte Karte:
   https://claude.ai/artifact/WmzYWa5W6igWNwv2iUZdnG). Feinschliff Karte (Raumstation-Kuppel, Fenster Zauberturm) erst
   nach Rückmeldung.

## Wichtig zu wissen
- Lernquest ist live im Umbau (`UMBAU = true`). Mergen = live. Lehrerseite ist live, Kinder sehen die Umbau-Seite.
- `seitenJson` lässt `source` und `mat` weg (keine Verweise wie „M1“), kürzt je Feld auf 4.000 Zeichen und ganze
  Bausteine bis 16.000 Zeichen. Frühere Stunden gehen weiter als Text (`stundenText`, ohne Lösungen).
- Entscheidung Lehrkraft 19.11.: Kompass Metall, Mondsichelstab Gold, Golem dunkle Augen, Zöpfe glatt bleiben so.
- Vorschau ohne Werkstatt: `VORSCHAU=<ordner> VORSCHAU_TEIL=dorf|karte|hintergrund|held|… VORSCHAU_NUR=<id>,<id> npx vitest run src/lernquest/figuren/vorschau`.
- Werkstatt veröffentlichen braucht die Zustimmung der Lehrkraft; die Live-Fassung vorher lesen (Artifact `read`).
- Gemergte Branches `claude/admiring-fermi-fcitkp`, `claude/eloquent-davinci-xlogq4`, `claude/jolly-planck-0jqcot`,
  `claude/dreamy-bardeen-2fmcg4`; löschen nur nach Rückfrage. Ebenso 3D-Skripte (`.claude/skills/grafik/skripte/`).
- Worker-Agenten mit `isolation: worktree` starten auf `main`: `git reset --hard <arbeits-branch>`, `ln -s <repo>/node_modules node_modules`.
- Server-Regeln doppelt (SQL und `rules.ts`/`dorf.ts`); Supabase-Migrationen braucht die Bestätigung der Lehrkraft.
- Lokale DB: Postgres 16 (`/usr/lib/postgresql/16/bin`, Nutzer `postgres`) mit Ersatz für `auth`, `extensions`, `cron`
  und Rollen `anon`, `authenticated`, `service_role`; Windows: PGlite.
- Kein Figma (18.11.). App prüfen: `npm run spieltest`. Windows: keine Dateinamen, die sich nur in Groß-/Kleinschreibung unterscheiden.
