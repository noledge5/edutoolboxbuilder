import { describe, expect, it } from 'vitest';
import { normalizeDoc } from './normalize';
import { ageOf, fachOf, lookClasses, lookFor, readModuleLook, readSheetLook, sheetClasses, sheetLookFor, subjectLabel, typeClass, variantClass } from './look';

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

describe('sheet design', () => {
  it('takes form, age and subject from the module', () => {
    expect(sheetLookFor({ subject: 'Geographie', grade: 9 })).toEqual({ form: 'geo', age: 2, subject: 'Geographie' });
    expect(sheetLookFor({ subject: ' Englisch ', grade: 5 })).toEqual({ form: 'eng', age: 1, subject: 'Englisch' });
    expect(sheetLookFor({ subject: 'Mathematik', grade: 8 })).toEqual({ form: 'org', age: 2, subject: 'Mathematik' });
    expect(sheetLookFor({ subject: 'Geographie', grade: 6, look: { theme: 'organisch', variant: 'bubble', head: 'a' } }).form).toBe('org');
    expect(sheetLookFor({ subject: 'Mathematik', grade: 7, look: { theme: 'inf', variant: 'bubble', head: 'a' } }).form).toBe('inf');
  });
  it('becomes classes on the page', () => {
    expect(sheetClasses({ form: 'inf', age: 1, subject: 'Informatik' })).toBe(' is-k-inf is-age-1');
    expect(sheetClasses(undefined)).toBe(' is-k-org is-age-2');
  });
  it('names the subject in the header once', () => {
    expect(subjectLabel('Klasse 9 · Modellversuch', 'Geographie')).toBe('Geographie');
    expect(subjectLabel('Klasse 9 · Geographie · Modul 1', 'Geographie')).toBe('');
    expect(subjectLabel('Klasse 9', '')).toBe('');
  });
  it('reads stored values leniently', () => {
    expect(readSheetLook({ form: 'eng', age: 1, subject: 'Englisch' })).toEqual({ form: 'eng', age: 1, subject: 'Englisch' });
    expect(readSheetLook({ form: 'x', age: 7, subject: 3 })).toEqual({ form: 'org', age: 2, subject: '' });
    expect(readSheetLook(null)).toBeUndefined();
    const doc = normalizeDoc({ pages: [{ title: 'A', blocks: [] }], sheet: { form: 'geo', age: 2, subject: 'Geographie' } });
    expect(doc.sheet).toEqual({ form: 'geo', age: 2, subject: 'Geographie' });
    expect(normalizeDoc({ pages: [{ title: 'A', blocks: [] }] }).sheet).toBeUndefined();
  });
});
