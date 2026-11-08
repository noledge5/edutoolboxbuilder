// A QR code as SVG on a white quiet zone, for the projector. Drawn here with `uqr` directly (not from sheet/parts.tsx),
// so the children's app does not load the worksheet code.
import { encode } from 'uqr';

export function QrBild({ link, label }: { link: string; label: string }) {
  let qr;
  try {
    qr = encode(link, { ecc: 'M', border: 0 });
  } catch {
    return null; // too long for a QR code: the projector simply shows none
  }
  const d = qr.data.flatMap((row, y) => row.map((on, x) => (on ? `M${x} ${y}h1v1h-1z` : ''))).join('');
  const rand = 2;
  return (
    <svg viewBox={`${-rand} ${-rand} ${qr.size + 2 * rand} ${qr.size + 2 * rand}`} shapeRendering="crispEdges" role="img" aria-label={label}>
      <rect x={-rand} y={-rand} width={qr.size + 2 * rand} height={qr.size + 2 * rand} fill="white" />
      <path d={d} fill="black" />
    </svg>
  );
}
