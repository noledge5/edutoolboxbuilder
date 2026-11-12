// A quick look at drawings without the workshop: writes a page and a screenshot (Playwright) of one group.
// Runs only when asked:  VORSCHAU=<ordner> VORSCHAU_TEIL=<kopf|werkzeug|begleiter|hintergrund|held|fuchs|eigen|alles> [VORSCHAU_ITEM=<hut-id>] npx vitest run src/lernquest/figuren/vorschau
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { AUGEN_ARTEN, FIGUREN, FigurBild, FRISUR_ARTEN, held, ITEMS, ItemBild, KLEIDUNG, MUND_ARTEN } from '.';
import { HINTERGRUENDE } from './hintergruende';
import type { Figur, Item, Teil } from './typen';

const ziel = process.env.VORSCHAU;
const teil = process.env.VORSCHAU_TEIL ?? 'alles';
const PLATZ: Record<string, string[]> = { kopf: ['hut'], werkzeug: ['hand-rechts', 'hand-links'], begleiter: ['begleiter'] };

const alle = (t: Teil[]): Teil[] => t.flatMap((x) => [x, ...alle(x.kinder ?? [])]);
const traeger = (i: Item): Figur | undefined =>
  [...FIGUREN].reverse().find((f) => alle(f.teile).some((t) => Object.keys(t.anker ?? {}).includes(i.platz)));

