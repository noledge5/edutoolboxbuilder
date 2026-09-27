// Hash routes, so the browser's back button works and GitHub Pages needs no server rules:
//   #/?fach=Geographie&klasse=9   overview
//   #/modul/<id>                   module (content overview, competence grid)
//   #/stunde/<id>                  worksheet editor
//   #/folien/<id>                  slides of a lesson
//   #/jahresplan?fach=…&klasse=…   year plan of a subject and grade
import { useSyncExternalStore } from 'react';

export type Route =
  | { view: 'overview'; subject?: string; grade?: number }
  | { view: 'module'; id: string }
  | { view: 'lesson'; id: string }
  | { view: 'slides'; id: string }
  | { view: 'plan'; subject: string; grade: number };

export function parseRoute(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#/, '').split('?');
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  if (parts[0] === 'modul' && parts[1]) return { view: 'module', id: parts[1] };
  if (parts[0] === 'stunde' && parts[1]) return { view: 'lesson', id: parts[1] };
  if (parts[0] === 'folien' && parts[1]) return { view: 'slides', id: parts[1] };
  const q = new URLSearchParams(query);
  const grade = Number(q.get('klasse'));
  if (parts[0] === 'jahresplan' && q.get('fach') && grade > 0) return { view: 'plan', subject: q.get('fach')!, grade };
  return { view: 'overview', subject: q.get('fach') ?? undefined, grade: Number.isFinite(grade) && grade > 0 ? grade : undefined };
}

export function routeHash(r: Route): string {
  if (r.view === 'module') return `#/modul/${encodeURIComponent(r.id)}`;
  if (r.view === 'lesson') return `#/stunde/${encodeURIComponent(r.id)}`;
  if (r.view === 'slides') return `#/folien/${encodeURIComponent(r.id)}`;
  const q = new URLSearchParams();
  if (r.subject) q.set('fach', r.subject);
  if (r.grade) q.set('klasse', String(r.grade));
  const s = q.toString();
  if (r.view === 'plan') return `#/jahresplan?${s}`;
  return s ? `#/?${s}` : '#/';
}

export function go(r: Route, replace = false) {
  const hash = routeHash(r);
  if (replace) history.replaceState(null, '', hash);
  else if (location.hash !== hash) location.hash = hash;
  if (replace) window.dispatchEvent(new HashChangeEvent('hashchange'));
}

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => location.hash);
  return parseRoute(hash);
}
