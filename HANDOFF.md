# Handoff – 25.11.2026 (Eigene Häuser im Klassendorf gemergt, PR #87; Migration noch offen)

## Ziel
Lernquest weiter ausbauen. Die Lehrkraft hat am 25.11. die Häuser vorgezogen; danach weiter nach
`docs/plan-lernquest-fragen.md` und den neuen Wünschen in `docs/plan-klassendorf-haeuser.md`.

## Stand
- Erledigt und **gemergt (PR #87, live)**: Klassendorf Teil B1 „Eigenes Haus“. Schalter je Klasse auf der Lehrerseite (Standard
  aus), Zelt per Quiz (`zelt.ts`, 5 von 12 Fragen, ab 4 richtig), Ausbau Hütte 300, Holzhaus 800 (Heldenstufe 3),
  Fachwerkhaus 1800 (5), Turmhaus 4000 (12). Kinder sehen alle Häuser ohne Namen, „Du“ am eigenen; die Lehrkraft sieht Namen.
  Branch `claude/compassionate-davinci-8in8er` (gemergt, nur nach Rückfrage löschen), CI grün.
- Tests grün (639), Typecheck, Build. SQL mit lokalem Postgres geprüft. Kinderseite im Browser mit nachgestelltem
  Server geprüft (Quiz, Zelt, Hütte, Handybreite). Nicht geprüft: echter Server, Lehrerseite im Browser.
- Offen bei der Lehrkraft: Migration `20261203_lernquest_haeuser.sql` in Supabase einspielen (bis dahin blendet die
  App die Häuser aus), Quizfragen in `src/lernquest/zelt.ts` prüfen, je Klasse „Eigene Häuser freigeschaltet“ setzen.

## Nächste Schritte (je einer pro Session, neuer Branch von `main`)
1. Rückmeldung zu den Häusern einarbeiten (Fragen, Bilder, Texte), falls die Lehrkraft etwas ändern will.
2. Neue Wünsche der Lehrkraft (25.11., offene Fragen stehen im Plan), Reihenfolge fragen: Mathe-Aufgaben (bald!),
   neue Gegenstände (auch Legendär), Einschmelzen (mehrere → nächst seltener, Legendär ausgenommen), Abzeichen,
   Haus und Profil anderer besuchen (braucht Namen für Kinder = neue Entscheidung), Häuser gestalten (B2).
3. **Solo-Boss an der Burg** (Plan Schritt 6): je Kind ein kleiner Boss am Ende einer Region, naheliegend statt Meilenstein
   (`karte.ts` `MEILENSTEIN_GROESSE`, `meilensteinStarten` in `app/LernquestApp.tsx`). Erst mit Skill `aufgabe` klären.
4. Plan Schritt 2 (Vokabeln getrennt, Kompetenzen statt Blatt), Schritte 4–5 (Fuchs, Lehrerseite neu).
5. Offen: Werkstatt mit neuen Kartenteilen und Hausstufen veröffentlichen? (Version 17: https://claude.ai/artifact/WmzYWa5W6igWNwv2iUZdnG)

## Wichtig zu wissen
- Häuser: Regeln doppelt in `dorf.ts` (`HAUS_STUFEN`) und Migration; Bilder `figuren/haeuser.tsx`, Kinderseite
  `app/MeinHaus.tsx`. Ohne Migration liefert der Server kein `haeuser`; die App blendet die Häuser dann aus.
  Grundstücke nach Eintrittsreihenfolge; wird ein Kind gelöscht, rücken die Häuser dahinter auf.
- Spieltest ohne Server: Playwright `page.route('http://127.0.0.1:9/**')` stellt RPCs nach (`lq_klasse_ansicht`,
  `lq_dorf`); ein nachgestellter Stand braucht `umbau: false`, sonst kommt die Umbau-Seite.
- Lokale DB: Postgres 16 (`/usr/lib/postgresql/16/bin`, als `postgres`, Port 5499); Rollen `anon`, `authenticated`,
  `service_role`, Schema `extensions` mit pgcrypto, `cron.schedule` als Attrappe; dann alle Migrationen.
- Kinder-App: Umbau-Seite, solange die Klasse nicht live ist (`imUmbau` in `rules.ts`).
- Force-Push blockiert. Gemergte Branches `claude/admiring-fermi-fcitkp`, `claude/eloquent-davinci-xlogq4`,
  `claude/jolly-planck-0jqcot`, `claude/umbau-schalter`, `claude/dreamy-bardeen-2fmcg4` nur nach Rückfrage löschen. Kein Figma.
- Vorschau: `VORSCHAU=<ordner> VORSCHAU_TEIL=dorf|karte|… npx vitest run src/lernquest/figuren/vorschau` (dorf zeigt
  jetzt auch Karten mit Häusern). Worker mit `isolation: worktree`: `git reset --hard <branch>`, node_modules verlinken.
- Werkstatt veröffentlichen und Supabase-Migrationen brauchen die Zustimmung der Lehrkraft.
