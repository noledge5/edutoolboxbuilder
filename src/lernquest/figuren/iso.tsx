// 2.5D building kit of the village (Stilprobe 3, docs/design/lernquest/stilprobe/haus-v3.mjs, decided 18.11.2026):
// 2:1 isometric, x runs right-down, y left-down, z up. Visible are the top, the left face (plane y + d) and the right
// face (plane x + w). Light from the top left: left faces light, right faces dark, cast shadows fall right-down.
// Every building and add-on uses these parts, so they match. Depth comes from flat tones only (no gradients, ADR 0001,
// 19.11.2026): right faces dark, a flat shadow band under eaves, a light edge at the ridge, cast shadows as one shape
// of fixed opacity. All colours from stil.ts. Draw back to front (smaller x + y first).
import type { ReactNode } from "react";
import { P } from "./stil";

export type Pt = [number, number];
export interface Flaechen {
  top: string;
  links: string;
  rechts: string;
}
export interface DachTon {
  vorn: string;
  seite: string;
  kante: string;
  licht: string;
}

export const BRUCH: Flaechen = {
  top: P.bruchHell,
  links: P.bruch,
  rechts: P.bruchTief,
};
export const PUTZ: Flaechen = {
  top: P.putzHell,
  links: P.putz,
  rechts: P.putzTief,
};
export const HOLZ: Flaechen = {
  top: P.holz,
  links: P.holzTief,
  rechts: P.balkenHell,
};
export const ZIEGEL: DachTon = {
  vorn: P.ziegel,
  seite: P.ziegelTief,
  kante: P.ziegelKante,
  licht: P.ziegelHell,
};
/** Thatch, for the hut of the own houses. */
export const STROH: DachTon = {
  vorn: P.sand,
  seite: P.sandTief,
  kante: P.sandTief,
  licht: P.sandHell,
};
export const SCHIEFER: DachTon = {
  vorn: P.schiefer,
  seite: P.schieferTief,
  kante: P.schieferKante,
  licht: P.schieferHell,
};

/** The flat shade over every right face (walls, gables): one tone of fixed opacity, so the right side reads darker
 *  than its base colour alone (it replaced the gradient overlays). */
const RECHTS_SCHATTEN = { fill: P.auge, opacity: 0.18 } as const;
/** The flat shadow band under eaves and jetties: a fraction of the band height, fixed opacity. */
const BAND_SCHATTEN = { fill: P.auge, opacity: 0.3 } as const;

const f = (p: Pt) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
const hash = (a: number, b: number) => {
  const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return v - Math.floor(v);
};
const mix = (a: Pt, b: Pt, t: number): Pt => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];

/** Convex hull of screen points (monotone chain), for cast shadows of round bodies. */
function huelle(pts: Pt[]): Pt[] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const kreuz = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const halb = (liste: Pt[]) => {
    const h: Pt[] = [];
    for (const q of liste) {
      while (h.length >= 2 && kreuz(h[h.length - 2], h[h.length - 1], q) <= 0) h.pop();
      h.push(q);
    }
    h.pop();
    return h;
  };
  return [...halb(p), ...halb([...p].reverse())];
}

/** Scalloped tile row from a to b (screen points), `k` tiles. */
function bogen(a: Pt, b: Pt, k: number): string {
  let d = "";
  for (let i = 0; i < k; i++) {
    const p = mix(a, b, i / k);
    const q = mix(a, b, (i + 1) / k);
    const r = (Math.hypot(q[0] - p[0], q[1] - p[1]) * 0.55).toFixed(1);
    d += `M${f(p)} A${r} ${r} 0 0 0 ${f(q)} `;
  }
  return d;
}

