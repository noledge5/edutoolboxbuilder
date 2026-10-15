# Stand: Arbeitsblatt-Baukasten
Zuletzt aktualisiert: 2026-10-15
HTML-Seite: keine

## Ziel
Browser-Werkzeug für eine Realschul-Lehrkraft: druckbare A4-Arbeitsblätter, Folien und Jahresplanung aus Bausteinen,
auf Mac und iPad, mit Claude im Baukasten; veröffentlicht über GitHub Pages. Endziele bis Sommer 2027: `docs/roadmap.md`.

## Aktueller Stand
- Umgesetzt: Phasen 1–4 und 7–9 (Editor, Bibliothek, Englisch und Jahresplan, Planung/Bilder/Folien, digital austeilen,
  Folien 2.0, KI im Baukasten); Phasen 5 und 6 teilweise. Einzelheiten: `docs/roadmap.md`.
- Zuletzt (08.10.2026): Tastenkürzel-Übersicht, „Stunde prüfen“ mit Claude, Bearbeiten direkt auf dem Blatt, neue Folienarten.
- 2026-10-15: Arbeitsweise von noledge5/based auf noledge5/hierarchie umgestellt (Skills, Worker, UTS, diese Datei).

## Offene Punkte
- Runde 7: interaktive Modelle für die Naturwissenschaften (roadmap, „Als Nächstes“).
- Automatischer Abgleich: Daten auf dem Server löschen und alte Kopplungen aufräumen (braucht Freigabe im Supabase-Werkzeug).
- Aus dem Audit: Klassenarbeit mit Claude aus dem Kompetenzraster, Didaktik-Check für fertige Stunden, Browser-Tests im CI.

## Entscheidungen
- Entscheidungen mit der Lehrkraft und ihre Gründe stehen in `docs/roadmap.md`; dieses Repo führt kein `docs/adr/`.
- Ein Push auf `main` veröffentlicht die App (`.github/workflows/deploy.yml`); `main` nur auf Wunsch.

## Nächste Schritte
1. Runde 7 (interaktive Modelle) mit der Lehrkraft klären und planen.

## Befunde
- keine
