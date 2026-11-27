import { describe, expect, it } from 'vitest';
import { readLesson, readModule } from '../library/read';
import { isWorkedOut, lessonsOf } from '../library/model';
import { isTopicIcon } from '../topicIcons';
import { demoLibrary } from './demoLibrary';

describe('demo library', () => {
  const lib = demoLibrary();
  it('reads back unchanged, like a synced library', () => {
    for (const m of lib.modules) expect(readModule(m)).toEqual(m);
    for (const l of lib.lessons) expect(readLesson(l)?.id).toBe(l.id);
  });
  it('has worked-out, planned and empty modules, each lesson in a module', () => {
    const ids = new Set(lib.modules.map((m) => m.id));
    expect(lib.lessons.every((l) => ids.has(l.moduleId))).toBe(true);
    const states = lib.modules.map((m) => {
      const ls = lessonsOf(lib, m.id);
      return ls.length === 0 ? 'leer' : ls.some(isWorkedOut) ? 'ausgearbeitet' : 'geplant';
    });
    expect(new Set(states)).toEqual(new Set(['leer', 'ausgearbeitet', 'geplant']));
  });
  it('uses only known topic icons', () => {
    for (const m of lib.modules) expect(isTopicIcon(m.icon), m.icon).toBe(true);
  });
});
