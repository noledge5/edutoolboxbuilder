// A shape without outline that keeps its edge on dark backgrounds (docs/design/prinzipien.md, 19.11.2026): dark
// colours (`istDunkel`) get a hard `hell` edge top left, drawn as a shape (mask: the shape minus itself moved down
// right), not as a filter.
import { useId } from 'react';
import { flaeche, istDunkel, P } from './stil';

/** A path filled in `farbe` (keeping the size it had with its outline); if dark, with a `hell` edge top left. */
export function Flaeche({ d, farbe, hell, breite = 3, kante = 2.5 }: { d: string; farbe: string; hell: string; breite?: number; kante?: number }) {
  const id = `kante-${useId().replace(/:/g, '')}`;
  if (!istDunkel(farbe)) return <path d={d} {...flaeche(farbe, breite)} />;
  // Mask colours only decide what shows (white shows, black hides); they are never drawn.
  const form = { strokeWidth: breite, strokeLinejoin: 'round' as const };
  return (
    <g>
      <path d={d} {...flaeche(farbe, breite)} />
      <mask id={id} maskUnits="userSpaceOnUse" x={-1000} y={-1000} width={3000} height={3000}>
        <path d={d} fill="white" stroke="white" {...form} />
        <path d={d} fill="black" stroke="black" {...form} transform={`translate(${kante} ${kante})`} />
      </mask>
      <path d={d} {...flaeche(hell, breite)} mask={`url(#${id})`} />
    </g>
  );
}

/** An ellipse (or circle) as a path, for `Flaeche`. */
export const ovalPfad = (cx: number, cy: number, rx: number, ry = rx) =>
  `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;

/** A hard shadow of the shape `form`, down right, only where it falls on the shapes `auf` (clipped to them): the head
 *  on collar and body, so the chin reads in front without an outline. Draw it inside the casting part, before it. */
export function Schlagschatten({ form, auf, versatz = 3 }: { form: string; auf: string[]; versatz?: number }) {
  const id = `schatten-${useId().replace(/:/g, '')}`;
  return (
    <g>
      <clipPath id={id}>
        {auf.map((d) => (
          <path key={d} d={d} />
        ))}
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <path d={form} transform={`translate(${versatz} ${versatz})`} fill={P.schatten} opacity={0.28} />
      </g>
    </g>
  );
}
