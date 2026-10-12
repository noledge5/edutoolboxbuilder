// The pairing code of the automatic sync and what is derived from it. The code (100 random bits and a 20-bit check,
// "K7QF-…") stays on the teacher's devices; the server only sees a room id, a token and ciphertext. Entries and
// pictures are named on the server by an HMAC of their key, so it cannot tell modules from lessons.
import { fromB64, toB64 } from '../share/crypto';

/** Crockford's base 32: no I, L, O, U, so codes are easy to read and type. */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const DATA = 20;
const CHECK = 4;

const enc = new TextEncoder();
const hex = (b: ArrayBuffer | Uint8Array) => Array.from(b instanceof Uint8Array ? b : new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('');

async function checkOf(data: string): Promise<string> {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(`baukasten-code:${data}`)));
  let out = '';
  for (let i = 0; i < CHECK; i++) out += ALPHABET[h[i] % 32];
  return out;
}

/** A new pairing code, e.g. "K7QF-9MXA-2RTB-H8CW-5NPD-QJ3E". */
export async function newCode(): Promise<string> {
  const bytes = crypto.getRandomValues(new Uint8Array(DATA));
  const data = Array.from(bytes, (b) => ALPHABET[b % 32]).join('');
  return groups(data + (await checkOf(data)));
}

const groups = (s: string) => s.match(/.{1,4}/g)!.join('-');

/** The code as typed or scanned (also a link with the code), or null if it is not a valid code. */
export async function readCode(input: string): Promise<string | null> {
  const fromLink = /koppeln\/([0-9A-Za-z-]+)/.exec(input)?.[1] ?? input;
  const s = fromLink
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1')
    .replace(/U/g, 'V');
  if (s.length !== DATA + CHECK) return null;
  const data = s.slice(0, DATA);
  return (await checkOf(data)) === s.slice(DATA) ? groups(s) : null;
}

/** The link in the QR code: opens the Baukasten with the code. */
export const pairLink = (code: string, base = `${location.origin}${location.pathname}`) => `${base}#/koppeln/${code.replace(/-/g, '')}`;

export interface SyncKeys {
  /** Name of the room on the server (hex, 32). */
  room: string;
  /** Proof for the server (hex, 64); it keeps only its hash. */
  token: string;
  aes: CryptoKey;
  mac: CryptoKey;
}

const SALT = enc.encode('arbeitsblatt-baukasten-abgleich-1');

export async function deriveKeys(code: string): Promise<SyncKeys> {
  const secret = code.replace(/-/g, '').slice(0, DATA);
  const base = await crypto.subtle.importKey('raw', enc.encode(secret), 'HKDF', false, ['deriveBits', 'deriveKey']);
  const bits = (info: string, n: number) => crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: SALT, info: enc.encode(info) }, base, n * 8);
  const room = hex(await bits('raum', 16));
  const token = hex(await bits('token', 32));
  const aes = await crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: SALT, info: enc.encode('schluessel') }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const mac = await crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: SALT, info: enc.encode('namen') }, base, { name: 'HMAC', hash: 'SHA-256', length: 256 }, false, ['sign']);
  return { room, token, aes, mac };
}

/** The name of an entry or picture on the server. */
export async function serverName(k: SyncKeys, key: string): Promise<string> {
  return hex(await crypto.subtle.sign('HMAC', k.mac, enc.encode(key))).slice(0, 32);
}

/** IV and ciphertext in one base64 text. */
export async function encrypt(k: SyncKeys, plain: Uint8Array<ArrayBuffer>): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k.aes, plain));
  const out = new Uint8Array(12 + ct.length);
  out.set(iv);
  out.set(ct, 12);
  return toB64(out);
}

export async function decrypt(k: SyncKeys, text: string): Promise<Uint8Array<ArrayBuffer>> {
  const all = fromB64(text);
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: all.subarray(0, 12) }, k.aes, all.subarray(12)));
}

export const encryptJson = (k: SyncKeys, value: unknown) => encrypt(k, enc.encode(JSON.stringify(value)));
export const decryptJson = async <T>(k: SyncKeys, text: string): Promise<T> => JSON.parse(new TextDecoder().decode(await decrypt(k, text))) as T;

/** A picture: its type, a zero byte, its bytes. */
export async function encryptBlob(k: SyncKeys, blob: Blob): Promise<string> {
  const head = enc.encode(blob.type || 'application/octet-stream');
  const body = new Uint8Array(await blob.arrayBuffer());
  const all = new Uint8Array(head.length + 1 + body.length);
  all.set(head);
  all.set(body, head.length + 1);
  return encrypt(k, all);
}

export async function decryptBlob(k: SyncKeys, text: string): Promise<Blob> {
  const all = await decrypt(k, text);
  const zero = all.indexOf(0);
  return new Blob([all.subarray(zero + 1)], { type: new TextDecoder().decode(all.subarray(0, zero)) });
}
