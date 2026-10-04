import { describe, expect, it } from 'vitest';
import { normalizeDoc } from './normalize';
import { ageOf, fachOf, lookClasses, lookFor, readModuleLook, typeClass, variantClass } from './look';

describe('subject designs', () => {
  it('follow the subject and the grade', () => {
    expect(fachOf('Geographie')).toBe('geo');
    expect(fachOf('Erdkunde')).toBe('geo');
    expect(fachOf('Englisch')).toBe('eng');
    expect(fachOf('Informatik')).toBe('inf');
    expect(fachOf('Mathematik')).toBeNull();
    expect(ageOf(5)).toBe(1);
    expect(ageOf(6)).toBe(1);
    expect(ageOf(7)).toBe(2);
    expect(lookFor({ subject: 'Geographie', grade: 9 })).toEqual({ fach: 'geo', age: 2, variant: 'bubble', head: 'a' });
    expect(lookFor({ subject: 'Mathematik', grade: 9 })).toBeNull();
  });
  it('can be chosen per module', () => {
    expect(lookFor({ subject: 'Geographie', grade: 9, look: { theme: 'organisch', variant: 'bubble', head: 'a' } })).toBeNull();
    expect(lookFor({ subject: 'Mathematik', grade: 5, look: { theme: 'inf', variant: 'bubble', head: 'b' } })).toEqual({ fach: 'inf', age: 1, variant: 'bubble', head: 'b' });
  });
  it('become classes on the page', () => {
    expect(lookClasses({ fach: 'eng', age: 1, variant: 'comic', head: 'a' })).toBe(' is-fd is-f-eng is-age-1 is-x-comic is-fh-a');
    expect(lookClasses({ fach: 'eng', age: 2, variant: 'comic', head: 'o' })).toBe(' is-fd is-f-eng is-age-2');
    expect(lookClasses(null)).toBe('');
    expect(typeClass('vocab')).toBe(' is-t-wortschatz');
    expect(typeClass('listening')).toBe(' is-t-hoeren');
    expect(variantClass('accent')).toBe('is-v-p');
    expect(variantClass('accent-2')).toBe('is-v-s');
    expect(variantClass('accent-5')).toBe('is-v-t');
  });
  it('read stored values leniently', () => {
    expect(readModuleLook({ theme: 'geo', variant: 'x', head: 'b' })).toEqual({ theme: 'geo', variant: 'bubble', head: 'b' });
    expect(readModuleLook({ theme: 'mathe' })?.theme).toBe('auto');
    expect(readModuleLook(undefined)).toBeUndefined();
    const doc = normalizeDoc({ pages: [{ title: 'A', blocks: [] }], look: { fach: 'inf', age: 1, variant: 'sticker', head: 'o' } });
    expect(doc.look).toEqual({ fach: 'inf', age: 1, variant: 'sticker', head: 'o' });
    expect(normalizeDoc({ pages: [{ title: 'A', blocks: [] }], look: { fach: 'x' } }).look).toBeUndefined();
  });
});
