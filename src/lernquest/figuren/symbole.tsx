// The app's own symbols (tab bar, status row): flat and filled like the figures, in the palette of stil.ts, light top
// left and one shade bottom right, no outline (docs/design/prinzipien.md). They replace the generic line icons next to
// drawn art (Oberfläche neu, 27.11.2026). Each is drawn on 32 × 32; `groesse` sets the size in px.
import { P, flaeche } from './stil';

type Props = { groesse?: number; className?: string };
const Rahmen = ({ groesse = 28, className, children }: Props & { children: React.ReactNode }) => (
  <svg width={groesse} height={groesse} viewBox="0 0 32 32" aria-hidden focusable="false" className={className}>
    {children}
  </svg>
);

const r1 = (n: number) => Math.round(n * 100) / 100;
/** A star with rounded tips around (cx, cy). */
export function sternPfad(cx: number, cy: number, aussen: number, innen: number, spitzen = 5): string {
  const pkt = Array.from({ length: spitzen * 2 }, (_, i) => {
    const r = i % 2 ? innen : aussen;
    const w = (Math.PI * i) / spitzen - Math.PI / 2;
    return `${r1(cx + r * Math.cos(w))} ${r1(cy + r * Math.sin(w))}`;
  });
  return `M${pkt.join(' L')} Z`;
}

/** An arc around (cx, cy) from angle `von` to `bis` (degrees, clockwise, 0 = right) with an arrow head at its end. */
function pfeilBogen(cx: number, cy: number, r: number, von: number, bis: number, kopf = 4.2) {
  const rad = (g: number) => (g * Math.PI) / 180;
  const pt = (g: number, rr = r) => [cx + rr * Math.cos(rad(g)), cy + rr * Math.sin(rad(g))];
  const ende = bis - 14;
  const [x0, y0] = pt(von);
  const [x1, y1] = pt(ende);
  const bogen = `M${r1(x0)} ${r1(y0)} A${r} ${r} 0 0 1 ${r1(x1)} ${r1(y1)}`;
  // The head: its base across the arc at `ende`, its tip along the arc.
  const [ax, ay] = pt(ende, r + kopf);
  const [bx, by] = pt(ende, r - kopf);
  const [tx, ty] = pt(bis);
  return { bogen, kopf: `M${r1(ax)} ${r1(ay)} L${r1(tx)} ${r1(ty)} L${r1(bx)} ${r1(by)} Z` };
}

export const SymbolKarte = (p: Props) => (
  <Rahmen {...p}>
    <path d="M4 8.5 L11.5 6 L11.5 26 L4 28.5 Z" {...flaeche(P.sandHell, 2)} />
    <path d="M11.5 6 L20.5 8.5 L20.5 28.5 L11.5 26 Z" {...flaeche(P.sandTief, 2)} />
    <path d="M20.5 8.5 L28 6 L28 26 L20.5 28.5 Z" {...flaeche(P.sand, 2)} />
    <path d="M5 13.5 Q8 11 10.5 12.5 L10.5 19 Q7.5 20.5 5 19 Z" fill={P.wiese} />
    <path d="M21.5 19.5 Q24.5 17.5 27 19 L27 24 Q24 26 21.5 24.5 Z" fill={P.wieseTief} />
    <path d="M7.5 23.5 C11 21.5 13.5 17.5 16.5 18 S21.5 14.5 23.5 12" fill="none" stroke={P.rot} strokeWidth={2} strokeLinecap="round" strokeDasharray="0.1 3.4" />
    <circle cx="24" cy="11" r="3" fill={P.rot} />
    <circle cx="23" cy="10" r="1" fill={P.rosaHell} />
  </Rahmen>
);

export const SymbolAufgaben = (p: Props) => (
  <Rahmen {...p}>
    <rect x="7" y="6.5" width="20" height="23" rx="3.5" fill={P.holzTief} />
    <rect x="5.5" y="5" width="20" height="23" rx="3.5" fill={P.holz} />
    <rect x="8.5" y="9" width="14" height="16.5" rx="2" fill={P.steinHell} />
    <rect x="11" y="3" width="9" height="5" rx="2" fill={P.metallTief} />
    <rect x="11" y="2.5" width="9" height="4" rx="2" fill={P.metall} />
    <circle cx="12.3" cy="14" r="2.4" fill={P.gruen} />
    <path d="M11.1 14 L12 15 L13.6 13.1" fill="none" stroke={P.weiss} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
    <rect x="15.6" y="13" width="5" height="2" rx="1" fill={P.steinTief} />
    <circle cx="12.3" cy="20.4" r="2.4" fill={P.steinTief} />
    <rect x="15.6" y="19.4" width="5" height="2" rx="1" fill={P.steinTief} />
  </Rahmen>
);

