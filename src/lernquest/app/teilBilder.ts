// Painted pictures for the hero (docs/design/lernquest/bilder.md). A picture belongs to a part by its file name:
// src/lernquest/app/teile/<part id>.webp, the bald base figure as koerper-<skin tone>.webp and each hair as
// haare-<hair id>-<colour>.webp (`FRISUREN`, `HAARFARBEN`) and each mouth as mund-<mouth id>.webp (`MUENDER`). Every file is a whole layer (480 × 480, transparent where
// empty) made by `npm run lq:bilder`. Vite gives each file a hashed name under assets/, so the service worker keeps it
// for offline use and a new picture is never stale.
// Anything without a picture is drawn as before (avatar.tsx), so pictures can arrive one by one.
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

/** The painted bald base figure in a skin tone, if there is one. */
export const koerperBild = (haut: number): string | undefined =>
  TEIL_BILDER[`koerper-${haut}`] ?? TEIL_BILDER['koerper-0'];

/** The painted hair in a colour, if there is one (only with the painted base figure, which it was made on). */
export const haareBild = (frisur: string, farbe: number): string | undefined =>
  TEIL_BILDER['koerper-0'] ? (TEIL_BILDER[`haare-${frisur}-${farbe}`] ?? TEIL_BILDER[`haare-${frisur}-0`]) : undefined;

/** The painted mouth, if there is one (it was made on the painted base figure, like the hair). */
export const mundBild = (mund: string): string | undefined =>
  TEIL_BILDER['koerper-0'] ? TEIL_BILDER[`mund-${mund}`] : undefined;
