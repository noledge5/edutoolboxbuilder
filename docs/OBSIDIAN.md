# Notizen in Obsidian lesen und pflegen

Der Ordner `docs/` ist ein Obsidian-Vault (ein Ordner mit Notizen, den Obsidian öffnet). Einstieg ist der Index
[roadmap.md](roadmap.md); die Notizen liegen in [entscheidungen/](entscheidungen/).

## Am Mac

1. [GitHub Desktop](https://desktop.github.com) installieren und mit dem GitHub-Konto anmelden.
2. „File → Clone Repository …“ → `noledge5/edutoolboxbuilder` wählen. Das legt eine Kopie des Repos (Klon) auf dem Mac an.
3. [Obsidian](https://obsidian.md) installieren, „Ordner als Vault öffnen“ und darin den Ordner `docs` wählen
   (nicht den ganzen Repo-Ordner, sonst gelten die Einstellungen aus `docs/.obsidian/` nicht).
4. Vor dem Schreiben in GitHub Desktop „Fetch origin“ und dann „Pull origin“ drücken, damit du den neuesten Stand hast
   (Claude ändert die Notizen auch).
5. Nach dem Schreiben in GitHub Desktop eine kurze Beschreibung eintippen, „Commit to main“, dann „Push origin“.

Ein Push, der nur `docs/` ändert, veröffentlicht die App nicht. Die Prüfung (CI) läuft trotzdem und sollte grün sein.

## Am iPad

Zwei Wege, beide mit Grenzen:

- **Working Copy** (Git-App für iOS) holt das Repo; in Obsidian öffnest du den Ordner `docs` daraus als Vault
  (in Working Copy: Ordner verknüpfen, „Link Repository/Directory“). Pushen kostet in Working Copy einen einmaligen
  Kauf. Diesen Weg habe ich nicht selbst am iPad ausprobiert.
- **Obsidian mit dem Community-Plugin „Git“**: In Obsidian unter „Einstellungen → Community-Plugins“ das Plugin „Git“
  installieren, das Repo mit einem GitHub-Schlüssel (Personal Access Token, nur für dieses Repo, Recht „Contents“)
  klonen. Der Schlüssel bleibt auf dem iPad (die Plugin-Ordner kommen nie in Git).

Grenzen am iPad, ehrlich:
- Das Git-Plugin ist auf iPad und iPhone langsam und gilt dort als unausgereift; bei einem großen Repo kann es abbrechen.
  Es klont das ganze Repo, nicht nur `docs/`; dann stell in Obsidian einmal von Hand „Markdown-Links“ an und
  „Relativer Pfad“ als Linkformat.
- Wenn am Mac und am iPad dieselbe Notiz geändert wurde, gibt es einen Konflikt, den man am iPad nur schwer löst.
  Darum: vor dem Schreiben holen, danach gleich pushen.
- Es gibt kein automatisches Holen im Hintergrund; iPadOS beendet Apps, die nicht offen sind.

## Hinweise

- Links bitte als normale Markdown-Links (`[Titel](datei.md)`), keine `[[Wikilinks]]`. Obsidian macht das von selbst
  so, die Einstellung steht in `docs/.obsidian/app.json`. So lesen auch Claude und andere Werkzeuge die Links.
- Bilder und andere Anhänge legt Obsidian in `docs/anhaenge/` ab.
- `docs/claude/anleitung-fuer-claude.md` nicht von Hand ändern: Sie wird aus dem Code erzeugt, ein Test prüft sie.
- `docs/design/` ist die Design-Vorlage der App; dort nur ändern, wenn das Design sich ändern soll.
