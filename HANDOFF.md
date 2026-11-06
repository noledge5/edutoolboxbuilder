# Handoff – 06.11.2026 (spät)

## Ziel
Lernquest (Lern-App für die Schüler, `docs/lernquest.md`). Stufe 4 „Echte Belohnungen und Auswertung“ ist fertig und
auf Wunsch der Lehrkraft nach `main` gebracht (PR „Lernquest Stufe 4“, Merge = veröffentlichen). Nächstes Thema:
Stufe 5 „KI-Fragenpool und mehr Formate“.

## Stand
- **Live:** Stufen 1–4. Lehrkraft-Bereich im Baukasten unter Übersicht → „Lernquest“.
- **Stufe 4** (Entscheidungen und Stand in `docs/lernquest.md`, „Stufe 4“):
  - Server: `supabase/migrations/20261108_lernquest_belohnungen.sql`, von der Lehrkraft im SQL Editor eingespielt
    (die Bestätigung des Supabase-Werkzeugs kam dreimal nicht an). Geprüft über die öffentlichen Funktionen.
  - Klassenpunkte je Kind: Wochenziel 3, Bosssieg 2 (einmal je Region), von Hand höchstens 5 je Woche.
    Gutscheine je Klasse mit Preis, Grenze je Kind und je Klasse pro Woche; Anfrage legt Punkte zurück.
  - Auswertung je Kompetenz aus den Wiederhol-Kästen (sitzt ab Kasten 3), Zuordnung nur im Browser der Lehrkraft.
- Tests: Typprüfung, 298 Tests, Build, CI grün. Lokale SQL-Prüfung (76), Live-Test (`LQ_LIVE=1`, 4 Tests) und
  Testlauf (`npm run lq:testlauf`, jetzt mit Gutschein anfragen und einlösen) grün. Lehrkraft-Seite mit einer
  Wegwerf-Klasse im Browser angesehen (Laptop und iPad).

## Nächste Schritte
1. Nach dem Deploy `LQ_URL=https://noledge5.github.io/edutoolboxbuilder/lernquest/ npm run lq:testlauf` (Ergebnis steht
   im Chat der Lehrkraft).
2. Nicht geprüft: Gutscheine mit vielen Kindern gleichzeitig; „Punkte geben“ fragt mit `window.prompt` (am iPad
   ansehen).
3. Offen: „+Schaden“ als Ausrüstungs-Bonus (Katalog-Änderung, eigener Schritt).
4. Stufe 5 planen (KI-Fragenpool je Stunde mit Prüfen/Freigeben; Karte/Bild-Punkte, Sortieren, Vorlesen).

## Wichtig zu wissen
- `main` = veröffentlichen. Arbeits-Branch nutzen, PR und Merge nur auf Wunsch.
- Belohnungsregeln doppelt (TS + SQL): `rules.ts` und `lq_runde_melden`, `lq_boss_ticken`, `lq_anfragen`.
- Die `lq_*`-Tabellen nie direkt lesen (echte Kindernamen); nur über die Server-Funktionen mit Wegwerf-Schlüssel.
