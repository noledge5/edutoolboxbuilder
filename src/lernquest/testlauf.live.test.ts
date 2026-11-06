// Testlauf: Lernquest played for real, so Claude (or anyone) can try a change end to end and see what breaks.
// `npm run lq:testlauf` builds the app, serves it, and against the real server (Supabase „baukasten“):
//   1. makes a throwaway teacher key, a test class, a test child with PIN and one made-up lesson with one exercise of
//      every kind; the key sees only this class, never the real ones;
//   2. drives Lernquest in Chromium (Playwright): class code, name, PIN, map, one round with one answer wrong on purpose;
//      then opens the chest it earned, wears the part and looks at the class (Stufe 2);
//   3. checks what the server stored against the rules in `rules.ts` (XP, best value, coins, chest, part worn);
//   4. takes screenshots (phone, iPad, laptop) and fails on any script error in the page;
//   5. deletes the class for good.
// Only runs with LQ_TESTLAUF=1. LQ_URL=<…/lernquest/> plays the live site instead of the local build; LQ_BILDER=<dir>
// sets where the screenshots go (default: the temp folder, never the repo). Playwright is not a dependency of the
// project: it is used from the machine (preinstalled in Claude's cloud sessions).
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { newKey } from './lehrkraft';
import { freischalten, kindAnlegen, klasseAnlegen, klasseEndgueltig, klasseLoeschen, klassen, meinStand } from './server';
import { muenzenFuerRunde, xpFuerRunde } from './rules';
import { TEILE } from './teile';
import { PAKET_FORMAT, type Paket, type Uebung } from './types';

const an = process.env.LQ_TESTLAUF === '1';
const BILDER = process.env.LQ_BILDER || join(tmpdir(), 'lernquest-testlauf');

// Minimal shapes of what is used from Playwright (it has no types in this project).
interface Locator {
  click(): Promise<void>;
  first(): Locator;
  filter(o: { hasText: RegExp | string }): Locator;
  waitFor(o?: { state?: string; timeout?: number }): Promise<void>;
  textContent(): Promise<string | null>;
  count(): Promise<number>;
}
interface Route {
  request(): { url(): string; method(): string; headers(): Record<string, string>; postDataBuffer(): Buffer | null };
  fulfill(o: { status: number; headers: Record<string, string>; body: Buffer }): Promise<void>;
}
interface Page {
  goto(url: string): Promise<unknown>;
  locator(sel: string, o?: { hasText?: RegExp | string }): Locator;
  getByRole(role: string, o: { name: string | RegExp; exact?: boolean }): Locator;
  screenshot(o: { path: string; fullPage?: boolean }): Promise<unknown>;
  evaluate<T>(fn: () => T): Promise<T>;
  waitForTimeout(ms: number): Promise<void>;
  on(ev: 'pageerror', fn: (e: Error) => void): void;
  on(ev: 'console', fn: (m: { type(): string; text(): string }) => void): void;
}
interface Context {
  newPage(): Promise<Page>;
  route(url: RegExp, fn: (r: Route) => Promise<void>): Promise<void>;
  addInitScript(fn: (arg: string) => void, arg: string): Promise<void>;
  close(): Promise<void>;
}
interface Browser {
  newContext(o: Record<string, unknown>): Promise<Context>;
  close(): Promise<void>;
}
interface Playwright {
  chromium: { launch(): Promise<Browser> };
  devices: Record<string, Record<string, unknown>>;
}

function playwright(): Playwright {
  try {
    return createRequire(import.meta.url)('playwright') as Playwright;
  } catch {
    throw new Error('Playwright fehlt auf diesem Rechner (npm i -g playwright); in Claudes Cloud-Sitzungen ist es da.');
  }
}

