# Handoff – 06.11.2026 (Nacht)

## Ziel
Lernquest (Lern-App für die Schüler, `docs/lernquest.md`). Stufe 5 „KI-Fragenpool und mehr Formate“, in zwei Teilen
(Entscheidung der Lehrkraft). **Teil A ist gebaut** auf Branch `claude/stufe-5-handoff-b9odwp`, noch nicht auf `main`.

## Stand
- **Live:** Stufen 1–4 und die offenen Übungen (`#probe=englisch5`).
- **Stufe 5 Teil A** (Entscheidungen und Stand in `docs/lernquest.md`, „Stufe 5“):
  - KI-Fragenpool je Stunde: Lehrkraft-Seite → „Stunden freischalten“ → „Fragenpool“. Chat-Weg oder eigener
    Schlüssel; prüfen, ändern, freigeben, verwerfen. Pool an der Stunde (`Lesson.pool`), freigegebene ins Lernpaket.
  - Neue Formate: Sortieren (`gruppen`), Bild wählen (`bild`, aus Bild-Vokabeln), Hören (`waehlen.hoeren`);
    Vorlesen mit der Stimme des Geräts in Englisch-Paketen.
  - Keine Serveränderung.
- Geprüft: Typprüfung, alle Tests (neu: `fragenpool.test.ts`), Build. Im Browser (Playwright, Hilfsseiten, nicht im
  Repo): die vier neuen Übungsansichten am Handy (390 px), der Dialog am iPad (1024 px) und Handy, Chat-Weg einlesen.
- **Nicht geprüft:** echter Aufruf an Claude mit Schlüssel (kein Schlüssel in der Sitzung); Senden eines Pakets mit
  Pool und Bildern an den echten Server (`lq:testlauf` läuft noch ohne Pool); Vorlesen mit echter Stimme (Chromium
  ohne Stimmen; am iPad ansehen).

## Nächste Schritte
1. Lehrkraft schaut Teil A an; bei „passt“ PR nach `main` (= veröffentlichen).
2. `lq:testlauf` um eine Stunde mit Pool und Bild-Vokabeln erweitern (prüft Rundenzahl am Server mit Pool).
3. Teil B planen: „Punkt auf Bild/Karte setzen“ (Lehrkraft setzt Punkte von Hand).
4. Weiter offen aus Stufe 4: Gutscheine mit vielen Kindern gleichzeitig; „Punkte geben“ fragt mit `window.prompt`;
   „+Schaden“ als Ausrüstungs-Bonus.

## Wichtig zu wissen
- `main` = veröffentlichen. Arbeits-Branch nutzen, PR und Merge nur auf Wunsch.
- Neue Übungsart: Liste in `AGENTS.md` (Lernquest) abarbeiten.
- Die `lq_*`-Tabellen nie direkt lesen (echte Kindernamen); nur über die Server-Funktionen mit Wegwerf-Schlüssel.
