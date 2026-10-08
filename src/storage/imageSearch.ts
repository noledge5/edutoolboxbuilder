// Searching free image collections on the internet, without an account or key:
// Openverse (Creative Commons and public domain images from Flickr, Wikimedia, museums and more)
// and Wikimedia Commons (strong for maps, diagrams and drawings). A picked image is downloaded and
// stored like an image file from the device; its author and licence become the image's source line.
import { isObj } from '../model/text';

export type ImageSource = 'openverse' | 'commons';
export type ImageKind = 'alle' | 'foto' | 'grafik';

export interface SearchOptions {
  kind: ImageKind;
  /** Only public domain and CC0: no source line needed. */
  free: boolean;
}

export interface FoundImage {
  source: ImageSource;
  id: string;
  title: string;
  /** Small preview for the result grid. */
  thumb: string;
  /** The picture in a size for the worksheet (downloaded when picked). */
  full: string;
  width: number;
  height: number;
  creator: string;
  /** "CC BY 2.0", "CC0", "Public Domain" */
  license: string;
  /** The image's page at its source, with the licence details. */
  page: string;
  /** "Flickr", "Wikimedia Commons" … */
  provider: string;
  /** The author has to be named (everything but CC0 and public domain). */
  attribution: boolean;
}

export interface SearchPage {
  images: FoundImage[];
  /** Where the next page starts, or null if there is none. */
  next: number | null;
}

export class SearchError extends Error {}

const PAGE_SIZE = 20;
const APP = 'Arbeitsblatt-Baukasten (https://noledge5.github.io/edutoolboxbuilder/)';

const PROVIDERS: Record<string, string> = {
  flickr: 'Flickr',
  wikimedia: 'Wikimedia Commons',
  stocksnap: 'StockSnap',
  rawpixel: 'rawpixel',
  nappy: 'nappy',
  smithsonian: 'Smithsonian',
  met: 'The Met',
  europeana: 'Europeana',
  nasa: 'NASA',
  inaturalist: 'iNaturalist',
};

const providerName = (p: string) => PROVIDERS[p] ?? (/^smithsonian/.test(p) ? 'Smithsonian' : p ? p[0].toUpperCase() + p.slice(1) : '');

/** "by-nc" + "2.0" → "CC BY-NC 2.0"; "cc0" → "CC0"; "pdm" → "Public Domain" */
export function licenseName(license: string, version = ''): string {
  const l = license.toLowerCase();
  if (l === 'cc0') return 'CC0';
  if (l === 'pdm') return 'Public Domain';
  return `CC ${l.toUpperCase()}${version ? ' ' + version : ''}`;
}

const isFreeLicense = (name: string) => /^(cc0|public domain|pd\b|pd-|gemeinfrei)/i.test(name.trim());

/** Plain text from the HTML in Wikimedia's metadata ("<a href=…>Jane</a>" → "Jane"). */
export function plainText(html: string): string {
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > 80 ? text.slice(0, 78).trimEnd() + ' …' : text;
}

/** The source line for the worksheet: "Chen Vision, CC BY 2.0, Flickr". */
export function creditOf(img: FoundImage): string {
  return [img.creator, img.license, img.provider].filter(Boolean).join(', ');
}

async function getJson(url: string, init?: RequestInit): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new SearchError(navigator.onLine === false ? 'Keine Internetverbindung. Die Bildsuche braucht Internet.' : 'Die Bildsuche ist gerade nicht erreichbar.');
  }
  if (res.status === 429) throw new SearchError('Zu viele Suchanfragen. Bitte einen Moment warten und dann noch einmal suchen.');
  if (!res.ok) throw new SearchError(`Die Bildsuche hat mit einem Fehler geantwortet (${res.status}).`);
  return res.json();
}

const s = (x: unknown) => (typeof x === 'string' ? x : typeof x === 'number' ? String(x) : '');

/** Openverse: `page` counts from 1. */
export async function searchOpenverse(query: string, o: SearchOptions, page = 1): Promise<SearchPage> {
  const params = new URLSearchParams({ q: query, page: String(page), page_size: String(PAGE_SIZE), mature: 'false' });
  if (o.free) params.set('license', 'cc0,pdm');
  if (o.kind === 'foto') params.set('category', 'photograph');
  if (o.kind === 'grafik') params.set('category', 'illustration,digitized_artwork');
  return openverseResults(await getJson(`https://api.openverse.org/v1/images/?${params}`), page);
}

export function openverseResults(data: unknown, page: number): SearchPage {
  const d = isObj(data) ? data : {};
  const results = Array.isArray(d.results) ? d.results.filter(isObj) : [];
  const images = results.map((r): FoundImage => {
    const license = licenseName(s(r.license), s(r.license_version));
    const id = s(r.id);
    return {
      source: 'openverse',
      id,
      title: s(r.title) || 'Ohne Titel',
      // Openverse's own copies of the files, served with the permission to use them in the page.
      thumb: s(r.thumbnail) || `https://api.openverse.org/v1/images/${id}/thumb/`,
      full: `https://api.openverse.org/v1/images/${id}/thumb/?full_size=true`,
      width: Number(r.width) || 0,
      height: Number(r.height) || 0,
      creator: plainText(s(r.creator)),
      license,
      page: s(r.foreign_landing_url),
      provider: providerName(s(r.source) || s(r.provider)),
      attribution: !isFreeLicense(license),
    };
  });
  const pages = Number(d.page_count) || 0;
  return { images, next: page < pages && images.length > 0 ? page + 1 : null };
}

