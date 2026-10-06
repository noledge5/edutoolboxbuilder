// Scans a QR code with the camera (the back camera on the iPad): the browser's BarcodeDetector where there is one,
// else jsQR (loaded only when needed). Calls `onText` with the first code it reads.
import { useEffect, useRef, useState } from 'react';

interface Detector {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (o: { formats: string[] }) => Detector;
  }
}

export function QrScanner({ onText, onError }: { onText(text: string): void; onError(message: string): void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let stopped = false;
    let timer = 0;
    const canvas = document.createElement('canvas');
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      } catch {
        onError('Die Kamera lässt sich nicht öffnen. Erlaube den Zugriff oder tippe den Code ein.');
        return;
      }
      if (stopped || !video.current) return;
      video.current.srcObject = stream;
      await video.current.play().catch(() => {});
      setReady(true);
      const detector = window.BarcodeDetector ? new window.BarcodeDetector({ formats: ['qr_code'] }) : null;
      const jsQR = detector ? null : (await import('jsqr')).default;
      const tick = async () => {
        if (stopped || !video.current) return;
        const v = video.current;
        if (v.videoWidth) {
          let text = '';
          if (detector) text = (await detector.detect(v).catch(() => []))[0]?.rawValue ?? '';
          else if (jsQR) {
            const scale = Math.min(1, 800 / v.videoWidth);
            canvas.width = Math.round(v.videoWidth * scale);
            canvas.height = Math.round(v.videoHeight * scale);
            const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
            ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            text = jsQR(img.data, img.width, img.height)?.data ?? '';
          }
          if (text) {
            onText(text);
            return;
          }
        }
        timer = window.setTimeout(() => void tick(), 200);
      };
      void tick();
    })();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // Started once; the callbacks of the first render are enough.
  }, []);

  return (
    <div className="qr-scan">
      <video ref={video} playsInline muted />
      {!ready && <span className="qr-scan-wait">Kamera wird geöffnet …</span>}
      <span className="qr-scan-frame" aria-hidden="true" />
    </div>
  );
}