/** The drawing kit for one origin (ox, oy). Each part returns a <g>. */
export function isoStift(ox: number, oy: number) {
  const P3 = (x: number, y: number, z = 0): Pt => [
    ox + (x - y) * 0.866,
    oy + (x + y) * 0.5 - z,
  ];
  const poly = (
    pts: Pt[],
    fill: string,
    rest: Record<string, unknown> = {},
  ) => <polygon points={pts.map(f).join(" ")} fill={fill} {...rest} />;
  const linie = (a: Pt, b: Pt, farbe: string, w = 2, o = 1) => (
    <line
      x1={a[0]}
      y1={a[1]}
      x2={b[0]}
      y2={b[1]}
      stroke={farbe}
      strokeWidth={w}
      strokeLinecap="round"
      opacity={o}
    />
  );

  const box = (
    x: number,
    y: number,
    z: number,
    w: number,
    d: number,
    h: number,
    c: Flaechen,
  ) => (
    <g>
      {poly(
        [
          P3(x, y, z + h),
          P3(x + w, y, z + h),
          P3(x + w, y + d, z + h),
          P3(x, y + d, z + h),
        ],
        c.top,
      )}
      {poly(
        [
          P3(x, y + d, z),
          P3(x + w, y + d, z),
          P3(x + w, y + d, z + h),
          P3(x, y + d, z + h),
        ],
        c.links,
      )}
      {poly(
        [
          P3(x + w, y, z),
          P3(x + w, y + d, z),
          P3(x + w, y + d, z + h),
          P3(x + w, y, z + h),
        ],
        c.rechts,
      )}
    </g>
  );

  /** Field stones on both visible faces of a box. */
  const steine = (
    x: number,
    y: number,
    z: number,
    w: number,
    d: number,
    h: number,
  ) => {
    const out: ReactNode[] = [];
    const rand = {
      stroke: P.bruchFuge,
      strokeWidth: 1.2,
      strokeLinejoin: "round",
    };
    for (let r = 0, zz = z + 1.5; zz < z + h - 2; r++, zz += 8) {
      const hh = Math.min(6, z + h - 1 - zz);
      for (let xx = x + (r % 2 ? 5 : 1); xx < x + w - 3; xx += 11) {
        const ww = Math.min(9, x + w - 1 - xx);
        out.push(
          <g key={`l${r}-${xx}`}>
            {poly(
              [
                P3(xx, y + d, zz),
                P3(xx + ww, y + d, zz),
                P3(xx + ww, y + d, zz + hh),
                P3(xx, y + d, zz + hh),
              ],
              hash(xx, zz) > 0.6 ? P.bruchHell : P.bruch,
              rand,
            )}
          </g>,
        );
      }
      for (let yy = y + (r % 2 ? 1 : 5); yy < y + d - 3; yy += 11) {
        const dd = Math.min(9, y + d - 1 - yy);
        out.push(
          <g key={`r${r}-${yy}`}>
            {poly(
              [
                P3(x + w, yy, zz),
                P3(x + w, yy + dd, zz),
                P3(x + w, yy + dd, zz + hh),
                P3(x + w, yy, zz + hh),
              ],
              hash(yy, zz + 7) > 0.6 ? P.bruch : P.bruchTief,
              rand,
            )}
          </g>,
        );
      }
    }
    return <g>{out}</g>;
  };

  /** Depth on a body: the right face one flat shade darker, a light edge along the top of the left face. */
  const tiefe = (
    x: number,
    y: number,
    z: number,
    w: number,
    d: number,
    h: number,
  ) => (
    <g>
      {poly(
        [
          P3(x + w, y, z),
          P3(x + w, y + d, z),
          P3(x + w, y + d, z + h),
          P3(x + w, y, z + h),
        ],
        RECHTS_SCHATTEN.fill,
        { opacity: RECHTS_SCHATTEN.opacity },
      )}
      {linie(P3(x, y + d, z + h), P3(x + w, y + d, z + h), P.weiss, 2, 0.35)}
    </g>
  );

  /** Flat shadow band below an edge (eaves, jetty) on both visible faces: one shape, 0.6 × `k` high, fixed opacity. */
  const band = (
    x: number,
    y: number,
    z: number,
    w: number,
    d: number,
    k = 12,
  ) => {
    const t = k * 0.6;
    return (
      <g>
        {poly(
          [
            P3(x, y + d, z),
            P3(x + w, y + d, z),
            P3(x + w, y + d, z - t),
            P3(x, y + d, z - t),
          ],
          BAND_SCHATTEN.fill,
          { opacity: BAND_SCHATTEN.opacity },
        )}
        {poly(
          [
            P3(x + w, y, z),
            P3(x + w, y + d, z),
            P3(x + w, y + d, z - t),
            P3(x + w, y, z - t),
          ],
          BAND_SCHATTEN.fill,
          { opacity: BAND_SCHATTEN.opacity },
        )}
      </g>
    );
  };

  /** Cast shadow on the ground of a body w × d, h high. */
  const schlag = (
    x: number,
    y: number,
    w: number,
    d: number,
    h: number,
    o = 0.24,
  ) => {
    const sx = h * 0.42;
    const sy = h * 0.1;
    const pts: [number, number][] = [
      [x, y],
      [x + w, y],
      [x + w + sx, y + sy],
      [x + w + sx, y + d + sy],
      [x + sx, y + d + sy],
      [x, y + d],
    ];
    return poly(
      pts.map(([a, b]) => P3(a, b, 0)),
      P.schatten,
      { opacity: o },
    );
  };

  /** Timber framing on the left face (plane y = Y) from x0 to x1. */
  const fachL = (
    x0: number,
    x1: number,
    Y: number,
    z0: number,
    z1: number,
    feld = 22,
  ) => {
    const k = Math.max(1, Math.round((x1 - x0) / feld));
    const s = (x1 - x0) / k;
    return (
      <g>
        {linie(P3(x0, Y, z0), P3(x1, Y, z0), P.balken, 4)}
        {linie(P3(x0, Y, z1), P3(x1, Y, z1), P.balken, 4)}
        {Array.from({ length: k + 1 }, (_, i) => (
          <g key={i}>
            {linie(P3(x0 + s * i, Y, z0), P3(x0 + s * i, Y, z1), P.balken, 4)}
          </g>
        ))}
        {linie(P3(x0, Y, z0), P3(x0 + s, Y, z1), P.balken, 3.5)}
        {linie(P3(x1, Y, z0), P3(x1 - s, Y, z1), P.balken, 3.5)}
      </g>
    );
  };
  /** Timber framing on the right face (plane x = X) from y0 to y1. */
  const fachR = (
    X: number,
    y0: number,
    y1: number,
    z0: number,
    z1: number,
    feld = 22,
  ) => {
    const k = Math.max(1, Math.round((y1 - y0) / feld));
    const s = (y1 - y0) / k;
    return (
      <g>
        {linie(P3(X, y0, z0), P3(X, y1, z0), P.balkenTief, 4)}
        {linie(P3(X, y0, z1), P3(X, y1, z1), P.balkenTief, 4)}
        {Array.from({ length: k + 1 }, (_, i) => (
          <g key={i}>
            {linie(
              P3(X, y0 + s * i, z0),
              P3(X, y0 + s * i, z1),
              P.balkenTief,
              4,
            )}
          </g>
        ))}
        {linie(P3(X, y0, z0), P3(X, y0 + s, z1), P.balkenTief, 3.5)}
        {linie(P3(X, y1, z0), P3(X, y1 - s, z1), P.balkenTief, 3.5)}
      </g>
    );
  };

  /** Steep gable roof, ridge along x. Visible: the front slope and the right gable (timbered when `fach`; plaster
   *  unless `giebelFarbe` says otherwise, e.g. wood for a hut). */
  const satteldach = (
    x: number,
    y: number,
    z: number,
    w: number,
    d: number,
    h: number,
    c: DachTon = ZIEGEL,
    o = 7,
    fach = true,
    giebelFarbe: string = P.putzTief,
  ) => {
    const m = y + d / 2;
    const E = (t: number, xx: number) =>
      P3(xx, m + (y + d + o - m) * t, z + h + (-3 - h) * t);
    const vorn = [E(1, x - o), E(1, x + w + o), E(0, x + w + o), E(0, x - o)];
    const giebel = [P3(x + w, y, z), P3(x + w, y + d, z), P3(x + w, m, z + h)];
    const reihen = Math.round(h / 7);
    const stueck = Math.round((w + 2 * o) / 7.5);
    return (
      <g>
        {poly(
          [
            P3(x - o, y - o, z - 3),
            P3(x + w + o, y - o, z - 3),
            P3(x + w + o, m, z + h),
            P3(x - o, m, z + h),
          ],
          c.seite,
        )}
        {poly(giebel, giebelFarbe)}
        {poly(giebel, RECHTS_SCHATTEN.fill, {
          opacity: RECHTS_SCHATTEN.opacity,
        })}
        {fach && (
          <g>
            {linie(P3(x + w, y, z), P3(x + w, m, z + h), P.balkenTief, 4)}
            {linie(P3(x + w, y + d, z), P3(x + w, m, z + h), P.balkenTief, 4)}
            {linie(P3(x + w, m, z), P3(x + w, m, z + h), P.balkenTief, 4)}
            {linie(
              P3(x + w, y + d * 0.25, z + h * 0.5),
              P3(x + w, y + d * 0.75, z + h * 0.5),
              P.balkenTief,
              3.5,
            )}
          </g>
        )}
        {poly(vorn, c.vorn)}
        <path
          d={Array.from({ length: reihen }, (_, i) =>
            bogen(
              E((i + 1) / reihen, x - o),
              E((i + 1) / reihen, x + w + o),
              stueck,
            ),
          ).join("")}
          fill="none"
          stroke={c.kante}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
        {linie(E(0, x - o), E(0, x + w + o), c.licht, 4)}
        {linie(E(0, x - o), E(1, x - o), P.balken, 4)}
        {linie(E(1, x - o), E(1, x + w + o), P.balken, 3)}
        {linie(
          P3(x + w + o, y - o, z - 3),
          P3(x + w + o, m, z + h),
          P.balken,
          4,
        )}
        {linie(P3(x + w + o, m, z + h), E(1, x + w + o), P.balken, 4)}
      </g>
    );
  };

  /** Steep pyramid roof (tower). Visible: front and right face. */
  const zeltdach = (
    x: number,
    y: number,
    z: number,
    w: number,
    d: number,
    h: number,
    c: DachTon = ZIEGEL,
    o = 6,
    fahne = true,
  ) => {
    const sp = P3(x + w / 2, y + d / 2, z + h);
    const l = P3(x - o, y + d + o, z - 2);
    const vv = P3(x + w + o, y + d + o, z - 2);
    const r = P3(x + w + o, y - o, z - 2);
    const reihen = Math.round(h / 8);
    let dv = "";
    let dr = "";
    for (let i = 1; i < reihen; i++) {
      const t = i / reihen;
      const st = Math.max(1, Math.round(((1 - t) * (w + 2 * o)) / 7.5));
      dv += bogen(mix(sp, l, t), mix(sp, vv, t), st);
      dr += bogen(mix(sp, vv, t), mix(sp, r, t), st);
    }
    return (
      <g>
        {poly([l, vv, sp], c.vorn)}
        {poly([vv, r, sp], c.seite)}
        <path d={dv} fill="none" stroke={c.kante} strokeWidth={1.8} />
        <path
          d={dr}
          fill="none"
          stroke={c.kante}
          strokeWidth={1.8}
          opacity={0.8}
        />
        {linie(l, vv, P.balken, 3)}
        {linie(vv, r, P.balken, 3)}
        {linie(vv, sp, c.licht, 3.5)}
        {linie(l, sp, P.balken, 3.5)}
        {linie(r, sp, P.balken, 3.5)}
        {fahne && linie(sp, [sp[0], sp[1] - 22], P.dunkel, 3)}
        {fahne && <path d={`M${f(sp)} m0 -22 l16 5 -16 6Z`} fill={P.gold} />}
      </g>
    );
  };

  /** Window with crossbars and a shutter on the left face (plane y = E) or the right face (plane x = E). */
  const fenster = (
    seite: "L" | "R",
    a: number,
    E: number,
    z: number,
    b: number,
    h: number,
    hell = false,
  ) => {
    const Q =
      seite === "L"
        ? (u: number, zz: number) => P3(u, E, zz)
        : (u: number, zz: number) => P3(E, u, zz);
    const rahmen = seite === "L" ? P.balken : P.balkenTief;
    return (
      <g>
        {poly(
          [
            Q(a - 2, z - 2),
            Q(a + b + 2, z - 2),
            Q(a + b + 2, z + h + 2),
            Q(a - 2, z + h + 2),
          ],
          rahmen,
        )}
        {poly(
          [Q(a, z), Q(a + b, z), Q(a + b, z + h), Q(a, z + h)],
          hell ? P.licht : P.glas,
        )}
        {linie(Q(a + b / 2, z), Q(a + b / 2, z + h), rahmen, 2)}
        {linie(Q(a, z + h / 2), Q(a + b, z + h / 2), rahmen, 2)}
        {poly(
          [
            Q(a - 2 - b * 0.45, z - 1),
            Q(a - 3, z - 1),
            Q(a - 3, z + h + 1),
            Q(a - 2 - b * 0.45, z + h + 1),
          ],
          seite === "L" ? HOLZ.links : HOLZ.rechts,
        )}
      </g>
    );
  };

  /** Arched door on the left face (plane y = Y). */
  const tuer = (a: number, Y: number, z: number, b: number, h: number) => {
    const bg = (r0: number, inset: number) => {
      const pts: Pt[] = [P3(a + inset, Y, z), P3(a + b - inset, Y, z)];
      for (let i = 0; i <= 8; i++) {
        const t = (i / 8) * Math.PI;
        pts.push(
          P3(
            a + b / 2 + Math.cos(t) * (b / 2 - inset),
            Y,
            z + h - b / 2 + Math.sin(t) * r0,
          ),
        );
      }
      return pts;
    };
    const k = P3(a + b - 4, Y, z + h * 0.45);
    return (
      <g>
        {poly(bg(b / 2 + 3, -3), P.bruchTief)}
        {poly(bg(b / 2, 0), P.leder)}
        {[1, 2].map((i) => (
          <g key={i}>
            {linie(
              P3(a + (b * i) / 3, Y, z + 1),
              P3(a + (b * i) / 3, Y, z + h - 3),
              P.lederHell,
              2,
            )}
          </g>
        ))}
        {linie(
          P3(a + 2, Y, z + h * 0.3),
          P3(a + b - 2, Y, z + h * 0.3),
          P.dunkel,
          2.5,
        )}
        {linie(
          P3(a + 2, Y, z + h * 0.65),
          P3(a + b - 2, Y, z + h * 0.65),
          P.dunkel,
          2.5,
        )}
        <circle cx={k[0]} cy={k[1]} r={2.2} fill={P.gold} />
      </g>
    );
  };

  /** A wooden fence along x at y = Y. */
  const zaunX = (x0: number, x1: number, Y: number) => (
    <g>
      {Array.from({ length: Math.floor((x1 - x0) / 14) + 1 }, (_, i) => (
        <g key={i}>
          {linie(P3(x0 + i * 14, Y, 0), P3(x0 + i * 14, Y, 18), P.balken, 4.5)}
        </g>
      ))}
      {linie(P3(x0, Y, 13), P3(x1, Y, 13), HOLZ.links, 4)}
      {linie(P3(x0, Y, 6), P3(x1, Y, 6), HOLZ.links, 4)}
    </g>
  );

  /** A flat rectangle on the ground (path, square, plot). */
  const flaeche = (
    x: number,
    y: number,
    w: number,
    d: number,
    fill: string,
    rest: Record<string, unknown> = {},
  ) =>
    poly([P3(x, y), P3(x + w, y), P3(x + w, y + d), P3(x, y + d)], fill, rest);

  // Round parts (map landmarks, 19.11.2026): a circle of radius r on the ground shows as an ellipse rx × ry.
  const RX = 1.2247;
  const RY = 0.7071;
  /** Arc data for the front half of the ellipse at screen point c (radius r on the ground), from left to right. */
  const vorne = (c: Pt, r: number, zurueck = false) =>
    zurueck
      ? `A${(r * RX).toFixed(1)} ${(r * RY).toFixed(1)} 0 0 1 ${f([c[0] - r * RX, c[1]])}`
      : `A${(r * RX).toFixed(1)} ${(r * RY).toFixed(1)} 0 0 0 ${f([c[0] + r * RX, c[1]])}`;

  /** A ring of an upright round body (tower, base, stripe) at (x, y) from z to z + h, radius r at the foot and r2 at
   *  the top: the visible front surface, without its top. */
  const ring = (
    x: number,
    y: number,
    z: number,
    r: number,
    h: number,
    farbe: string,
    r2 = r,
  ) => {
    const u = P3(x, y, z);
    const o = P3(x, y, z + h);
    return (
      <path
        d={`M${f([o[0] - r2 * RX, o[1]])} L${f([u[0] - r * RX, u[1]])} ${vorne(u, r)} L${f([o[0] + r2 * RX, o[1]])} ${vorne(o, r2, true)} Z`}
        fill={farbe}
      />
    );
  };

  /** The flat shade on the right of a round body (like `tiefe` on a box): one shape, fixed opacity. */
  const rundTiefe = (x: number, y: number, z: number, r: number, h: number, r2 = r) => {
    const u = P3(x, y, z);
    const o = P3(x, y, z + h);
    const k = 0.35;
    const s = Math.sqrt(1 - k * k);
    return (
      <path
        d={`M${f([o[0] + k * r2 * RX, o[1] + s * r2 * RY])} L${f([u[0] + k * r * RX, u[1] + s * r * RY])} A${(r * RX).toFixed(1)} ${(r * RY).toFixed(1)} 0 0 0 ${f([u[0] + r * RX, u[1]])} L${f([o[0] + r2 * RX, o[1]])} A${(r2 * RX).toFixed(1)} ${(r2 * RY).toFixed(1)} 0 0 1 ${f([o[0] + k * r2 * RX, o[1] + s * r2 * RY])} Z`}
        fill={RECHTS_SCHATTEN.fill}
        opacity={RECHTS_SCHATTEN.opacity}
      />
    );
  };

  /** An upright round body (round tower, base): front ring, shade on the right, top face in `oben`. */
  const walze = (
    x: number,
    y: number,
    z: number,
    r: number,
    h: number,
    c: Flaechen,
    r2 = r,
  ) => {
    const o = P3(x, y, z + h);
    return (
      <g>
        {ring(x, y, z, r, h, c.links, r2)}
        {rundTiefe(x, y, z, r, h, r2)}
        <ellipse cx={o[0]} cy={o[1]} rx={r2 * RX} ry={r2 * RY} fill={c.top} />
      </g>
    );
  };

  /** A cone roof on a round body: base radius r at height z, tip h above. The right part `tief`, a light edge. */
  const kegel = (
    x: number,
    y: number,
    z: number,
    r: number,
    h: number,
    farbe: string,
    tief: string,
    licht: string,
  ) => {
    const u = P3(x, y, z);
    const sp = P3(x, y, z + h);
    const k = 0.3;
    const s = Math.sqrt(1 - k * k);
    return (
      <g>
        <path d={`M${f(sp)} L${f([u[0] - r * RX, u[1]])} ${vorne(u, r)} Z`} fill={farbe} />
        <path
          d={`M${f(sp)} L${f([u[0] + k * r * RX, u[1] + s * r * RY])} A${(r * RX).toFixed(1)} ${(r * RY).toFixed(1)} 0 0 0 ${f([u[0] + r * RX, u[1]])} Z`}
          fill={tief}
        />
        {linie(mix(sp, [u[0] - 0.45 * r * RX, u[1] + 0.89 * r * RY], 0.08), [u[0] - 0.45 * r * RX, u[1] + 0.89 * r * RY - 2], licht, 3.5)}
      </g>
    );
  };

  /** A dome (half ball) of radius r on (x, y, z): the right part `tief` from a hard edge, a light arc top left. */
  const kuppel = (
    x: number,
    y: number,
    z: number,
    r: number,
    farbe: string,
    tief: string,
    licht: string,
  ) => {
    const u = P3(x, y, z);
    const rx = r * RX;
    const ry = r * RY;
    const k = 0.4;
    const s = Math.sqrt(1 - k * k);
    return (
      <g>
        <path d={`M${f([u[0] - rx, u[1]])} A${rx.toFixed(1)} ${r} 0 0 1 ${f([u[0] + rx, u[1]])} ${vorne(u, r, true)} Z`} fill={farbe} />
        <path
          d={`M${f([u[0] + k * rx, u[1] - s * r])} A${rx.toFixed(1)} ${r} 0 0 1 ${f([u[0] + rx, u[1]])} A${rx.toFixed(1)} ${ry.toFixed(1)} 0 0 1 ${f([u[0] + k * rx, u[1] + s * ry])} Q${f([u[0] + k * rx + r * 0.25, u[1] - r * 0.2])} ${f([u[0] + k * rx, u[1] - s * r])} Z`}
          fill={tief}
        />
        <path
          d={`M${f([u[0] - rx * 0.72, u[1] - r * 0.42])} A${(rx * 0.78).toFixed(1)} ${(r * 0.78).toFixed(1)} 0 0 1 ${f([u[0] - rx * 0.2, u[1] - r * 0.76])}`}
          fill="none"
          stroke={licht}
          strokeWidth={5}
          strokeLinecap="round"
        />
      </g>
    );
  };

  /** Cast shadow of a round body (radius r at the foot, r2 at the top, h high) on the ground: the hull of its foot and
   *  its top moved like `schlag`, one shape of fixed opacity. */
  const rundSchlag = (x: number, y: number, r: number, h: number, r2 = r, o = 0.24) => {
    const pts: Pt[] = [];
    for (let i = 0; i < 24; i++) {
      const t = (i / 24) * 2 * Math.PI;
      pts.push(P3(x + Math.cos(t) * r, y + Math.sin(t) * r));
      pts.push(P3(x + h * 0.42 + Math.cos(t) * r2, y + h * 0.1 + Math.sin(t) * r2));
    }
    return poly(huelle(pts), P.schatten, { opacity: o });
  };

  /** An arched opening (gate, door, window slit) in one colour on the left face (plane y = E) or the right face
   *  (plane x = E): from `a` along the face, b wide, h high to the top of the arch. */
  const bogenTor = (
    seite: "L" | "R",
    a: number,
    E: number,
    z: number,
    b: number,
    h: number,
    farbe: string,
  ) => {
    const Q =
      seite === "L"
        ? (u: number, zz: number) => P3(u, E, zz)
        : (u: number, zz: number) => P3(E, u, zz);
    const pts: Pt[] = [Q(a, z), Q(a + b, z)];
    for (let i = 0; i <= 8; i++) {
      const t = (i / 8) * Math.PI;
      pts.push(Q(a + b / 2 + (Math.cos(t) * b) / 2, z + h - b / 2 + (Math.sin(t) * b) / 2));
    }
    return poly(pts, farbe);
  };

  return {
    P3,
    poly,
    ring,
    rundTiefe,
    walze,
    kegel,
    kuppel,
    rundSchlag,
    bogenTor,
    linie,
    box,
    steine,
    tiefe,
    band,
    schlag,
    fachL,
    fachR,
    satteldach,
    zeltdach,
    fenster,
    tuer,
    zaunX,
    flaeche,
    bogen,
  };
}
export type IsoStift = ReturnType<typeof isoStift>;
