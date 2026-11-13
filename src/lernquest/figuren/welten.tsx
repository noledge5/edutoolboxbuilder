// Worlds of the map (13.11.2026): every region gets a landscape of its own. A world sets the ground and path colours,
// the landmark at the top (instead of the castle) and what grows beside the path: the map plans the places (weg.ts:
// big `baum`/`tanne` at the edge, small `busch`/`blume`/`stein` near the path) and the world puts its own drawings
// there. Modules take the module worlds in turn by their number; the regions of the Extra-Pakete have fixed ones
// (Wortschatz-Wald, Grammatik-Turm). Same style as gelaende.tsx: centre bottom at (0, 0), outline, light top left.
import type { ReactNode } from 'react';
import { Baum, Blume, BurgBild, Burg, Busch, Klumpen, Stein, Tanne, type BurgFarben, type GelaendeTeil } from './gelaende';
import { P, UMRISS, UMRISS_FEIN } from './stil';
import type { DekoArt } from '../weg';

const schatten = (rx: number, ry = rx / 4) => <ellipse cx={4} cy={0} rx={rx} ry={ry} fill={P.schatten} opacity={0.18} />;

// — Wüste —

export function Palme(): ReactNode {
  const blatt = (w: number) => (
    <g key={w} transform={`translate(2 -58) rotate(${w})`}>
      <path d="M0 0 Q14 -10 30 -2 Q16 -2 0 4 Z" fill={P.blatt} {...UMRISS_FEIN} />
      <path d="M3 0 Q15 -6 26 -2" fill="none" stroke={P.blattHell} strokeWidth={2.2} strokeLinecap="round" />
    </g>
  );
  return (
    <g>
      {schatten(16)}
      <path d="M-5 0 Q-2 -30 4 -58 L9 -57 Q4 -28 5 0 Z" fill={P.holz} {...UMRISS_FEIN} />
      {[-12, -24, -36, -48].map((y) => (
        <path key={y} d={`M${-4 + (-y / 58) * 7} ${y} h8`} stroke={P.holzTief} strokeWidth={2} strokeLinecap="round" />
      ))}
      {[-160, -120, -60, -20, 20].map(blatt)}
      <circle cx={0} cy={-55} r={3.5} fill={P.lederTief} stroke={P.linie} strokeWidth={1.5} />
      <circle cx={6} cy={-54} r={3.5} fill={P.lederTief} stroke={P.linie} strokeWidth={1.5} />
    </g>
  );
}

export function Kaktus(): ReactNode {
  return (
    <g>
      {schatten(14)}
      <path d="M-8 0 V-50 a8 8 0 0 1 16 0 V0 Z" fill={P.gruen} {...UMRISS} />
      <path d="M-8 -26 h-8 a4 4 0 0 1 -4 -4 v-14 a5 5 0 0 1 10 0 v8 h2 M8 -20 h8 a4 4 0 0 0 4 -4 v-12 a5 5 0 0 0 -10 0 v6 h-2" fill={P.gruen} {...UMRISS} />
      <path d="M2 -52 V-4" stroke={P.gruenTief} strokeWidth={4} strokeLinecap="round" opacity={0.6} />
      <path d="M-4 -50 V-10" stroke={P.gruenHell} strokeWidth={3} strokeLinecap="round" />
      <circle cx={0} cy={-58} r={3.5} fill={P.rosa} stroke={P.linie} strokeWidth={1.5} />
    </g>
  );
}

export function KaktusKlein(): ReactNode {
  return (
    <g>
      {schatten(10, 3)}
      <path d="M-9 0 Q-12 -14 0 -18 Q12 -14 9 0 Z" fill={P.gruen} {...UMRISS_FEIN} />
      <path d="M-4 -14 Q-6 -8 -5 -2" fill="none" stroke={P.gruenHell} strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={0} cy={-18} r={2.6} fill={P.gelb} stroke={P.linie} strokeWidth={1.4} />
    </g>
  );
}

