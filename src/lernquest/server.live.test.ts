// Against the real server functions (Supabase „baukasten“): rights and locking. Runs only with LQ_LIVE=1
// (`LQ_LIVE=1 npx vitest run src/lernquest/server.live.test.ts`), so the CI does not depend on the network. It makes
// two test classes with fresh teacher keys and deletes them for good at the end.
import { afterAll, describe, expect, it } from 'vitest';
import { newKey } from './lehrkraft';
import { muenzenFuerRunde } from './rules';
import { TEILE, teil } from './teile';
import {
  anmelden,
  avatarSetzen,
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
});
