// After `vite build -c vite.werkstatt.config.ts`: puts script and stylesheet into the page, so the workshop is one
// file (dist-werkstatt/figuren-werkstatt.html) that can be published as an artifact.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const dir = 'dist-werkstatt';
const html = readFileSync(join(dir, 'lernquest/werkstatt.html'), 'utf8');
const base = dirname(join(dir, 'lernquest/werkstatt.html'));
const js = [...html.matchAll(/<script[^>]*src="([^"]+)"[^>]*><\/script>/g)].map((m) => readFileSync(join(base, m[1]), 'utf8'));
const css = [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)].map((m) => readFileSync(join(base, m[1]), 'utf8'));
if (js.length !== 1) throw new Error(`expected one script, found ${js.length}`);
const sicher = (s) => s.replace(/<\/(script|style)/gi, '<\\/$1');
const seite = `<title>Figuren-Werkstatt</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>${sicher(css.join('\n'))}</style>
<div id="root"></div>
<script type="module">${sicher(js[0])}</script>
`;
writeFileSync(join(dir, 'figuren-werkstatt.html'), seite);
console.log(`${join(dir, 'figuren-werkstatt.html')}: ${(seite.length / 1024).toFixed(0)} KB`);
