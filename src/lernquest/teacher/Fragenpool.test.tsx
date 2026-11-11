// The pool dialog as the teacher first sees it (Stufe B): level, explanation, the typed format, „Alle freigeben“.
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { createPage } from '../../model/ops';
import type { Lesson, Module, Settings } from '../../library/types';
import type { PoolEintrag } from '../types';
import { FragenpoolDialog } from './Fragenpool';

it('zeigt Stufe, Erklärung und „Selbst schreiben“ und bietet „Alle freigeben“ für das Ungeprüfte', () => {
  const pool: PoolEintrag[] = [
    { u: { art: 'schreiben', id: 'pool-a', frage: 'Schreib es auf Englisch.', aussage: 'die Schwester', loesungen: ['sister', 'the sister'], niveau: 3, erklaerung: 'sister = Schwester.' }, frei: false },
    { u: { art: 'richtigfalsch', id: 'pool-b', frage: 'Stimmt das?', aussage: 'Tom has got a sister.', richtig: true, niveau: 1 }, frei: true },
  ];
  const stunde = { id: 'l1', moduleId: 'm1', number: 3, title: 'My family', doc: { pages: [createPage()] }, pool, updatedAt: 1 } as unknown as Lesson;
  const modul = { id: 'm1', number: 2, title: 'Family', icon: 'users', subject: 'Englisch', grade: 5, lang: 'en' } as unknown as Module;
  const html = renderToStaticMarkup(<FragenpoolDialog modul={modul} stunde={stunde} settings={{} as Settings} onChange={() => {}} onClose={() => {}} />);
  expect(html).toContain('Selbst schreiben · schwer');
  expect(html).toContain('Richtig/Falsch · leicht');
  expect(html).toContain('auch richtig: the sister');
  expect(html).toContain('Erklärung: sister = Schwester.');
  expect(html).toContain('Alle freigeben (1)');
});
