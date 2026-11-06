# Handoff – 06.11.2026 (Nacht)

## Ziel
Lernquest (Lern-App für die Schüler, `docs/lernquest.md`). Stufe 5 „KI-Fragenpool und mehr Formate“ ist **fertig
gebaut** auf Branch `claude/stufe-5-handoff-b9odwp`, noch nicht auf `main` (Merge = veröffentlichen).

## Stand
- **Live:** Stufen 1–4 und die offenen Übungen (`#probe=englisch5`).
- **Stufe 5** (Entscheidungen und Stand in `docs/lernquest.md`, „Stufe 5“):
  - „Fragen erzeugen“ je Stunde (Lehrkraft-Seite → „Stunden freischalten“): etwa 15 Fragen von Claude (Chat oder
    eigener Schlüssel), jede einzeln freigeben, ändern, löschen. Pool an der Stunde (`Lesson.pool`).
  - „Punkte im Bild …“ im selben Dialog: Bild vom Arbeitsblatt, Punkte setzen und benennen.
  - Neue Formate: Sortieren, Bild wählen (aus Bild-Vokabeln), Punkt auf Karte/Bild, Hören; Vorlesen mit der Stimme
    des Geräts in Englisch-Paketen. Keine Serveränderung.
- Geprüft: Typprüfung, alle Tests, Build, CI. Testlauf gegen den echten Server (`npm run lq:testlauf`, jetzt mit
  zweiter Station aus den neuen Formaten und Bildern im Paket) grün, Testklasse gelöscht. Dialog und Punkte-Editor im
  Browser am iPad- und Handy-Format (Hilfsseiten, nicht im Repo).
- **Nicht geprüft:** echter Aufruf an Claude mit Schlüssel (kein Schlüssel in der Sitzung, der Chat-Weg ist geprüft);
  Vorlesen mit echter Stimme (am iPad anhören); Bild-Vokabeln mit eigenen Fotos im echten Baukasten.

## Nächste Schritte
1. Lehrkraft schaut Stufe 5 an; bei „passt“ PR nach `main` (= veröffentlichen), danach
   `LQ_URL=https://noledge5.github.io/edutoolboxbuilder/lernquest/ npm run lq:testlauf`.
2. Offen aus Stufe 4: Gutscheine mit vielen Kindern gleichzeitig; „Punkte geben“ fragt mit `window.prompt`;
   „+Schaden“ als Ausrüstungs-Bonus.

## Wichtig zu wissen
- `main` = veröffentlichen. Arbeits-Branch nutzen, PR und Merge nur auf Wunsch.
- Neue Übungsart: Liste in `AGENTS.md` (Lernquest) abarbeiten.
- Die `lq_*`-Tabellen nie direkt lesen (echte Kindernamen); nur über die Server-Funktionen mit Wegwerf-Schlüssel.
