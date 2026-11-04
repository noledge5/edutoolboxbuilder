// Hands the lesson's pictures to the server for one hour (see supabase/functions/praesi-bild): private storage,
// signed links, deleted after 18 hours. Only pictures leave the device, never names or answers.
import { getImage } from '../storage/db';
import { SERVER } from '../share/server';
import type { LessonImage } from './prompt';

const KEEP = /^image\/(png|jpeg|gif|webp)$/;

/** SVG and other formats become a PNG (the server takes only PNG, JPEG, GIF and WebP; SVG can carry scripts). */
async function asRaster(blob: Blob): Promise<Blob> {
  if (KEEP.test(blob.type)) return blob;
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, 1600 / Math.max(img.naturalWidth || 1600, img.naturalHeight || 1600));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round((img.naturalWidth || 1600) * scale);
    canvas.height = Math.round((img.naturalHeight || 1200) * scale);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const out = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
    if (!out) throw new Error('Ein Bild ließ sich nicht umwandeln.');
    return out;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const REFUSED: Record<string, string> = {
  'zu-gross': 'Ein Bild ist zu groß (höchstens 4 MB).',
  'kein-bild': 'Eine Datei ist kein Bild, das Canva lesen kann.',
  voll: 'Der Bilder-Speicher ist gerade voll. Versuch es morgen wieder.',
};

/** Uploads one picture and returns its link (valid for an hour). */
export async function shareImage(blob: Blob, signal?: AbortSignal): Promise<string> {
  const body = await asRaster(blob);
  let res: Response;
  try {
    res = await fetch(`${SERVER.url}/functions/v1/praesi-bild`, { method: 'POST', headers: { apikey: SERVER.key, 'Content-Type': body.type }, body, signal });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new Error('Keine Verbindung zum Server. Bist du online?');
  }
  const data = (await res.json().catch(() => ({}))) as { url?: unknown; error?: unknown };
  if (!res.ok || typeof data.url !== 'string' || !data.url.startsWith(`${SERVER.url}/storage/`)) {
    throw new Error(REFUSED[String(data.error)] ?? `Der Server nimmt das Bild nicht an (${res.status}).`);
  }
  return data.url;
}

/** Uploads the pictures one after the other; missing pictures (not on this device) are left out. */
export async function shareImages(images: LessonImage[], onProgress: (done: number) => void, signal?: AbortSignal): Promise<{ label: string; url: string }[]> {
  const out: { label: string; url: string }[] = [];
  for (const [i, img] of images.entries()) {
    const blob = await getImage(img.id);
    if (blob) out.push({ label: img.label, url: await shareImage(blob, signal) });
    onProgress(i + 1);
  }
  return out;
}
