# Handoff – 18.11.2026 (alles live; nächster Schritt Klassendorf Stufe 2 im neuen Stil)

## Ziel
Lernquest weiter ausbauen. Je Session ein Punkt aus „Nächste Schritte“, von oben nach unten.

## Stand (alles in `main` = live)
- PR #76: Extra-Pakete in Auswertung, „Wiederholen sofort“, Kartenfrage, Bosskampf. PR #77: Idee Klassendorf.
- PR #79: Klassendorf Stufe 1 „Dorfkasse“, Lernzeit je Tag (Standard 45 Min., je Klasse einstellbar), wiederholte
  Station nur 2 EP / 1 Münze, Kampfmusik am Beamer (`app/musik.ts`). Migrationen `20261130_lernquest_dorf` und
  `20261201_lernquest_lernzeit` sind live (18.11.). Musik nur auf Fehlerfreiheit geprüft, nicht angehört.
- Werkstatt: alle 159 offenen Teile auf Wunsch der Lehrkraft als „passt“ eingetragen; sie sieht trotzdem durch.
- Branch `claude/happy-pascal-p3h9wu`: nur Doku + Stilproben (nicht gemergt, kein Code).
- Tests: grün (617). Letzter Commit siehe `git log`.

## Für die Lehrkraft offen
- Kampfmusik am Beamer anhören; Klassendorf und „Lernzeit am Tag“ ausprobieren.
- Durchsicht der Teile in der Werkstatt; Extra-Paket mit Claude erzeugen (ungetestet).

## Nächste Schritte (je einer pro Session)
1. **Klassendorf Stufe 2, Teil A: neuer Stil + Dorfkarte.** Entscheidungen und Rückmeldung in
   `docs/idee-klassendorf.md` („Stufe 2“). Vorlage: `docs/design/lernquest/stilprobe/haus-v2.mjs` (+ .png):
   isometrisch schräg von oben, mehr Detail, Verläufe, Licht am Abend; Figuren flach und rund wie Duolingo; Farben
   passen. Zuerst Stilregeln im Skill `figur` und in `stil.ts`/Tests anpassen (Verläufe erlauben, Farben weiter aus der
   Palette), dann `figuren/dorf.tsx` als scrollbare Iso-Karte (Dorfplatz, Grundstück je Kind, Viertel à 6). Lehrkraft
   muss die Probe noch final abnicken – kurz fragen.
2. **Teil B: eigene Häuser** (Migration): Stufen Zelt gratis / Hütte 300 / Holzhaus 800 / Fachwerk 1800 / Turm 4000,
   höhere mit Heldenstufe; modulare Anbauten (Turm, Anbau, Balkon, Garten, Laterne, Zaun …), auch aus Truhen;
   Besuchen mit Sticker-Gruß. Erst planen (Skill `aufgabe`).
3. **Teil C:** Held, Fuchs, Bosse, Lernkarte, ~70 Gegenstände im neuen Stil neu zeichnen (mehrere Sessions).
4. „Frage melden“ (Migration; erst planen). 5. Lehrkraft-Bereich in der Lernquest-App für Bosskampf mit Karten.
6. Kleinkram: `docs/kritik-und-plan.md` nachziehen. 7. Offen: Fremde können leere Klassen anlegen (Datenmüll).

## Wichtig zu wissen
- Prüfungen der Lehrkraft: Werkstatt https://claude.ai/artifact/WmzYWa5W6igWNwv2iUZdnG, Sammlung `pruefung`
  (Skill `figur`); Werkstatt-Artefakt ist noch nicht mit den Dorf-Zeichnungen neu veröffentlicht.
- Server-Regeln stehen doppelt (SQL und `rules.ts`/`dorf.ts`), Tests vergleichen die SQL-Zeilen: beide zusammen ändern.
  `lq_runde_melden` hat jetzt `p_sekunden`; die App sendet bei altem Server ohne (Fallback in `server.ts`).
- Wünsche für eigene Teile: `lq_teil where wunsch is not null` (Supabase „baukasten“); am 13.11. keine offen (Militärhelm gezeichnet).
- Lokale Datenbank zum Prüfen: Postgres 16 (`/usr/lib/postgresql/16/bin`, als Nutzer `postgres`, Datenordner unter
  `/var/lib/postgresql/`, nicht im Scratchpad); vor den Migrationen Ersatz für `auth` (`uid()`, `role()`), `extensions`
  (pgcrypto), `cron.schedule`/`cron.unschedule` und Rollen `anon`, `authenticated`, `service_role` anlegen.
- Supabase-Migrationen brauchen eine Bestätigung der Lehrkraft in ihrer App (sonst Abbruch nach ~4 Minuten).
- Auf dem Windows-Rechner der Lehrkraft gibt es kein Postgres: Migrationen dort mit PGlite prüfen (`@electric-sql/pglite`
  mit `pgcrypto` im Scratchpad installieren, dieselben Ersatz-Schemata, alle Dateien aus `supabase/migrations` der Reihe
  nach laden). So wurde das Klassendorf am 13.11. geprüft (Regeln per SQL und im Browser gegen einen kleinen
  RPC-Server; `.env.spieltest.local` mit `VITE_SERVER_URL` zeigt die App dorthin).
- Windows unterscheidet keine Groß- und Kleinschreibung: nie zwei Dateien, die sich nur darin unterscheiden
  (`Sperre.tsx` neben `sperre.ts` ließ die App dort nicht starten; heißt jetzt `SperreRahmen.tsx`).
- App im Browser prüfen: `npm run spieltest`, Daten aus `scripts/spieltest-daten.js` in die Konsole, Helfer `scripts/spieltest-helfer.js`.
