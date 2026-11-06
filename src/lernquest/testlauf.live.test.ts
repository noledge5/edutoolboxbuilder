// Testlauf: Lernquest played for real, so Claude (or anyone) can try a change end to end and see what breaks.
// `npm run lq:testlauf` builds the app, serves it, and against the real server (Supabase „baukasten“):
//   1. makes a throwaway teacher key, a test class, a test child with PIN and one made-up lesson with one exercise of
//      every kind; the key sees only this class, never the real ones;
//   2. drives Lernquest in Chromium (Playwright): class code, name, PIN, map, one round with one answer wrong on purpose;
//      then opens the chest it earned, wears the part and looks at the class (Stufe 2);
//   3. checks what the server stored against the rules in `rules.ts` (XP, best value, coins, chest, part worn);
//   4. takes screenshots (phone, iPad, laptop) and fails on any script error in the page;
//   5. fights a boss (Stufe 3): the projector (1440 × 810, teacher key put into this browser) and the child's phone,
//      every answer right until the boss falls; checks the chest on the server;
//   6. Stufe 4: checks the class points of the win, asks for a voucher on the phone, redeems it as the teacher;
//   7. Stufe 5: unlocks a second station with the new kinds (sort into groups, pick the picture, places on a picture,
//      listening) and pictures in the package, plays it right through, checks the round on the server;
//   8. deletes the class for good.
// Only runs with LQ_TESTLAUF=1. LQ_URL=<…/lernquest/> plays the live site instead of the local build; LQ_BILDER=<dir>
// sets where the screenshots go (default: the temp folder, never the repo). Playwright is not a dependency of the
// project: it is used from the machine (preinstalled in Claude's cloud sessions).
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { newKey } from './lehrkraft';
import { anfrageErledigen, belohnungen, bossBeamer, bossStarten, freischalten, gutscheinSpeichern, kindAnlegen, klasseAnlegen, klasseEndgueltig, klasseLoeschen, klassen, meinStand } from './server';
import { bossFragen } from './boss';
import { muenzenFuerRunde, PUNKTE_BOSS, xpFuerRunde } from './rules';
import { TEILE } from './teile';
import { PAKET_FORMAT, type Paket, type Uebung } from './types';

const an = process.env.LQ_TESTLAUF === '1';
const BILDER = process.env.LQ_BILDER || join(tmpdir(), 'lernquest-testlauf');

