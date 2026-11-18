import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DORF_GEBAEUDE } from "../dorf";
import {
  DORF_TEILE,
  DorfKarte,
  GEBAEUDE_BILD,
  grundstuecke,
  JE_VIERTEL,
} from "./dorf";

describe("Klassendorf: Zeichnungen", () => {
  it("hat für jedes Gebäude eine Zeichnung und jede Zeichnung zeichnet", () => {
    for (const g of DORF_GEBAEUDE)
      expect(GEBAEUDE_BILD[g.id], g.id).toBeTypeOf("function");
    expect(new Set(DORF_TEILE.map((t) => t.id)).size).toBe(DORF_TEILE.length);
    for (const t of DORF_TEILE)
      expect(
        renderToStaticMarkup(<svg>{t.zeichnung()}</svg>).length,
        t.id,
      ).toBeGreaterThan(200);
  });

  it("zeigt gebaute Gebäude und die Baustelle auf der Karte", () => {
    const leer = renderToStaticMarkup(
      <DorfKarte fertig={[]} plaetze={0} titel="Dorf" />,
    );
    const voll = renderToStaticMarkup(
      <DorfKarte
        fertig={["brunnen"]}
        baustelle="bruecke"
        plaetze={0}
        titel="Dorf"
      />,
    );
    expect(voll.length).toBeGreaterThan(leer.length + 1000);
    expect(voll).toContain('aria-label="Dorf"');
  });

  it("legt Grundstücke in Vierteln zu sechs an, ohne Überlappung, und die Karte wächst nach rechts", () => {
    const g = grundstuecke(14);
    expect(g.map((p) => p.viertel)).toEqual([
      0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2,
    ]);
    for (let i = 0; i < g.length; i++)
      for (let j = i + 1; j < g.length; j++) {
        const ueber =
          Math.abs(g[i].x - g[j].x) < 56 && Math.abs(g[i].y - g[j].y) < 56;
        expect(ueber, `${i}/${j}`).toBe(false);
      }
    // Not on the square (0..300 × 0..300).
    for (const p of g)
      expect(p.x >= 300 || p.y + 56 <= 0, JSON.stringify(p)).toBe(true);
    const breite = (n: number) =>
      Number(
        /viewBox="[-\d.]+ [-\d.]+ ([\d.]+)/.exec(
          renderToStaticMarkup(<DorfKarte fertig={[]} plaetze={n} titel="D" />),
        )![1],
      );
    expect(breite(JE_VIERTEL * 2)).toBeGreaterThan(breite(JE_VIERTEL));
    expect(breite(JE_VIERTEL)).toBeGreaterThan(breite(0));
    expect(breite(Number.NaN)).toBe(breite(0));
    expect(breite(-3)).toBe(breite(0));
  });

  it("nutzt für Verläufe nur eigene, eindeutige Ids", () => {
    const html = renderToStaticMarkup(
      <div>
        <DorfKarte fertig={[]} plaetze={6} titel="A" />
        <DorfKarte fertig={[]} plaetze={6} titel="B" />
      </div>,
    );
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
    for (const [, ref] of html.matchAll(/url\(#([^)]+)\)/g))
      expect(ids, ref).toContain(ref);
  });
});
