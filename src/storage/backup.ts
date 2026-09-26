// Backup file: the whole worksheet with its images in one JSON file, to keep safe or move between devices.
// Opening also accepts a bare document (the "Daten" JSON, or one made by Claude).
import { DocFormatError, normalizeDoc } from '../model/normalize';
import { referencedImages } from '../model/ops';
import type { Doc } from '../model/types';
import type { Library } from '../library/types';
import { getImage, putImageAs } from './db';
import { readDeleted, readSettings } from './library';

export const BACKUP_FORMAT = 'arbeitsblatt-baukasten';
export const LIBRARY_FORMAT = 'arbeitsblatt-baukasten-bibliothek';
export const BACKUP_VERSION = 1;

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: number;
  savedAt: string;
  doc: Doc;
  /** Image id → data URL. */
  images: Record<string, string>;
}

async function toDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:${blob.type || 'application/octet-stream'};base64,${btoa(bin)}`;
}

function dataUrlToBlob(url: string): Blob {
  const m = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(url);
  if (!m) throw new DocFormatError('Ein Bild in der Datei ist beschädigt.');
  const [, type = 'application/octet-stream', b64, data] = m;
  if (!b64) return new Blob([decodeURIComponent(data)], { type });
  const bin = atob(data);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

export async function createBackup(doc: Doc): Promise<BackupFile> {
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, savedAt: new Date().toISOString(), doc, images: await imagesOf([doc]) };
}

/** Umlauts and ß spelled out, and characters most file systems reject removed: safe on every device. */
export function safeFileName(name: string): string {
  const spelled = name
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
    .replace(/Ä/g, 'Ae').replace(/Ö/g, 'Oe').replace(/Ü/g, 'Ue').replace(/ß/g, 'ss');
  return spelled
    .normalize('NFKD')
    .replace(/[^\x20-\x7e]/g, '')
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** File name from the first page title, e.g. "Versuchsprotokoll Waerme einfangen.json". */
export function backupFileName(doc: Doc): string {
  const title = safeFileName(doc.pages[0]?.title || '').slice(0, 80);
  return `${title || 'Arbeitsblatt'}.json`;
}

/** Reads a backup (or bare document) file, stores its images and returns the document. */
export async function readBackup(text: string): Promise<Doc> {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new DocFormatError('Die Datei ist keine gültige Arbeitsblatt-Datei (kein JSON).');
  }
  const obj = raw as Partial<BackupFile> | null;
  if (obj && obj.format === BACKUP_FORMAT) {
    if (typeof obj.version === 'number' && obj.version > BACKUP_VERSION) {
      throw new DocFormatError('Die Datei stammt aus einer neueren Version des Baukastens.');
    }
    const doc = normalizeDoc(obj.doc);
    for (const [id, url] of Object.entries(obj.images ?? {})) {
      if (typeof url === 'string') await putImageAs(id, dataUrlToBlob(url));
    }
    return doc;
  }
  return normalizeDoc(raw);
}

export interface LibraryFile {
  format: typeof LIBRARY_FORMAT;
  version: number;
  savedAt: string;
  library: Library;
  images: Record<string, string>;
}

async function imagesOf(docs: Doc[]): Promise<Record<string, string>> {
  const images: Record<string, string> = {};
  for (const id of new Set(docs.flatMap((d) => [...referencedImages(d)]))) {
    const blob = await getImage(id);
    if (blob) images[id] = await toDataUrl(blob);
  }
  return images;
}

/** The whole library (all subjects, modules, lessons and images) as one file. */
export async function createLibraryBackup(library: Library): Promise<LibraryFile> {
  return { format: LIBRARY_FORMAT, version: BACKUP_VERSION, savedAt: new Date().toISOString(), library, images: await imagesOf(library.lessons.map((l) => l.doc)) };
}

/** Always the same name, so saving to iCloud Drive replaces the previous file instead of piling up copies. */
export const LIBRARY_FILE_NAME = 'Arbeitsblatt-Baukasten Bibliothek.json';

export type OpenedFile = { kind: 'library'; library: Library; savedAt: number } | { kind: 'doc'; doc: Doc };

/** Reads a library backup, a worksheet backup or a bare document; stores the images it carries. */
export async function readAnyFile(text: string): Promise<OpenedFile> {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new DocFormatError('Die Datei ist keine gültige Arbeitsblatt-Datei (kein JSON).');
  }
  const obj = raw as Partial<LibraryFile> | null;
  if (obj && obj.format === LIBRARY_FORMAT) {
    if (typeof obj.version === 'number' && obj.version > BACKUP_VERSION) throw new DocFormatError('Die Datei stammt aus einer neueren Version des Baukastens.');
    const lib = obj.library;
    if (!lib || !Array.isArray(lib.modules) || !Array.isArray(lib.lessons)) throw new DocFormatError('Die Sicherung ist unvollständig.');
    const lessons = lib.lessons.map((l) => ({ ...l, updatedAt: Number(l.updatedAt) || 0, doc: normalizeDoc(l.doc) }));
    const modules = lib.modules.map((m) => ({ ...m, competences: Array.isArray(m.competences) ? m.competences : [], updatedAt: Number(m.updatedAt) || 0 }));
    for (const [id, url] of Object.entries(obj.images ?? {})) if (typeof url === 'string') await putImageAs(id, dataUrlToBlob(url));
    const savedAt = Date.parse(obj.savedAt ?? '') || 0;
    return { kind: 'library', savedAt, library: { settings: readSettings(lib.settings), modules, lessons, deleted: readDeleted(lib.deleted) } };
  }
  return { kind: 'doc', doc: await readBackup(text) };
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
