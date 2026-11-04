// "Präsi in Canva" (Runde 9): hands a lesson's picture to Canva without making it public. The Baukasten posts one
// picture; it goes into the private bucket "praesi-bilder" under a random name, and the answer is a signed link that
// works for one hour (Canva imports it from there). Pictures older than KEEP_HOURS are deleted on every call and by the
// scheduled clean-up (GitHub Action "Ergebnis-Server wach halten"). No names, no student data: only pictures.
// Deployed with the Supabase tools; "verify_jwt" is off because the browser key is not a JWT. Abuse is bounded by
// type and size checks, a cap on the files kept and the short lifetime.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const BUCKET = 'praesi-bilder';
const MAX_BYTES = 4 * 1024 * 1024;
const MAX_FILES = 150;
const KEEP_HOURS = 18;
const LINK_SECONDS = 60 * 60;
const ORIGINS = ['https://noledge5.github.io', 'http://localhost:5173', 'http://localhost:4173'];

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

/** PNG, JPEG, GIF and WebP by their first bytes; anything else (also SVG, which can carry scripts) is refused. */
function imageType(b: Uint8Array): string | null {
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return 'image/gif';
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
  return null;
}

/** Deletes old pictures; returns how many are left. */
async function cleanUp(): Promise<number> {
  const { data, error } = await db.storage.from(BUCKET).list('', { limit: 1000, sortBy: { column: 'created_at', order: 'asc' } });
  if (error || !data) return MAX_FILES;
  const limit = Date.now() - KEEP_HOURS * 3600_000;
  const old = data.filter((f) => f.created_at && Date.parse(f.created_at) < limit).map((f) => f.name);
  if (old.length) await db.storage.from(BUCKET).remove(old);
  return data.length - old.length;
}

function answer(body: unknown, status: number, origin: string | null): Response {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (origin && ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  return new Response(JSON.stringify(body), { status, headers });
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: origin && ORIGINS.includes(origin)
        ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'apikey, content-type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' }
        : {},
    });
  }
  if (req.method !== 'POST') return answer({ error: 'methode' }, 405, origin);
  if (new URL(req.url).searchParams.has('aufraeumen')) return answer({ left: await cleanUp() }, 200, origin);

  const length = Number(req.headers.get('Content-Length') ?? 0);
  if (length > MAX_BYTES) return answer({ error: 'zu-gross' }, 413, origin);
  const bytes = new Uint8Array(await req.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_BYTES) return answer({ error: 'zu-gross' }, 413, origin);
  const type = imageType(bytes);
  if (!type) return answer({ error: 'kein-bild' }, 415, origin);
  if ((await cleanUp()) >= MAX_FILES) return answer({ error: 'voll' }, 429, origin);

  const name = `${crypto.randomUUID()}.${type.split('/')[1]}`;
  const up = await db.storage.from(BUCKET).upload(name, bytes, { contentType: type, upsert: false });
  if (up.error) return answer({ error: 'speichern' }, 500, origin);
  const signed = await db.storage.from(BUCKET).createSignedUrl(name, LINK_SECONDS);
  if (signed.error || !signed.data) return answer({ error: 'link' }, 500, origin);
  return answer({ url: signed.data.signedUrl }, 200, origin);
});