const oben = pfeilBogen(16, 16, 9.5, 195, 335);
const unten = pfeilBogen(16, 16, 9.5, 15, 155);
export const SymbolWiederholen = (p: Props) => (
  <Rahmen {...p}>
    <path d={oben.bogen} fill="none" stroke={P.blau} strokeWidth={4.2} strokeLinecap="round" />
    <path d={oben.kopf} {...flaeche(P.blau, 1.6)} />
    <path d={unten.bogen} fill="none" stroke={P.blauTief} strokeWidth={4.2} strokeLinecap="round" />
    <path d={unten.kopf} {...flaeche(P.blauTief, 1.6)} />
  </Rahmen>
);

const SCHILD = 'M16 3.5 L26 7 V15 C26 21.5 21.8 26.3 16 29 C10.2 26.3 6 21.5 6 15 V7 Z';
export const SymbolHeld = (p: Props) => (
  <Rahmen {...p}>
    <path d={SCHILD} {...flaeche(P.blau, 2)} />
    <path d="M16 3.5 L26 7 V15 C26 21.5 21.8 26.3 16 29 Z" {...flaeche(P.blauTief, 2)} />
    <path d="M8.6 9 L13.8 7.1" stroke={P.blauHell} strokeWidth={2} strokeLinecap="round" />
    <path d={sternPfad(16, 16.5, 6.6, 3)} {...flaeche(P.gold, 1.4)} />
    <path d={sternPfad(16, 16.5, 6.6, 3)} fill="none" />
    <circle cx="14.6" cy="15" r="1" fill={P.goldHell} />
  </Rahmen>
);

export const SymbolKlasse = (p: Props) => (
  <Rahmen {...p}>
    <path d="M3.5 28 V24.5 A4.6 4.6 0 0 1 12.7 24.5 V28 Z" {...flaeche(P.lila, 1.5)} />
    <circle cx="8.1" cy="15.6" r="3.7" fill={P.haut1} />
    <path d="M19.3 28 V24.5 A4.6 4.6 0 0 1 28.5 24.5 V28 Z" {...flaeche(P.orange, 1.5)} />
    <circle cx="23.9" cy="15.6" r="3.7" fill={P.haut3} />
    <path d="M10.3 29.5 V25 A5.7 5.7 0 0 1 21.7 25 V29.5 Z" {...flaeche(P.gruen, 1.5)} />
    <path d="M16 19.3 A5.7 5.7 0 0 1 21.7 25 V29.5 H16 Z" fill={P.gruenTief} />
    <circle cx="16" cy="15.2" r="4.6" fill={P.haut0} />
    <path d="M11.4 15 A4.6 4.6 0 0 1 20.6 15 Q16 12.6 11.4 15 Z" fill={P.haar0} />
  </Rahmen>
);

export const SymbolMuenze = (p: Props) => (
  <Rahmen {...p}>
    <circle cx="16" cy="17.2" r="12" fill={P.goldTief} />
    <circle cx="16" cy="15.6" r="12" fill={P.gold} />
    <circle cx="16" cy="15.6" r="7.4" fill="none" stroke={P.goldTief} strokeWidth={2.2} opacity={0.55} />
    <path d="M8.6 12.4 A8.4 8.4 0 0 1 13.2 7.9" fill="none" stroke={P.goldHell} strokeWidth={2.2} strokeLinecap="round" />
  </Rahmen>
);

/** The badge of the hero level; the app writes the number over it. */
export const SymbolStufe = (p: Props) => (
  <Rahmen {...p}>
    <path d="M16 2.8 L27.4 9.4 V22.6 L16 29.2 L4.6 22.6 V9.4 Z" {...flaeche(P.lila, 2.6)} />
    <path d="M16 2.8 L27.4 9.4 V22.6 L16 29.2 Z" {...flaeche(P.lilaTief, 2.6)} opacity={0.55} />
    <path d="M7.4 10.6 L13.4 7.1" stroke={P.lilaHell} strokeWidth={2} strokeLinecap="round" />
  </Rahmen>
);

export const SymbolTruhe = (p: Props) => (
  <Rahmen {...p}>
    <rect x="4.5" y="14" width="23" height="14" rx="3" fill={P.holz} />
    <path d="M17 14 H24.5 A3 3 0 0 1 27.5 17 V25 A3 3 0 0 1 24.5 28 H17 Z" fill={P.holzTief} />
    <path d="M4.5 14.5 V11.5 A6 5.5 0 0 1 10.5 6 H21.5 A6 5.5 0 0 1 27.5 11.5 V14.5 Z" {...flaeche(P.holzHell, 1.5)} />
    <rect x="8.4" y="6.2" width="3.4" height="21.8" rx="1.2" fill={P.gold} />
    <rect x="20.2" y="6.2" width="3.4" height="21.8" rx="1.2" fill={P.gold} />
    <rect x="13.3" y="12" width="5.4" height="6.4" rx="1.6" fill={P.goldTief} />
    <circle cx="16" cy="14.6" r="1.1" fill={P.lederTief} />
  </Rahmen>
);

