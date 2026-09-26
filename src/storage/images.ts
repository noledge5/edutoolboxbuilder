import { useEffect, useState } from 'react';
import { getImage, putImage } from './db';

const MAX_SIDE = 1600;

/** Scales large photos down so a handful of images does not fill the device's storage. */
async function shrink(file: Blob): Promise<Blob> {
  if (file.type === 'image/svg+xml') return file;
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const { naturalWidth: w, naturalHeight: h } = img;
    const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
    if (scale === 1 && file.size < 1_500_000) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    // Keep PNG for formats that may carry transparency (diagrams, screenshots); photos become JPEG.
    const type = /png|gif|webp/.test(file.type) ? 'image/png' : 'image/jpeg';
    const out = await new Promise<Blob | null>((res) => canvas.toBlob(res, type, 0.86));
    return out ?? file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Stores an image file and returns its id for the block's `image` prop. */
export async function storeImageFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Das ist keine Bilddatei.');
  return putImage(await shrink(file));
}

const urlCache = new Map<string, string>();

export type ImageState = { status: 'none' } | { status: 'loading' } | { status: 'missing' } | { status: 'ready'; url: string };

/** Object URL for a stored image id. */
export function useImageUrl(id: string): ImageState {
  const [state, setState] = useState<ImageState>(() => {
    if (!id) return { status: 'none' };
    const url = urlCache.get(id);
    return url ? { status: 'ready', url } : { status: 'loading' };
  });
  useEffect(() => {
    if (!id) return setState({ status: 'none' });
    const cached = urlCache.get(id);
    if (cached) return setState({ status: 'ready', url: cached });
    let alive = true;
    setState({ status: 'loading' });
    getImage(id)
      .then((blob) => {
        if (!alive) return;
        if (!blob) return setState({ status: 'missing' });
        const url = URL.createObjectURL(blob);
        urlCache.set(id, url);
        setState({ status: 'ready', url });
      })
      .catch(() => alive && setState({ status: 'missing' }));
    return () => {
      alive = false;
    };
  }, [id]);
  return state;
}
