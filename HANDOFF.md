# Handoff – 20.11.2026 (Wiederholung mit Maß gemergt, PR #86; als Nächstes Solo-Boss an der Burg)

## Ziel
Lernquest nach `docs/plan-lernquest-fragen.md` überarbeiten; Kinder-App schaltet die Lehrkraft je Klasse selbst live.

## Stand
- Erledigt und **gemergt (PR #86, live)**: Wiederholung mit Maß (Plan Schritt 3). „Wiederholen“ gibt höchstens 16 am Tag
  (`WDH_TAG` in `rules.ts`), danach „Für heute hast du genug wiederholt“; der Rest wartet unsichtbar. Reihenfolge:
  „Wiederholen sofort“ zuerst (auch innerhalb der 16), dann niedrigster Kasten, dann am längsten überfällig. Gezählt
  je Gerät (`lernquest:wiederholt`, `app/speicher.ts`), keine Migration. Entscheidungen der Lehrkraft: 16 am Tag,
  „Wiederholen sofort“ zuerst und mit Limit. Doku: `docs/lernquest.md`, `docs/roadmap.md`, Plan.
  Branch `claude/dreamy-bardeen-2fmcg4`. Mergen = live.
- Tests grün (631), Typecheck, Build, CI grün. Spieltest mit 70 fälligen Aufgaben: Karte/Fuchs/Menü zeigen 16,
  nach einer echten Runde 8, nach 16 „für heute geschafft“.
- Lehrkraft 20.11.: Die neuen Fragen von Claude sind gut (keine Änderung am Auftrag nötig).

## Nächste Schritte (je einer pro Session, neuer Branch von `main`)
1. **Solo-Boss an der Burg** (Plan Schritt 6, Wunsch der Lehrkraft): Am Ende des Lernwegs einer Region besiegt jedes
   Kind allein einen kleinen Boss (Lebensbalken, Schaden je richtiger Antwort). Naheliegend: Meilenstein (`karte.ts`
   `MEILENSTEIN_GROESSE`, `meilensteinStarten` in `app/LernquestApp.tsx`) wird dieser Kampf. Erst mit Skill `aufgabe`
   planen und klären: ersetzt er den Meilenstein, Belohnung, Niederlage, Boss-Figuren je Region (Skill `figur`).
2. Plan Schritt 2: Vokabeln getrennt von anderen Inhalten; Geografie u. a. nach Kompetenzen statt nach Blatt.
3. Plan Schritte 4–5 (Fuchs und Animationen, Lehrerseite neu).
4. Offen bei der Lehrkraft: Werkstatt mit den neuen Kartenteilen veröffentlichen? (Version 17 zeigt noch die alte
   Karte: https://claude.ai/artifact/WmzYWa5W6igWNwv2iUZdnG). Feinschliff Karte erst nach Rückmeldung.

## Wichtig zu wissen
- Kinder-App: Umbau-Seite, solange die Klasse nicht live ist (`imUmbau` in `rules.ts`); Schalter je Klasse auf der Lehrerseite.
- Force-Push auf Branches wird von der Rechteprüfung blockiert; gemergte Branch-Namen neu aufsetzen per Merge, nicht per Force.
- Gemergte Branches `claude/admiring-fermi-fcitkp`, `claude/eloquent-davinci-xlogq4`, `claude/jolly-planck-0jqcot`,
  `claude/umbau-schalter`, `claude/dreamy-bardeen-2fmcg4`; löschen nur nach Rückfrage. Ebenso 3D-Skripte (`.claude/skills/grafik/skripte/`).
- Spieltest: `npm run spieltest`, Daten `scripts/spieltest-daten.js`, Spielen `scripts/spieltest-helfer.js` (per Playwright `evaluate`).
- Vorschau ohne Werkstatt: `VORSCHAU=<ordner> VORSCHAU_TEIL=dorf|karte|… npx vitest run src/lernquest/figuren/vorschau`.
- Werkstatt veröffentlichen braucht die Zustimmung der Lehrkraft; die Live-Fassung vorher lesen (Artifact `read`).
- Worker-Agenten mit `isolation: worktree` starten auf `main`: `git reset --hard <arbeits-branch>`, `ln -s <repo>/node_modules node_modules`.
- Server-Regeln doppelt (SQL und `rules.ts`/`dorf.ts`); Supabase-Migrationen braucht die Bestätigung der Lehrkraft.
- Lokale DB: Postgres 16 (`/usr/lib/postgresql/16/bin`, als `postgres`: initdb, pg_ctl -o '-p 5499'); vorher Rollen
  `anon`, `authenticated`, `service_role`, Schema `extensions` mit pgcrypto, `cron.schedule` als Attrappe; dann alle Migrationen.
- Kein Figma (18.11.). Windows: keine Dateinamen, die sich nur in Groß-/Kleinschreibung unterscheiden.
