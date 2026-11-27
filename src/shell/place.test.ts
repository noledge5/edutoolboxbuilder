import { describe, expect, it } from 'vitest';
import { demoLibrary } from '../demo/demoLibrary';
import { boardPlace, placeOf } from './place';

describe('place of the library screens', () => {
  const lib = demoLibrary();
  it('defaults to the first subject and its first class with modules', () => {
    expect(boardPlace(lib)).toEqual({ subject: 'Geographie', grade: 5 });
    expect(boardPlace(lib, 'Englisch')).toEqual({ subject: 'Englisch', grade: 6 });
  });
  it('keeps an asked class without modules, and ignores unknown subjects and classes', () => {
    expect(boardPlace(lib, 'Biologie', 7)).toEqual({ subject: 'Biologie', grade: 7 });
    expect(boardPlace(lib, 'Latein', 42)).toEqual({ subject: 'Geographie', grade: 5 });
  });
  it('finds module, lesson and year plan places; none for Lernquest', () => {
    expect(placeOf(lib, { view: 'module', id: 'demo-eng8-m1' })).toEqual({ subject: 'Englisch', grade: 8, moduleId: 'demo-eng8-m1' });
    expect(placeOf(lib, { view: 'lesson', id: 'demo-geo9-m1-s2' })).toEqual({ subject: 'Geographie', grade: 9, moduleId: 'demo-geo9-m1' });
    expect(placeOf(lib, { view: 'plan', subject: 'Informatik', grade: 10 })).toEqual({ subject: 'Informatik', grade: 10 });
    expect(placeOf(lib, { view: 'lernquest' })).toBeNull();
    expect(placeOf(lib, { view: 'module', id: 'gibt-es-nicht' })).toBeNull();
  });
});
