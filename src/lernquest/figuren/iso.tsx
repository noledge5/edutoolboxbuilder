// 2.5D building kit of the village (Stilprobe 3, docs/design/lernquest/stilprobe/haus-v3.mjs, decided 18.11.2026):
// 2:1 isometric, x runs right-down, y left-down, z up. Visible are the top, the left face (plane y + d) and the right
// face (plane x + w). Light from the top left: left faces light, right faces dark, cast shadows fall right-down.
// Every building and add-on uses these parts, so they match. Depth comes from gradient overlays (ids from
// <IsoVerlaeufe>), all colours from stil.ts. Draw back to front (smaller x + y first).
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
export const SCHIEFER: DachTon = {
  vorn: P.schiefer,
  seite: P.schieferTief,
  kante: P.schieferKante,
  licht: P.schieferHell,
};

/** The shared gradients of one drawing; `id` must be unique in the page (useId). */
export function IsoVerlaeufe({ id }: { id: string }) {
  const lin = (
    name: string,
    stops: [number, string, number][],
    x2 = 0,
    y2 = 1,
  ) => (
    <linearGradient
      id={`${id}-${name}`}
      x1={x2 < 0 ? 1 : 0}
      y1={0}
      x2={x2 < 0 ? 0 : x2}
      y2={y2}
    >
      {stops.map(([o, c, a], i) => (
        <stop key={i} offset={o} stopColor={c} stopOpacity={a} />
      ))}
    </linearGradient>
  );
  return (
    <defs>
      {lin("ao", [
        [0, P.weiss, 0.1],
        [0.55, P.auge, 0],
        [1, P.auge, 0.3],
      ])}
      {lin("aoR", [
        [0, P.auge, 0.06],
        [1, P.auge, 0.34],
      ])}
      {lin("traufe", [
        [0, P.auge, 0.42],
        [1, P.auge, 0],
      ])}
      {lin("dach", [
        [0, P.weiss, 0.22],
        [0.5, P.weiss, 0],
        [1, P.auge, 0.28],
      ])}
      {lin("dachT", [
        [0, P.weiss, 0.18],
        [1, P.auge, 0.26],
      ])}
      {lin(
        "dachW",
        [
          [0, P.weiss, 0.15],
          [1, P.auge, 0.25],
        ],
        -1,
        0,
      )}
      <radialGradient id={`${id}-glanz`}>
        <stop offset={0} stopColor={P.licht} stopOpacity={0.7} />
        <stop offset={1} stopColor={P.licht} stopOpacity={0} />
      </radialGradient>
    </defs>
  );
}

const f = (p: Pt) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
const hash = (a: number, b: number) => {
  const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return v - Math.floor(v);
};
const mix = (a: Pt, b: Pt, t: number): Pt => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];

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

/** The drawing kit for one origin (ox, oy) and the gradients of `<IsoVerlaeufe id={v}>`. Each part returns a <g>. */
export function isoStift(ox: number, oy: number, v: string) {
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
  const url = (n: string) => `url(#${v}-${n})`;

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

  /** Depth on both visible faces: darker toward the ground, the right face darker, a light top edge. */
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
          P3(x, y + d, z),
          P3(x + w, y + d, z),
          P3(x + w, y + d, z + h),
          P3(x, y + d, z + h),
        ],
        url("ao"),
      )}
      {poly(
        [
          P3(x + w, y, z),
          P3(x + w, y + d, z),
          P3(x + w, y + d, z + h),
          P3(x + w, y, z + h),
        ],
        url("aoR"),
      )}
      {linie(P3(x, y + d, z + h), P3(x + w, y + d, z + h), P.weiss, 2, 0.35)}
    </g>
  );

  /** Shadow band below an edge (eaves, jetty) on both visible faces, `k` high. */
  const band = (
    x: number,
    y: number,
    z: number,
    w: number,
    d: number,
    k = 12,
  ) => (
    <g>
      {poly(
        [
          P3(x, y + d, z),
          P3(x + w, y + d, z),
          P3(x + w, y + d, z - k),
          P3(x, y + d, z - k),
        ],
        url("traufe"),
      )}
      {poly(
        [
          P3(x + w, y, z),
          P3(x + w, y + d, z),
          P3(x + w, y + d, z - k),
          P3(x + w, y, z - k),
        ],
        url("traufe"),
      )}
    </g>
  );

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

  /** Steep gable roof, ridge along x. Visible: the front slope and the right gable (timbered when `fach`). */
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
        {poly(giebel, P.putzTief)}
        {poly(giebel, url("aoR"))}
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
        {poly(vorn, url("dach"))}
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
        {poly([l, vv, sp], url("dachT"))}
        {poly([vv, r, sp], c.seite)}
        {poly([vv, r, sp], url("dachT"))}
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

  return {
    P3,
    poly,
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
    url,
  };
}
export type IsoStift = ReturnType<typeof isoStift>;