/** Wikimedia Commons: `offset` counts results from 0. */
export async function searchCommons(query: string, o: SearchOptions, offset = 0): Promise<SearchPage> {
  const filetype = o.kind === 'foto' ? 'filetype:bitmap' : o.kind === 'grafik' ? 'filetype:drawing' : 'filetype:bitmap|drawing';
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    origin: '*',
    generator: 'search',
    gsrnamespace: '6',
    gsrsearch: `${query} ${filetype}`,
    gsrlimit: String(PAGE_SIZE),
    gsroffset: String(offset),
    prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata',
    // Wikimedia serves previews only in its standard widths (250, 330, 500, 960, 1280 …).
    iiurlwidth: '330',
    iiextmetadatafilter: 'LicenseShortName|Artist|AttributionRequired',
  });
  const url = `https://commons.wikimedia.org/w/api.php?${params}`;
  let data: unknown;
  try {
    // Wikimedia asks browser tools to name themselves.
    data = await getJson(url, { headers: { 'Api-User-Agent': APP } });
  } catch (e) {
    if (!(e instanceof SearchError) || navigator.onLine === false) throw e;
    data = await getJson(url);
  }
  const page = commonsResults(data, offset);
  return o.free ? { ...page, images: page.images.filter((i) => !i.attribution) } : page;
}

export function commonsResults(data: unknown, offset: number): SearchPage {
  const d = isObj(data) ? data : {};
  const q = isObj(d.query) ? d.query : {};
  const pages = (Array.isArray(q.pages) ? q.pages : isObj(q.pages) ? Object.values(q.pages) : []).filter(isObj);
  pages.sort((a, b) => (Number(a.index) || 0) - (Number(b.index) || 0));
  const images: FoundImage[] = [];
  for (const p of pages) {
    const info = Array.isArray(p.imageinfo) && isObj(p.imageinfo[0]) ? p.imageinfo[0] : null;
    if (!info) continue;
    const meta = isObj(info.extmetadata) ? info.extmetadata : {};
    const value = (k: string) => (isObj(meta[k]) ? s((meta[k] as Record<string, unknown>).value) : '');
    const width = Number(info.width) || 0;
    const mime = s(info.mime);
    const thumb = s(info.thumburl) || s(info.url);
    const license = value('LicenseShortName') || 'siehe Bildseite';
    images.push({
      source: 'commons',
      id: String(p.pageid ?? p.title),
      title: s(p.title)
        .replace(/^(File|Datei):/, '')
        .replace(/\.[a-z0-9]+$/i, '')
        .replace(/_/g, ' '),
      thumb,
      full: commonsFull(s(info.url), thumb, mime, width),
      width,
      height: Number(info.height) || 0,
      creator: plainText(value('Artist')),
      license,
      page: s(info.descriptionurl),
      provider: 'Wikimedia Commons',
      attribution: value('AttributionRequired') === 'true' || !isFreeLicense(license),
    });
  }
  const cont = isObj(d.continue) ? Number(d.continue.gsroffset) : NaN;
  return { images, next: Number.isFinite(cont) && cont > offset ? cont : null };
}

const SHOWN = /^image\/(jpeg|png|gif|webp)$/;
/** A standard width of Wikimedia's scaled copies, large enough for a whole A4 width. */
const WIDE = 1280;

/** A size for the worksheet: the original if a browser shows it and it is not huge, else a scaled copy. */
export function commonsFull(original: string, thumb: string, mime: string, width: number): string {
  const scaled = (w: number) => thumb.replace(/(\/|-)\d+px-/, `$1${w}px-`);
  if (mime === 'image/svg+xml') return scaled(WIDE);
  if (width > WIDE) return scaled(WIDE);
  return SHOWN.test(mime) ? original : thumb;
}

export function searchImages(source: ImageSource, query: string, o: SearchOptions, at?: number): Promise<SearchPage> {
  return source === 'openverse' ? searchOpenverse(query, o, at ?? 1) : searchCommons(query, o, at ?? 0);
}

/** Downloads the picked image as a file; falls back to the preview if the large version cannot be fetched. */
export async function downloadImage(img: FoundImage): Promise<File> {
  for (const url of [img.full, img.thumb]) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const blob = await res.blob();
      if (!blob.type.startsWith('image/')) continue;
      const ext = blob.type.split('/')[1]?.replace('svg+xml', 'svg') || 'jpg';
      return new File([blob], `${img.title.slice(0, 60) || 'bild'}.${ext}`, { type: blob.type });
    } catch {
      // try the next size
    }
  }
  throw new SearchError('Das Bild konnte nicht geladen werden. Bitte ein anderes wählen.');
}
