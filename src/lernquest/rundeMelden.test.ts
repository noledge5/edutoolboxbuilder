import { afterEach, describe, expect, it, vi } from 'vitest';
import { rundeMelden } from './server';

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
