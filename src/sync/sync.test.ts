import { describe, expect, it } from 'vitest';
import { newLesson, newModule, seedLibrary } from '../library/model';
import type { Library } from '../library/types';
import { decryptBlob, decryptJson, deriveKeys, encryptBlob, encryptJson, newCode, pairLink, readCode, serverName } from './keys';
import { entriesOf, mergeRemote, toSend } from './merge';

describe('pairing code', () => {
  it('is 24 characters in groups of four and checks itself', async () => {
    const code = await newCode();
    expect(code).toMatch(/^([0-9A-HJKMNP-TV-Z]{4}-){5}[0-9A-HJKMNP-TV-Z]{4}$/);
    expect(await readCode(code)).toBe(code);
    expect(await readCode(code.toLowerCase().replace(/-/g, ' '))).toBe(code);
    expect(await readCode(pairLink(code, 'https://x.example/app/'))).toBe(code);
    // One wrong character is noticed.
    const wrong = code.slice(0, 2) + (code[2] === 'A' ? 'B' : 'A') + code.slice(3);
    expect(await readCode(wrong)).toBeNull();
    expect(await readCode('zu kurz')).toBeNull();
  });
  it('reads O as 0 and I or L as 1', async () => {
    let code = '';
    for (let i = 0; i < 50 && !/[01]/.test(code.slice(0, 24)); i++) code = await newCode();
    const typed = code.replace(/0/g, 'O').replace(/1/g, 'l');
    expect(await readCode(typed)).toBe(code);
  });
  it('derives the same room and keys on both devices, and encrypts', async () => {
    const code = await newCode();
    const a = await deriveKeys(code);
    const b = await deriveKeys(code);
    const c = await deriveKeys(await newCode());
    expect(a.room).toMatch(/^[0-9a-f]{32}$/);
    expect(a.token).toMatch(/^[0-9a-f]{64}$/);
    expect(a.room).toBe(b.room);
    expect(a.token).toBe(b.token);
    expect(c.room).not.toBe(a.room);
    expect(await serverName(a, 'l:x')).toBe(await serverName(b, 'l:x'));
    expect(await serverName(a, 'l:x')).toMatch(/^[0-9a-f]{32}$/);
    const sealed = await encryptJson(a, { k: 'l:x', v: { title: 'Der Treibhauseffekt' } });
    expect(sealed).not.toContain('Treibhaus');
    expect(await decryptJson(b, sealed)).toEqual({ k: 'l:x', v: { title: 'Der Treibhauseffekt' } });
    await expect(decryptJson(c, sealed)).rejects.toThrow();
    const blob = new Blob([new Uint8Array([1, 2, 3, 0, 4])], { type: 'image/jpeg' });
    const back = await decryptBlob(b, await encryptBlob(a, blob));
    expect(back.type).toBe('image/jpeg');
    expect([...new Uint8Array(await back.arrayBuffer())]).toEqual([1, 2, 3, 0, 4]);
  });
});

/** A library with one real module and lesson (changed at time 100). */
function lib(): Library {
  const l = seedLibrary();
  const m = { ...newModule(l, 'Englisch', 5), id: 'm1', title: 'Hello', updatedAt: 100 };
  const lesson = { ...newLesson(l, m), id: 'l1', moduleId: 'm1', title: 'Stunde A', updatedAt: 100 };
  return { ...l, modules: [m], lessons: [lesson], deleted: {}, settings: { ...l.settings, updatedAt: 50 } };
}
const remoteOf = (entries: [string, unknown][]) => new Map(entries);

describe('sending', () => {
  it('sends what changed since the last agreement, never the untouched sample', () => {
    const l = lib();
    expect(toSend(l, {}).map((e) => e.key)).toEqual(['m:m1', 'l:l1', 's']);
    expect(toSend(l, { 'm:m1': 100, 'l:l1': 100, s: 50 })).toEqual([]);
    const sample = seedLibrary();
    expect(toSend(sample, {}).filter((e) => e.key !== 's' && e.key !== 'd')).toEqual([]);
    expect(entriesOf(l).find((e) => e.key === 'd')!.updatedAt).toBe(0);
  });
});

