// Recorded voice for reading English aloud (26.11.2026; the teacher: the device voices sound broken or tinny on many
// phones). When the teacher sends a station to a class, her Baukasten has Google's text-to-speech record every English
// text a child can hear there (teacher/stimme.ts) and stores the MP3s on the server (20261206_lernquest_ton.sql),
// keyed by a hash of the spoken text. The children's app loads them ahead and plays them (app/vorlesen.ts); without a
// recording it speaks with the device's voice as before. This file is the shared part: which texts are read and their key.
import { richParts } from '../model/text';
import type { Paket, Uebung } from './types';

/** The text as it is spoken: without **bold** and {{marks}}, spaces collapsed. */
export const vorleseText = (text: string) =>
  richParts(text)
    .map((p) => p.text)
    .join('')
    .replace(/\s+/g, ' ')
    .trim();

/** The sentence read after „Prüfen“ in English packages (gap and word order, Runde.tsx). */
export function nachDemPruefen(u: Uebung): string {
  if (u.art === 'luecke') return u.teile.join('');
  if (u.art === 'reihenfolge') return u.loesung;
  return '';
}

/** Every text a child can hear in an exercise: the speakers in Uebungen.tsx and the sentence after „Prüfen“. */
export function vorleseTexteVon(u: Uebung, lang: 'de' | 'en'): string[] {
  const out: string[] = [];
  if (u.art === 'waehlen' && u.hoeren) out.push(u.hoeren);
  if (lang === 'en') {
    if ((u.art === 'waehlen' || u.art === 'richtigfalsch') && u.aussage) out.push(u.aussage);
    if (u.art === 'bild') out.push(u.wort);
    const nach = nachDemPruefen(u);
    if (nach) out.push(nach);
  }
  return out;
}

/** All texts of a package as spoken, each once. */
export function vorleseTexte(p: Pick<Paket, 'lang' | 'uebungen'>): string[] {
  return [...new Set(p.uebungen.flatMap((u) => vorleseTexteVon(u, p.lang)).map(vorleseText).filter(Boolean))];
}

/** The server key of a recording: SHA-256 of „en-GB|“ and the spoken text, as hex (the same in app and Baukasten). */
export async function tonSchluessel(text: string): Promise<string> {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`en-GB|${vorleseText(text)}`));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