// — The made-up lesson: one exercise of every kind, five in all, so the station is one round. —
const STUNDE = 'testlauf-stunde-1';
const UEBUNGEN: Uebung[] = [
  { art: 'waehlen', id: 'u1', frage: 'Testlauf 1: Welcher Kontinent ist der größte?', optionen: ['Afrika', 'Asien', 'Europa', 'Australien'], richtig: [1] },
  { art: 'richtigfalsch', id: 'u2', frage: 'Testlauf 2: Stimmt das?', aussage: 'Der Pazifik ist der größte Ozean.', richtig: true },
  { art: 'luecke', id: 'u3', frage: 'Testlauf 3: Ergänze den Satz.', teile: ['Berlin ist die Hauptstadt von ', 'Deutschland', '.'], kacheln: ['Deutschland', 'Frankreich', 'Polen'] },
  { art: 'paare', id: 'u4', frage: 'Testlauf 4: Finde die Paare.', paare: [['Rhein', 'Fluss'], ['Zugspitze', 'Berg'], ['Bodensee', 'See']] },
  { art: 'reihenfolge', id: 'u5', frage: 'Testlauf 5: Bilde den Satz.', hinweis: 'Wohin fließt die Elbe?', kacheln: ['Die', 'Elbe', 'fließt', 'nach', 'Hamburg'], loesung: 'Die Elbe fließt nach Hamburg' },
];
/** Answered wrong on purpose (the feedback for a mistake is part of the run). */
const FALSCH = 'u1';
const PAKET: Paket = {
  format: PAKET_FORMAT,
  v: 1,
  stunde: STUNDE,
  nummer: 1,
  titel: 'Testlauf-Station',
  modul: { id: 'testlauf-modul', nummer: 1, titel: 'Testlauf', icon: 'globe', stunden: [{ nummer: 1, titel: 'Testlauf-Station' }, { nummer: 2, titel: 'Gesperrte Station' }] },
  fach: 'Erdkunde',
  lang: 'de',
  uebungen: UEBUNGEN,
};

