// Heroes in full kit (outfit, hat, tool, companion) at a large size, to see whether everything sits on the body.
// Runs only when asked: OUTFITPROBE=<ordner> npx vitest run src/lernquest/figuren/outfitprobe
import { mkdirSync, writeFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { it } from 'vitest';
import { FigurBild } from './Figur';
import { held, KLEIDUNG } from './held';
import { ITEMS } from '.';

const ziel = process.env.OUTFITPROBE;
it.skipIf(!ziel)('Helden in voller Ausrüstung', () => {
  const item = (id: string) => ITEMS.find((i) => i.id === id)!;
  const hute = ['waldhut', 'wollmuetze', 'kappe', 'zauberhut', 'ritterhelm', 'krone', 'cowboyhut', 'kochmuetze', 'piratenhut', 'pilzhut', 'raumhelm', 'blumenkranz'];
  const werkzeuge = ['holzschwert', 'zauberstab', 'fackel', 'lupe', 'buch', 'kristallschwert', 'angel', 'laterne'];
  const begleiter = ['hamster', 'katze', 'pinguin', 'fuchs', 'eule', 'drache'];
  const frisuren = ['kurz', 'lang', 'locken', 'bob', 'zoepfe', 'afro', 'dutt', 'stacheln'];
  const kleider = Object.keys(KLEIDUNG);
  const html = kleider
    .map((k, n) => {
      const hut = item(hute[n % hute.length]);
      const f = held({ kleidung: k, frisur: frisuren[n % frisuren.length], haut: n % 6, haarfarbe: n % 5, haube: hut.haube });
      const items = [hut, item(werkzeuge[n % werkzeuge.length]), item(begleiter[n % begleiter.length])].filter(Boolean);
      return '<figure style="margin:0;text-align:center;font:12px sans-serif">' + renderToStaticMarkup(<FigurBild figur={f} items={items} zeit={0} lebendig={false} breite={230} />) + '<figcaption>' + k + '</figcaption></figure>';
    })
    .join('');
  mkdirSync(ziel!, { recursive: true });
  writeFileSync(ziel + '/outfits.html', '<!doctype html><meta charset="utf-8"><body style="margin:0;display:flex;flex-wrap:wrap;gap:8px;padding:10px;background:#fbf6e9">' + html + '</body>');
});