describe('taking in', () => {
  it('takes newer entries and new ones, keeps newer local ones, and remembers the agreement', () => {
    const l = lib();
    const there = { ...l.lessons[0], title: 'Stunde A (iPad)', updatedAt: 200 };
    const added = { ...l.lessons[0], id: 'l2', title: 'Stunde B', updatedAt: 150 };
    const r = mergeRemote(l, remoteOf([['l:l1', there], ['l:l2', added], ['m:m1', { ...l.modules[0], updatedAt: 90 }]]), { 'l:l1': 100, 'm:m1': 100 });
    expect(r.library.lessons.map((x) => x.title).sort()).toEqual(['Stunde A (iPad)', 'Stunde B']);
    expect(r.lessons.map((x) => x.id).sort()).toEqual(['l1', 'l2']);
    expect(r.modules).toEqual([]);
    expect(r.base['l:l1']).toBe(200);
    expect(r.conflicts).toEqual([]);
    expect(r.taken).toBe(2);
    expect(toSend(r.library, r.base).map((e) => e.key)).toEqual(['s']);
  });
  it('a lesson changed on both devices: the newer wins, the other is kept as a version', () => {
    const l = lib();
    l.lessons[0] = { ...l.lessons[0], title: 'hier geändert', updatedAt: 300 };
    const there = { ...l.lessons[0], title: 'dort geändert', updatedAt: 400 };
    const r = mergeRemote(l, remoteOf([['l:l1', there]]), { 'l:l1': 100 });
    expect(r.library.lessons[0].title).toBe('dort geändert');
    expect(r.keep).toHaveLength(1);
    expect(r.keep[0].lesson.title).toBe('hier geändert');
    expect(r.conflicts).toEqual(['dort geändert']);
    // The other way round: here is newer, the version from there is kept, and here goes to the server.
    const older = { ...there, updatedAt: 250, title: 'dort älter' };
    const r2 = mergeRemote(l, remoteOf([['l:l1', older]]), { 'l:l1': 100 });
    expect(r2.library.lessons[0].title).toBe('hier geändert');
    expect(r2.keep[0].lesson.title).toBe('dort älter');
    expect(toSend(r2.library, r2.base).map((e) => e.key)).toContain('l:l1');
  });
  it('carries deletions both ways', () => {
    const l = lib();
    const r = mergeRemote(l, remoteOf([['d', { l1: 500 }]]), {});
    expect(r.library.lessons).toEqual([]);
    expect(r.removedLessons).toEqual(['l1']);
    expect(r.deleted).toBe(true);
    // A deletion known only here goes back to the server.
    const here = { ...lib(), deleted: { old: 50 } };
    const r2 = mergeRemote(here, remoteOf([['d', { other: 40 }]]), { d: 40 });
    expect(r2.library.deleted).toEqual({ old: 50, other: 40 });
    expect(toSend(r2.library, r2.base).map((e) => e.key)).toContain('d');
    // Changed after the deletion on the other device: it stays.
    const r3 = mergeRemote(lib(), remoteOf([['d', { l1: 80 }]]), {});
    expect(r3.library.lessons).toHaveLength(1);
  });
  it('merges settings changed on both devices', () => {
    const l = lib();
    l.settings = { ...l.settings, subjects: ['Englisch'], classProfiles: { 'Englisch · 5': 'hier' }, updatedAt: 300 };
    const there = { ...l.settings, subjects: ['Geographie'], classProfiles: { 'Geographie · 9': 'dort' }, principles: 'Ich-Du-Wir', updatedAt: 400 };
    const r = mergeRemote(l, remoteOf([['s', there]]), { s: 100 }, 999);
    expect(r.library.settings.subjects).toEqual(['Geographie', 'Englisch']);
    expect(r.library.settings.classProfiles).toEqual({ 'Englisch · 5': 'hier', 'Geographie · 9': 'dort' });
    expect(r.library.settings.principles).toBe('Ich-Du-Wir');
    expect(r.library.settings.updatedAt).toBe(999);
    expect(toSend(r.library, r.base).map((e) => e.key)).toContain('s');
  });
  it('sends an untouched module along with its changed lesson, and keeps it on the other device', () => {
    const a = seedLibrary();
    a.lessons[0] = { ...a.lessons[0], title: 'geändert', updatedAt: 500 };
    const sent = toSend(a, {});
    expect(sent.map((e) => e.key)).toEqual([`m:${a.modules[0].id}`, `l:${a.lessons[0].id}`]);
    expect(toSend(a, { [`m:${a.modules[0].id}`]: 0, [`l:${a.lessons[0].id}`]: 500 })).toEqual([]);
    const b = seedLibrary();
    const r = mergeRemote(b, new Map(sent.map((e) => [e.key, e.value])), {});
    expect(r.library.modules.map((m) => m.id)).toEqual([a.modules[0].id]);
    expect(r.library.lessons.map((l) => l.title)).toEqual(['geändert']);
  });
  it('drops the untouched sample at the first sync with a library that has content', () => {
    const sample = seedLibrary();
    const l = lib();
    const r = mergeRemote(sample, remoteOf([['m:m1', l.modules[0]], ['l:l1', l.lessons[0]]]), {});
    expect(r.library.modules.map((m) => m.id)).toEqual(['m1']);
    expect(r.removedLessons).toContain(sample.lessons[0].id);
  });
});
