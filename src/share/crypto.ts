// End-to-end encryption of the students' results: every handout has its own key pair (ECDH P-256). Its public key
// goes out with the assignment; the student's browser derives an AES-GCM key with a fresh key pair of its own and
// encrypts name and answers. Only the teacher's devices (which keep the private key with the handout) can read them;
// the server stores nothing but ciphertext.

const ALG = { name: 'ECDH', namedCurve: 'P-256' } as const;

export interface KeyPair {
  publicKey: JsonWebKey;
  privateKey: JsonWebKey;
}

export async function newKeyPair(): Promise<KeyPair> {
  const k = (await crypto.subtle.generateKey(ALG, true, ['deriveKey'])) as CryptoKeyPair;
  return { publicKey: await crypto.subtle.exportKey('jwk', k.publicKey), privateKey: await crypto.subtle.exportKey('jwk', k.privateKey) };
}

const toB64 = (bytes: Uint8Array) => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const fromB64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

const aesKey = (priv: CryptoKey, pub: CryptoKey) => crypto.subtle.deriveKey({ name: 'ECDH', public: pub }, priv, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);

/** Encrypts `data` for the holder of the private key belonging to `publicKey`; the result is one text. */
export async function seal(data: unknown, publicKey: JsonWebKey): Promise<string> {
  const teacher = await crypto.subtle.importKey('jwk', publicKey, ALG, false, []);
  const mine = (await crypto.subtle.generateKey(ALG, true, ['deriveKey'])) as CryptoKeyPair;
  const key = await aesKey(mine.privateKey, teacher);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(JSON.stringify(data));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));
  const epk = await crypto.subtle.exportKey('jwk', mine.publicKey);
  return JSON.stringify({ v: 1, x: epk.x, y: epk.y, iv: toB64(iv), ct: toB64(ct) });
}

/** Reads what `seal` encrypted, with the private key of the handout. Throws if it was not meant for this key. */
export async function open<T = unknown>(sealed: string, privateKey: JsonWebKey): Promise<T> {
  const s = JSON.parse(sealed) as { v: number; x: string; y: string; iv: string; ct: string };
  const priv = await crypto.subtle.importKey('jwk', privateKey, ALG, false, ['deriveKey']);
  const theirs = await crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: s.x, y: s.y, ext: true }, ALG, false, []);
  const key = await aesKey(priv, theirs);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(s.iv) }, key, fromB64(s.ct));
  return JSON.parse(new TextDecoder().decode(plain)) as T;
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

/** A random id of letters and digits (no look-alikes), e.g. for a handout or a student's submission. */
export function randomId(length = 10): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}
