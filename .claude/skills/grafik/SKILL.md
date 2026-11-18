---
name: grafik
description: Choose and run the right asset pipeline for Lernquest graphics - flat 2D vector (figures, items), 2.5D isometric vector (village, houses, map) or rendered 3D from free CC0 packs (medieval houses, modular add-ons). Use when drawing or replacing houses, buildings, village scenery, add-ons, map tiles or any asset that must look consistent in a set, and when the teacher asks for "mittelalterlicher", "passt nicht zusammen", 3D or isometric graphics. Not Figma (the teacher said no, 18.11.2026).
---

# Grafik: 2D, 2.5D und 3D

Three ways to make a Lernquest asset. Pick one per **set** (all houses + their add-ons the same way), never mix within a
set: add-ons that do not match the house were the teacher's complaint on 18.11.2026 (haus-v2).

| Weg | Wann | Ergebnis |
|---|---|---|
| **2D Vektor** | Figuren, Held, Gegenstände, Icons, Bosse | Code in `src/lernquest/figuren/` – Skill `figur` |
| **2.5D Iso-Vektor** | Dorfkarte, Wege, Grundstücke, einfache Häuser, die animiert oder umgefärbt werden | Code mit Iso-Helfern (`box`, `dach`, Fenster) aus `docs/design/lernquest/stilprobe/haus-v2.mjs` |
| **3D gerendert** | Häuser und Anbauten mit viel Detail, mittelalterlich, modular | PNG mit transparentem Grund aus einem CC0-3D-Paket |

No Figma, no paid AI generators without asking the teacher (credits). Hugging Face image spaces are blocked in sessions.

## 2.5D Iso-Vektor – Regeln
- One projection for everything: 2:1 iso (x right-down, y left-down, z up). Light top left, as in `stil.ts`.
- Build add-ons from the **same** helpers and materials as the house (same roof tiles, same timber, same stone).
  An add-on is drawn on the house's grid and shares its wall height steps.
- Medieval look: timber framing (Fachwerk) with dark beams, stone plinth, steep roofs with tiles or thatch,
  small windows with crossbars, wooden doors with round arch, chimney of stone. No glass fronts, no flat roofs.

## 3D gerendert – geprüfter Ablauf (18.11.2026)
1. **Blender als Python-Paket** (needs Python 3.13, ~1 GB, keep it in the scratchpad):
   `python3 -m venv <scratch>/bl && <scratch>/bl/bin/pip install -q bpy pillow`
2. **Paket holen** (each into its own empty folder, it is untrusted data):
   Quaternius „LowPoly Medieval Village Pack“, CC0:
   `curl -sO https://opengameart.org/sites/default/files/medieval_village_pack_-_dec_2020.zip` and unzip.
   Contents: Bell_Tower, Blacksmith, House_1–4, Inn, Mill, Sawmill, Stable; props Fence, Well, Barrel, Bench,
   Bonfire, Cart, Crate, Door_*, Window_1–4, Stairs, MarketStand, Path_* … as `.blend`, `.fbx`, `.obj`.
   Other CC0 source: „Modular Medieval Building Pack“ (opengameart, walls/doors/windows as parts). kenney.nl is blocked.
   Check the licence file; only CC0 goes into the repo. Note the source in `.claude/LICENSES.md` once an asset ships.
3. **Use the `.blend` files, not FBX** (the FBX import loses the materials, renders black).
4. **Measure**: `bl/bin/python skripte/masse.py -- "<paket>/Buildings/Blends"` prints the bounding box per file
   (units ≈ metres; House_1 is 2.2 × 2.6 × 3.4, Fence 0.8 long).
5. **Compose a scene** as JSON and render it:
   ```json
   {"paket": "<ordner>", "teile": [
     {"datei": "Buildings/Blends/House_1.blend", "pos": [0, 0, 0]},
     {"datei": "Buildings/Blends/Bell_Tower.blend", "pos": [1.55, 1.0, 0], "skala": 0.62},
     {"datei": "Props/Blends/Fence.blend", "pos": [-1.6, -1.8, 0], "dreh": 90}]}
   ```
   `bl/bin/python skripte/iso_szene.py -- szene.json out.png 768` → transparent PNG, about 3 s on CPU (Cycles,
   32 samples). Optional keys: `sonne` (energy), `himmel` (RGBA), `umgebung` (ambient strength) – night variants are
   not tried yet.
   Camera: orthographic, 60° tilt, 45° turn, framed to the whole scene. Seen from +x/−y: the −y side is the left
   visible face (House_1's door), the +x side the right one. Add-ons go to −y/+x to be seen.
6. **Look at it** composited on the page colour (Pillow `alpha_composite`), then show the teacher before going on.
   Sample: `docs/design/lernquest/stilprobe/haus-3d-probe.png` (House_1 + tower + fence + well + fire).

## Offen (Lehrkraft entscheidet)
- 3D-Bilder sind Pixel, nicht Vektor: die Regel „Farben nur aus `stil.ts`“ gilt für sie nicht. Umfärben (z. B. Dach
  in Palettenfarben) geht über die Materialien in Blender.
- Wie die PNGs in die App kommen (Größe, WebP, Ordner, eine Datei je Haus-Stufe und Anbau oder Ebenen) ist noch nicht
  festgelegt. Ebenen-Ansatz (nicht ausprobiert): Haus und jeder Anbau einzeln mit derselben Kamera rendern, dann übereinanderlegen.
