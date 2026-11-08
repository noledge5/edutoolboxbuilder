// The camera side of the Kartenfrage: reads the cards in the back camera's picture a few times a second. An answer
// counts only when two pictures in a row read the same card the same way, so a card being turned never counts on
// its way. Calls `onAntwort` for each counted (or changed) answer and reports what the last picture showed.
import { useEffect, useRef, useState } from 'react';
import type { Antwort } from './code';
import { kartenLesen, type Treffer } from './lesen';

/** Widest picture that is read (Full HD: about 30 ms on a laptop). */
const BREITE_MAX = 1920;
/** Pause between two pictures. */
const PAUSE_MS = 80;

export interface ScanBild {
  /** Size of the picture read, for drawing the outlines over the video. */
  w: number;
  h: number;
  treffer: Treffer[];
}

export function useKartenScan(an: boolean, onAntwort: (nummer: number, antwort: Antwort) => void) {
  const video = useRef<HTMLVideoElement>(null);
  const [fehler, setFehler] = useState('');
  const [bild, setBild] = useState<ScanBild | null>(null);
  const melden = useRef(onAntwort);
  melden.current = onAntwort;
  /** Card → answer last counted; cleared for each new question, so the same answer counts again. */
  const gezaehlt = useRef(new Map<number, Antwort>());

  useEffect(() => {
    if (!an) {
      setBild(null);
      return;
    }
    let stream: MediaStream | null = null;
    let stopped = false;
    let timer = 0;
    const canvas = document.createElement('canvas');
    /** Card → answer read in the last picture (not yet counted twice). */
    let vorher = new Map<number, Antwort>();
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
      } catch {
        setFehler('Die Kamera lässt sich nicht öffnen. Erlaube den Zugriff auf die Kamera in den Einstellungen des Browsers.');
        return;
      }
      const v = video.current;
      if (stopped || !v) return stream.getTracks().forEach((t) => t.stop());
      setFehler('');
      v.srcObject = stream;
      await v.play().catch(() => {});
      const tick = () => {
        if (stopped) return;
        if (v.videoWidth) {
          const scale = Math.min(1, BREITE_MAX / v.videoWidth);
          const w = Math.round(v.videoWidth * scale);
          const h = Math.round(v.videoHeight * scale);
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(v, 0, 0, w, h);
            const rgba = ctx.getImageData(0, 0, w, h).data;
            const grau = new Uint8Array(w * h);
            for (let i = 0, j = 0; i < grau.length; i++, j += 4) grau[i] = (rgba[j] * 77 + rgba[j + 1] * 150 + rgba[j + 2] * 29) >> 8;
            const treffer = kartenLesen(grau, w, h);
            const jetzt = new Map(treffer.map((t) => [t.nummer, t.antwort]));
            for (const [n, a] of jetzt)
              if (vorher.get(n) === a && gezaehlt.current.get(n) !== a) {
                gezaehlt.current.set(n, a);
                melden.current(n, a);
              }
            vorher = jetzt;
            setBild({ w, h, treffer });
          }
        }
        timer = window.setTimeout(tick, PAUSE_MS);
      };
      tick();
    })();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [an]);

  return { video, fehler, bild, neu: () => gezaehlt.current.clear() };
}
