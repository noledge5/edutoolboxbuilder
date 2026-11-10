# Handoff – 10.11.2026 (Abmelden-Knopf, eigene Frisuren) – UNFERTIG

## Ziel
Wunsch der Lehrkraft (Admin): (1) Schüler brauchen einen sichtbaren „Abmelden“-Knopf; (2) sie will auf der Lehrerseite
„Bilder der Teile“ neue Frisuren anlegen können (wie eigene Teile).

## Stand (Branch `claude/sweet-tesla-pcomqy`, letzter Commit „WIP: …“, nicht gemergt)
- Gebaut, Typprüfung/Tests (394)/Build grün, **noch nicht im Browser geprüft**:
  - Abmelden: Knopf unten auf der Held-Seite (`app/Held.tsx`, Prop `onAbmelden`) und im Menü oben; beide fragen nach
    (`abmeldenFragen` in `app/LernquestApp.tsx`), mit Warnung, wenn ungesendete Runden verloren gingen.
  - Eigene Frisuren: `teile.ts` (`Frisur`, `readEigeneFrisuren`, `alleFrisuren`, `frisurVon` kennt eigene),
    `app/hochgeladen.tsx` (`frisurenLaden`, localStorage `lernquest:eigeneFrisuren`), `app/bilderKontext.ts`
    (`EigeneFrisuren`, `useAlleFrisuren`, `FrisurVorschau` für die Vorschau einer noch neuen Frisur), `app/avatar.tsx`
    (Haare lesen `FrisurVorschau`), Held-Wahl zeigt eigene (aus dem Spiel nur für die, die sie tragen),
    `teacher/TeilBilder.tsx` (Kachel „Neue Frisur“, Name, „Frisur anlegen“ lädt 5 Haarfarben in einem Aufruf;
    eigene: umbenennen, „Zur Wahl für die Kinder“), `server.ts` (`frisurenEigen`, `frisurAnlegen`, `frisurAendern`),
    Test in `eigeneTeile.test.ts`.
  - Migration `supabase/migrations/20261121_lernquest_eigene_frisuren.sql` (Tabelle `lq_frisur`, `lq_frisur_anlegen`
    atomar mit 5 Bildern, `lq_frisur_aendern`, `lq_frisuren_eigen`, `lq_bild_loeschen` schützt eigene Frisuren):
    **lokal mit allen Migrationen geprüft, NICHT eingespielt** – braucht OK der Lehrkraft.

## Nächste Schritte
1. Im Browser prüfen (Playwright, RPCs nachahmen wie in früheren Durchläufen, siehe `docs/lernquest.md`): neue Frisur
   anlegen (Vorschau am Helden und in 5 Farben, `lq_frisur_anlegen` bekommt 5 Bilder), umbenennen/aus der Wahl; Kind
   sieht sie auf der Held-Seite; Abmelden-Knopf mit Nachfrage.
2. Live-Rechtetest in `src/lernquest/server.live.test.ts` ergänzen (Nicht-Admin: `zugang` bei `frisurAnlegen`/`frisurAendern`).
3. Doku: Abschnitt in `docs/lernquest.md` („Eigene Frisuren und Abmelden“), kurz in `docs/design/lernquest/bilder.md`.
4. Lehrkraft fragen → Migration per Supabase-Verbindung einspielen (sie muss die Bestätigung annehmen; ohne Antwort
   bricht es nach ~4 min ab, dann prüfen, ob etwas ankam) → `LQ_LIVE=1 npx vitest run src/lernquest/server.live.test.ts`.
5. PR, CI grün → mergen (die Lehrkraft hat in dieser Reihe jeweils „PR merge“ freigegeben; neu fragen).

## Wichtig zu wissen
- Admin = Besitzer-Hash ihrer Klasse „5c“ in `lq_admin` (Hash nicht ins Repo).
- Lokale Datenbank: Postgres 16; vor den Migrationen Ersatz für `auth`, `extensions` (pgcrypto), `cron.schedule`, Rollen
  `anon`, `authenticated`, `service_role` mit Standardrechten wie bei Supabase (default privileges auf public).
- Chromium: `scrollIntoView` gibt ein Promise zurück – nie als Rückgabe eines `useEffect` nutzen.
- Design-Test `lernquest.css.test.ts`: Abstände nur als `var(--lq-a-N)` ohne px-Rückfall.
