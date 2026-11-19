# Handoff – 19.11.2026 (PR #82 gemergt: Figuren ohne Umriss, Dorf ohne Verläufe; nächster Schritt Landkarte isometrisch)

## Ziel
Alle Lernquest-Grafiken nach `docs/design/prinzipien.md` (kein Umriss, wenige große Formen wie Duolingo, keine Verläufe,
Umgebung isometrisch), danach jede Frage ohne Arbeitsblatt lösbar machen (Plan: `docs/plan-lernquest-fragen.md`).

## Stand
- Erledigt und **gemergt (PR #82, live)**: Figuren, Held mit allen Teilen, Begleiter, Bosse, Truhe, Hintergründe ohne
  Umriss; Durchsicht (Samurai-Schultern rot, Hase kräftiger, Wald/Nacht/Bibliothek neu); Dorf ohne Verläufe (`iso.tsx`
  flache Töne, `IsoVerlaeufe` weg, Test in `dorf.test.tsx` verbietet Verläufe). Branch `claude/eloquent-davinci-xlogq4`.
- Werkstatt Version 17: https://claude.ai/artifact/WmzYWa5W6igWNwv2iUZdnG – Durchsicht ohne Änderungswünsche.
- Tests grün (621), Typecheck, Build und CI grün.

## Nächste Schritte (je einer pro Session, neuer Branch von `main`)
1. Landkarte isometrisch ohne Umriss (`gelaende.tsx`, `welten.tsx`, Iso-Bausatz aus `iso.tsx`), Himmelsverlauf in
   `app/Landschaft.tsx` durch flache Bänder ersetzen; Bäume/Palme/Kaktus mit `hintergruende.tsx` auf gemeinsame Teile
   bringen (dort gibt es jetzt `TANNE_FLACH`). Vorher/nachher zeigen, Werkstatt aktualisieren (vorher fragen).
2. Danach `UMRISS`/`UMRISS_FEIN` aus `stil.ts` und die `umriss`-Option von `Glied` (`fuchs.tsx`) löschen.
3. Fragen-Schritte: Claude schreibt lösbare Fragen aus dem Blatt (`fragenpool.ts`, `poolPrompt`; Testfall Englisch
   Präpositionen), dann `UMBAU = false`; Vokabeln getrennt; Wiederholung mit Maß; Fuchs in den Aufgaben; Lehrerseite neu.

## Wichtig zu wissen
- Entscheidung Lehrkraft 19.11.: Kompass Metall, Mondsichelstab Gold, Golem dunkle Augen, Zöpfe glatt bleiben so.
- Vorschau ohne Werkstatt: `VORSCHAU=<ordner> VORSCHAU_TEIL=dorf|hintergrund|held|… VORSCHAU_NUR=<id>,<id> npx vitest run src/lernquest/figuren/vorschau`.
- Werkstatt veröffentlichen braucht die Zustimmung der Lehrkraft; die Live-Fassung vorher lesen (Artifact `read`).
- Branch `claude/admiring-fermi-fcitkp` ist in #82 enthalten; löschen nur nach Rückfrage.
- Worker-Agenten mit `isolation: worktree` starten auf `main`: `git reset --hard <arbeits-branch>`, `ln -s <repo>/node_modules node_modules`.
- 3D-Skripte (`.claude/skills/grafik/skripte/`) und `haus-3d-probe.png` ungenutzt; löschen nur nach Rückfrage.
- Lernquest ist live im Umbau (`UMBAU = true`). Mergen = live.
- Server-Regeln doppelt (SQL und `rules.ts`/`dorf.ts`); Supabase-Migrationen braucht die Bestätigung der Lehrkraft.
- Lokale DB: Postgres 16 (`/usr/lib/postgresql/16/bin`, Nutzer `postgres`) mit Ersatz für `auth`, `extensions`, `cron`
  und Rollen `anon`, `authenticated`, `service_role`; Windows: PGlite. `poolTipps` wirkungslos (in Schritt 3 aufräumen).
- Kein Figma (18.11.). App prüfen: `npm run spieltest`. Windows: keine Dateinamen, die sich nur in Groß-/Kleinschreibung unterscheiden.
