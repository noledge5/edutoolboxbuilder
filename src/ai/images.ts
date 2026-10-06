// Pictures made by an image model at OpenRouter (Claude itself draws no pictures): a description and a style become a
// picture for an image field. The cost OpenRouter reports is counted like a Claude request.
import { AiError } from './client';
import { dollars } from './prices';
import { imageKeyOf, overLimit, withSpent } from './settings';
import { getAiSettings, setAiSettings } from './useAi';

const OPENROUTER = 'https://openrouter.ai/api/v1';

export type ImageStyle = 'illustration' | 'sachlich' | 'linie' | 'comic' | 'foto';

export const IMAGE_STYLES: { v: ImageStyle; l: string; prompt: string }[] = [
  {
    v: 'illustration',
    l: 'Freundliche Illustration',
    prompt: "friendly children's book illustration for 10 to 12 year olds, clear shapes, clean outlines, soft warm colours, plain white background",
  },
  { v: 'sachlich', l: 'Sachliche Zeichnung', prompt: 'clear educational illustration for a school textbook, accurate, flat colours, clean outlines, plain white background' },
  { v: 'linie', l: 'Strichzeichnung (zum Ausmalen)', prompt: 'black and white line art like a colouring page, clean even outlines, no shading, no grey, plain white background' },
  { v: 'comic', l: 'Comic', prompt: 'cheerful comic style for children, bold outlines, bright but not garish colours, plain white background' },
  { v: 'foto', l: 'Foto-realistisch', prompt: 'realistic photograph, natural light, sharp, neutral background' },
];

export type ImageAspect = '1:1' | '4:3' | '3:2' | '16:9';

/** The prompt for the image model: what to show, in which style; text in pictures is mostly wrong, so none. */
export function imagePrompt(what: string, style: ImageStyle, withText = false): string {
  const s = IMAGE_STYLES.find((x) => x.v === style) ?? IMAGE_STYLES[0];
  return [
    `Picture for a school worksheet: ${what.trim()}.`,
    `Style: ${s.prompt}.`,
    withText ? 'Keep any text short and spelled correctly.' : 'No text, no letters, no labels, no watermark.',
    'One clear main subject, nothing frightening, suitable for a classroom.',
  ].join(' ');
}

/** The default style: friendly for grades 5–6, plain for the older ones; the last choice per age group is kept. */
export function defaultStyle(grade: number | undefined): ImageStyle {
  const age = grade && grade >= 7 ? 2 : 1;
  try {
    const kept = localStorage.getItem(`arbeitsblatt-baukasten:bildstil-${age}`);
    if (IMAGE_STYLES.some((s) => s.v === kept)) return kept as ImageStyle;
  } catch {
    // No storage: the default.
  }
  return age === 1 ? 'illustration' : 'sachlich';
}

export function keepStyle(grade: number | undefined, style: ImageStyle) {
  try {
    localStorage.setItem(`arbeitsblatt-baukasten:bildstil-${grade && grade >= 7 ? 2 : 1}`, style);
  } catch {
    // Not kept.
  }
}

/** Picture models offered by OpenRouter (the list is public). */
export async function imageModels(): Promise<{ v: string; l: string }[]> {
  const res = await fetch(`${OPENROUTER}/models`);
  const data = ((await res.json()) as { data?: { id: string; name?: string; architecture?: { output_modalities?: string[] } }[] }).data ?? [];
  return data.filter((m) => m.architecture?.output_modalities?.includes('image') && !m.id.startsWith('openrouter/')).map((m) => ({ v: m.id, l: m.name || m.id }));
}

export interface MadeImage {
  /** data:image/png;base64,… */
  url: string;
  model: string;
  usd: number;
}

interface ImageResponse {
  model?: string;
  error?: { message?: string };
  usage?: { cost?: number };
  choices?: { message?: { images?: { image_url?: { url?: string } }[]; content?: string } }[];
}

/** One picture from OpenRouter. */
export async function makeImage(key: string, model: string, prompt: string, aspect: ImageAspect, signal?: AbortSignal): Promise<MadeImage> {
  let res: Response;
  try {
    res = await fetch(`${OPENROUTER}/chat/completions`, {
      method: 'POST',
      signal,
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'X-Title': 'Arbeitsblatt-Baukasten' },
      body: JSON.stringify({
        model,
        modalities: ['image', 'text'],
        image_config: { aspect_ratio: aspect },
        usage: { include: true },
        messages: [{ role: 'user', content: prompt }],
      }),
    });
  } catch (e) {
    throw new AiError(e instanceof DOMException && e.name === 'AbortError' ? 'abort' : 'network', e instanceof DOMException && e.name === 'AbortError' ? 'Abgebrochen.' : 'Keine Verbindung zu OpenRouter. Ist das Gerät online?');
  }
  const data = (await res.json().catch(() => ({}))) as ImageResponse;
  if (!res.ok || data.error) {
    const msg = data.error?.message ?? String(res.status);
    if (res.status === 401 || res.status === 403) throw new AiError('key', 'Der OpenRouter-Schlüssel wird nicht angenommen. Prüfe ihn in den Einstellungen („KI im Baukasten“).');
    if (res.status === 402) throw new AiError('credit', 'Das Guthaben bei OpenRouter ist aufgebraucht. Lade es dort auf.');
    if (res.status === 429) throw new AiError('rate', 'Gerade zu viele Anfragen. Versuch es in einer Minute noch einmal.');
    throw new AiError('other', `Das Bild konnte nicht erzeugt werden (${msg}).`);
  }
  const url = data.choices?.[0]?.message?.images?.find((i) => i.image_url?.url?.startsWith('data:image'))?.image_url?.url;
  if (!url) throw new AiError('refusal', 'Das Bildmodell hat kein Bild geliefert. Beschreib das Bild anders und versuch es noch einmal.');
  return { url, model: data.model ?? model, usd: typeof data.usage?.cost === 'number' ? data.usage.cost : 0 };
}

/** Pictures with this device's key: asks first over the month's limit, counts what they cost. null: no key or not wanted. */
export async function runImages(prompt: string, aspect: ImageAspect, count: number, signal?: AbortSignal): Promise<MadeImage[] | null> {
  const s = await getAiSettings();
  const key = imageKeyOf(s);
  if (!s || !key) return null;
  if (overLimit(s) && !window.confirm(`Diesen Monat hast du auf diesem Gerät schon ${dollars(s.spent)} für KI ausgegeben (Limit ${dollars(s.limit)}). Trotzdem fortfahren?`)) return null;
  const made = await Promise.allSettled(Array.from({ length: count }, () => makeImage(key, s.imageModel, prompt, aspect, signal)));
  const ok = made.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
  let now = (await getAiSettings()) ?? s;
  for (const m of ok) now = withSpent(now, 'Bild erzeugen', m.model, m.usd);
  if (ok.length) await setAiSettings(now);
  if (!ok.length) throw (made.find((r) => r.status === 'rejected') as PromiseRejectedResult).reason;
  return ok;
}

/** A data URL as a file for the image store. */
export async function fileOfDataUrl(url: string, name: string): Promise<File> {
  const blob = await (await fetch(url)).blob();
  return new File([blob], `${name}.${blob.type.split('/')[1] || 'png'}`, { type: blob.type || 'image/png' });
}
