import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DORF_GEBAEUDE, HAUS_STUFEN } from "../dorf";
import { HAUS_BILD, HAUS_TEILE } from "./haeuser";
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

  it("zeichnet Karte, Gebäude und Anbauten ohne Verläufe (ADR 0001, nur flache Töne)", () => {
    const html = renderToStaticMarkup(
      <svg>
        <DorfKarte
          fertig={DORF_GEBAEUDE.map((g) => g.id)}
          baustelle={DORF_GEBAEUDE[0].id}
          plaetze={12}
          titel="Dorf"
        />
        {Object.values(GEBAEUDE_BILD).map((b, i) => (
          <g key={i}>{b()}</g>
        ))}
        {DORF_TEILE.map((t) => (
          <g key={t.id}>{t.zeichnung()}</g>
        ))}
        <DorfKarte
          fertig={[]}
          plaetze={5}
          haeuser={HAUS_STUFEN.map((_, i) => ({ stufe: i, name: "X" }))}
          ich={0}
          titel="Häuser"
        />
      </svg>,
    );
    expect(html).not.toMatch(/Gradient|filter=|blur/i);
  });

  it("hat für jede Hausstufe eine Zeichnung, und jede Stufe ist größer als die vorige", () => {
    expect(HAUS_BILD).toHaveLength(HAUS_STUFEN.length);
    expect(HAUS_TEILE.map((t) => t.name)).toEqual(
      HAUS_STUFEN.map((h) => `Haus: ${h.name}`),
    );
    const laenge = HAUS_TEILE.map(
      (t) => renderToStaticMarkup(<svg>{t.zeichnung()}</svg>).length,
    );
    for (let i = 1; i < laenge.length; i++)
      expect(laenge[i], HAUS_STUFEN[i].name).toBeGreaterThan(laenge[i - 1]);
  });

  it("zeigt Häuser auf ihren Grundstücken, „Du“ am eigenen und Namen nur, wenn sie mitkommen", () => {
    const plaetze = [{ stufe: null }, { stufe: 0 }, { stufe: 4 }];
    const kind = renderToStaticMarkup(
      <DorfKarte fertig={[]} plaetze={3} haeuser={plaetze} ich={1} titel="D" />,
    );
    const leer = renderToStaticMarkup(
      <DorfKarte fertig={[]} plaetze={3} titel="D" />,
    );
    expect(kind.length).toBeGreaterThan(leer.length + 2000);
    expect(kind).toContain(">Du<");
    const lehrkraft = renderToStaticMarkup(
      <DorfKarte
        fertig={[]}
        plaetze={3}
        haeuser={[
          { stufe: null, name: "Ali" },
          { stufe: 2, name: "Bea" },
          { stufe: 1, name: "Maximilian-Alexander" },
        ]}
        titel="D"
      />,
    );
    expect(lehrkraft).toContain(">Ali<");
    expect(lehrkraft).toContain(">Bea<");
    expect(lehrkraft).toContain(">Maximilia…<");
    expect(lehrkraft).not.toContain(">Du<");
    // More houses than plots: the map makes room for all of them.
    const breite = (html: string) =>
      Number(/viewBox="[-\d.]+ [-\d.]+ ([\d.]+)/.exec(html)![1]);
    expect(
      breite(
        renderToStaticMarkup(
          <DorfKarte fertig={[]} plaetze={0} haeuser={plaetze} titel="D" />,
        ),
      ),
    ).toBe(breite(leer));
  });

  it("nutzt nur eigene, eindeutige Ids", () => {
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
