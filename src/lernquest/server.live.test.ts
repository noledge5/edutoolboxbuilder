// Against the real server functions (Supabase „baukasten“): rights and locking. Runs only with LQ_LIVE=1
// (`LQ_LIVE=1 npx vitest run src/lernquest/server.live.test.ts`), so the CI does not depend on the network. It makes
// two test classes with fresh teacher keys and deletes them for good at the end.
import { afterAll, describe, expect, it } from 'vitest';
import { newKey } from './lehrkraft';
import {
  anmelden,
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
    const paketA = { format: 'lernquest-paket', stunde: 'sA', uebungen: [], modul: { id: 'm' } };
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
    expect((await meinStand(ok2.token, null)).stand).toMatchObject({ xp: 25, bestwerte: { sA: [100] } });
    // … and the other child nothing of it.
    const tomIn = await anmelden(a.code, tom, '5678');
    if (!tomIn.ok) throw new Error('Tom');
    expect((await meinStand(tomIn.token, null)).stand.xp).toBe(0);
    // No direct table access, no helper functions.
    expect(await code(lq('lq_sitzung_pruefen', { p_token: token }))).not.toBe('ok');
    const table = await fetch(`https://txafdkaeotgekoxzgcxd.supabase.co/rest/v1/lq_kind?select=*`, { headers: { apikey: 'sb_publishable_956BMuhr1RsRXwF3gQ4-3Q_bMXrUxFS' } });
    expect(table.ok ? await table.json() : []).toEqual([]);

    // Five wrong PINs lock; the teacher unlocks.
    for (const rest of [4, 3, 2, 1]) expect(await anmelden(a.code, tom, '0000')).toEqual({ ok: false, gesperrt: false, rest });
    expect(await anmelden(a.code, tom, '0000')).toEqual({ ok: false, gesperrt: true, rest: 0 });
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
});
