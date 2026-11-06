// Painted pictures for the hero's parts (docs/design/lernquest/bilder.md). A picture belongs to a part by its file
// name: src/lernquest/app/teile/<part id>.webp, the base figures as koerper-<skin tone>.webp,
// koerper2-… and koerper3-… (FIGUREN). Every file is a whole layer (480 × 480, transparent where empty) made by
// `npm run lq:bilder`. Vite gives each file a hashed name under assets/, so the service worker keeps it for offline
// use and a new picture is never stale.
// A part without a picture is drawn as before (avatar.tsx), so pictures can arrive one by one.
import { FIGUR_DATEI } from '../teile';

const DATEIEN = import.meta.glob('./teile/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export const TEIL_BILDER: Record<string, string> = Object.fromEntries(
  Object.entries(DATEIEN).map(([pfad, url]) => [pfad.slice('./teile/'.length, -'.webp'.length), url]),
);

/** The picture of a part, if there is one. */
export const teilBild = (id: string | undefined): string | undefined => (id ? TEIL_BILDER[id] : undefined);


/** The painted base figure in a skin tone, if there is one for this figure (never another figure's picture). */
export const koerperBild = (haut: number, figur = 0): string | undefined => {
  const name = FIGUR_DATEI[figur] ?? FIGUR_DATEI[0];
  return TEIL_BILDER[`${name}-${haut}`] ?? TEIL_BILDER[`${name}-0`];
};
