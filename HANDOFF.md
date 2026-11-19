# Handoff – 19.11.2026 (Lernquest im Umbau; nächster Schritt: Claude schreibt lösbare Fragen aus dem Blatt)

## Ziel
Lernquest überarbeiten, damit jede Frage ohne das Arbeitsblatt lösbar ist und die 45 Minuten am Tag effektiv genutzt
werden. Plan und Reihenfolge: `docs/plan-lernquest-fragen.md`.

## Stand
- PR #81 (Branch `claude/handoff-continuation-849cyl`, gemergt am 19.11. = live):
  `UMBAU = true` (Kinder sehen „Wir bauen gerade um“), `buildPaket` gibt keine Aufgaben 1:1 vom Blatt mehr ins Paket,
  nur freigegebene Pool-Fragen. Auf dem Server nichts gelöscht. Pläne `docs/plan-lernquest-fragen.md`,
  `docs/plan-klassendorf-haeuser.md`, Eintrag in `docs/roadmap.md`.
- Klassendorf Teil A (PR #80) ist live; Teil B (eigene Häuser, Zelt-Quiz) auf Halde.
- Tests: grün (619), Typecheck, Build. CI zu PR #81 grün.

## Nächste Schritte (je einer pro Session, Skill `aufgabe`)
1. **Claude schreibt die Fragen aus dem Blatt:** `fragenpool.ts` (`poolPrompt`, bisher nur `blockText`) bekommt die
   JSON-Struktur der Schülerseiten samt Bildhinweisen; Regeln: ohne Blatt lösbar, curriculumsnah, verschiedene Formate.
   Testfall: Englisch Präpositionen (Ball/Box) – Lehrkraft nach der Stunde fragen. Danach `UMBAU = false` und
   Stationen der laufenden Klassen neu veröffentlichen (Lehrkraft).
2. Vokabeln getrennt von anderen Inhalten; Geografie u. a. nach Kompetenzen.
3. Wiederholung mit Maß (fällige deckeln, Vorschlag ≤ ⅓ der Lernzeit).
4. Fuchs während der Aufgaben + Fuchs-Challenges je Landkarte; flüssigere Animationen (wie Duolingo).
5. Lehrerseite neu gestalten, übersichtlicher.

## Wichtig zu wissen
- Pool-Tipps für Blatt-Aufgaben (`poolTipps`) sind jetzt wirkungslos; in Schritt 1 aufräumen.
- Server-Regeln stehen doppelt (SQL und `rules.ts`/`dorf.ts`), Tests vergleichen sie: beide zusammen ändern.
- Supabase-Migrationen brauchen eine Bestätigung der Lehrkraft in ihrer App.
- Lokale DB: Postgres 16 (`/usr/lib/postgresql/16/bin`, Nutzer `postgres`); vorher Ersatz für `auth`, `extensions`,
  `cron` und Rollen `anon`, `authenticated`, `service_role`. Auf Windows: PGlite.
- Kein Figma (Lehrkraft, 18.11.). 3D/Grafik: Skill `grafik`. Werkstatt: https://claude.ai/artifact/WmzYWa5W6igWNwv2iUZdnG
- Windows: keine zwei Dateien, die sich nur in Groß-/Kleinschreibung unterscheiden.
- App prüfen: `npm run spieltest`, Daten `scripts/spieltest-daten.js`, Helfer `scripts/spieltest-helfer.js`.
