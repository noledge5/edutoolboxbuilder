# Handoff – 12.11.2026 (Stufe E fertig und live: PR #61 gemergt, App wieder an)

## Stand
- **Kinder-App ist im Code abgeschaltet** (`UMBAU = true` in `src/lernquest/app/LernquestApp.tsx`): Anmeldung, Spiel und
  Boss-Beamer zeigen „Lernquest wird umgebaut“. Offene Übungen per Link laufen weiter. Auf den Geräten wird nichts
  gelöscht (Spielstand, ungesendete Runden bleiben). Live erst, wenn die Lehrkraft den Branch
  `claude/intelligent-knuth-ddy0o4` nach `main` mergt (Mergen = veröffentlichen). Wieder an: `UMBAU = false`.
- `main` hat Lernquest bis Stufe D, Teil 1 (PR #58). Branch `lernquest` = main (+ alter Handoff).
- **Stufe D, Teil 2 gibt es zweimal, beide nicht in `main`:**
  - `claude/lucid-galileo-0dvocr`: Klassen-Aufgabe (neue Sterne, Ziel 3 je Kind, einstellbar), Willkommen.
    **Ihre Migration `20261125_lernquest_klassenaufgabe.sql` ist LIVE eingespielt** (Supabase „baukasten“), die Datei
    liegt aber nur auf diesem Branch. Neue Migrationen müssen darauf aufbauen (Funktionen `lq_runde_melden`,
    `lq_stand_json` u. a. sind dort ersetzt, Tabelle `lq_klasse_woche`) – vorher die Datei ansehen.
  - Eine zweite Fassung (Runden statt Sterne, Truhe für alle) wurde in dieser Sitzung gebaut und per Revert wieder
    herausgenommen (Commit `f9a57f2`, nie eingespielt). Ideen daraus bei Bedarf dort nachlesen.

## Nächste Schritte: Stufe E bauen (Plan steht, entschieden am 12.11.2026)
Plan und Entscheidungen: „Stufe E“ in `docs/kritik-und-plan.md`; Mockup: `docs/design/lernquest/mockup-stufe-e.png`.
Kurz: Lernweg bleibt (sichtbarer), Stufe D Teil 2 übernehmen, Spielstände bleiben, keine Rangliste/Tagesserie.
1. **Fertig auf Branch `claude/amazing-newton-h940fp`** (nicht in `main`, von der Lehrkraft am 12.11. für gut befunden):
   - Teil 1: Farb-Tokens Grün/Creme in `lernquest.css` (wirkt auf alle Bildschirme), Start, Namen, PIN und Umbau-Seite
     neu, `Landschaft.tsx` (Landschaft mit Burg). `npm run spieltest` zeigt die App trotz `UMBAU` (nur dieser Modus).
   - Figuren-Baukasten `src/lernquest/figuren/`: Gerüst aus Teilen, Posen, Animationsmotor `bewegung.ts`
     (requestAnimationFrame, Blinzeln, Strecken, Kurven), Anker für Teile. Fuchs (7 Posen), Tintenkrake (Boss, 4 Posen),
     12 Teile. In der App: `app/Fuchs.tsx` (`Fuchs`, `FuchsSagt`).
   - Figuren-Werkstatt `lernquest/werkstatt.html` (nicht im Produktions-Build), Artefakt
     https://claude.ai/artifact/WmzYWa5W6igWNwv2iUZdnG (`npm run werkstatt`, mit Speicher für die Prüfungen der
     Lehrkraft). Fotos: `node scripts/werkstatt-fotos.mjs <ordner>`. **Jede Zeichnung über den Skill `figur`**; zu
     Beginn die Prüfungen lesen (Schritt 1; am 12.11. noch keine gespeichert).
2. **Fertig auf Branch `claude/clever-hamilton-ztdfgt`** (baut auf Teil 1 auf, nicht in `main`): Teil 2, Karte als
   Landschaft (`app/Landkarte.tsx`, Lage in `weg.ts`, Bauteile in `figuren/gelaende.tsx`, Werkstatt `#karte`), Fuchs
   über der Karte (`fuchsHinweis`), Leiste im Mockup-Look. Die Lehrkraft prüft Teile erst an den Spieler-Avataren (Teil 4,
   Entscheidung in `docs/roadmap.md`).
3. **Teil 4 fertig auf demselben Branch:** der Held als Vektorfigur (`figuren/held.tsx`), alle 80 Teile, 9 Frisuren,
   6 Münder, 6 Hautfarben gezeichnet; die App zeigt ihn überall (`app/heldVektor.tsx`), Werkstatt `#avatar` zum
   Zusammenstellen und Prüfen. Die Lehrkraft prüft jetzt die Teile am Helden; ihre Prüfungen zuerst lesen (Skill
   `figur`). Gemalte Bilder gelöscht; die 3 eigenen Teile und die eigene Frisur der Lehrkraft sind als
   Vektor nachgezeichnet (`EIGENE_ZEICHNUNGEN`). Neue eigene Teile: in der DB nachsehen (`lq_teil` mit `eigen`,
   `lq_frisur`) und ebenso nachzeichnen. Lehrkraft-Seite „Teile und Wünsche“: kein Hochladen mehr; neue Teile/Frisuren als
   Wunsch (Migration `20261126_lernquest_wuensche.sql`, live eingespielt 12.11.); Wünsche lesen und zeichnen: Skill `figur`.
4. **Teil 3 fertig auf demselben Branch:** Runde im Mockup-Look (`app/Runde.tsx`, CSS-Block „Stufe E, Teil 3“ am Ende
   von `lernquest.css`); Logik unverändert. **Teil 5 fertig auf demselben Branch** (Stufe D Teil 2 von `claude/lucid-galileo-0dvocr` hineingemergt, Migration
   `20261125_lernquest_klassenaufgabe.sql` ist jetzt im Repo): Reiter „Aufgaben“ (Heute/Woche), Truhe als Vektor, Fuchs
   beim Fund. **Teil 6 fertig:** Glockentöne (`app/ton.ts`), Konfetti (`app/Jubel.tsx`) bei Stern, perfekter Runde,
   Meilenstein und seltenem Fund, Held jubelt über dem Ergebnis, Schalter „Bewegung reduzieren“ im Menü (Klasse
   `lq-ruhig`), **`UMBAU = false`**. Gemergt (PR #61) und veröffentlicht am 12.11.; die Kinder-App ist live. Noch offen: Live-Tests gegen den Server laufen lassen, Lehrkraft-Seite „Teile und Wünsche“
   einmal angemeldet ansehen (nur ohne Anmeldung nicht prüfbar). Früher zu Teil 5: Dateien von
   `claude/lucid-galileo-0dvocr` holen (Migration `20261125_lernquest_klassenaufgabe.sql` ist live, muss ins Repo).

## Wichtig zu wissen
- Lokale Datenbank zum Prüfen: Postgres 16; vor den Migrationen Ersatz für `auth`, `extensions` (pgcrypto) und
  `cron.schedule` anlegen, Rollen `anon`, `authenticated`, `service_role` (mit Standardrechten wie bei Supabase).
- Supabase-Migrationen über die Verbindung brauchen eine Bestätigung der Lehrkraft in ihrer App; ohne Antwort bricht es
  nach knapp 4 Minuten ab (dann prüfen, ob etwas angekommen ist, und neu versuchen).
