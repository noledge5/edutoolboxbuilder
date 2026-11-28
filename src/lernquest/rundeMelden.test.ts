import { afterEach, describe, expect, it, vi } from 'vitest';
import { rundeMelden, waechterMelden } from './server';

describe('rundeMelden', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('schickt die Runde ohne Dauer nochmal, wenn der Server p_sekunden noch nicht kennt', async () => {
    const bodies: Record<string, unknown>[] = [];
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      const b = JSON.parse(String(init.body));
      bodies.push(b);
      if ('p_sekunden' in b)
        return new Response(JSON.stringify({ code: 'PGRST202', message: 'Could not find the function public.lq_runde_melden(p_gesamt, p_leitner, p_richtig, p_runde, p_sekunden, p_stunde, p_token) in the schema cache' }), { status: 404 });
      return new Response(JSON.stringify({ plus: 5, stand: {} }));
    });
    const r = await rundeMelden('t', 's1', 0, 3, 5, {}, 80);
    expect(r.plus).toBe(5);
    expect(bodies).toHaveLength(2);
    expect(bodies[0].p_sekunden).toBe(80);
    expect('p_sekunden' in bodies[1]).toBe(false);
  });

  it('gibt andere Fehler weiter (z. B. Lernzeit um)', async () => {
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ message: 'zeit' }), { status: 400 }));
    await expect(rundeMelden('t', 's1', 0, 3, 5, {}, 80)).rejects.toMatchObject({ code: 'zeit' });
  });
});

describe('waechterMelden (Solo-Boss, 28.11.2026)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('sendet Region und Ergebnis und gibt die Truhe weiter', async () => {
    let body: Record<string, unknown> = {};
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      expect(url).toContain('/rpc/lq_waechter_melden');
      body = JSON.parse(String(init.body));
      return new Response(JSON.stringify({ truhe: true, stand: { truhen: 2 } }));
    });
    const r = await waechterMelden('t', 'm-en1', 9, 10);
    expect(body).toEqual({ p_token: 't', p_modul: 'm-en1', p_richtig: 9, p_gesamt: 10 });
    expect(r.truhe).toBe(true);
    expect(r.stand?.truhen).toBe(2);
  });

  it('gibt keine Truhe, wenn der Server ablehnt oder die Funktion noch nicht kennt', async () => {
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ message: 'ungueltig' }), { status: 400 }));
    expect(await waechterMelden('t', 'm1', 9, 10)).toEqual({ truhe: false, stand: null });
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ code: 'PGRST202', message: 'Could not find the function public.lq_waechter_melden(p_gesamt, p_modul, p_richtig, p_token) in the schema cache' }), { status: 404 }));
    expect(await waechterMelden('t', 'm1', 9, 10)).toEqual({ truhe: false, stand: null });
  });

  it('wirft bei Netzproblemen, damit die Meldung in der Warteschlange bleibt', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('Failed to fetch');
    });
    await expect(waechterMelden('t', 'm1', 9, 10)).rejects.toThrow('offline');
  });
});