export function Duerrbusch(): ReactNode {
  return (
    <g>
      <path d="M0 0 L-8 -12 M0 0 L-2 -16 M0 0 L6 -14 M0 0 L11 -8 M-5 -8 L-10 -10 M4 -10 L8 -16" fill="none" stroke={P.holzTief} strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
}

const farbStein = (f: string, h: string, t: string) => () => (
  <g>
    <path d="M-14 0 Q-16 -10 -7 -14 Q2 -18 10 -12 Q16 -6 14 0 Z" fill={f} {...UMRISS_FEIN} />
    <path d="M3 -13 Q14 -7 13 -1 L1 -1 Z" fill={t} opacity={0.6} />
    <path d="M-10 -6 Q-9 -11 -4 -12" fill="none" stroke={h} strokeWidth={2.5} strokeLinecap="round" />
  </g>
);
export const SandStein = farbStein(P.orangeHell, P.sandHell, P.orangeTief);

export function Pyramide(): ReactNode {
  return (
    <g>
      <ellipse cx={8} cy={2} rx={110} ry={10} fill={P.schatten} opacity={0.18} />
      <path d="M-100 0 L0 -150 L100 0 Z" fill={P.sand} {...UMRISS} />
      <path d="M0 -150 L100 0 L30 0 Z" fill={P.sandTief} opacity={0.7} />
      {[-30, -60, -90, -120].map((y) => (
        <path key={y} d={`M${-100 * (1 + y / 150) + 6} ${y} H${100 * (1 + y / 150) - 6}`} stroke={P.sandTief} strokeWidth={2.5} strokeLinecap="round" />
      ))}
      <path d="M-8 -138 L-70 -14" stroke={P.sandHell} strokeWidth={4} strokeLinecap="round" />
      <path d="M-16 0 V-26 A16 16 0 0 1 16 -26 V0 Z" fill={P.lederTief} {...UMRISS} />
      <path d="M-4 -150 h8 l-4 -12 Z" fill={P.gold} {...UMRISS_FEIN} />
    </g>
  );
}

// — Schneeland —

export function SchneeTanne(): ReactNode {
  return (
    <g>
      {Tanne()}
      {[
        [-12, 22],
        [-28, 18],
        [-44, 13],
      ].map(([y, b]) => (
        <path key={y} d={`M${-b + 4} ${y - 2} Q0 ${y - 9} ${b - 4} ${y - 2} Q0 ${y - 4} ${-b + 4} ${y - 2} Z`} fill={P.schnee} stroke={P.linie} strokeWidth={1.6} strokeLinejoin="round" />
      ))}
      <path d="M-5 -62 Q0 -70 5 -62 Q0 -64 -5 -62 Z" fill={P.schnee} stroke={P.linie} strokeWidth={1.6} />
    </g>
  );
}

export function Schneehaufen(): ReactNode {
  return <Klumpen kreise={[[-6, -8, 9], [7, -7, 8], [0, -12, 8]]} farbe={P.schnee} hell={P.weiss} tief={P.eis} />;
}

export function Eiskristall(): ReactNode {
  return (
    <g transform="translate(0 -12)">
      {[0, 60, 120].map((w) => (
        <path key={w} d="M0 -10 V10 M-3 -7 L0 -4 L3 -7 M-3 7 L0 4 L3 7" transform={`rotate(${w})`} fill="none" stroke={P.eisTief} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      <circle r={2.5} fill={P.eisHell} stroke={P.eisTief} strokeWidth={1.5} />
    </g>
  );
}

export const Eisblock = farbStein(P.eis, P.eisHell, P.eisTief);

const EIS: BurgFarben = { mauer: P.eis, mauerHell: P.eisHell, mauerTief: P.eisTief, dach: P.blauHell, dachTief: P.blau, fahne: P.weiss, tor: P.blauTief };
export const Eisburg = () => <BurgBild f={EIS} boss={false} />;

// — Strand —

export function Muschel(): ReactNode {
  return (
    <g>
      <path d="M-10 0 Q-12 -12 0 -14 Q12 -12 10 0 Q0 3 -10 0 Z" fill={P.rosaHell} {...UMRISS_FEIN} />
      <path d="M0 -13 V-1 M-5 -12 L-3 -1 M5 -12 L3 -1" stroke={P.rosaTief} strokeWidth={1.8} strokeLinecap="round" />
    </g>
  );
}

export function Seestern(): ReactNode {
  const d = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? 4 : 10;
    const w = (i * Math.PI) / 5 - Math.PI / 2;
    return `${i ? 'L' : 'M'}${Math.round(Math.cos(w) * r * 10) / 10} ${Math.round((Math.sin(w) * r - 9) * 10) / 10}`;
  }).join(' ');
  return (
    <g>
      <path d={`${d} Z`} fill={P.orange} {...UMRISS_FEIN} strokeWidth={1.8} />
      <circle cx={-2} cy={-11} r={1.5} fill={P.orangeHell} />
      <circle cx={2} cy={-8} r={1.5} fill={P.orangeHell} />
    </g>
  );
}

export function Leuchtturm(): ReactNode {
  return (
    <g>
      <ellipse cx={8} cy={2} rx={90} ry={10} fill={P.schatten} opacity={0.18} />
      {/* Rocks at its foot and the keeper's little house. */}
      <Klumpen kreise={[[-50, -10, 16], [-30, -6, 12], [44, -8, 14]]} farbe={P.grauHell} hell={P.metallHell} tief={P.grau} />
      <path d="M30 0 V-30 L48 -44 L66 -30 V0 Z" fill={P.stein} {...UMRISS} />
      <path d="M26 -28 L48 -48 L70 -28" fill="none" stroke={P.rot} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      <rect x={42} y={-18} width={12} height={18} fill={P.holzTief} {...UMRISS_FEIN} />
      {/* The tower: tapered, red and white rings, the lamp room on top. */}
      <path d="M-22 0 L-14 -130 H14 L22 0 Z" fill={P.weiss} {...UMRISS} />
      {[
        [-20, -16],
        [-60, -16],
        [-100, -16],
      ].map(([y, h]) => {
        const w = (yy: number) => 22 - ((-yy / 130) * 8);
        return <path key={y} d={`M${-w(y)} ${y} L${-w(y + h)} ${y + h} H${w(y + h)} L${w(y)} ${y} Z`} fill={P.rot} stroke={P.linie} strokeWidth={2} transform={`translate(0 ${-h})`} />;
      })}
      <path d="M6 -128 L14 -4" stroke={P.linie} strokeWidth={6} opacity={0.12} strokeLinecap="round" />
      <rect x={-18} y={-136} width={36} height={8} rx={2} fill={P.grauTief} {...UMRISS_FEIN} />
      <rect x={-12} y={-156} width={24} height={20} rx={3} fill={P.gelb} {...UMRISS_FEIN} />
      <path d="M-6 -152 V-140" stroke={P.gelbHell} strokeWidth={3} strokeLinecap="round" />
      <path d="M-16 -156 Q0 -176 16 -156 Z" fill={P.rot} {...UMRISS_FEIN} />
      <path d="M14 -148 L60 -160 L60 -136 Z" fill={P.gelbHell} opacity={0.55} />
    </g>
  );
}

// — Vulkan —

export function ToterBaum(): ReactNode {
  return (
    <g>
      {schatten(14)}
      <path d="M-4 0 L-3 -30 L-14 -46 M-3 -30 L0 -52 M0 -40 L12 -54 M-3 -22 L-12 -30" fill="none" stroke={P.linie} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M-4 0 L-3 -30 L-14 -46 M-3 -30 L0 -52 M0 -40 L12 -54 M-3 -22 L-12 -30" fill="none" stroke={P.dunkelHell} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

export function Vulkankegel(): ReactNode {
  return (
    <g>
      {schatten(26, 5)}
      <path d="M-30 0 L-8 -50 H8 L30 0 Z" fill={P.dunkel} {...UMRISS} />
      <path d="M8 -50 L30 0 H12 Z" fill={P.dunkelTief} opacity={0.6} />
      <path d="M-8 -50 Q-4 -40 -6 -30 Q0 -36 2 -26 Q6 -38 8 -50 Z" fill={P.lava} stroke={P.linie} strokeWidth={1.6} strokeLinejoin="round" />
      <circle cx={-4} cy={-60} r={5} fill={P.grau} opacity={0.6} />
      <circle cx={4} cy={-70} r={6} fill={P.grau} opacity={0.45} />
    </g>
  );
}

export function GlutFels(): ReactNode {
  return (
    <g>
      <Klumpen kreise={[[-6, -9, 9], [7, -7, 8]]} farbe={P.dunkelHell} hell={P.grauHell} tief={P.dunkelTief} />
      <path d="M-8 -12 L-3 -6 L-6 -2 M5 -11 L8 -5" fill="none" stroke={P.lava} strokeWidth={2.2} strokeLinecap="round" />
    </g>
  );
}

export function Flamme(): ReactNode {
  return (
    <g>
      <path d="M0 0 Q-10 -6 -5 -16 Q-3 -10 0 -12 Q-2 -20 4 -26 Q4 -16 10 -10 Q10 -2 0 0 Z" fill={P.lava} {...UMRISS_FEIN} />
      <path d="M0 -2 Q-4 -6 -1 -11 Q2 -8 4 -6 Q4 -2 0 -2 Z" fill={P.lavaHell} />
    </g>
  );
}

export const DunkelStein = farbStein(P.dunkelHell, P.grauHell, P.dunkelTief);

const FEUER: BurgFarben = { mauer: P.dunkelHell, mauerHell: P.grauHell, mauerTief: P.dunkel, dach: P.lava, dachTief: P.lavaTief, fahne: P.lavaHell, tor: P.dunkelTief };
export const Feuerfestung = () => <BurgBild f={FEUER} boss={false} />;

// — Weltall —

export function PlanetKlein(): ReactNode {
  return (
    <g transform="translate(0 -30)">
      <ellipse cx={0} cy={0} rx={30} ry={8} fill="none" stroke={P.linie} strokeWidth={7} transform="rotate(-15)" />
      <circle r={18} fill={P.orange} {...UMRISS} />
      <path d="M2 -16 A18 18 0 0 1 16 8 Q4 12 -6 14 A18 18 0 0 0 2 -16 Z" fill={P.orangeTief} opacity={0.5} />
      <path d="M-12 -6 Q-10 -12 -4 -14" fill="none" stroke={P.orangeHell} strokeWidth={3.5} strokeLinecap="round" />
      <path d="M-30 8 A30 8 0 0 0 30 -8" transform="rotate(-15)" fill="none" stroke={P.gelb} strokeWidth={3.5} strokeLinecap="round" />
    </g>
  );
}

export function Rakete(): ReactNode {
  return (
    <g>
      {schatten(14)}
      <path d="M-12 0 L-8 -14 M12 0 L8 -14" stroke={P.linie} strokeWidth={7} strokeLinecap="round" />
      <path d="M-12 0 L-8 -14 M12 0 L8 -14" stroke={P.rot} strokeWidth={3.5} strokeLinecap="round" />
      <path d="M-9 -8 V-44 Q0 -66 9 -44 V-8 Z" fill={P.metallHell} {...UMRISS} />
      <path d="M4 -52 Q9 -46 9 -40 V-8 H4 Z" fill={P.metallTief} opacity={0.6} />
      <circle cx={0} cy={-34} r={5} fill={P.blauHell} {...UMRISS_FEIN} />
      <path d="M-9 -54 Q0 -66 9 -54" fill={P.rot} {...UMRISS_FEIN} />
    </g>
  );
}

export function Krater(): ReactNode {
  return (
    <g>
      <ellipse cx={0} cy={-4} rx={15} ry={6} fill={P.nachtHell} stroke={P.linie} strokeWidth={2} />
      <ellipse cx={1} cy={-3} rx={10} ry={3.5} fill={P.nachtTief} />
    </g>
  );
}

export function Funkelstern(): ReactNode {
  return <path d="M0 -24 Q2 -14 10 -12 Q2 -10 0 0 Q-2 -10 -10 -12 Q-2 -14 0 -24 Z" fill={P.gelb} stroke={P.linie} strokeWidth={1.8} strokeLinejoin="round" />;
}

export const Asteroid = farbStein(P.grau, P.grauHell, P.grauTief);

export function Raumstation(): ReactNode {
  return (
    <g>
      {/* A big ringed planet behind the station. */}
      <g transform="translate(46 -120)">
        <circle r={44} fill={P.lila} {...UMRISS} />
        <path d="M6 -42 A44 44 0 0 1 40 22 Q10 34 -14 40 A44 44 0 0 0 6 -42 Z" fill={P.lilaTief} opacity={0.5} />
        <path d="M-30 -14 Q-24 -30 -10 -36" fill="none" stroke={P.lilaHell} strokeWidth={6} strokeLinecap="round" />
        <path d="M-70 14 A72 18 0 0 0 70 -14" transform="rotate(-12)" fill="none" stroke={P.linie} strokeWidth={9} strokeLinecap="round" />
        <path d="M-70 14 A72 18 0 0 0 70 -14" transform="rotate(-12)" fill="none" stroke={P.tuerkisHell} strokeWidth={4.5} strokeLinecap="round" />
      </g>
      <ellipse cx={6} cy={2} rx={100} ry={10} fill={P.schatten} opacity={0.25} />
      {/* The station: a dome on a base, an antenna, round windows. */}
      <rect x={-90} y={-24} width={180} height={24} rx={8} fill={P.metall} {...UMRISS} />
      <path d="M-70 -24 A70 64 0 0 1 70 -24 Z" fill={P.metallHell} {...UMRISS} />
      <path d="M20 -84 A70 64 0 0 1 70 -24 H36 Q38 -60 20 -84 Z" fill={P.metallTief} opacity={0.55} />
      <path d="M-50 -40 Q-44 -64 -20 -76" fill="none" stroke={P.weiss} strokeWidth={5} strokeLinecap="round" />
      {[-40, 0, 40].map((x) => (
        <circle key={x} cx={x} cy={-12} r={6} fill={P.tuerkisHell} {...UMRISS_FEIN} />
      ))}
      <path d="M0 -88 V-118" stroke={P.linie} strokeWidth={3.5} strokeLinecap="round" />
      <circle cx={0} cy={-122} r={6} fill={P.rot} {...UMRISS_FEIN} />
      <path d="M-16 0 V-14 a16 12 0 0 1 32 0 V0 Z" fill={P.tinte} {...UMRISS_FEIN} />
    </g>
  );
}

// — Wortschatz-Wald —

export function Farn(): ReactNode {
  return (
    <g>
      {[-40, -15, 15, 40].map((w) => (
        <g key={w} transform={`rotate(${w})`}>
          <path d="M0 0 Q-3 -10 0 -20" fill="none" stroke={P.linie} strokeWidth={5} strokeLinecap="round" />
          <path d="M0 0 Q-3 -10 0 -20" fill="none" stroke={P.blatt} strokeWidth={2.5} strokeLinecap="round" />
          {[-6, -11, -16].map((y) => (
            <path key={y} d={`M${-1} ${y} q-5 -1 -6 -4 M1 ${y} q5 -1 6 -4`} fill="none" stroke={P.blattHell} strokeWidth={2} strokeLinecap="round" />
          ))}
        </g>
      ))}
    </g>
  );
}

export function Pilz(): ReactNode {
  return (
    <g>
      <path d="M-4 0 V-10 H4 V0 Z" fill={P.creme} {...UMRISS_FEIN} />
      <path d="M-12 -9 Q-12 -22 0 -22 Q12 -22 12 -9 Z" fill={P.rot} {...UMRISS_FEIN} />
      <circle cx={-5} cy={-15} r={2.2} fill={P.weiss} />
      <circle cx={4} cy={-17} r={1.8} fill={P.weiss} />
      <circle cx={6} cy={-12} r={1.6} fill={P.weiss} />
    </g>
  );
}

export function MoosStein(): ReactNode {
  return (
    <g>
      {Stein()}
      <path d="M-12 -8 Q-6 -16 4 -15 Q-2 -12 -12 -8 Z" fill={P.wieseTief} stroke={P.linie} strokeWidth={1.5} strokeLinejoin="round" />
    </g>
  );
}

export function Baumhaus(): ReactNode {
  return (
    <g>
      <ellipse cx={6} cy={2} rx={90} ry={10} fill={P.schatten} opacity={0.18} />
      {/* Trunk and roots. */}
      <path d="M-24 0 Q-16 -10 -14 -40 L-12 -96 H12 L14 -40 Q16 -10 24 0 Z" fill={P.leder} {...UMRISS} />
      <path d="M4 -96 L8 -40 Q10 -12 18 0 H6 Q2 -30 4 -96 Z" fill={P.lederTief} opacity={0.6} />
      {/* The crown behind and above the house. */}
      <Klumpen
        kreise={[
          [-46, -150, 32],
          [0, -168, 38],
          [48, -150, 32],
          [-60, -118, 24],
          [62, -116, 24],
        ]}
        farbe={P.blatt}
        hell={P.blattHell}
        tief={P.blattTief}
      />
      {/* Platform, house and ladder. */}
      <rect x={-56} y={-100} width={112} height={10} rx={3} fill={P.holz} {...UMRISS_FEIN} />
      <path d="M-40 -100 V-136 H40 V-100 Z" fill={P.holz} {...UMRISS} />
      <path d="M20 -136 H40 V-100 H20 Z" fill={P.holzTief} opacity={0.5} />
      {[-128, -118, -108].map((y) => (
        <path key={y} d={`M-36 ${y} H36`} stroke={P.holzTief} strokeWidth={2} />
      ))}
      <path d="M-50 -134 L0 -168 L50 -134 Z" fill={P.rot} {...UMRISS} />
      <path d="M0 -168 L50 -134 H18 Z" fill={P.rotTief} opacity={0.55} />
      <rect x={-26} y={-128} width={14} height={14} rx={2} fill={P.gelbHell} {...UMRISS_FEIN} />
      <rect x={6} y={-130} width={16} height={30} rx={3} fill={P.lederTief} {...UMRISS_FEIN} />
      <path d="M-34 -90 L-30 0 M-22 -90 L-18 0" stroke={P.holzTief} strokeWidth={3} strokeLinecap="round" />
      {[-76, -58, -40, -22].map((y) => (
        <path key={y} d={`M${-33 + (-90 - y) / -22.5} ${y} H${-21 + (-90 - y) / -22.5}`} stroke={P.holzTief} strokeWidth={3} strokeLinecap="round" />
      ))}
    </g>
  );
}

// — Grammatik-Turm —

export function Felsspitze(): ReactNode {
  return (
    <g>
      {schatten(18, 4.5)}
      <path d="M-20 0 L-6 -58 L4 -44 L10 -66 L22 0 Z" fill={P.grauHell} {...UMRISS} />
      <path d="M10 -66 L22 0 H8 L6 -40 Z" fill={P.grau} opacity={0.6} />
      <path d="M-14 -6 L-6 -50" stroke={P.metallHell} strokeWidth={3} strokeLinecap="round" />
      <path d="M-6 -58 L-1 -50 L4 -44 L-3 -46 Z M10 -66 L13 -55 L7 -56 Z" fill={P.schnee} stroke={P.linie} strokeWidth={1.5} strokeLinejoin="round" />
    </g>
  );
}

export function Kristall(): ReactNode {
  return (
    <g>
      <path d="M-10 0 L-12 -12 L-6 -22 L-2 -8 Z" fill={P.lilaHell} {...UMRISS_FEIN} />
      <path d="M-4 0 L-4 -22 L2 -30 L8 -22 L8 0 Z" fill={P.lila} {...UMRISS_FEIN} />
      <path d="M2 -30 L8 -22 V0 H3 Z" fill={P.lilaTief} opacity={0.6} />
      <path d="M-1 -22 V-6" stroke={P.lilaHell} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

export function Zauberturm(): ReactNode {
  return (
    <g>
      <ellipse cx={6} cy={2} rx={80} ry={10} fill={P.schatten} opacity={0.18} />
      <Klumpen kreise={[[-44, -10, 18], [44, -8, 16], [-26, -6, 12]]} farbe={P.grauHell} hell={P.metallHell} tief={P.grau} />
      {/* The tower, slightly wider at the foot, a balcony and a pointed hat-roof with stars. */}
      <path d="M-30 0 L-24 -130 H24 L30 0 Z" fill={P.stein} {...UMRISS} />
      <path d="M10 -130 H24 L30 0 H14 Z" fill={P.steinTief} opacity={0.6} />
      <path d="M-24 -10 L-19 -122" stroke={P.steinHell} strokeWidth={4} strokeLinecap="round" />
      {[-30, -70].map((y) => (
        <path key={y} d={`M-6 ${y} v-8 a6 6 0 0 1 12 0 v8 Z`} fill={P.gelbHell} {...UMRISS_FEIN} />
      ))}
      <path d="M-14 0 V-18 a14 14 0 0 1 28 0 V0 Z" fill={P.lilaTief} {...UMRISS_FEIN} />
      <rect x={-34} y={-136} width={68} height={10} rx={3} fill={P.lila} {...UMRISS_FEIN} />
      <path d="M-36 -134 Q-10 -150 -4 -210 Q4 -196 14 -186 Q8 -180 6 -170 Q20 -156 36 -134 Z" fill={P.lila} {...UMRISS} />
      <path d="M-4 -210 Q4 -196 14 -186 Q8 -180 6 -170 Q20 -156 36 -134 H12 Q10 -170 -4 -210 Z" fill={P.lilaTief} opacity={0.5} />
      {[
        [-14, -150, 5],
        [8, -160, 4],
        [-2, -178, 3.5],
      ].map(([x, y, r]) => (
        <path key={x} d={`M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3} Z`} fill={P.gelb} stroke={P.linie} strokeWidth={1.2} />
      ))}
    </g>
  );
}

// — The worlds —

export type WeltId = 'wiese' | 'wueste' | 'schnee' | 'strand' | 'vulkan' | 'weltall' | 'wald' | 'turm';

export interface Welt {
  id: WeltId;
  name: string;
  /** Ground, its light patches and the darker ground at the boss castle. */
  boden: string;
  flecken: string;
  bodenTief: string;
  /** Path edge, path, the dashed line in the middle. */
  wegRand: string;
  weg: string;
  wegLinie: string;
  /** Small dots over the ground (stars in space, snowflakes), or none. */
  punkte?: string;
  wahrzeichen: () => ReactNode;
  deko: Record<DekoArt, () => ReactNode>;
}

export const WELTEN: Record<WeltId, Welt> = {
  wiese: { id: 'wiese', name: 'Wiese', boden: P.wiese, flecken: P.wieseHell, bodenTief: P.wieseTief, wegRand: P.sandTief, weg: P.sand, wegLinie: P.sandHell, wahrzeichen: Burg, deko: { baum: Baum, tanne: Tanne, busch: Busch, blume: Blume, stein: Stein } },
  wueste: { id: 'wueste', name: 'Wüste', boden: P.sand, flecken: P.sandHell, bodenTief: P.sandTief, wegRand: P.holzTief, weg: P.orangeHell, wegLinie: P.sandHell, wahrzeichen: Pyramide, deko: { baum: Palme, tanne: Kaktus, busch: KaktusKlein, blume: Duerrbusch, stein: SandStein } },
  schnee: { id: 'schnee', name: 'Schneeland', boden: P.schnee, flecken: P.eisHell, bodenTief: P.eis, wegRand: P.eisTief, weg: P.blauHell, wegLinie: P.eisHell, punkte: P.weiss, wahrzeichen: Eisburg, deko: { baum: SchneeTanne, tanne: SchneeTanne, busch: Schneehaufen, blume: Eiskristall, stein: Eisblock } },
  strand: { id: 'strand', name: 'Strand', boden: P.sand, flecken: P.wasser, bodenTief: P.wasserTief, wegRand: P.holzTief, weg: P.holz, wegLinie: P.sandHell, wahrzeichen: Leuchtturm, deko: { baum: Palme, tanne: Palme, busch: Muschel, blume: Seestern, stein: Stein } },
  vulkan: { id: 'vulkan', name: 'Vulkan', boden: P.dunkelHell, flecken: P.grau, bodenTief: P.lavaTief, wegRand: P.dunkelTief, weg: P.grauHell, wegLinie: P.lavaHell, wahrzeichen: Feuerfestung, deko: { baum: ToterBaum, tanne: Vulkankegel, busch: GlutFels, blume: Flamme, stein: DunkelStein } },
  weltall: { id: 'weltall', name: 'Weltall', boden: P.nacht, flecken: P.nachtHell, bodenTief: P.nachtTief, wegRand: P.lilaTief, weg: P.lilaHell, wegLinie: P.weiss, punkte: P.gelbHell, wahrzeichen: Raumstation, deko: { baum: PlanetKlein, tanne: Rakete, busch: Krater, blume: Funkelstern, stein: Asteroid } },
  wald: { id: 'wald', name: 'Wortschatz-Wald', boden: P.wieseTief, flecken: P.wiese, bodenTief: P.blattTief, wegRand: P.leder, weg: P.lederHell, wegLinie: P.sandHell, wahrzeichen: Baumhaus, deko: { baum: Baum, tanne: Tanne, busch: Farn, blume: Pilz, stein: MoosStein } },
  turm: { id: 'turm', name: 'Grammatik-Turm', boden: P.metall, flecken: P.metallHell, bodenTief: P.metallTief, wegRand: P.sandTief, weg: P.sand, wegLinie: P.sandHell, wahrzeichen: Zauberturm, deko: { baum: Felsspitze, tanne: Tanne, busch: Kristall, blume: Blume, stein: Stein } },
};

/** The worlds of the modules, in turn by module number (module 1 the meadow). */
export const MODUL_WELTEN: WeltId[] = ['wiese', 'wueste', 'schnee', 'strand', 'vulkan', 'weltall'];

/** The world of a region: the Extra-Pakete regions fixed (ids from src/lernquest/extra.ts), modules in turn. */
export function weltVon(regionId: string, nummer: number): Welt {
  if (regionId.startsWith('extra-wortschatz-')) return WELTEN.wald;
  if (regionId.startsWith('extra-grammatik-')) return WELTEN.turm;
  const n = Number.isFinite(nummer) && nummer > 0 ? Math.floor(nummer) : 1;
  return WELTEN[MODUL_WELTEN[(n - 1) % MODUL_WELTEN.length]];
}

/** The new pieces for the workshop („Karte“), next to GELAENDE (gelaende.tsx). */
export const WELT_TEILE: GelaendeTeil[] = [
  { id: 'pyramide', name: 'Pyramide (Wüste)', rahmen: [-112, -170, 224, 180], zeichnung: Pyramide },
  { id: 'eisburg', name: 'Eisburg (Schneeland)', rahmen: [-112, -200, 224, 210], zeichnung: Eisburg },
  { id: 'leuchtturm', name: 'Leuchtturm (Strand)', rahmen: [-90, -180, 180, 190], zeichnung: Leuchtturm },
  { id: 'feuerfestung', name: 'Feuerfestung (Vulkan)', rahmen: [-112, -200, 224, 210], zeichnung: Feuerfestung },
  { id: 'raumstation', name: 'Raumstation (Weltall)', rahmen: [-112, -180, 230, 190], zeichnung: Raumstation },
  { id: 'baumhaus', name: 'Baumhaus (Wortschatz-Wald)', rahmen: [-100, -215, 200, 225], zeichnung: Baumhaus },
  { id: 'zauberturm', name: 'Zauberturm (Grammatik-Turm)', rahmen: [-80, -215, 160, 225], zeichnung: Zauberturm },
  { id: 'palme', name: 'Palme', rahmen: [-34, -76, 68, 82], zeichnung: Palme },
  { id: 'kaktus', name: 'Kaktus', rahmen: [-24, -66, 48, 72], zeichnung: Kaktus },
  { id: 'kaktusklein', name: 'Kleiner Kaktus', rahmen: [-14, -24, 28, 28], zeichnung: KaktusKlein },
  { id: 'duerrbusch', name: 'Dürrer Busch', rahmen: [-14, -20, 28, 24], zeichnung: Duerrbusch },
  { id: 'sandstein', name: 'Sandstein', rahmen: [-18, -20, 36, 22], zeichnung: SandStein },
  { id: 'schneetanne', name: 'Tanne mit Schnee', rahmen: [-28, -74, 56, 80], zeichnung: SchneeTanne },
  { id: 'schneehaufen', name: 'Schneehaufen', rahmen: [-18, -24, 36, 26], zeichnung: Schneehaufen },
  { id: 'eiskristall', name: 'Eiskristall', rahmen: [-13, -26, 26, 28], zeichnung: Eiskristall },
  { id: 'eisblock', name: 'Eisblock', rahmen: [-18, -20, 36, 22], zeichnung: Eisblock },
  { id: 'muschel', name: 'Muschel', rahmen: [-14, -18, 28, 22], zeichnung: Muschel },
  { id: 'seestern', name: 'Seestern', rahmen: [-13, -22, 26, 26], zeichnung: Seestern },
  { id: 'toterbaum', name: 'Toter Baum', rahmen: [-24, -62, 48, 66], zeichnung: ToterBaum },
  { id: 'vulkankegel', name: 'Kleiner Vulkan', rahmen: [-34, -80, 68, 84], zeichnung: Vulkankegel },
  { id: 'glutfels', name: 'Glutfels', rahmen: [-18, -22, 36, 24], zeichnung: GlutFels },
  { id: 'flamme', name: 'Flamme', rahmen: [-14, -30, 28, 32], zeichnung: Flamme },
  { id: 'planetklein', name: 'Kleiner Planet', rahmen: [-36, -60, 72, 62], zeichnung: PlanetKlein },
  { id: 'rakete', name: 'Rakete', rahmen: [-18, -70, 36, 74], zeichnung: Rakete },
  { id: 'krater', name: 'Krater', rahmen: [-18, -12, 36, 14], zeichnung: Krater },
  { id: 'funkelstern', name: 'Funkelstern', rahmen: [-12, -26, 24, 28], zeichnung: Funkelstern },
  { id: 'farn', name: 'Farn', rahmen: [-22, -24, 44, 26], zeichnung: Farn },
  { id: 'pilz', name: 'Pilz', rahmen: [-14, -24, 28, 26], zeichnung: Pilz },
  { id: 'felsspitze', name: 'Felsspitze', rahmen: [-24, -70, 50, 74], zeichnung: Felsspitze },
  { id: 'kristall', name: 'Kristall', rahmen: [-14, -32, 26, 34], zeichnung: Kristall },
];
