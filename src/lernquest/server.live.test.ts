// Against the real server functions (Supabase „baukasten“): rights and locking. Runs only with LQ_LIVE=1
// (`LQ_LIVE=1 npx vitest run src/lernquest/server.live.test.ts`), so the CI does not depend on the network. It makes
// two test classes with fresh teacher keys and deletes them for good at the end.
import { afterAll, describe, expect, it } from 'vitest';
import { newKey } from './lehrkraft';
import { bossLp, bossSchaden, muenzenFuerRunde } from './rules';
import type { BossFrage } from './boss';
import { TEILE, teil } from './teile';
import {
  anfrageErledigen,
  anfrageZurueck,
  anfragen,
  belohnungen,
  gutscheinLoeschen,
  gutscheinSpeichern,
  gutscheine,
  punkteGeben,
  anmelden,
  avatarSetzen,
  bossAntworten,
  bossBeamer,
  bossBeenden,
  bossOffen,
  bossStand,
  bossStarten,
  bossWeiter,
  kaufen,
  klasseAnsicht,
  entsperren,
  freischalten,
  kindAnlegen,
  klasseAnlegen,
  klasseEndgueltig,
  klasseLoeschen,
  klasseOeffnen,
  klassen,
  lq,
  LqError,
  meinStand,
  pinSetzen,
  rundeMelden,
  sperren,
  truheOeffnen,
} from './server';

const live = process.env.LQ_LIVE === '1';

const code = async (p: Promise<unknown>) => {
  try {
    await p;
    return 'ok';
  } catch (e) {
    return e instanceof LqError ? e.code : String(e);
  }
};

