// Stilprobe „ohne Umriss“ (ADR 0001, 19.11.2026): the real fox and hero, today and without outline, side by side, at
// small sizes and on the backgrounds of the app. The outline is taken off in the browser, the code stays as it is:
// outlines of filled shapes take the fill colour (the shape keeps its size), outlines laid on top go, the dark under-
// stroke of limbs takes the limb colour; open lines (mouth, brows) stay. Runs only when asked:
//   STILPROBE=<ordner> npx vitest run src/lernquest/figuren/stilprobe
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { FIGUREN, FigurBild, FRISUR_ARTEN, held, ITEMS } from '.';
import { GEBAEUDE_BILD } from './dorf';
import { P } from './stil';
import type { Figur, Item } from './typen';

const ziel = process.env.STILPROBE;
const fuchs = FIGUREN.find((f) => f.id === 'fuchs')!;
const kombi = (ids: string[]) => ITEMS.filter((x) => ids.includes(x.id));
const HELDEN: { figur: Figur; items: Item[] }[] = [
  { figur: held({ kleidung: 'pulli', haut: 1, frisur: FRISUR_ARTEN[2], haarfarbe: 0 }), items: kombi(['wollmuetze', 'lupe']) },
  { figur: held({ kleidung: 'weste', haut: 3, frisur: FRISUR_ARTEN[4], haarfarbe: 1 }), items: kombi(['piratenhut', 'angel', 'papagei']) },
  { figur: held({ kleidung: 'zauberrobe', haut: 4, frisur: FRISUR_ARTEN[6], haarfarbe: 3 }), items: kombi(['zauberhut', 'zauberstab', 'eule']) },
];

const bild = (f: Figur, breite: number, items: Item[] = [], pose?: string) =>
  renderToStaticMarkup(<FigurBild figur={f} pose={pose} items={items} zeit={0} lebendig={false} breite={breite} />);
// heute | ohne Umriss | ohne Umriss + Trennschatten (the proposal). `zwei` leaves out the middle one.
const paar = (titel: string, inhalt: () => string, zwei = false) =>
  `<figure><div class="reihe"><div>${inhalt()}</div>${zwei ? '' : `<div class="ohne">${inhalt()}</div>`}<div class="ohne trenn">${inhalt()}</div></div><figcaption>${titel}<br><small>${zwei ? 'heute · Vorschlag' : 'heute · nur ohne Umriss · Vorschlag'}</small></figcaption></figure>`;

// Runs in the page: takes the outline (stroke in P.linie) off everything inside `.ohne`. Inside `.trenn` arms and
// head also cast a hard shadow (no blur) to the bottom right, only onto the body (masked by its silhouette), so they
// stay apart from the body without a line.
const OHNE_UMRISS = `(() => {
  const NS = 'http://www.w3.org/2000/svg';
  document.body.insertAdjacentHTML('beforeend', '<svg width="0" height="0" style="position:absolute"><filter id="weiss"><feFlood flood-color="#fff"/><feComposite in2="SourceAlpha" operator="in"/></filter><filter id="schattenform"><feFlood flood-color="${P.schatten}" flood-opacity="0.28"/><feComposite in2="SourceAlpha" operator="in"/></filter></svg>');
  let n = 0;
  for (const k of document.querySelectorAll('.trenn [data-teil="koerper"]')) {
    n += 1;
    k.id = 'koerper' + n;
    const maske = document.createElementNS(NS, 'mask');
    maske.id = 'maske' + n;
    for (const [a, v] of [['maskUnits', 'userSpaceOnUse'], ['x', '-500'], ['y', '-500'], ['width', '1500'], ['height', '1500']]) maske.setAttribute(a, v);
    const u = document.createElementNS(NS, 'use');
    u.setAttribute('href', '#koerper' + n);
    u.setAttribute('filter', 'url(#weiss)');
    maske.append(u);
    k.ownerSVGElement.append(maske);
    for (const t of k.parentNode.querySelectorAll(':scope > [data-teil^="arm-"], :scope > [data-teil="kopf"]')) {
      const huelle = document.createElementNS(NS, 'g');
      huelle.setAttribute('mask', 'url(#maske' + n + ')');
      const versatz = document.createElementNS(NS, 'g');
      versatz.setAttribute('transform', 'translate(3 3)');
      versatz.setAttribute('filter', 'url(#schattenform)');
      versatz.append(t.cloneNode(true));
      huelle.append(versatz);
      t.parentNode.insertBefore(huelle, t);
    }
  }
  const L = '${P.linie.toLowerCase()}';
  const farbe = (el) => (el.getAttribute('stroke') || '').toLowerCase();
  for (const root of document.querySelectorAll('.ohne')) {
    for (const el of [...root.querySelectorAll('[stroke]')]) {
      if (farbe(el) !== L) continue;
      const w = parseFloat(el.getAttribute('stroke-width') || '1');
      const fuellung = getComputedStyle(el).fill;
      const d = (el.getAttribute('d') || '').trim();
      const tag = el.tagName.toLowerCase();
      const zu = !['path', 'line', 'polyline'].includes(tag) || /z$/i.test(d);
      const naechstes = el.nextElementSibling;
      if (w >= 8 && naechstes && naechstes.getAttribute('d') === el.getAttribute('d') && naechstes.getAttribute('stroke')) {
        el.setAttribute('stroke', naechstes.getAttribute('stroke'));            // limb under-stroke
      } else if (el.tagName.toLowerCase() === 'g') {
        el.setAttribute('stroke', 'none');                                       // group outline
      } else if (fuellung && fuellung !== 'none') {
        if (fuellung.startsWith('url(')) el.setAttribute('stroke', 'none');
        else el.setAttribute('stroke', fuellung);                                // outline of a filled shape
      } else if (zu || w >= 3) {
        el.setAttribute('stroke', 'none');                                       // outline laid on top
      }                                                                           // else: open line, stays
    }
  }
})()`;

