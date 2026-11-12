# Handoff – 12.11.2026 (Extra-Pakete auf Branch, Stunden-Filter auf Branch)

## Ziel
Lernquest weiter ausbauen. Nächste Aufgabe: Grammatik- und Wortfeld-Pakete, die Claude erzeugt und die die Lehrkraft
unabhängig von Stunden freischaltet.

## Stand
- PR #65 gemergt und live: Held/Fuchs/Bosse bewegen sich (`FigurBild` mit `danach`), Golem und Rätseldrache als Figuren
  (`figuren/golem.tsx`, `figuren/raetseldrache.tsx`), Drache-Begleiter neu, Lehrkraft-Seite „Neu wünschen“ springt ins Bild.
- Branch `claude/admiring-brahmagupta-j275g8` (nicht in `main`): nur ausgearbeitete Stunden (`isWorkedOut`) auf der
  Lehrkraft-Seite und als Station auf der Karte (`paket.ts` `buildPaket`). Schon gesendete Pakete ändern sich erst nach
  „neu senden“ (Knopf mit Titel „Nach Änderungen an freigeschalteten Stunden“). Lehrkraft muss mergen (= veröffentlichen).
- Tests: grün (542), Typprüfung und Lint grün.
- Letzter Commit: 09386f9 Lernquest Lehrkraft: nur ausgearbeitete Stunden zeigen …

## Nächste Schritte
1. **Extra-Pakete gebaut** auf Branch `claude/extra-pakete` (baut auf `claude/admiring-brahmagupta-j275g8` auf, beide
   nicht in `main`; Mergen = veröffentlichen, erst den Stunden-Filter, dann diesen Branch). Lehrkraft-Seite: Bereich
   „Extra-Pakete“ unter „Stunden freischalten“ (Fach/Klasse aus dessen Filter): Art, Thema oder Vokabelliste →
   Fragenpool-Dialog → Haken zum Freischalten. Kinder-Karte: „Grammatik-Turm“/„Wortschatz-Wald“ hinter den Modulen, nie
   „aktuell“ (Foto im Spieltest geprüft). Tests 550 grün. **Nicht geprüft:** die Lehrkraft-Seite angemeldet (geht nur mit
   Server) und echtes Erzeugen mit Claude. Die Lehrkraft soll einmal ein Paket anlegen, erzeugen, freischalten.
   Grenzen: Auswertung, „Wiederholen sofort“ und Bosskampf am Beamer kennen Extra-Pakete nicht (nur Stunden).
2. Verschoben: Lehrkraft sagt, die Animationen sind auf dem iPhone (Safari) „noch nicht wirklich da“, obwohl die Werkstatt
   sich dort bewegt. Mögliche Gründe: Service Worker (`public/sw.js`) zeigt alte Fassung; Schalter „Bewegung reduzieren“
   im App-Menü (`lernquest:ruhig`). Safari ist hier nicht testbar (nur Chromium).
3. Militärhelm (Wunsch der Lehrkraft) gezeichnet auf Branch `claude/handoff-documentation-sy0llp`, nicht in `main`; die
   Lehrkraft prüft ihn in der Werkstatt und stellt auf ihrer Seite die Herkunft ein.

## Wichtig zu wissen
- Prüfungen der Lehrkraft: Werkstatt https://claude.ai/artifact/WmzYWa5W6igWNwv2iUZdnG, Sammlung `pruefung`
  (Skill `figur`). Offen zum Prüfen: Golem, Rätseldrache, Drache-Begleiter, Einhorn (Notiz dort ist alt, schon umgesetzt).
- Wünsche für eigene Teile: `lq_teil where wunsch is not null` (Supabase „baukasten“); am 12.11. abends keine offen (Militärhelm gezeichnet).
- Lokale Datenbank zum Prüfen: Postgres 16; vor den Migrationen Ersatz für `auth`, `extensions` (pgcrypto) und
  `cron.schedule` anlegen, Rollen `anon`, `authenticated`, `service_role`.
- Supabase-Migrationen brauchen eine Bestätigung der Lehrkraft in ihrer App (sonst Abbruch nach ~4 Minuten).
- App im Browser prüfen: `npm run spieltest`, Daten aus `scripts/spieltest-daten.js` in die Konsole, Helfer `scripts/spieltest-helfer.js`.