describe.skipIf(!live)('Lernquest-Server (live)', () => {
  const keyA = [newKey()];
  const keyB = [newKey()];
  const made: { keys: string[]; id: string }[] = [];

  afterAll(async () => {
    for (const k of made) {
      await klasseLoeschen(k.keys, k.id, true).catch(() => {});
      await klasseEndgueltig(k.keys, k.id).catch(() => {});
    }
  });

  it('trennt Klassen, Kinder und Lehrkräfte; sperrt nach 5 falschen PINs', async () => {
    const a = await klasseAnlegen(keyA, 'Test A');
    made.push({ keys: keyA, id: a.id });
    const b = await klasseAnlegen(keyB, 'Test B');
    made.push({ keys: keyB, id: b.id });
    const mia = await kindAnlegen(keyA, a.id, 'Mia T.', '1234');
    const tom = await kindAnlegen(keyA, a.id, 'Tom T.', '5678');
    const ben = await kindAnlegen(keyB, b.id, 'Ben T.', '1111');
    expect(await code(anmelden(a.code, ben, '1111'))).toBe('code');
    const paketA = {
      format: 'lernquest-paket',
      stunde: 'sA',
      uebungen: [],
      modul: { id: 'm' },
    };
    await freischalten(keyA, a.id, 'sA', paketA);
    await freischalten(keyB, b.id, 'sB', { ...paketA, stunde: 'sB' });

    // A teacher sees and changes only own classes.
    expect((await klassen(keyA)).map((k) => k.id)).toEqual([a.id]);
    expect(await code(kindAnlegen(keyA, b.id, 'X', '0000'))).toBe('zugang');
    expect(await code(freischalten(keyA, b.id, 'x', paketA))).toBe('zugang');
    expect(await code(sperren(keyB, a.id, 'sA'))).toBe('zugang');
    expect(await code(pinSetzen(keyB, mia, '0000'))).toBe('zugang');
    expect(await code(klassen(['nicht-hex']))).toBe('zugang');

    // The class list shows names only.
    const offen = await klasseOeffnen(a.code);
    expect(offen.kinder.map((k) => k.name)).toEqual(['Mia T.', 'Tom T.']);
    expect(JSON.stringify(offen)).not.toMatch(/pin|hash|xp/i);

    // Signing in needs the right class code and PIN.
    expect(await code(anmelden(b.code, mia, '1234'))).toBe('code');
    const ok = await anmelden(a.code, mia, '1234');
    if (!ok.ok) throw new Error('Anmeldung fehlgeschlagen');
    const token = ok.token;

    // A child sees only the own class's packages and plays only those.
    const s = await meinStand(token, null);
    expect(s.name).toBe('Mia T.');
    expect(s.stunden).toEqual(['sA']);
    expect(await code(rundeMelden(token, 'sB', 0, 1, 1, {}))).toBe('ungueltig');
    const r = await rundeMelden(token, 'sA', 0, 5, 5, { 'sA/u1': [2, 1] });
    expect(r.plus).toBe(25);
    // A second device of the same child sees the same.
    const ok2 = await anmelden(a.code, mia, '1234');
    if (!ok2.ok) throw new Error('Zweite Anmeldung fehlgeschlagen');
    expect((await meinStand(ok2.token, null)).stand).toMatchObject({
      xp: 25,
      bestwerte: { sA: [100] },
    });
    // … and the other child nothing of it.
    const tomIn = await anmelden(a.code, tom, '5678');
    if (!tomIn.ok) throw new Error('Tom');
    expect((await meinStand(tomIn.token, null)).stand.xp).toBe(0);
    // No direct table access, no helper functions.
    expect(await code(lq('lq_sitzung_pruefen', { p_token: token }))).not.toBe('ok');
    const table = await fetch(`https://txafdkaeotgekoxzgcxd.supabase.co/rest/v1/lq_kind?select=*`, { headers: { apikey: 'sb_publishable_956BMuhr1RsRXwF3gQ4-3Q_bMXrUxFS' } });
    expect(table.ok ? await table.json() : []).toEqual([]);

    // Five wrong PINs lock; the teacher unlocks.
    for (const rest of [4, 3, 2, 1])
      expect(await anmelden(a.code, tom, '0000')).toEqual({
        ok: false,
        gesperrt: false,
        rest,
      });
    expect(await anmelden(a.code, tom, '0000')).toEqual({
      ok: false,
      gesperrt: true,
      rest: 0,
    });
    expect(await code(anmelden(a.code, tom, '5678'))).toBe('gesperrt');
    expect(await code(meinStand(tomIn.token, null))).toBe('gesperrt');
    await entsperren(keyA, tom);
    expect((await anmelden(a.code, tom, '5678')).ok).toBe(true);

    // A new PIN signs out all devices.
    await pinSetzen(keyA, mia, '4321');
    expect(await code(meinStand(token, null))).toBe('sitzung');

    // A class in the bin lets nobody in.
    await klasseLoeschen(keyB, b.id, true);
    expect(await code(klasseOeffnen(b.code))).toBe('code');
    expect(await code(anmelden(b.code, ben, '1111'))).toBe('code');
  }, 60_000);

  it('Stufe 2: Truhe, Laden, Avatar und Klassen-Ansicht', async () => {
    const keyC = [newKey()];
    const keyD = [newKey()];
    const c = await klasseAnlegen(keyC, 'Held C');
    made.push({ keys: keyC, id: c.id });
    const d = await klasseAnlegen(keyD, 'Held D');
    made.push({ keys: keyD, id: d.id });
    const mia = await kindAnlegen(keyC, c.id, 'Mia H.', '1234');
    await kindAnlegen(keyC, c.id, 'Tom H.', '5678');
    const ben = await kindAnlegen(keyD, d.id, 'Ben H.', '1111');
    // Five exercises: one round makes the station complete.
    await freischalten(keyC, c.id, 'sH', { format: 'lernquest-paket', stunde: 'sH', uebungen: [{}, {}, {}, {}, {}], modul: { id: 'm' } });
    const ok = await anmelden(c.code, mia, '1234');
    const okBen = await anmelden(d.code, ben, '1111');
    if (!ok.ok || !okBen.ok) throw new Error('Anmeldung fehlgeschlagen');
    const token = ok.token;

    // Nothing to open or buy at the start.
    expect(await code(truheOeffnen(token))).toBe('ungueltig');
    expect(await code(kaufen(token, 'lupe'))).toBe('muenzen');

    // The first complete station gives a chest, the second time not; coins as in rules.ts.
    const r1 = await rundeMelden(token, 'sH', 0, 5, 5, {});
    expect(r1).toMatchObject({ muenzenPlus: muenzenFuerRunde(5, 5, 3, 0, 0), truhenPlus: 1 });
    expect(r1.stand).toMatchObject({ truhen: 1, muenzen: r1.muenzenPlus, inventar: [] });
    const r2 = await rundeMelden(token, 'sH', 0, 5, 5, {});
    expect(r2.truhenPlus).toBe(0);

    // A chest gives one part that is no start part; a new part is never a double.
    const t = await truheOeffnen(token);
    const gefunden = teil(t.teil);
    expect(gefunden && !gefunden.start).toBe(true);
    expect(t).toMatchObject({ seltenheit: gefunden?.seltenheit, doppelt: false, muenzen: 0 });
    expect(t.stand).toMatchObject({ truhen: 0, inventar: [t.teil], pech: t.seltenheit >= 2 ? 0 : 1 });
    expect(await code(truheOeffnen(token))).toBe('ungueltig');

    // Shop: a common part costs 40.
    const r3 = await rundeMelden(token, '', 0, 5, 5, {});
    const muenzen = r3.stand.muenzen;
    expect(muenzen).toBeGreaterThanOrEqual(40);
    const [ware, zweite] = TEILE.filter((x) => x.seltenheit === 0 && !x.start && x.id !== t.teil);
    const nachKauf = await kaufen(token, ware.id);
    expect(nachKauf.muenzen).toBe(muenzen - 40);
    expect(nachKauf.inventar).toEqual([t.teil, ware.id]);
    expect(await code(kaufen(token, ware.id))).toBe('ungueltig');
    expect(await code(kaufen(token, 'tshirt'))).toBe('ungueltig');
    expect(await code(kaufen(token, 'gibt-es-nicht'))).toBe('ungueltig');
    if (nachKauf.muenzen < 40) expect(await code(kaufen(token, zweite.id))).toBe('muenzen');

    // Avatar: only owned or start parts, each in its own place, skin tone 0–5.
    const avatar = { kleidung: 'tshirt', augen: 'punktaugen', [ware.slot]: ware.id, begleiter: '', haut: 2 };
    expect((await avatarSetzen(token, avatar)).avatar).toEqual(avatar);
    const fremd = TEILE.find((x) => x.seltenheit === 4 && x.id !== t.teil);
    if (!fremd) throw new Error('Katalog');
    expect(await code(avatarSetzen(token, { [fremd.slot]: fremd.id }))).toBe('ungueltig');
    expect(await code(avatarSetzen(token, { kopf: 'tshirt' }))).toBe('ungueltig');
    expect(await code(avatarSetzen(token, { haut: 6 }))).toBe('ungueltig');
    expect(await code(avatarSetzen(token, { name: 'x' } as never))).toBe('ungueltig');
    expect((await meinStand(token, null)).stand.avatar).toEqual(avatar);

    // The class view: names and avatars of the own class only, no experience, coins or PINs.
    const ansicht = await klasseAnsicht(token);
    expect(ansicht).toEqual({
      klasse: 'Held C',
      tage: 1,
      kinder: [
        { name: 'Mia H.', avatar, ich: true },
        { name: 'Tom H.', avatar: {}, ich: false },
      ],
    });
    expect(JSON.stringify(ansicht)).not.toMatch(/pin|hash|xp|muenzen|inventar|truhen/i);
    expect((await klasseAnsicht(okBen.token)).kinder.map((k) => k.name)).toEqual(['Ben H.']);
    expect(await code(klasseAnsicht('falsch'))).not.toBe('ok');
  }, 60_000);

  it('Stufe 3: Bosskampf – Lösungen verborgen, Schaden, Herzen, Truhe einmal je Region', async () => {
    const keyE = [newKey()];
    const keyF = [newKey()];
    const e = await klasseAnlegen(keyE, 'Boss E');
    made.push({ keys: keyE, id: e.id });
    const f = await klasseAnlegen(keyF, 'Boss F');
    made.push({ keys: keyF, id: f.id });
    const mia = await kindAnlegen(keyE, e.id, 'Mia B.', '1234');
    const tom = await kindAnlegen(keyE, e.id, 'Tom B.', '5678');
    const ben = await kindAnlegen(keyF, f.id, 'Ben B.', '1111');
    const [m, t, b] = await Promise.all([anmelden(e.code, mia, '1234'), anmelden(e.code, tom, '5678'), anmelden(f.code, ben, '1111')]);
    if (!m.ok || !t.ok || !b.ok) throw new Error('Anmeldung fehlgeschlagen');
    const fragen: BossFrage[] = [
      { frage: 'F1', aussage: 'A1', optionen: ['a', 'b', 'c', 'd'], richtig: 2 },
      { frage: 'F2', aussage: '', optionen: ['richtig', 'falsch'], richtig: 0 },
      { frage: 'F3', aussage: '', optionen: ['x', 'y', 'z'], richtig: 1 },
    ];
    expect(await code(bossStarten(keyF, e.id, 'm1', 'T', 0, fragen))).toBe('zugang');
    expect(await code(bossStarten(keyE, e.id, 'm1', 'T', 0, fragen.slice(0, 2)))).toBe('ungueltig');
    const id = await bossStarten(keyE, e.id, 'm1', 'Erdkunde · Region 1', 0, fragen);

    // Only the own class sees and joins the fight; the teacher of another class sees nothing.
    expect(await bossOffen(m.token)).toEqual({ id, titel: 'Erdkunde · Region 1', boss: 0 });
    expect(await bossOffen(b.token)).toBeNull();
    expect(await code(bossStand(b.token, id))).toBe('ungueltig');
    expect(await code(bossBeamer(keyF, id))).toBe('zugang');
    expect(await code(bossWeiter(keyE, id))).toBe('leer');
    await bossStand(m.token, id);
    await bossStand(t.token, id);
    const los = await bossWeiter(keyE, id);
    expect(los).toMatchObject({ phase: 'frage', frage: 0, kinder: 2, lpMax: bossLp(2, 3), herzen: 5, aussage: 'A1' });

    // While the question runs the phones get the options, never the solution.
    const handy = await bossStand(m.token, id);
    expect(handy.optionen).toEqual(['a', 'b', 'c', 'd']);
    expect(handy.richtig).toBeNull();
    expect(JSON.stringify(handy)).not.toMatch(/A1|F1|"text"/);

    // Mia right (fast), Tom wrong: half right, no heart lost; all answered, so it resolves.
    expect(await bossAntworten(m.token, id, 0, 2)).toEqual({ angenommen: true });
    expect(await bossAntworten(m.token, id, 0, 1)).toEqual({ angenommen: false });
    expect(await code(bossAntworten(t.token, id, 0, 9))).toBe('ungueltig');
    expect(await bossAntworten(t.token, id, 0, 0)).toEqual({ angenommen: true });
    const auf = await bossBeamer(keyE, id);
    expect(auf).toMatchObject({ phase: 'aufloesung', richtig: 2, herzen: 5, verteilung: [1, 0, 1, 0] });
    const nachMia = await bossStand(m.token, id);
    expect(nachMia).toMatchObject({ richtig: 2, wahl: 2, serie: 1 });
    // The server's damage follows bossSchaden: between a slow and an instant answer.
    expect(nachMia.schaden).toBeGreaterThanOrEqual(bossSchaden(5000, 1));
    expect(nachMia.schaden).toBeLessThanOrEqual(bossSchaden(0, 1));
    expect(auf.lp).toBe(bossLp(2, 3) - (nachMia.schaden ?? 0));

    // Question 2: both wrong -> the boss hits; question 3 resolved early by the teacher -> lost, no chest.
    await bossWeiter(keyE, id);
    await bossAntworten(m.token, id, 1, 1);
    await bossAntworten(t.token, id, 1, 1);
    expect((await bossBeamer(keyE, id)).herzen).toBe(4);
    await bossWeiter(keyE, id);
    const ende = await bossWeiter(keyE, id);
    expect(ende).toMatchObject({ phase: 'ende', sieg: false, truhen: 0 });
    expect(await bossOffen(m.token)).toBeNull();
    expect((await meinStand(m.token, null)).stand.truhen).toBe(0);

    // A new fight for the same region; a fight ended by the teacher gives nothing.
    const id2 = await bossStarten(keyE, e.id, 'm1', 'R1', 1, fragen);
    await bossStand(m.token, id2);
    expect((await bossBeenden(keyE, id2)).phase).toBe('ende');
    expect(await bossOffen(m.token)).toBeNull();
  }, 60_000);
  it('Stufe 4: Klassenpunkte, Gutscheine, Grenzen, Anfragen abhaken', async () => {
    const keyG = [newKey()];
    const keyH = [newKey()];
    const g = await klasseAnlegen(keyG, 'Belohnung G');
    made.push({ keys: keyG, id: g.id });
    const h = await klasseAnlegen(keyH, 'Belohnung H');
    made.push({ keys: keyH, id: h.id });
    const ida = await kindAnlegen(keyG, g.id, 'Ida T.', '1111');
    const jan = await kindAnlegen(keyG, g.id, 'Jan T.', '2222');
    const kai = await kindAnlegen(keyH, h.id, 'Kai T.', '3333');
    const login = async (code: string, kind: string, pin: string) => {
      const r = await anmelden(code, kind, pin);
      if (!r.ok) throw new Error('Anmeldung fehlgeschlagen');
      return r.token;
    };
    const ti = await login(g.code, ida, '1111');
    const tj = await login(g.code, jan, '2222');
    const tk = await login(h.code, kai, '3333');

    // Vouchers belong to the class of the teacher key.
    const gs = await gutscheinSpeichern(keyG, g.id, null, { name: 'Sitzplatz', preis: 2, jeKind: 1, jeKlasse: 1, aktiv: true });
    expect(await code(gutscheinSpeichern(keyH, g.id, null, { name: 'X', preis: 1, jeKind: null, jeKlasse: null, aktiv: true }))).toBe('zugang');
    expect(await code(gutscheinLoeschen(keyH, gs))).toBe('zugang');
    expect(await code(belohnungen(keyH, g.id))).toBe('zugang');
    expect((await gutscheine(tk)).gutscheine).toEqual([]);
    expect(await code(anfragen(tk, gs))).toBe('ungueltig');

    // Points by hand: own children only, at most 5 a week.
    expect(await code(anfragen(ti, gs))).toBe('punkte');
    expect(await code(punkteGeben(keyH, ida, 1))).toBe('zugang');
    expect(await punkteGeben(keyG, ida, 3)).toBe(3);
    expect(await code(punkteGeben(keyG, ida, 3))).toBe('grenze');
    expect(await punkteGeben(keyG, jan, 5)).toBe(5);
    expect((await klassen(keyG))[0].kinder.find((k) => k.id === ida)).toMatchObject({ klassenpunkte: 3, punkteHand: 3, leitner: {} });

    // Asking sets the points aside; limits per child and for the class.
    const nachIda = await anfragen(ti, gs);
    expect(nachIda.punkte).toBe(1);
    expect(nachIda.gutscheine[0]).toMatchObject({ ich: 1, klasse: 1 });
    expect((await meinStand(ti, null)).stand.klassenpunkte).toBe(1);
    expect(await code(anfragen(tj, gs))).toBe('grenze');
    expect((await klassen(keyG))[0].anfragen).toBe(1);

    // Taking back gives the points back and frees the class limit; another child cannot take it back.
    const offen = nachIda.anfragen[0];
    expect(await code(anfrageZurueck(tj, offen.id))).toBe('ungueltig');
    expect((await anfrageZurueck(ti, offen.id)).punkte).toBe(3);
    const nachJan = await anfragen(tj, gs);
    expect(nachJan.punkte).toBe(3);

    // The teacher ticks off: refused gives back, redeemed uses up, twice is refused.
    const liste = await belohnungen(keyG, g.id);
    const jansAnfrage = liste.anfragen.find((a) => a.kind === jan && a.zustand === 'offen');
    expect(jansAnfrage).toBeDefined();
    expect(await code(anfrageErledigen(keyH, jansAnfrage!.id, true))).toBe('zugang');
    await anfrageErledigen(keyG, jansAnfrage!.id, false);
    expect((await gutscheine(tj)).punkte).toBe(5);
    expect(await code(anfrageErledigen(keyG, jansAnfrage!.id, true))).toBe('ungueltig');
    const zweite = (await anfragen(tj, gs)).anfragen.find((a) => a.zustand === 'offen')!;
    await anfrageErledigen(keyG, zweite.id, true);
    const jetzt = await gutscheine(tj);
    expect(jetzt.punkte).toBe(3);
    expect(jetzt.anfragen.map((a) => a.zustand)).toEqual(['eingeloest', 'abgelehnt']);
    // Redeemed still counts for this week's limit.
    expect(await code(anfragen(tj, gs))).toBe('grenze');

    // Off: hidden and not askable; deleting gives open requests back.
    const joker = await gutscheinSpeichern(keyG, g.id, null, { name: 'Joker', preis: 1, jeKind: null, jeKlasse: null, aktiv: true });
    expect((await anfragen(ti, joker)).punkte).toBe(2);
    await gutscheinSpeichern(keyG, g.id, joker, { name: 'Joker', preis: 1, jeKind: null, jeKlasse: null, aktiv: false });
    expect((await gutscheine(ti)).gutscheine.map((x) => x.name)).toEqual(['Sitzplatz']);
    expect(await code(anfragen(ti, joker))).toBe('ungueltig');
    await gutscheinLoeschen(keyG, joker);
    expect((await gutscheine(ti)).punkte).toBe(3);
    expect((await belohnungen(keyG, g.id)).gutscheine.map((x) => x.name)).toEqual(['Sitzplatz']);
  }, 60_000);
});
