// Screenshots of the figure workshop for a quick look: `npm run werkstatt && node scripts/werkstatt-fotos.mjs <ordner>`.
// Takes #bogen (everything), #teile, one picture per figure and the fox at phone width. Uses the preinstalled Playwright (Chromium).
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ziel = resolve(process.argv[2] ?? 'werkstatt-fotos');
mkdirSync(ziel, { recursive: true });
// The artifact file has no document skeleton (the artifact host adds it); add one for the local browser.
const seite = `${ziel}/werkstatt.html`;
writeFileSync(seite, `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${readFileSync('dist-werkstatt/figuren-werkstatt.html', 'utf8')}</body></html>`);
const figuren = [...readFileSync('src/lernquest/figuren/index.ts', 'utf8').matchAll(/import \{ (\w+) \} from '\.\/(\w+)';/g)].map((m) => m[2]).filter((f) => f !== 'items');

const b = await chromium.launch();
const fehler = [];
for (const [name, breite] of [['bogen', 1280], ['teile', 1280], ...figuren.map((f) => [f, 1280]), ['fuchs', 390]]) {
  const p = await b.newPage({ viewport: { width: breite, height: 1000 }, reducedMotion: 'reduce' });
  p.on('pageerror', (e) => fehler.push(`${name}: ${e.message}`));
  await p.goto(`file://${seite}#${name}`);
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${ziel}/${name}${breite < 600 ? '-handy' : ''}.png`, fullPage: true });
  await p.close();
}
await b.close();
console.log(fehler.length ? fehler.join('\n') : `Fotos in ${ziel}`);
process.exit(fehler.length ? 1 : 0);
