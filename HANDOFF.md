# Handoff – 13.11.2026 (Sperre, Truhen und 50 neue Teile live; nächster Schritt Extra-Pakete vervollständigen)

## Ziel
Lernquest weiter ausbauen. Je Session ein Punkt aus „Nächste Schritte“, von oben nach unten.

## Stand (alles in `main` = live)
- PR #66–#68: Stunden-Filter, Extra-Pakete (`src/lernquest/extra.ts`, `teacher/ExtraPakete.tsx`; lassen sich in ein
  anderes Fach oder eine andere Klassenstufe verschieben), Militärhelm. PR #69: Figuren bewegen sich auch mit der
  System-Einstellung „Bewegung reduzieren“, nur der App-Schalter hält sie an.
- PR #70: **Sperre des Baukastens** (`src/sperre/`): 6-stelliger Code je Gerät, beim Öffnen und nach 15 Minuten ohne
  Berührung, Knopf „Sperren“; Kinder-Seiten bleiben offen. Einrichten unter Einstellungen → „Sperre auf diesem Gerät“.
- **Truhen und Seltenheit** (Migration `20261128_lernquest_truhen_neu.sql`, live): Teile eine Seltenheit herunter
  (außer gewöhnlich und Frisuren); Truhe 55 % Münzen (10/15/25/40), 45 % Teil (25/12/5,5/2/0,5 %), Garantie jede 7.
  Truhe. Kein Klassengutschein aus Truhen (Lehrkraft: weglassen).
- PR #72: **50 neue Teile**, je Seltenheit zehn (Migration `20261129_lernquest_neue_teile.sql`, live). Katalog jetzt
  49 / 25 / 21 / 18 / 8 je Seltenheit (gewöhnlich bis legendär).
- Branch `claude/truhen-seltenheit` ist gemergt; die Lehrkraft kann ihn auf GitHub löschen.

## Für die Lehrkraft offen
- Die 50 neuen Teile in der Werkstatt prüfen (dazu Golem, Rätseldrache, Drache-Begleiter, Einhorn, Militärhelm).
- Sperre auf jedem Gerät einrichten; am iPhone prüfen, ob sich die Figuren bewegen.
- Ein Extra-Paket anlegen, erzeugen und freischalten (das Erzeugen mit Claude ist noch ungetestet);
  „Freigeschaltete neu senden“; beim Militärhelm die Herkunft einstellen; „Teile und Wünsche“ angemeldet ansehen.

## Nächste Schritte (je einer pro Session)
1. **Prüfungen der Lehrkraft lesen**, sobald sie die neuen Teile durchgesehen hat (Skill `figur`, Schritt 1), und die
   Teile mit „aendern“ überarbeiten.
2. **Extra-Pakete vervollständigen:** Auswertung (`teacher/Auswertung.tsx`), „Wiederholen sofort“
   (`teacher/WiederholenSofort.tsx`) und Bosskampf am Beamer (`useRegion`/`BossStart` in `LernquestView.tsx`) kennen nur
   Stunden (`lib.lessons` mit `klasse.stunden`); Extra-Pakete über `freiFuer`/`buildExtraPaket` dazunehmen.
3. **„Frage melden“:** Kinder melden eine fehlerhafte Übung, die Lehrkraft sieht die Meldungen beim Fragenpool. Braucht
   eine Migration (Freigabe der Lehrkraft in ihrer App); erst planen (Skill `aufgabe`) und Plan zeigen.
4. **Lehrkraft-Bereich in der Lernquest-App** für den Bosskampf mit Karten (heute scannt der Baukasten). Erst planen.
5. Kleinkram: `docs/kritik-und-plan.md` an den überholten Stellen nachziehen (Hinweis in `docs/roadmap.md`).
6. Offen zur Entscheidung: Fremde können auf ihrem Gerät leere Klassen auf dem Server anlegen (bis 40 je Schlüssel,
   Schlüssel beliebig neu). Keine Daten in Gefahr, aber Datenmüll möglich; Abhilfe bräuchte eine Migration.

## Wichtig zu wissen
- Prüfungen der Lehrkraft: Werkstatt https://claude.ai/artifact/WmzYWa5W6igWNwv2iUZdnG, Sammlung `pruefung`
  (Skill `figur`). Offen zum Prüfen: die 50 neuen Teile, Golem, Rätseldrache, Drache-Begleiter, Einhorn (Notiz dort ist alt, schon umgesetzt), Militärhelm.
- Wünsche für eigene Teile: `lq_teil where wunsch is not null` (Supabase „baukasten“); am 13.11. keine offen (Militärhelm gezeichnet).
- Lokale Datenbank zum Prüfen: Postgres 16 (`/usr/lib/postgresql/16/bin`, als Nutzer `postgres`, Datenordner unter
  `/var/lib/postgresql/`, nicht im Scratchpad); vor den Migrationen Ersatz für `auth` (`uid()`, `role()`), `extensions`
  (pgcrypto), `cron.schedule`/`cron.unschedule` und Rollen `anon`, `authenticated`, `service_role` anlegen.
- Supabase-Migrationen brauchen eine Bestätigung der Lehrkraft in ihrer App (sonst Abbruch nach ~4 Minuten).
- App im Browser prüfen: `npm run spieltest`, Daten aus `scripts/spieltest-daten.js` in die Konsole, Helfer `scripts/spieltest-helfer.js`.
