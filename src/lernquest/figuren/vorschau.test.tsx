// A quick look at drawings without the workshop: writes a page and a screenshot (Playwright) of one group.
// Runs only when asked:  VORSCHAU=<ordner> VORSCHAU_TEIL=<kopf|werkzeug|begleiter|hintergrund|held|fuchs|eigen|dorf|karte|alles> [VORSCHAU_ITEM=<hut-id>] npx vitest run src/lernquest/figuren/vorschau
// VORSCHAU_NUR=<id>,<id> keeps only these items, backgrounds, figures (all poses) and, with VORSCHAU_TEIL=held, parts.
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { AUGEN_ARTEN, FIGUREN, FigurBild, FRISUR_ARTEN, held, ITEMS, ItemBild, KLEIDUNG, MUND_ARTEN } from '.';
import { DORF_GEBAEUDE } from '../dorf';
import { Landkarte } from '../app/Landkarte';
import { Landschaft } from '../app/Landschaft';
import { DorfKarte, GEBAEUDE_BILD } from './dorf';
import { HAUS_GESTALTET, HAUS_TEILE } from './haeuser';
import { GELAENDE } from './gelaende';
import { MODUL_WELTEN, WELT_TEILE } from './welten';
import { HINTERGRUENDE } from './hintergruende';
import type { Figur, Item, Teil } from './typen';

const ziel = process.env.VORSCHAU;
const teil = process.env.VORSCHAU_TEIL ?? 'alles';
const nur = process.env.VORSCHAU_NUR?.split(',');
const gewaehlt = (id: string) => !nur || nur.includes(id);
const PLATZ: Record<string, string[]> = { kopf: ['hut'], werkzeug: ['hand-rechts', 'hand-links'], begleiter: ['begleiter'] };

const alle = (t: Teil[]): Teil[] => t.flatMap((x) => [x, ...alle(x.kinder ?? [])]);
const traeger = (i: Item): Figur | undefined => [...FIGUREN].reverse().find((f) => alle(f.teile).some((t) => Object.keys(t.anker ?? {}).includes(i.platz)));