it.skipIf(!ziel)('writes a preview page and screenshot', async () => {
  const teile: string[] = [];
  const items = ITEMS.filter((i) => teil === 'alles' || PLATZ[teil]?.includes(i.platz));
  if (teil !== 'hintergrund' && teil !== 'held')
    for (const i of items) {
      const f = traeger(i);
      teile.push(
        `<figure><div class="reihe">${renderToStaticMarkup(<ItemBild item={i} groesse={120} zeit={0.4} />)}${renderToStaticMarkup(<ItemBild item={i} groesse={48} zeit={0.4} />)}${
          f ? renderToStaticMarkup(<FigurBild figur={f} items={[i]} zeit={0} lebendig={false} breite={160} />) : ''
        }</div><figcaption>${i.id} · ${i.seltenheit}</figcaption></figure>`,
      );
    }
  if (teil === 'hintergrund' || teil === 'alles')
    for (const h of HINTERGRUENDE)
      teile.push(
        `<figure><div class="reihe"><svg width="240" height="240" viewBox="0 0 240 240">${renderToStaticMarkup(<>{h.zeichnung(0.4)}</>)}</svg><svg width="64" height="64" viewBox="0 0 240 240">${renderToStaticMarkup(<>{h.zeichnung(0)}</>)}</svg></div><figcaption>${h.id} · ${h.seltenheit}</figcaption></figure>`,
      );
  if (teil === 'held' || teil === 'fuchs' || teil === 'alles')
    for (const f of FIGUREN.filter((x) => (teil === 'fuchs' ? x.id === 'fuchs' : x.art === 'held')))
      for (const p of Object.keys(f.posen))
        teile.push(`<figure>${renderToStaticMarkup(<FigurBild figur={f} pose={p} zeit={0} lebendig={false} breite={200} />)}<figcaption>${f.id} · ${p}</figcaption></figure>`);
  if (teil === 'eigen') {
    const HELM = process.env.VORSCHAU_ITEM ?? 'e97c799d057';
    const bg = HINTERGRUENDE.find((h) => h.id === 'e57ef47f771')!;
    teile.push(`<figure><svg width="300" height="300" viewBox="0 0 240 240">${renderToStaticMarkup(<>{bg.zeichnung(0.4)}<FigurBild figur={held({ kleidung: 'e0a70ed2238', frisur: 'f25e0e76346', haut: 2 })} items={ITEMS.filter((i) => i.id === HELM)} zeit={0} lebendig={false} breite={240} /></>)}</svg><figcaption>alle vier</figcaption></figure>`);
    teile.push(`<figure>${renderToStaticMarkup(<FigurBild figur={held({ kleidung: 'e0a70ed2238', frisur: 'f25e0e76346', haarfarbe: 3 })} zeit={0} lebendig={false} breite={200} />)}<figcaption>ohne Helm</figcaption></figure>`);
    teile.push(`<figure>${renderToStaticMarkup(<ItemBild item={ITEMS.find((i) => i.id === HELM)!} groesse={120} zeit={0} />)}${renderToStaticMarkup(<ItemBild item={ITEMS.find((i) => i.id === HELM)!} groesse={48} zeit={0} />)}<figcaption>Helm</figcaption></figure>`);
  }
  if (teil === 'held') {
    const zeige = (name: string, a: Parameters<typeof held>[0]) =>
      teile.push(`<figure>${renderToStaticMarkup(<FigurBild figur={held(a)} zeit={0} lebendig={false} breite={140} />)}<figcaption>${name}</figcaption></figure>`);
    [0, 1, 2, 3, 4, 5].forEach((h) => zeige(`haut ${h}`, { haut: h, frisur: FRISUR_ARTEN[h], haarfarbe: h % 5 }));
    FRISUR_ARTEN.forEach((fr, i) => zeige(fr, { frisur: fr, haarfarbe: (i + 2) % 5, haut: (i + 3) % 6 }));
    AUGEN_ARTEN.forEach((au, i) => zeige(au, { augen: au, haut: i % 6, frisur: FRISUR_ARTEN[(i + 4) % 9] }));
    MUND_ARTEN.forEach((m, i) => zeige(m, { mund: m, haut: (i + 2) % 6 }));
    Object.keys(KLEIDUNG).forEach((k, i) => zeige(k, { kleidung: k, haut: i % 6, frisur: FRISUR_ARTEN[i % 9], haarfarbe: i % 5 }));
    const kombi = (hut: string, wz: string, bg: string) => ITEMS.filter((x) => [hut, wz, bg].includes(x.id));
    [['krone', 'sternenschwert', 'drache', 'goldruestung'], ['piratenhut', 'angel', 'papagei', 'weste'], ['raumhelm', 'kompass', 'roboter', 'raumanzug'], ['zauberhut', 'zauberstab', 'eule', 'zauberrobe'], ['wollmuetze', 'lupe', 'katze', 'pulli']].forEach(([h, w, b, k], i) =>
      teile.push(`<figure>${renderToStaticMarkup(<FigurBild figur={held({ kleidung: k, haut: i + 1, frisur: FRISUR_ARTEN[i + 2], haarfarbe: i })} items={kombi(h, w, b)} zeit={0} lebendig={false} breite={200} />)}<figcaption>${h}+${w}+${b}</figcaption></figure>`),
    );
  }
  const html = `<!doctype html><meta charset="utf-8"><style>body{font:14px system-ui;background:#f3efe6;display:flex;flex-wrap:wrap;gap:12px;margin:12px}figure{margin:0;background:#fff;padding:8px;border-radius:12px}.reihe{display:flex;gap:8px;align-items:end}figcaption{text-align:center}</style>${teile.join('')}`;
  mkdirSync(ziel!, { recursive: true });
  const datei = join(ziel!, `vorschau-${teil}.html`);
  writeFileSync(datei, html);
  // The preinstalled Playwright (global, not a dependency of the project).
  const { chromium } = createRequire(import.meta.url)('playwright') as { chromium: { launch: () => Promise<any> } };
  const b = await chromium.launch();
  const s = await b.newPage({ viewport: { width: 1400, height: 900 } });
  await s.goto(`file://${datei}`);
  await s.screenshot({ path: join(ziel!, `vorschau-${teil}.png`), fullPage: true });
  await b.close();
  expect(teile.length).toBeGreaterThan(0);
}, 60_000);
