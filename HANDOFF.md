# Handoff – 12.11.2026 (Figuren bewegen sich, PR #65 live; Stunden-Filter auf Branch)

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
1. Grammatik-/Wortfeld-Pakete bauen (neuer Branch von `main`). Entschieden am 12.11.:
   - Ort: **eigene Region je Fach** auf der Weltkarte (z. B. „Grammatik-Turm“, „Wortschatz-Wald“), jedes Paket eine Station.
   - Eingabe: **Thema eintippen** (Fach, Klassenstufe, z. B. „simple past“, „Wortfeld Wetter“) **und aus Vokabellisten**
     der Stunden (`src/ai/vocab.ts`, `VocabAiDialog.tsx`).
   - Freigabe **wie der Fragenpool** (`fragenpool.ts`, `teacher/Fragenpool.tsx`): Claude schreibt ~30 Übungen + Hilfe-Karten,
     Lehrkraft prüft jede, schaltet das Paket je Klasse frei.
   - Idee zum Wiederverwenden: Paket mit eigener Kennung statt Stunde (`stunde: 'extra-…'`, `modul.id: 'extra-<fach>-…'`)
     durch `buildPaket`/`paketSenden`/`lq_freischalten`; vorher prüfen, ob Server-Funktionen Stunden-Ids prüfen und wie
     Regionen/Boss (`karte.ts` `regionenVon`, `boss.ts` `bossVon`) mit so einem Modul umgehen. Speicherort der Pakete in
     der Bibliothek klären (`src/library/types.ts`).
   - Erst planen (Skill `aufgabe`), Plan kurz der Lehrkraft zeigen.
2. Verschoben: Lehrkraft sagt, die Animationen sind auf dem iPhone (Safari) „noch nicht wirklich da“, obwohl die Werkstatt
   sich dort bewegt. Mögliche Gründe: Service Worker (`public/sw.js`) zeigt alte Fassung; Schalter „Bewegung reduzieren“
   im App-Menü (`lernquest:ruhig`). Safari ist hier nicht testbar (nur Chromium).

## Wichtig zu wissen
- Prüfungen der Lehrkraft: Werkstatt https://claude.ai/artifact/WmzYWa5W6igWNwv2iUZdnG, Sammlung `pruefung`
  (Skill `figur`). Offen zum Prüfen: Golem, Rätseldrache, Drache-Begleiter, Einhorn (Notiz dort ist alt, schon umgesetzt).
- Wünsche für eigene Teile: `lq_teil where wunsch is not null` (Supabase „baukasten“); am 12.11. keine offen.
- Lokale Datenbank zum Prüfen: Postgres 16; vor den Migrationen Ersatz für `auth`, `extensions` (pgcrypto) und
  `cron.schedule` anlegen, Rollen `anon`, `authenticated`, `service_role`.
- Supabase-Migrationen brauchen eine Bestätigung der Lehrkraft in ihrer App (sonst Abbruch nach ~4 Minuten).
- App im Browser prüfen: `npm run spieltest`, Daten aus `scripts/spieltest-daten.js` in die Konsole, Helfer `scripts/spieltest-helfer.js`.