export const SymbolStern = (p: Props) => (
  <Rahmen {...p}>
    <path d={sternPfad(16.8, 17.4, 13, 6.2)} {...flaeche(P.goldTief, 2)} />
    <path d={sternPfad(16, 16.4, 13, 6.2)} {...flaeche(P.gold, 2)} />
    <circle cx="13.2" cy="12.6" r="1.6" fill={P.goldHell} />
  </Rahmen>
);

/** A castle (27.11.2026): a region of the map conquered – two towers with blue roofs, a wall with a gate, a pennant. */
export const SymbolBurg = (p: Props) => (
  <Rahmen {...p}>
    <path d="M7 15 H25 V28.6 H7 Z" {...flaeche(P.stein, 2)} />
    <path d="M10 12.4 H13.2 V16 H10 Z M18.8 12.4 H22 V16 H18.8 Z" {...flaeche(P.stein, 1.6)} />
    <path d="M4.2 11.4 H11.8 V28.6 H4.2 Z M20.2 11.4 H27.8 V28.6 H20.2 Z" {...flaeche(P.stein, 2)} />
    <path d="M24 11.4 H27.8 V28.6 H24 Z" fill={P.steinTief} opacity={0.6} />
    <path d="M3.2 12 L8 4.4 L12.8 12 Z M19.2 12 L24 4.4 L28.8 12 Z" {...flaeche(P.blau, 2)} />
    <path d="M24 4.4 L28.8 12 H24 Z" fill={P.blauTief} opacity={0.55} />
    <path d="M13 28.6 V23.4 Q16 19.6 19 23.4 V28.6 Z" {...flaeche(P.holzTief, 1.6)} />
    <path d="M8 4.4 V1.6" stroke={P.holzTief} strokeWidth={2} strokeLinecap="round" />
    <path d="M8.6 1.4 L13 2.8 L8.6 4.4 Z" {...flaeche(P.gold, 1.2)} />
    <path d="M6 14.6 V24" stroke={P.steinHell} strokeWidth={2} strokeLinecap="round" />
  </Rahmen>
);

/** A flame (27.11.2026): the combo of right answers in a row, beside the hearts. Orange outside, yellow inside, a light
 *  tongue top left; drawn like the other symbols (palette, no outline). */
export const SymbolFlamme = (p: Props) => (
  <Rahmen {...p}>
    <path d="M16.8 30 C9.8 30 6.4 25 7.4 19.4 C8.2 15 11.6 12.4 12.6 7.6 C15.6 10 16 13 15.6 15.8 C17.6 13.6 19.2 9.8 18.6 4 C24.4 8.2 26.6 14.4 26 20 C25.4 25.6 22 30 16.8 30 Z" {...flaeche(P.orangeTief, 2)} />
    <path d="M16 29 C9.4 29 6.2 24.4 7.2 19.2 C8 15 11.2 12.6 12.2 8.2 C15 10.6 15.4 13.4 15 16 C17 13.8 18.6 10.2 18 4.8 C23.4 8.8 25.4 14.6 24.8 19.8 C24.2 25 21 29 16 29 Z" {...flaeche(P.orange, 2)} />
    <path d="M16 28 C12.4 28 10.6 25.4 11.2 22.4 C11.8 19.6 14 18.4 14.8 15.4 C16.8 17.2 17.4 19.2 17.2 21 C18.4 20 19.2 18.4 19.2 16.8 C21.6 19 22.2 21.8 21.6 24 C21 26.4 18.8 28 16 28 Z" {...flaeche(P.gelb, 2)} />
    <path d="M10.6 18.6 Q11.6 15.6 13.4 13.8" fill="none" stroke={P.orangeHell} strokeWidth={2.2} strokeLinecap="round" />
  </Rahmen>
);

export const SymbolOffline = (p: Props) => (
  <Rahmen {...p}>
    <path d="M8.5 24 A5 5 0 0 1 8.2 14.1 A7.5 7.5 0 0 1 22.6 12.6 A5.8 5.8 0 0 1 23.5 24 Z" {...flaeche(P.wolke, 2)} />
    <path d="M9 24 H23.5 A5.8 5.8 0 0 0 28.6 19.6 Q21 22.5 9 21.2 Z" fill={P.wolkeTief} />
    <path d="M6 5.5 L26 27" stroke={P.grauTief} strokeWidth={3} strokeLinecap="round" />
  </Rahmen>
);
