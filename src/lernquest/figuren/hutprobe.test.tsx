// Every hat on the hero (Held 4: does it sit on the block head?). Runs only when asked:
// HUTPROBE=<ordner> npx vitest run src/lernquest/figuren/hutprobe
import { mkdirSync, writeFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { it } from 'vitest';
import { FigurBild } from './Figur';
import { held } from './held';
import { ITEMS } from '.';
const ziel = process.env.HUTPROBE;
it.skipIf(!ziel)('Hüte am Held', () => {
  const hute = ITEMS.filter((i) => i.platz === 'hut');
  const frisuren = ['kurz', 'bob', 'locken', 'stacheln'];
  const html = hute
    .map(
      (h, n) =>
        '<figure style="margin:0;text-align:center;font:12px sans-serif">' +
        renderToStaticMarkup(<FigurBild figur={held({ frisur: frisuren[n % 4], haut: n % 6 })} items={[h]} zeit={0} lebendig={false} breite={130} />) +
        '<figcaption>' +
        h.id +
        '</figcaption></figure>',
    )
    .join('');
  mkdirSync(ziel!, { recursive: true });
  writeFileSync(ziel + '/hute.html', '<!doctype html><meta charset="utf-8"><body style="margin:0;display:flex;flex-wrap:wrap;gap:6px;padding:10px;background:#fbf6e9">' + html + '</body>');
});
