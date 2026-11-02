# Phase 7 – Digital austeilen

← [Index](../roadmap.md)

## Phasen

### Phase 7 – Digital austeilen (Runde 4, nach dem Vorbild eduki Interactive)
Entschieden mit Fragen und Vor- und Nachteilen:
- ✅ Aufgaben aus den vorhandenen Bausteinen am Gerät lösbar; austeilen als einzelne Aufgabe, ausgewählte Bausteine oder ganzes Arbeitsblatt, per Link und QR-Code, ohne Konto: Schüler geben Vorname + ersten Buchstaben des Nachnamens ein.
- ✅ Aufträge liegen im eigenen öffentlichen Repository `noledge5/baukasten-aufgaben` (GitHub-Schlüssel je Gerät, darf nur dort schreiben); die Schüleransicht lädt sie von raw.githubusercontent.com.
- ✅ Ergebnisse Ende-zu-Ende-verschlüsselt (ECDH P-256 + AES-GCM, ein Schlüsselpaar je Auftrag, der private Schlüssel reist mit dem Abgleich) auf Supabase in Frankfurt (Projekt „baukasten“), nur über zwei Funktionen erreichbar, Löschung nach 14 Tagen (pg_cron), täglicher Weckruf per GitHub Action.
- ✅ Übung (selbst prüfen, Lösung zeigen; Lehrkraft sieht ersten Versuch und Ende) oder Test (ohne Lösungen im veröffentlichten Auftrag).
- ✅ Auswertung: Live-Tabelle, häufige Fehler, Kompetenz-Übersicht (mit Niveau), Ansicht ohne Namen für den Beamer.
- Als Nächstes: interaktive Modelle für die Naturwissenschaften (Simulationen mit eingebauten Aufgaben, über dieselbe Auswertung), danach ggf. Zeichenfeld digital.
