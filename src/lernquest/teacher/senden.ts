// Sending a lesson's Lernpaket to a class: the package with the teacher's own pictures as small JPEGs (they live only
// in this browser) and a size check against the server's limit, so the teacher gets a clear message instead of
// „ungueltig“.
import type { Lesson, Module } from '../../library/types';
import { getImage } from '../../storage/db';
import { BILD_SEITE, buildPaket, mitBildern } from '../paket';
import { freischalten, LqError } from '../server';

/**
 * Bytes of JSON we send at most: `lq_freischalten` takes 300 000 bytes of `jsonb::text`, which writes a space after
 * every colon and comma, so the same package is a little longer there.
 */
export const PAKET_MAX = 270_000;

/** A stored picture as a JPEG data URL of at most `seite` pixels (white behind transparent parts); null when it is gone. */
export async function bildVorschau(id: string, seite: number = BILD_SEITE): Promise<string | null> {
  const blob = await getImage(id);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, seite / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.naturalWidth * scale));
    c.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const g = c.getContext('2d');
    if (!g) return null;
    g.fillStyle = '#fff';
    g.fillRect(0, 0, c.width, c.height);
    g.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', seite > BILD_SEITE ? 0.7 : 0.72);
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Unlocks (or sends again) a lesson for a class; `versteckt` are the lessons hidden from it. */
export async function paketSenden(keys: string[], klasse: string, m: Module, l: Lesson, lessons: Lesson[], versteckt: readonly string[]): Promise<void> {
  const paket = await mitBildern(buildPaket(m, l, lessons, versteckt), bildVorschau);
  if (new TextEncoder().encode(JSON.stringify(paket)).length > PAKET_MAX) throw new LqError('gross');
  await freischalten(keys, klasse, l.id, paket);
}