it.skipIf(!ziel)('writes the Stilprobe ohne Umriss', async () => {
  const t: string[] = [];
  t.push('<h2>1 · Fuchs, alle Posen</h2><div class="zeile">');
  for (const p of Object.keys(fuchs.posen)) t.push(paar(fuchs.posen[p].name, () => bild(fuchs, 150, [], p)));
  t.push('</div><h2>2 · Held mit Ausrüstung</h2><div class="zeile">');
  HELDEN.forEach((h, i) => t.push(paar(`Held ${i + 1}`, () => bild(h.figur, 180, h.items))));
  t.push('</div><h2>3 · Größenprobe 48 px und 32 px</h2><div class="zeile">');
  for (const g of [48, 32])
    t.push(paar(`${g} px`, () => [bild(fuchs, g), ...HELDEN.map((h) => bild(h.figur, g, h.items))].join(''), true));
  t.push('</div><h2>4 · Vorschlag auf den Hintergründen der App</h2><div class="zeile">');
  const gruende: [string, string][] = [
    ['Creme (App)', '#FBF6E9'],
    ['Wiese (Karte)', P.wiese],
    ['Nacht (Truhe, Boss)', '#1F1A3D'],
    ['Dunkelgrün (Boss)', '#173A1C'],
  ];
  for (const [name, farbe] of gruende)
    t.push(
      `<figure><div class="reihe ohne trenn" style="background:${farbe};padding:10px;border-radius:12px">${bild(fuchs, 110)}${bild(HELDEN[0].figur, 120, HELDEN[0].items)}${bild(fuchs, 48)}</div><figcaption>${name}</figcaption></figure>`,
    );
  const haus = renderToStaticMarkup(<>{GEBAEUDE_BILD.baeckerei()}</>);
  t.push(
    `<figure><div class="ohne trenn" style="background:${P.wiese};border-radius:12px;position:relative;width:340px;height:260px">` +
      `<svg width="260" height="260" viewBox="-95 -160 190 230" style="position:absolute;left:70px;top:0">${haus}</svg>` +
      `<div style="position:absolute;left:12px;top:150px">${bild(HELDEN[1].figur, 100, HELDEN[1].items)}</div>` +
      `<div style="position:absolute;left:240px;top:168px">${bild(fuchs, 80, [], 'winken')}</div></div><figcaption>Vor dem Dorf (Haus noch mit Verläufen)</figcaption></figure>`,
  );
  t.push('</div>');
  const html = `<!doctype html><meta charset="utf-8"><style>body{font:14px system-ui;background:#f3efe6;margin:16px;color:#263322}h2{font-size:17px;margin:18px 0 8px}.zeile{display:flex;flex-wrap:wrap;gap:12px}figure{margin:0;background:#FBF6E9;padding:8px;border-radius:12px}.reihe{display:flex;gap:6px;align-items:end}.reihe>div{display:flex;gap:4px;align-items:end}figcaption{text-align:center;margin-top:4px}small{color:#556149}</style><h1 style="font-size:20px">Stilprobe: ohne Umriss (10 %, nur Richtung)</h1>${t.join('')}`;
  mkdirSync(ziel!, { recursive: true });
  const datei = join(ziel!, 'stilprobe-umriss.html');
  writeFileSync(datei, html);
  const { chromium } = createRequire(import.meta.url)('playwright') as { chromium: { launch: () => Promise<any> } };
  const b = await chromium.launch();
  const s = await b.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 });
  await s.goto(`file://${datei}`);
  await s.evaluate(OHNE_UMRISS);
  await s.screenshot({ path: join(ziel!, 'stilprobe-umriss.png'), fullPage: true });
  await b.close();
  expect(t.length).toBeGreaterThan(0);
}, 60_000);
