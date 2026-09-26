import { describe, expect, it } from 'vitest';
import { parseRoute, routeHash } from './router';

describe('routes', () => {
  it('round-trips every view', () => {
    for (const r of [
      { view: 'overview' as const },
      { view: 'overview' as const, subject: 'Geographie', grade: 9 },
      { view: 'module' as const, id: 'b12' },
      { view: 'lesson' as const, id: 'b34' },
    ]) {
      expect(parseRoute(routeHash(r))).toEqual({ ...r, ...(r.view === 'overview' ? { subject: r.subject, grade: r.grade } : {}) });
    }
  });

  it('falls back to the overview', () => {
    expect(parseRoute('')).toEqual({ view: 'overview', subject: undefined, grade: undefined });
    expect(parseRoute('#/unbekannt')).toMatchObject({ view: 'overview' });
  });
});
