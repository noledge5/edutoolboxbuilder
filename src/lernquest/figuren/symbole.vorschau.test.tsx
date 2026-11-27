// Runs only when asked: SYMBOLE=<ordner> npx vitest run src/lernquest/figuren/symbole.vorschau — writes symbole.html.
import { mkdirSync, writeFileSync } from 'node:fs';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { it } from 'vitest';
import * as S from './symbole';

const ziel = process.env.SYMBOLE;
it.skipIf(!ziel)('Symbole als Bogen', () => {
  const liste = Object.entries(S).filter(([n]) => n.startsWith('Symbol')) as [string, (p: { groesse?: number }) => ReactElement][];
  const reihe = (bg: string) =>
    `<div style="display:flex;gap:18px;align-items:end;padding:16px;background:${bg}">${liste.map(([n, C]) => `<figure style="margin:0;text-align:center;font:12px sans-serif">${renderToStaticMarkup(<C groesse={64} />)}${renderToStaticMarkup(<C groesse={28} />)}${renderToStaticMarkup(<C groesse={20} />)}<figcaption>${n.slice(6)}</figcaption></figure>`).join('')}</div>`;
  mkdirSync(ziel!, { recursive: true });
  writeFileSync(`${ziel}/symbole.html`, `<!doctype html><meta charset="utf-8"><body style="margin:0">${reihe('#FBF6E9')}${reihe('#FFFFFF')}${reihe('#173A1C')}</body>`);
});
