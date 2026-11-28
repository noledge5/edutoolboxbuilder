// The teacher's evaluation shows the exercises the class finds hard (28.11.2026).
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Library } from '../../library/types';
import type { KlasseInfo } from '../server';
import { Auswertung } from './Auswertung';

const rf = (id: string, aussage: string) => ({ art: 'richtigfalsch' as const, id, frage: 'Stimmt das?', aussage, richtig: true });
const lib = {
  modules: [{ id: 'm1', number: 1, title: 'Numbers', icon: '', subject: 'Englisch', grade: 5, lang: 'en', competences: [] }],
  lessons: [{ id: 'l1', moduleId: 'm1', number: 1, title: 'Numbers 1–20', doc: { pages: [] }, pool: [rf('a', '12 = twelve'), rf('b', '13 = thirteen')].map((u) => ({ frei: true, u })) }],
  extras: [],
} as unknown as Library;
const kind = (name: string, a: number) => ({ id: name, name, gesperrt: false, zuletzt: null, geloescht: null, xp: 0, bestwerte: {}, tage: [], leitner: { 'l1/a': [a, 1] as [number, number] } });
const klasse = { id: 'k', name: '5c', code: 'X', geloescht: null, stunden: ['l1'], kinder: [kind('Ali', 1), kind('Bea', 1), kind('Can', 2)] } as unknown as KlasseInfo;

describe('teacher evaluation', () => {
  it('lists the exercises the class finds hard, with the answer and the count', () => {
    const html = renderToStaticMarkup(<Auswertung lib={lib} klasse={klasse} />);
    expect(html).toContain('Diese Aufgaben fallen der Klasse schwer');
    expect(html).toContain('12 = twelve → stimmt');
    expect(html).toContain('2 von 3');
    expect(html).toContain('Zuletzt falsch: Ali, Bea');
    expect(html).not.toContain('13 = thirteen');
  });
});