const exact = (s: string) => new RegExp(`^\\s*${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);

/** Supabase calls of the page go through Node's fetch (the sandbox's browser may not trust the proxy); TLS stays on. */
async function serverDurchNode(ctx: Context) {
  await ctx.route(/supabase\.co/, async (route) => {
    const req = route.request();
    const headers = Object.fromEntries(Object.entries(req.headers()).filter(([k]) => !['host', 'connection', 'content-length', 'accept-encoding'].includes(k)));
    const res = await fetch(req.url(), { method: req.method(), headers, body: req.method() === 'GET' || req.method() === 'HEAD' ? undefined : (req.postDataBuffer()?.toString() ?? undefined) });
    const out = Object.fromEntries([...res.headers].filter(([k]) => !['content-encoding', 'content-length', 'transfer-encoding'].includes(k)));
    await route.fulfill({ status: res.status, headers: out, body: Buffer.from(await res.arrayBuffer()) });
  });
}

/** Plays one exercise as a child would: taps, lays tiles, „Prüfen“, „Weiter“. */
async function spiele(page: Page, fehler: string[]) {
  const frage = page.locator('.lq-frage').first();
  await frage.waitFor({ timeout: 15_000 });
  const text = (await frage.textContent()) ?? '';
  const u = UEBUNGEN.find((x) => text.includes(x.frage.split(':')[0]));
  if (!u) throw new Error(`Unbekannte Übung im Testlauf: „${text}“`);
  const falsch = u.id === FALSCH;
  const knopf = (name: string) => page.getByRole('button', { name: exact(name) }).first();
  const kachel = (name: string) => page.locator('.lq-kacheln .lq-kachel').filter({ hasText: exact(name) }).first();
  switch (u.art) {
    case 'waehlen':
      await knopf(falsch ? u.optionen.find((_, i) => !u.richtig.includes(i))! : u.optionen[u.richtig[0]]).click();
      break;
    case 'richtigfalsch':
      await knopf(u.richtig !== falsch ? '✓ richtig' : '✗ falsch').click();
      break;
    case 'luecke':
      for (let i = 1; i < u.teile.length; i += 2) await kachel(u.teile[i]).click();
      break;
    case 'reihenfolge':
      for (const w of u.loesung.split(' ')) await kachel(w).click();
      break;
    case 'paare':
      for (const [l, r] of u.paare) {
        await page.locator('.lq-paare .lq-option').filter({ hasText: exact(l) }).first().click();
        await page.locator('.lq-paare .lq-option').filter({ hasText: exact(r) }).first().click();
      }
      break;
  }
  if (u.art !== 'paare') await knopf('Prüfen').click();
  const fuss = page.locator(falsch ? '.lq-fuss.nein' : '.lq-fuss.ok').first();
  await fuss.waitFor({ timeout: 5_000 }).catch(() => fehler.push(`${u.id} (${u.art}): erwartete Rückmeldung „${falsch ? 'falsch' : 'richtig'}“ kam nicht`));
  await knopf('Weiter').click();
}

describe.skipIf(!an)('Testlauf: Lernquest wie ein Kind spielen (live)', () => {
  const keys = [newKey()];
  let klasse = '';
  let stopServer: (() => Promise<void>) | null = null;

  afterAll(async () => {
    if (klasse) {
      await klasseLoeschen(keys, klasse, true).catch(() => {});
      await klasseEndgueltig(keys, klasse).catch(() => {});
      // Nothing may stay on the server.
      const rest = await klassen(keys);
      if (rest.length) throw new Error(`Testklasse nicht gelöscht: ${rest.map((x) => x.id).join(', ')}`);
    }
    await stopServer?.();
  });

  it('meldet an, spielt eine Runde und prüft den Spielstand', { timeout: 180_000 }, async () => {
    mkdirSync(BILDER, { recursive: true });
    let url = process.env.LQ_URL ?? '';
    if (!url) {
      const { preview } = await import('vite');
      const server = await preview({ preview: { port: 4180, strictPort: false, open: false }, logLevel: 'error' });
      stopServer = () => new Promise((ok) => server.httpServer.close(() => ok()));
      url = `${server.resolvedUrls?.local[0] ?? 'http://localhost:4180/'}lernquest/`;
    }

    // 1. Class, child, lesson.
    const k = await klasseAnlegen(keys, 'Testlauf (wird gelöscht)');
    klasse = k.id;
    const pin = String(1000 + Math.floor(Math.random() * 9000));
    await kindAnlegen(keys, klasse, 'Testkind T.', pin);
    await freischalten(keys, klasse, STUNDE, PAKET);

    // 2. Play on a phone.
    const { chromium, devices } = playwright();
    const browser = await chromium.launch();
    const fehler: string[] = [];
    try {
      const ctx = await browser.newContext({ ...devices['iPhone 13'], locale: 'de-DE' });
      await serverDurchNode(ctx);
      const page = await ctx.newPage();
      page.on('pageerror', (e) => fehler.push(`Skriptfehler: ${e.message}`));
      page.on('console', (m) => m.type() === 'error' && fehler.push(`Konsole: ${m.text()}`));
      await page.goto(`${url}#${k.code}`);
      await page.locator('.lq-name').filter({ hasText: 'Testkind T.' }).first().click();
      for (const d of pin) await page.getByRole('button', { name: d, exact: true }).first().click();
      const station = page.locator('.lq-knoten.aktuell').first();
      await station.waitFor({ timeout: 20_000 });
      await page.screenshot({ path: join(BILDER, 'handy-1-karte.png') });
      await station.click();
      for (let i = 0; i < UEBUNGEN.length; i++) {
        await spiele(page, fehler);
        if (i === 0) await page.screenshot({ path: join(BILDER, 'handy-2-runde.png') });
      }
      await page.locator('.lq-ergebnis').first().waitFor({ timeout: 15_000 });
      await page.waitForTimeout(800);
      await page.screenshot({ path: join(BILDER, 'handy-3-ergebnis.png') });
      // Stufe 2: the chest of the first complete station, the part worn at once, the class.
      await page.getByRole('button', { name: exact('Truhe öffnen') }).click();
      await page.getByRole('button', { name: exact('Öffnen') }).click();
      await page.locator('.lq-truhe-buehne.da').first().waitFor({ timeout: 15_000 });
      await page.waitForTimeout(700);
      await page.screenshot({ path: join(BILDER, 'handy-4-truhe.png') });
      const gefunden = ((await page.locator('.lq-truhe-text h1').first().textContent()) ?? '').trim();
      await page.getByRole('button', { name: exact('Gleich anlegen') }).click();
      await page.locator('.lq-held-raster').first().waitFor({ timeout: 15_000 });
      await page.waitForTimeout(500);
      await page.screenshot({ path: join(BILDER, 'handy-5-held.png') });
      await page.locator('.lq-leiste button').filter({ hasText: 'Klasse' }).first().click();
      await page.locator('.lq-helden li').first().waitFor({ timeout: 15_000 });
      await page.screenshot({ path: join(BILDER, 'handy-6-klasse.png') });
      const sitzung = await page.evaluate(() => localStorage.getItem('lernquest:sitzung') ?? '');
      await ctx.close();

      // 3. What the server keeps, against the rules on this side (they live twice: rules.ts and lq_runde_melden).
      const token = (JSON.parse(sitzung) as { token: string }).token;
      // The round is sent in the background; wait until it has arrived.
      let { stand } = await meinStand(token, null);
      for (let i = 0; i < 20 && !stand.bestwerte[STUNDE]; i++) {
        await new Promise((ok) => setTimeout(ok, 500));
        ({ stand } = await meinStand(token, null));
      }
      const richtig = UEBUNGEN.length - 1;
      const bericht = { url, xp: stand.xp, bestwerte: stand.bestwerte, muenzen: stand.muenzen, truhen: stand.truhen, inventar: stand.inventar, avatar: stand.avatar, fehler };
      writeFileSync(join(BILDER, 'ergebnis.json'), JSON.stringify(bericht, null, 2));
      expect(stand.xp).toBe(xpFuerRunde(richtig, UEBUNGEN.length));
      expect(stand.bestwerte[STUNDE]?.[0]).toBe(Math.round((100 * richtig) / UEBUNGEN.length));
      expect(stand.muenzen).toBe(muenzenFuerRunde(richtig, UEBUNGEN.length, 3, 0));
      // The one chest is open; its part (never a twin the first time) is owned and worn.
      const teil = TEILE.find((t) => t.name === gefunden);
      expect(teil, `Teil aus der Truhe: „${gefunden}“`).toBeDefined();
      expect(stand.truhen).toBe(0);
      expect(stand.inventar).toEqual([teil!.id]);
      expect(stand.avatar[teil!.slot]).toBe(teil!.id);

      // 4. The map after the round, on the other sizes (same session, fresh device).
      const groessen: [string, Record<string, unknown>][] = [
        ['ipad', devices['iPad (gen 7)']],
        ['ipad-quer', devices['iPad (gen 7) landscape']],
        ['laptop', { viewport: { width: 1280, height: 800 } }],
      ];
      for (const [name, dev] of groessen) {
        const c = await browser.newContext({ ...dev, locale: 'de-DE' });
        await serverDurchNode(c);
        await c.addInitScript((s) => localStorage.setItem('lernquest:sitzung', s), sitzung);
        const p = await c.newPage();
        p.on('pageerror', (e) => fehler.push(`Skriptfehler (${name}): ${e.message}`));
        await p.goto(url);
        await p.locator('.lq-knoten').first().waitFor({ timeout: 20_000 });
        await p.waitForTimeout(500);
        await p.screenshot({ path: join(BILDER, `${name}-karte.png`) });
        await p.locator('.lq-leiste button').filter({ hasText: 'Held' }).first().click();
        await p.locator('.lq-held-raster').first().waitFor({ timeout: 15_000 });
        await p.waitForTimeout(300);
        await p.screenshot({ path: join(BILDER, `${name}-held.png`) });
        await c.close();
      }
    } finally {
      await browser.close();
      console.log(`Testlauf: Bilder in ${BILDER}`);
    }
    expect(fehler).toEqual([]);
  });
});