it.skipIf(!ziel)(
  'writes a preview page and screenshot',
  async () => {
    const teile: string[] = [];
    const items = ITEMS.filter((i) => (teil === 'alles' || PLATZ[teil]?.includes(i.platz)) && gewaehlt(i.id));
    if (teil === 'dorf') {
      // Richtung A: the map at phone size (330 wide, 1:1) for each village stage, evening, winter, the teacher's view and
      // a city of 30; then every house stage, every look and the buildings alone.
      const ids = DORF_GEBAEUDE.map((g) => g.id);
      const namen = ['Ali', 'Bea', 'Can', 'Dana', 'Emil', 'Fiona', 'Gül', 'Hannes', 'Ida', 'Jonas', 'Kim', 'Maximilian-Alexander'];
      const haeuser = (n: number) => Array.from({ length: n }, (_, i) => ({ stufe: i % 7 === 6 ? null : i % 5, name: namen[i % namen.length], aussehen: null }));
      const karte = (titel: string, p: Parameters<typeof DorfKarte>[0], hoch = 900) =>
        teile.push(
          `<figure style="width:330px"><div class="karte" style="height:${hoch}px;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end">${renderToStaticMarkup(<DorfKarte {...p} />)}</div><figcaption>${titel}</figcaption></figure>`,
        );
      const kind = (fertig: number, extra: Partial<Parameters<typeof DorfKarte>[0]> = {}) => ({
        fertig: ids.slice(0, fertig),
        baustelle: ids[fertig] ?? null,
        plaetze: 14,
        haeuser: haeuser(14).map(({ stufe, aussehen }) => ({ stufe, aussehen })),
        ich: 3,
        titel: 'Dorf',
        held: <FigurBild figur={held({ kleidung: 'kapuzenpulli', frisur: 'locken', haut: 2 })} zeit={0} lebendig={false} breite={240} />,
        ...extra,
      });
      karte('Weiler (0 Gebäude)', kind(0));
      karte('Dorf (2)', kind(2));
      karte('Marktflecken (4)', kind(4));
      karte('Stadt (6)', kind(6));
      karte('Stadt am Abend', kind(6, { abend: true }));
      karte('Dorf im Winter', kind(3, { winter: true }));
      karte('Winterabend', kind(5, { winter: true, abend: true }));
      karte('Lehrkraft (Namen)', { fertig: ids.slice(0, 3), plaetze: 14, haeuser: haeuser(14), titel: 'Dorf' });
      karte('Häuser noch aus', { fertig: ids.slice(0, 1), baustelle: ids[1], plaetze: 6, hinweis: 'Bald: eure Häuser', titel: 'Dorf' });
      karte(
        'Stadt mit 30 Häusern',
        { fertig: ids, plaetze: 30, haeuser: haeuser(30).map(({ stufe }, i) => ({ stufe: stufe ?? 2, aussehen: null, ...(i === 20 ? {} : {}) })), ich: 20, titel: 'Dorf' },
        2400,
      );
      for (const t of [...HAUS_TEILE, ...HAUS_GESTALTET])
        teile.push(
          `<figure><div class="reihe"><svg width="160" height="${(160 * t.rahmen[3]) / t.rahmen[2]}" viewBox="${t.rahmen.join(' ')}">${renderToStaticMarkup(<>{t.zeichnung()}</>)}</svg><svg width="48" height="48" viewBox="${t.rahmen.join(' ')}">${renderToStaticMarkup(<>{t.zeichnung()}</>)}</svg></div><figcaption>${t.id}</figcaption></figure>`,
        );
      for (const [id, bild] of Object.entries(GEBAEUDE_BILD).filter(([id]) => gewaehlt(id)))
        teile.push(`<figure><svg width="220" height="220" viewBox="-110 -160 220 220">${renderToStaticMarkup(<>{bild()}</>)}</svg><figcaption>${id}</figcaption></figure>`);
    }
    if (teil === 'karte') {
      // One region per world (modules in turn, then the two Extra-Pakete regions), then every piece alone.
      if (gewaehlt('landschaft')) teile.push(`<figure style="width:400px">${renderToStaticMarkup(<Landschaft />)}<figcaption>Landschaft (Start)</figcaption></figure>`);
      const regionen: [string, number][] = [...MODUL_WELTEN.map((_, i): [string, number] => [`m${i + 1}`, i + 1]), ['extra-wortschatz-5', 1], ['extra-grammatik-5', 1]];
      for (const [id, n] of regionen.filter(([id]) => gewaehlt(id)))
        teile.push(
          `<figure style="width:300px">${renderToStaticMarkup(<Landkarte id={id} nummer={n} kopf={id} punkte={[1, 2, 3, 4].map((k) => ({ key: `${k}`, inhalt: k }))} mitBoss />)}<figcaption>${id}</figcaption></figure>`,
        );
      for (const t of [...GELAENDE, ...WELT_TEILE].filter((x) => gewaehlt(x.id))) {
        const [x, y, w, h] = t.rahmen;
        teile.push(
          `<figure><div class="reihe"><svg width="${Math.max(120, w)}" height="${Math.max(120, w) * (h / w)}" viewBox="${x} ${y} ${w} ${h}">${renderToStaticMarkup(<>{t.zeichnung()}</>)}</svg><svg width="48" height="48" viewBox="${x} ${y} ${w} ${h}">${renderToStaticMarkup(<>{t.zeichnung()}</>)}</svg></div><figcaption>${t.id}</figcaption></figure>`,
        );
      }
    }
    if (teil !== 'hintergrund' && teil !== 'held' && teil !== 'dorf' && teil !== 'karte')
      for (const i of items) {
        const f = traeger(i);
        teile.push(
          `<figure><div class="reihe">${renderToStaticMarkup(<ItemBild item={i} groesse={120} zeit={0.4} />)}${renderToStaticMarkup(<ItemBild item={i} groesse={48} zeit={0.4} />)}${
            f ? renderToStaticMarkup(<FigurBild figur={f} items={[i]} zeit={0} lebendig={false} breite={160} />) : ''
          }</div><figcaption>${i.id} · ${i.seltenheit}</figcaption></figure>`,
        );
      }
    if (teil === 'hintergrund' || teil === 'alles')
      for (const h of HINTERGRUENDE.filter((x) => gewaehlt(x.id)))
        teile.push(
          `<figure><div class="reihe"><svg width="240" height="240" viewBox="0 0 240 240">${renderToStaticMarkup(<>{h.zeichnung(0.4)}</>)}</svg><svg width="64" height="64" viewBox="0 0 240 240">${renderToStaticMarkup(<>{h.zeichnung(0)}</>)}</svg></div><figcaption>${h.id} · ${h.seltenheit}</figcaption></figure>`,
        );
    if (teil === 'held' || teil === 'fuchs' || teil === 'alles')
      for (const f of FIGUREN.filter((x) => (nur ? nur.includes(x.id) : teil === 'fuchs' ? x.id === 'fuchs' : x.art === 'held')))
        for (const p of Object.keys(f.posen))
          teile.push(`<figure>${renderToStaticMarkup(<FigurBild figur={f} pose={p} zeit={0} lebendig={false} breite={200} />)}<figcaption>${f.id} · ${p}</figcaption></figure>`);
    if (teil === 'eigen') {
      const HELM = process.env.VORSCHAU_ITEM ?? 'e97c799d057';
      const bg = HINTERGRUENDE.find((h) => h.id === 'e57ef47f771')!;
      teile.push(
        `<figure><svg width="300" height="300" viewBox="0 0 240 240">${renderToStaticMarkup(
          <>
            {bg.zeichnung(0.4)}
            <FigurBild figur={held({ kleidung: 'e0a70ed2238', frisur: 'f25e0e76346', haut: 2 })} items={ITEMS.filter((i) => i.id === HELM)} zeit={0} lebendig={false} breite={240} />
          </>,
        )}</svg><figcaption>alle vier</figcaption></figure>`,
      );
      teile.push(
        `<figure>${renderToStaticMarkup(<FigurBild figur={held({ kleidung: 'e0a70ed2238', frisur: 'f25e0e76346', haarfarbe: 3 })} zeit={0} lebendig={false} breite={200} />)}<figcaption>ohne Helm</figcaption></figure>`,
      );
      teile.push(
        `<figure>${renderToStaticMarkup(<ItemBild item={ITEMS.find((i) => i.id === HELM)!} groesse={120} zeit={0} />)}${renderToStaticMarkup(<ItemBild item={ITEMS.find((i) => i.id === HELM)!} groesse={48} zeit={0} />)}<figcaption>Helm</figcaption></figure>`,
      );
    }
    if (teil === 'held') {
      const zeige = (name: string, a: Parameters<typeof held>[0]) =>
        gewaehlt(name) && teile.push(`<figure>${renderToStaticMarkup(<FigurBild figur={held(a)} zeit={0} lebendig={false} breite={nur ? 280 : 140} />)}<figcaption>${name}</figcaption></figure>`);
      [0, 1, 2, 3, 4, 5].forEach((h) => zeige(`haut ${h}`, { haut: h, frisur: FRISUR_ARTEN[h], haarfarbe: h % 5 }));
      FRISUR_ARTEN.forEach((fr, i) => zeige(fr, { frisur: fr, haarfarbe: (i + 2) % 5, haut: (i + 3) % 6 }));
      AUGEN_ARTEN.forEach((au, i) => zeige(au, { augen: au, haut: i % 6, frisur: FRISUR_ARTEN[(i + 4) % 9] }));
      MUND_ARTEN.forEach((m, i) => zeige(m, { mund: m, haut: (i + 2) % 6 }));
      Object.keys(KLEIDUNG).forEach((k, i) => zeige(k, { kleidung: k, haut: i % 6, frisur: FRISUR_ARTEN[i % 9], haarfarbe: i % 5 }));
      const kombi = (hut: string, wz: string, bg: string) => ITEMS.filter((x) => [hut, wz, bg].includes(x.id));
      if (!nur)
        [
          ['krone', 'sternenschwert', 'drache', 'goldruestung'],
          ['piratenhut', 'angel', 'papagei', 'weste'],
          ['raumhelm', 'kompass', 'roboter', 'raumanzug'],
          ['zauberhut', 'zauberstab', 'eule', 'zauberrobe'],
          ['wollmuetze', 'lupe', 'katze', 'pulli'],
        ].forEach(([h, w, b, k], i) =>
          teile.push(
            `<figure>${renderToStaticMarkup(<FigurBild figur={held({ kleidung: k, haut: i + 1, frisur: FRISUR_ARTEN[i + 2], haarfarbe: i })} items={kombi(h, w, b)} zeit={0} lebendig={false} breite={200} />)}<figcaption>${h}+${w}+${b}</figcaption></figure>`,
          ),
        );
    }
    const html = `<!doctype html><meta charset="utf-8"><style>body{font:14px system-ui;background:#f3efe6;display:flex;flex-wrap:wrap;gap:12px;margin:12px}figure{margin:0;background:#fff;padding:8px;border-radius:12px}.reihe{display:flex;gap:8px;align-items:end}figcaption{text-align:center}.karte svg{display:block;width:100%;height:auto;flex:none}.lq-landkarte-flaeche{position:relative}.lq-landkarte-flaeche svg{display:block;width:100%}.lq-wegpunkte{margin:0;padding:0}.lq-wegpunkt{position:absolute;list-style:none;transform:translate(-50%,-50%);width:36px;height:36px;border-radius:50%;background:#fff;display:grid;place-items:center;box-shadow:0 3px 0 #0003}</style>${teile.join('')}`;
    mkdirSync(ziel!, { recursive: true });
    const datei = join(ziel!, `vorschau-${teil}.html`);
    writeFileSync(datei, html);
    // The preinstalled Playwright (global, not a dependency of the project).
    const { chromium } = createRequire(import.meta.url)('playwright') as { chromium: { launch: (o?: object) => Promise<any> } };
    const b = await chromium.launch(process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {});
    const s = await b.newPage({ viewport: { width: 1400, height: 900 } });
    await s.goto(`file://${datei}`);
    await s.screenshot({ path: join(ziel!, `vorschau-${teil}.png`), fullPage: true });
    await b.close();
    expect(teile.length).toBeGreaterThan(0);
  },
  60_000,
);
