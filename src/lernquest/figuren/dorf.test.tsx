import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AUSSEHEN, AUSSEHEN_TEILE, DORF_GEBAEUDE, HAUS_STUFEN } from "../dorf";
import { GRUND, grundstuecke, JE_VIERTEL } from "../dorfplan";
import { DACH_TOENE, FAHNEN_TOENE, FARBMUSTER, HAUS_BILD, HAUS_GESTALTET, HAUS_TEILE, HOLZ_TOENE, PUTZ_TOENE, TUER_TOENE } from "./haeuser";
import { DORF_TEILE, DorfKarte, GEBAEUDE_BILD } from "./dorf";
import { P } from "./stil";

const PALETTE = new Set(Object.values(P).map((x) => x.toLowerCase()));
const farbenAusserhalb = (html: string) =>
  [...html.matchAll(/#[0-9a-fA-F]{6}\b/g)].map((m) => m[0].toLowerCase()).filter((f) => !PALETTE.has(f));
const ids = DORF_GEBAEUDE.map((g) => g.id);
const hoehe = (html: string) => Number(/viewBox="[-\d.]+ [-\d.]+ [\d.]+ ([\d.]+)"/.exec(html)![1]);
const breite = (html: string) => Number(/viewBox="[-\d.]+ [-\d.]+ ([\d.]+)/.exec(html)![1]);

describe("Klassendorf: Zeichnungen", () => {
  it("hat für jedes Gebäude eine Zeichnung und jede Zeichnung zeichnet", () => {
    for (const g of DORF_GEBAEUDE) expect(GEBAEUDE_BILD[g.id], g.id).toBeTypeOf("function");
    expect(new Set(DORF_TEILE.map((t) => t.id)).size).toBe(DORF_TEILE.length);
    for (const t of DORF_TEILE) expect(renderToStaticMarkup(<svg>{t.zeichnung()}</svg>).length, t.id).toBeGreaterThan(200);
  });

  it("zeigt gebaute Gebäude und die Baustelle auf der Karte", () => {
    const leer = renderToStaticMarkup(<DorfKarte fertig={[]} plaetze={0} titel="Dorf" />);
    const voll = renderToStaticMarkup(<DorfKarte fertig={["brunnen"]} baustelle="bruecke" plaetze={0} titel="Dorf" />);
    expect(voll.length).toBeGreaterThan(leer.length + 1000);
    expect(voll).toContain('aria-label="Dorf"');
  });

  it("ist so breit wie das Handy und wächst mit der Klasse nur nach oben", () => {
    const karte = (n: number) => renderToStaticMarkup(<DorfKarte fertig={[]} plaetze={n} titel="D" />);
    expect(breite(karte(0))).toBe(breite(karte(30)));
    expect(hoehe(karte(JE_VIERTEL * 2))).toBeGreaterThan(hoehe(karte(JE_VIERTEL)));
    expect(hoehe(karte(JE_VIERTEL))).toBeGreaterThan(hoehe(karte(0)));
    expect(hoehe(karte(Number.NaN))).toBe(hoehe(karte(0)));
    expect(hoehe(karte(-3))).toBe(hoehe(karte(0)));
    expect(grundstuecke(14).map((p) => p.viertel)).toEqual([0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2]);
  });

  it("wächst vom Weiler zur Stadt: gepflasterter Weg, Laternen, Marktstände, Stadtmauer", () => {
    const stufe = (fertig: number) => renderToStaticMarkup(<DorfKarte fertig={ids.slice(0, fertig)} plaetze={12} titel="D" />);
    const [weiler, dorf, markt, stadt] = [0, 2, 4, 6].map(stufe);
    expect([weiler, dorf, markt, stadt].map((h) => /data-stufe="(\d)"/.exec(h)![1])).toEqual(["0", "1", "2", "3"]);
    expect(weiler).toContain(P.sand);
    expect(weiler).not.toContain(`fill="${P.putzHell}" data-licht`);
    const laternen = (h: string) => (h.match(/height="28" rx="1.5"/g) ?? []).length;
    expect(laternen(weiler)).toBe(0);
    expect(laternen(dorf)).toBeGreaterThanOrEqual(6);
    // Market stalls only from Marktflecken on, the wall with its round towers only in the city.
    const teil = (h: string, t: string) => (h.match(new RegExp(`data-teil="${t}"`, "g")) ?? []).length;
    expect([weiler, dorf, markt, stadt].map((h) => teil(h, "stand"))).toEqual([0, 0, 2, 2]);
    expect([weiler, dorf, markt, stadt].map((h) => teil(h, "mauer"))).toEqual([0, 0, 0, 1]);
  });

  it("zeichnet Karte, Gebäude, Häuser und Anbauten ohne Verläufe und nur mit Farben der Palette, auch abends und im Winter", () => {
    for (const [abend, winter] of [
      [false, false],
      [true, false],
      [false, true],
      [true, true],
    ])
      for (const fertig of [0, 3, 6]) {
        const html = renderToStaticMarkup(
          <DorfKarte
            fertig={ids.slice(0, fertig)}
            baustelle={ids[fertig] ?? null}
            plaetze={12}
            haeuser={Array.from({ length: 12 }, (_, i) => ({ stufe: i % 6 === 5 ? null : i % 5, name: "X", aussehen: null }))}
            ich={2}
            abend={abend}
            winter={winter}
            neu={{ haeuser: [1], gebaeude: ids.slice(0, 1) }}
            titel="Dorf"
          />,
        );
        expect(html).not.toMatch(/Gradient|filter=|blur/i);
        expect(farbenAusserhalb(html), `${abend}/${winter}/${fertig}`).toEqual([]);
      }
    const teile = renderToStaticMarkup(
      <svg>
        {DORF_TEILE.map((t) => (
          <g key={t.id}>{t.zeichnung()}</g>
        ))}
      </svg>,
    );
    expect(farbenAusserhalb(teile)).toEqual([]);
  });

  it("macht abends dunkel, lässt Fenster und Laternen leuchten und lässt Schnee fallen", () => {
    const karte = (abend: boolean, winter: boolean) =>
      renderToStaticMarkup(
        <DorfKarte fertig={ids.slice(0, 3)} plaetze={6} haeuser={[{ stufe: 3 }, { stufe: 2 }, { stufe: 4 }]} abend={abend} winter={winter} titel="D" />,
      );
    const tag = karte(false, false);
    const nacht = karte(true, false);
    expect(tag).not.toContain("data-licht");
    expect(nacht).toContain(P.nachtTief);
    expect((nacht.match(/data-licht/g) ?? []).length).toBeGreaterThan(10);
    expect(nacht).toContain(`fill="${P.licht}" data-licht`);
    expect(tag).not.toContain(P.schnee);
    expect(karte(false, true)).toContain(P.schnee);
  });

  it("hat für jede Hausstufe eine Zeichnung, und jede Stufe ist größer als die vorige", () => {
    expect(HAUS_BILD).toHaveLength(HAUS_STUFEN.length);
    expect(HAUS_TEILE.map((t) => t.name)).toEqual(HAUS_STUFEN.map((h) => `Haus: ${h.name}`));
    const laenge = HAUS_TEILE.map((t) => renderToStaticMarkup(<svg>{t.zeichnung()}</svg>).length);
    for (let i = 1; i < laenge.length; i++) expect(laenge[i], HAUS_STUFEN[i].name).toBeGreaterThan(laenge[i - 1]);
  });

  it("hat für jede Wahl beim Gestalten eine Farbe oder ein Bild, und jede zeichnet anders", () => {
    expect(DACH_TOENE).toHaveLength(AUSSEHEN.dach.wahl.length);
    expect(HOLZ_TOENE).toHaveLength(AUSSEHEN.wand.wahl.length);
    expect(PUTZ_TOENE).toHaveLength(AUSSEHEN.wand.wahl.length);
    expect(TUER_TOENE).toHaveLength(AUSSEHEN.tuer.wahl.length);
    expect(FAHNEN_TOENE).toHaveLength(AUSSEHEN.fahne.wahl.length);
    for (const t of ["dach", "wand", "tuer", "fahne"] as const) expect(new Set(FARBMUSTER[t]).size, t).toBe(AUSSEHEN[t].wahl.length);
    for (const t of AUSSEHEN_TEILE) {
      const bilder = AUSSEHEN[t].wahl.map((_, k) =>
        renderToStaticMarkup(
          <svg>{<DorfKarte fertig={[]} plaetze={1} haeuser={[{ stufe: 4, aussehen: { dach: 0, wand: 0, tuer: 0, fahne: 0, zaun: 0, garten: 0, deko: 0, [t]: k } }]} titel="D" />}</svg>,
        ),
      );
      expect(new Set(bilder).size, t).toBe(bilder.length);
    }
    for (const t of HAUS_GESTALTET) expect(farbenAusserhalb(renderToStaticMarkup(<svg>{t.zeichnung()}</svg>)), t.id).toEqual([]);
  });

  it("zeigt Häuser auf ihren Grundstücken, „Du“ am eigenen und Namen nur, wenn sie mitkommen", () => {
    const plaetze = [{ stufe: null }, { stufe: 0 }, { stufe: 4 }];
    const kind = renderToStaticMarkup(<DorfKarte fertig={[]} plaetze={3} haeuser={plaetze} ich={1} titel="D" />);
    const leer = renderToStaticMarkup(<DorfKarte fertig={[]} plaetze={3} titel="D" />);
    expect(kind.length).toBeGreaterThan(leer.length + 2000);
    expect(kind).toContain(">Du<");
    expect(kind).toContain("data-ich");
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
    expect(hoehe(renderToStaticMarkup(<DorfKarte fertig={[]} plaetze={0} haeuser={plaetze} titel="D" />))).toBe(hoehe(leer));
    // A broken stage from the server draws an empty plot instead of failing.
    expect(() => renderToStaticMarkup(<DorfKarte fertig={[]} plaetze={1} haeuser={[{ stufe: 9 }]} titel="D" />)).not.toThrow();
  });

  it("lässt Neues aufploppen und nutzt nur eigene, eindeutige Ids", () => {
    const html = renderToStaticMarkup(
      <div>
        <DorfKarte fertig={["brunnen"]} plaetze={6} haeuser={[{ stufe: 2 }]} neu={{ haeuser: [0], gebaeude: ["brunnen"] }} titel="A" />
        <DorfKarte fertig={[]} plaetze={6} titel="B" />
      </div>,
    );
    expect((html.match(/class="lq-neu"/g) ?? []).length).toBe(2);
    expect(html).toContain('class="lq-staub"');
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
    for (const [, ref] of html.matchAll(/url\(#([^)]+)\)/g)) expect(ids, ref).toContain(ref);
    expect(GRUND).toBe(64);
  });
});
