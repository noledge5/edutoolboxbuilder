// The teacher's column „Wächter“ (28.11.2026).
import { describe, expect, it } from 'vitest';
import { besiegteRegionen, waechterRegionen } from './waechterRegionen';

describe('guard regions for the teacher', () => {
  const module = [
    { id: 'm2', number: 2 },
    { id: 'm1', number: 1 },
    { id: 'm3', number: 3 },
  ];
  const stunden = [
    { id: 'a', moduleId: 'm1' },
    { id: 'b', moduleId: 'm1' },
    { id: 'c', moduleId: 'm2' },
    { id: 'd', moduleId: 'm2' },
    { id: 'e', moduleId: 'm3' },
    { id: 'f', moduleId: 'm3' },
  ];

  it('counts modules with at least two unlocked lessons, in order', () => {
    expect(waechterRegionen(module, stunden, ['a', 'b', 'c', 'd', 'e']).map((m) => m.id)).toEqual(['m1', 'm2']);
    expect(waechterRegionen(module, stunden, ['a'])).toEqual([]);
  });

  it('lists the beaten ones among them only', () => {
    const r = waechterRegionen(module, stunden, ['a', 'b', 'c', 'd']);
    expect(besiegteRegionen(r, ['m2', 'm3', 'extra-wortschatz-5']).map((m) => m.id)).toEqual(['m2']);
    expect(besiegteRegionen(r, undefined)).toEqual([]);
  });
});