// Minimal shapes of what is used from Playwright (it has no types in this project).
interface Locator {
  click(o?: { position?: { x: number; y: number } }): Promise<void>;
  first(): Locator;
  nth(i: number): Locator;
  boundingBox(): Promise<{ x: number; y: number; width: number; height: number } | null>;
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
  evaluate<T>(fn: (() => T) | string): Promise<T>;
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
// — Stufe 5: a second station with the new kinds (all answered right), pictures in the package as on the real way. —
const STUNDE2 = 'testlauf-stunde-2';
const BILD_SVG = `data:image/svg+xml;base64,${Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#bfe3f2"/><circle cx="120" cy="90" r="30" fill="#2a7"/><circle cx="300" cy="210" r="30" fill="#c53"/></svg>').toString('base64')}`;
const UEBUNGEN2: Uebung[] = [
  { art: 'gruppen', id: 'pool-g', frage: 'Testlauf 6: Sortiere.', gruppen: ['Fluss', 'Berg'], karten: [['Rhein', 0], ['Zugspitze', 1], ['Elbe', 0], ['Brocken', 1]] },
  { art: 'bild', id: 'pool-b', frage: 'Testlauf 7: Welches Bild passt?', wort: 'Karte', bilder: ['🐶', 'img:testlauf', '🐟'], richtig: 1 },
  { art: 'punkt', id: 'pool-p', frage: 'Testlauf 8: Tippe auf die richtige Stelle.', bild: 'karte:testlauf', punkte: [[30, 30, 'Grüner Punkt'], [75, 70, 'Roter Punkt']] },
  { art: 'waehlen', id: 'pool-h', frage: 'Testlauf 9: Hör zu. Was passt?', hoeren: 'The Rhine is a river.', optionen: ['Der Rhein ist ein Fluss.', 'Der Rhein ist ein Berg.'], richtig: [0] },
];
const PAKET2: Paket = {
  format: PAKET_FORMAT,
  v: 1,
  stunde: STUNDE2,
  nummer: 2,
  titel: 'Testlauf-Station 2',
  modul: { id: 'testlauf-modul', nummer: 1, titel: 'Testlauf', icon: 'globe', stunden: [{ nummer: 1, titel: 'Testlauf-Station' }, { nummer: 2, titel: 'Testlauf-Station 2' }] },
  fach: 'Erdkunde',
  lang: 'de',
  uebungen: UEBUNGEN2,
  bilder: { 'img:testlauf': BILD_SVG, 'karte:testlauf': BILD_SVG },
};

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
  const u = [...UEBUNGEN, ...UEBUNGEN2].find((x) => text.includes(`${x.frage.split(':')[0]}:`));
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
    case 'gruppen':
      for (let i = 0; i < u.karten.length; i++) {
        const karte = ((await page.locator('.lq-sortkarte').first().textContent()) ?? '').trim();
        const g = u.karten.find(([t]) => t === karte)?.[1] ?? 0;
        await page.locator('.lq-gruppe-kopf').nth(g).click();
      }
      break;
    case 'bild':
      await page.locator('.lq-bild:has(img)').first().click();
      break;
    case 'punkt':
      for (let i = 0; i < u.punkte.length; i++) {
        const name = ((await page.locator('.lq-wort b').first().textContent()) ?? '').trim();
        const [x, y] = u.punkte.find(([, , n]) => n === name) ?? [0, 0];
        const flaeche = page.locator('.lq-karte-flaeche').first();
        const box = (await flaeche.boundingBox())!;
        await flaeche.click({ position: { x: (box.width * x) / 100, y: (box.height * y) / 100 } });
      }
      break;
  }
  // Pairs and places check themselves when all are done.
  if (u.art !== 'paare' && u.art !== 'punkt') await knopf('Prüfen').click();
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

      // 5. Boss fight: three questions from the made-up lesson, one child, every answer right.
      const fragen = bossFragen([PAKET], 'testlauf', 3);
      const bossId = await bossStarten(keys, klasse, PAKET.modul.id, 'Erdkunde · Region 1', 0, fragen);
      const handyCtx = await browser.newContext({ ...devices['iPhone 13'], locale: 'de-DE' });
      await serverDurchNode(handyCtx);
      await handyCtx.addInitScript((s) => localStorage.setItem('lernquest:sitzung', s), sitzung);
      const handy = await handyCtx.newPage();
      handy.on('pageerror', (e) => fehler.push(`Skriptfehler (Boss, Handy): ${e.message}`));
      await handy.goto(url);
      await handy.locator('.lq-boss-band').first().waitFor({ timeout: 25_000 });
      await handy.screenshot({ path: join(BILDER, 'boss-1-handy-karte.png') });
      await handy.locator('.lq-boss-band').first().click();
      await handy.locator('.lq-boss-handy').first().waitFor({ timeout: 15_000 });

      const beamerCtx = await browser.newContext({ viewport: { width: 1440, height: 810 }, locale: 'de-DE' });
      await serverDurchNode(beamerCtx);
      const beamer = await beamerCtx.newPage();
      beamer.on('pageerror', (e) => fehler.push(`Skriptfehler (Beamer): ${e.message}`));
      await beamer.goto(url);
      // The teacher key as the Baukasten keeps it (same origin): IndexedDB „arbeitsblatt-baukasten“, store „daten“.
      const lehrkraft = JSON.stringify({ keys, pins: {}, updatedAt: Date.now() });
      await beamer.evaluate(`new Promise((ok, no) => { const r = indexedDB.open('arbeitsblatt-baukasten'); r.onupgradeneeded = () => r.result.createObjectStore('daten'); r.onerror = () => no(r.error); r.onsuccess = () => { const tx = r.result.transaction('daten', 'readwrite'); tx.objectStore('daten').put(${lehrkraft}, 'geraet:lernquest'); tx.oncomplete = () => { r.result.close(); ok(1); }; tx.onerror = () => no(tx.error); }; })`);
      await beamer.goto('about:blank');
      await beamer.goto(`${url}#beamer=${bossId}`);
      const losKnopf = beamer.getByRole('button', { name: exact('Los geht’s!') }).first();
      await losKnopf.waitFor({ timeout: 20_000 });
      await beamer.waitForTimeout(1500);
      await beamer.screenshot({ path: join(BILDER, 'boss-2-beamer-warten.png') });
      await losKnopf.click();
      // The test follows what the projector shows (the server may move on between a poll and a click).
      const naechste = beamer.getByRole('button', { name: exact('Nächste Frage') }).first();
      const schliessen = beamer.getByRole('button', { name: exact('Schließen') }).first();
      for (let i = 0; i < fragen.length; i++) {
        await handy.locator(`.lq-pad.a${fragen[i].richtig}:not([disabled])`).first().waitFor({ timeout: 20_000 });
        if (i === 0) {
          await beamer.waitForTimeout(1200);
          await beamer.screenshot({ path: join(BILDER, 'boss-3-beamer-frage.png') });
          await handy.screenshot({ path: join(BILDER, 'boss-4-handy-frage.png') });
        }
        await handy.locator(`.lq-pad.a${fragen[i].richtig}`).first().click();
        // All (one) answered: the question resolves at the next poll; wait for its result on the projector.
        let weiter = false;
        for (let w = 0; w < 60; w++) {
          if (await schliessen.count()) break;
          if (await naechste.count()) {
            weiter = true;
            break;
          }
          await beamer.waitForTimeout(500);
        }
        await beamer.waitForTimeout(1200);
        if (i === 0) {
          await beamer.screenshot({ path: join(BILDER, 'boss-5-beamer-aufloesung.png') });
          await handy.screenshot({ path: join(BILDER, 'boss-6-handy-aufloesung.png') });
        }
        if (!weiter) break;
        await naechste.click();
      }
      const bossEnde = await bossBeamer(keys, bossId);
      await beamer.waitForTimeout(1500);
      await handy.waitForTimeout(1500);
      await beamer.screenshot({ path: join(BILDER, 'boss-7-beamer-ende.png') });
      await handy.screenshot({ path: join(BILDER, 'boss-8-handy-ende.png') });
      expect(bossEnde).toMatchObject({ phase: 'ende', sieg: true, truhen: 1 });
      expect((await meinStand(token, null)).stand.truhen).toBe(1);
      await handy.getByRole('button', { name: exact('Truhe öffnen') }).first().waitFor({ timeout: 10_000 });

      // 6. Stufe 4: the win brought class points; a voucher asked for on the phone, redeemed by the teacher.
      expect((await meinStand(token, null)).stand.klassenpunkte).toBe(PUNKTE_BOSS);
      await gutscheinSpeichern(keys, klasse, null, { name: 'Testlauf-Gutschein', preis: PUNKTE_BOSS, jeKind: 1, jeKlasse: null, aktiv: true });
      const zuGutscheinen = async () => {
        await handy.goto(url);
        await handy.locator('.lq-leiste button').filter({ hasText: 'Held' }).first().click();
        await handy.getByRole('button', { name: exact('Gutscheine') }).first().click();
        await handy.locator('.lq-gutschein').first().waitFor({ timeout: 15_000 });
      };
      await zuGutscheinen();
      await handy.screenshot({ path: join(BILDER, 'gutschein-1-liste.png') });
      await handy.locator('.lq-gutschein').first().click();
      await handy.getByRole('button', { name: /^Testlauf-Gutschein anfragen/ }).first().click();
      await handy.locator('.lq-anfrage.offen').first().waitFor({ timeout: 15_000 });
      await handy.screenshot({ path: join(BILDER, 'gutschein-2-angefragt.png') });
      const offen = (await belohnungen(keys, klasse)).anfragen.filter((a) => a.zustand === 'offen');
      expect(offen).toHaveLength(1);
      expect((await meinStand(token, null)).stand.klassenpunkte).toBe(0);
      await anfrageErledigen(keys, offen[0].id, true);
      await zuGutscheinen();
      await handy.locator('.lq-anfrage.eingeloest').first().waitFor({ timeout: 15_000 });
      await handy.screenshot({ path: join(BILDER, 'gutschein-3-eingeloest.png') });

      // 7. Stufe 5: the second station with the new kinds and pictures; the server counts its rounds from `uebungen`.
      await freischalten(keys, klasse, STUNDE2, PAKET2);
      const vorher = (await meinStand(token, null)).stand;
      await handy.goto(url);
      const station2 = handy.locator('.lq-knoten.aktuell').first();
      await station2.waitFor({ timeout: 20_000 });
      await station2.click();
      for (let i = 0; i < UEBUNGEN2.length; i++) {
        await spiele(handy, fehler);
        if (i < 3) await handy.screenshot({ path: join(BILDER, `stufe5-${i + 1}.png`) }).catch(() => {});
      }
      await handy.locator('.lq-ergebnis').first().waitFor({ timeout: 15_000 });
      let nachher = (await meinStand(token, null)).stand;
      for (let i = 0; i < 20 && !nachher.bestwerte[STUNDE2]; i++) {
        await new Promise((ok) => setTimeout(ok, 500));
        nachher = (await meinStand(token, null)).stand;
      }
      expect(nachher.bestwerte[STUNDE2]).toEqual([100]);
      expect(nachher.xp).toBe(vorher.xp + xpFuerRunde(UEBUNGEN2.length, UEBUNGEN2.length, vorher.xpHeute));
      await handyCtx.close();
      await beamerCtx.close();
    } finally {
      await browser.close();
      console.log(`Testlauf: Bilder in ${BILDER}`);
    }
    expect(fehler).toEqual([]);
  });
});
