// The lock of the Baukasten on the teacher's devices: a 6-digit code before the teacher pages show (at start and after
// 15 minutes without a touch), so children at the teacher's iPad or at the projector laptop cannot open lessons, classes
// or PINs. Only a salted PBKDF2 hash of the code is stored, as `geraet:sperre` on this device (not in backups, not in
// the sync; each device gets its own code). Wrong codes cost waiting time, also across reloads.
// It is a lock against people at the device, not encryption: the data in the browser's storage stays as it is.
import { get, set, del } from 'idb-keyval';
import { kv } from '../storage/kv';

export const SPERRE_KEY = 'geraet:sperre';
export const CODE_LAENGE = 6;
/** Minutes without a touch until the lock closes again. */
export const PAUSE_MINUTEN = 15;
/** Free tries; after them every wrong code doubles the waiting time (30 s, 1 min, 2 min, … at most 1 hour). */
export const FREIE_VERSUCHE = 5;
const ITERATIONEN = 210_000;

export interface Sperre {
  salt: string;
  hash: string;
  iter: number;
  /** Wrong codes in a row, and until when (ms) no code is taken. */
  fehler: number;
  bis: number;
}

const hex = (b: ArrayBuffer | Uint8Array) => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('');
const unhex = (s: string) => new Uint8Array((s.match(/../g) ?? []).map((h) => parseInt(h, 16)));

/** Six digits, not all the same and not counting up or down (123456, 654321). */
export function codeFehler(code: string): string {
  if (!new RegExp(`^\\d{${CODE_LAENGE}}$`).test(code)) return `Der Code hat genau ${CODE_LAENGE} Ziffern.`;
  if (/^(\d)\1+$/.test(code)) return 'Bitte nicht sechsmal dieselbe Ziffer.';
  const d = [...code].map(Number);
  const schritt = d.slice(1).map((x, i) => x - d[i]);
  if (schritt.every((s) => s === 1) || schritt.every((s) => s === -1)) return 'Bitte keine Zahlenreihe wie 123456.';
  return '';
}

export async function hashVon(code: string, salt: Uint8Array, iter = ITERATIONEN): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(code), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations: iter }, key, 256);
  return hex(bits);
}

/** Compares without stopping at the first difference. */
function gleich(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

/** Waiting time after `fehler` wrong codes in a row (ms). */
export const wartezeit = (fehler: number) => (fehler < FREIE_VERSUCHE ? 0 : Math.min(60 * 60_000, 30_000 * 2 ** (fehler - FREIE_VERSUCHE)));

export async function neueSperre(code: string): Promise<Sperre> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { salt: hex(salt), hash: await hashVon(code, salt), iter: ITERATIONEN, fehler: 0, bis: 0 };
}

/** Checks a code: the new state to store and whether it was right ('warten' while the waiting time runs). */
export async function pruefe(s: Sperre, code: string, jetzt = Date.now()): Promise<{ ergebnis: 'ok' | 'falsch' | 'warten'; sperre: Sperre }> {
  if (jetzt < s.bis) return { ergebnis: 'warten', sperre: s };
  const ok = gleich(await hashVon(code, unhex(s.salt), s.iter), s.hash);
  if (ok) return { ergebnis: 'ok', sperre: { ...s, fehler: 0, bis: 0 } };
  const fehler = s.fehler + 1;
  return { ergebnis: 'falsch', sperre: { ...s, fehler, bis: jetzt + wartezeit(fehler) } };
}

export function leseSperre(x: unknown): Sperre | null {
  if (!x || typeof x !== 'object') return null;
  const r = x as Partial<Sperre>;
  if (typeof r.salt !== 'string' || !/^[0-9a-f]{32}$/.test(r.salt) || typeof r.hash !== 'string' || !/^[0-9a-f]{64}$/.test(r.hash)) return null;
  const iter = Number(r.iter);
  return { salt: r.salt, hash: r.hash, iter: Number.isInteger(iter) && iter >= 100_000 ? iter : ITERATIONEN, fehler: Math.max(0, Number(r.fehler) || 0), bis: Math.max(0, Number(r.bis) || 0) };
}

export const ladeSperre = async () => leseSperre(await get(SPERRE_KEY, kv()));
export const speichereSperre = (s: Sperre) => set(SPERRE_KEY, s, kv());
export const loescheSperre = () => del(SPERRE_KEY, kv());
