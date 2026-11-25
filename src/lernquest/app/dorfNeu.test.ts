import { describe, expect, it } from 'vitest';
import { dorfNeu } from './Dorf';

describe('Neues im Dorf seit dem letzten Besuch', () => {
  it('lässt beim ersten Besuch nichts aufploppen', () => {
    expect(dorfNeu(null, { fertig: ['brunnen'], haeuser: [1, null] })).toEqual({});
  });

  it('findet neue Gebäude, neue und ausgebaute Häuser, aber keine gleich gebliebenen', () => {
    const alt = { fertig: ['brunnen'], haeuser: [1, null, 3] };
    expect(dorfNeu(alt, { fertig: ['brunnen', 'bruecke'], haeuser: [2, 0, 3, 0] })).toEqual({ gebaeude: ['bruecke'], haeuser: [0, 1, 3] });
    expect(dorfNeu(alt, alt)).toEqual({ gebaeude: [], haeuser: [] });
  });
});
