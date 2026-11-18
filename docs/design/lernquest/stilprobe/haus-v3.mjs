// Stilprobe 3: mittelalterliches Haus in 2.5D-Vektor (isometrisch). Haus und alle Anbauten aus denselben Bauteilen:
// Steinsockel, Fachwerk, Schuppenziegel, Holz. Aufruf: node haus-v3.mjs out.svg
import { writeFileSync } from 'node:fs';

let glows = [];
const defs = [];
let n = 0;
const uid = (p) => `${p}${++n}`;
const lin = (s, x2 = 0, y2 = 1) => { const i = uid('l'); defs.push(`<linearGradient id="${i}" x1="0" y1="0" x2="${x2}" y2="${y2}">${s.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`); return `url(#${i})`; };
const hash = (a, b) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); };

// Materialien: je Fläche oben / links (Licht) / rechts (Schatten), dazu Linienfarben.
const M = {
  stein: { top: '#c9cdd3', links: '#aab1bb', rechts: '#858d99', fuge: '#6c7380', hell: '#c3c9d1' },
  putz: { top: '#fff1cf', links: '#f6e3b4', rechts: '#d9c08a' },
  balken: '#5a3519', balkenR: '#47290f', balkenHell: '#7a4b26',
  holz: { top: '#b67a45', links: '#9a6234', rechts: '#7a4b26' },
  ziegel: { vorn: '#c9553f', seite: '#9e3d2e', kante: '#7d2c22', licht: '#e98a6f' },
  tuer: '#6b3f1f', tuerHell: '#8a5530', eisen: '#3a3a44',
};

function iso(ox, oy) {
  const P = (x, y, z = 0) => [ox + (x - y) * 0.866, oy + (x + y) * 0.5 - z];
  const f = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
  const poly = (pts, c, extra = '') => `<polygon points="${pts.map(f).join(' ')}" fill="${c}" ${extra}/>`;
  const line = (a, b, c, w = 2, o = 1) => `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" opacity="${o}"/>`;
  const box = (x, y, z, w, d, h, c) => poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], c.top) +
    poly([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], c.links) +
    poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], c.rechts);

  // Bruchstein auf beiden sichtbaren Seiten eines Kastens.
  const steine = (x, y, z, w, d, h) => {
    let s = '';
    const reihe = 8;
    for (let r = 0, zz = z + 1.5; zz < z + h - 2; r++, zz += reihe) {
      const hh = Math.min(reihe - 2, z + h - 1 - zz);
      for (let xx = x + (r % 2 ? 5 : 1); xx < x + w - 3; xx += 11) {
        const ww = Math.min(9, x + w - 1 - xx), k = hash(xx, zz);
        s += poly([P(xx, y + d, zz), P(xx + ww, y + d, zz), P(xx + ww, y + d, zz + hh), P(xx, y + d, zz + hh)], k > 0.6 ? M.stein.hell : M.stein.links, `stroke="${M.stein.fuge}" stroke-width="1.2" stroke-linejoin="round"`);
      }
      for (let yy = y + (r % 2 ? 1 : 5); yy < y + d - 3; yy += 11) {
        const dd = Math.min(9, y + d - 1 - yy), k = hash(yy, zz + 7);
        s += poly([P(x + w, yy, zz), P(x + w, yy + dd, zz), P(x + w, yy + dd, zz + hh), P(x + w, yy, zz + hh)], k > 0.6 ? M.stein.links : M.stein.rechts, `stroke="${M.stein.fuge}" stroke-width="1.2" stroke-linejoin="round"`);
      }
    }
    return s;
  };

  // Fachwerk auf der linken Seite (Ebene y = Y) und der rechten Seite (Ebene x = X).
  const fachL = (x0, x1, Y, z0, z1, feld = 22) => {
    let s = line(P(x0, Y, z0), P(x1, Y, z0), M.balken, 4) + line(P(x0, Y, z1), P(x1, Y, z1), M.balken, 4);
    const k = Math.max(1, Math.round((x1 - x0) / feld));
    for (let i = 0; i <= k; i++) { const xx = x0 + ((x1 - x0) * i) / k; s += line(P(xx, Y, z0), P(xx, Y, z1), M.balken, 4); }
    const a = x0 + (x1 - x0) / k, b = x1 - (x1 - x0) / k;
    s += line(P(x0, Y, z0), P(a, Y, z1), M.balken, 3.5) + line(P(x1, Y, z0), P(b, Y, z1), M.balken, 3.5);
    return s;
  };
  const fachR = (X, y0, y1, z0, z1, feld = 22) => {
    let s = line(P(X, y0, z0), P(X, y1, z0), M.balkenR, 4) + line(P(X, y0, z1), P(X, y1, z1), M.balkenR, 4);
    const k = Math.max(1, Math.round((y1 - y0) / feld));
    for (let i = 0; i <= k; i++) { const yy = y0 + ((y1 - y0) * i) / k; s += line(P(X, yy, z0), P(X, yy, z1), M.balkenR, 4); }
    s += line(P(X, y0, z0), P(X, y0 + (y1 - y0) / k, z1), M.balkenR, 3.5) + line(P(X, y1, z0), P(X, y1 - (y1 - y0) / k, z1), M.balkenR, 3.5);
    return s;
  };

  // Schuppenziegel: Bögen entlang einer Reihe von a nach b (Bildschirmpunkte).
  const schuppen = (a, b, schritte, c, w = 1.8) => {
    let d = '';
    for (let i = 0; i < schritte; i++) {
      const p = [a[0] + ((b[0] - a[0]) * i) / schritte, a[1] + ((b[1] - a[1]) * i) / schritte];
      const q = [a[0] + ((b[0] - a[0]) * (i + 1)) / schritte, a[1] + ((b[1] - a[1]) * (i + 1)) / schritte];
      const r = Math.hypot(q[0] - p[0], q[1] - p[1]) * 0.55;
      d += `M${f(p)} A${r.toFixed(1)} ${r.toFixed(1)} 0 0 0 ${f(q)} `;
    }
    return `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
  };

  // Steiles Satteldach, First in x-Richtung; sichtbar: vordere Fläche und rechter Giebel.
  const satteldach = (x, y, z, w, d, h, o = 7, giebelFach = true) => {
    const m = y + d / 2;
    const E = (t, xx) => P(xx, m + (y + d + o - m) * t, z + h + (-3 - h) * t);
    let s = poly([P(x - o, y - o, z - 3), P(x + w + o, y - o, z - 3), P(x + w + o, m, z + h), P(x - o, m, z + h)], M.ziegel.seite);
    s += poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, m, z + h)], M.putz.rechts);
    if (giebelFach) {
      s += line(P(x + w, y, z), P(x + w, m, z + h), M.balkenR, 4) + line(P(x + w, y + d, z), P(x + w, m, z + h), M.balkenR, 4);
      s += line(P(x + w, m, z), P(x + w, m, z + h), M.balkenR, 4) + line(P(x + w, y + d * 0.25, z + h * 0.5), P(x + w, y + d * 0.75, z + h * 0.5), M.balkenR, 3.5);
      const fz = z + h * 0.18, fh = h * 0.22;
      s += poly([P(x + w, m - 6, fz), P(x + w, m + 6, fz), P(x + w, m + 6, fz + fh), P(x + w, m - 6, fz + fh)], M.balkenR) + `__FENSTER_GIEBEL_${f(P(x + w, m, fz + fh / 2))}__`;
    }
    s += poly([E(1, x - o), E(1, x + w + o), E(0, x + w + o), E(0, x - o)], M.ziegel.vorn);
    const reihen = Math.round(h / 7);
    const stueck = Math.round((w + 2 * o) / 7.5);
    for (let i = 1; i <= reihen; i++) { const t = i / reihen; s += schuppen(E(t, x - o), E(t, x + w + o), stueck, M.ziegel.kante); }
    s += line(E(0, x - o), E(0, x + w + o), M.ziegel.licht, 4) + line(E(0, x - o), E(1, x - o), M.balken, 4) + line(E(1, x - o), E(1, x + w + o), M.balken, 3);
    s += line(P(x + w + o, y - o, z - 3), P(x + w + o, m, z + h), M.balken, 4) + line(P(x + w + o, m, z + h), E(1, x + w + o), M.balken, 4);
    return s;
  };

  // Steiles Zeltdach (Turm). Sichtbar: vordere und rechte Fläche.
  const zeltdach = (x, y, z, w, d, h, o = 6) => {
    const sp = P(x + w / 2, y + d / 2, z + h);
    const l = P(x - o, y + d + o, z - 2), v = P(x + w + o, y + d + o, z - 2), r = P(x + w + o, y - o, z - 2);
    const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    let s = poly([l, v, sp], M.ziegel.vorn) + poly([v, r, sp], M.ziegel.seite);
    const reihen = Math.round(h / 8);
    for (let i = 1; i < reihen; i++) {
      const t = i / reihen;
      const st = Math.max(1, Math.round(((1 - t) * (w + 2 * o)) / 7.5));
      s += schuppen(mix(sp, l, t), mix(sp, v, t), st, M.ziegel.kante) + schuppen(mix(sp, v, t), mix(sp, r, t), st, '#6a241b');
    }
    s += line(l, v, M.balken, 3) + line(v, r, M.balken, 3) + line(v, sp, M.ziegel.licht, 3.5) + line(l, sp, M.balken, 3.5) + line(r, sp, M.balken, 3.5);
    s += line(sp, [sp[0], sp[1] - 22], M.eisen, 3) + `<path d="M${sp[0]} ${sp[1] - 22} l16 5 -16 6Z" fill="#e8b23a"/>`;
    return s;
  };

  // Fenster mit Sprossen und Läden, links (Ebene y = Y) oder rechts (Ebene x = X).
  const fenster = (seite, a, E, z, b, h, abend) => {
    const Q = seite === 'L' ? (u, zz) => P(u, E, zz) : (u, zz) => P(E, u, zz);
    const rahmen = seite === 'L' ? M.balken : M.balkenR;
    const glas = abend ? '#ffd27a' : '#5d7d96';
    let s = poly([Q(a - 2, z - 2), Q(a + b + 2, z - 2), Q(a + b + 2, z + h + 2), Q(a - 2, z + h + 2)], rahmen);
    s += poly([Q(a, z), Q(a + b, z), Q(a + b, z + h), Q(a, z + h)], glas);
    s += line(Q(a + b / 2, z), Q(a + b / 2, z + h), rahmen, 2) + line(Q(a, z + h / 2), Q(a + b, z + h / 2), rahmen, 2);
    s += poly([Q(a - 2 - b * 0.45, z - 1), Q(a - 3, z - 1), Q(a - 3, z + h + 1), Q(a - 2 - b * 0.45, z + h + 1)], seite === 'L' ? M.holz.links : M.holz.rechts);
    if (abend) { const c = Q(a + b / 2, z + h / 2); glows.push(`<circle cx="${c[0].toFixed(1)}" cy="${(c[1] + 6).toFixed(1)}" r="${b * 2.4}" fill="url(#fenster)"/>`); }
    return s;
  };

  // Rundbogentür auf der linken Seite.
  const tuer = (a, Y, z, b, h) => {
    const bogen = (r0, inset) => { const pts = [P(a + inset, Y, z), P(a + b - inset, Y, z)]; for (let i = 0; i <= 8; i++) { const t = (i / 8) * Math.PI; pts.push(P(a + b / 2 + Math.cos(t) * (b / 2 - inset), Y, z + h - b / 2 + Math.sin(t) * r0)); } return pts; };
    let s = poly(bogen(b / 2 + 3, -3), M.stein.rechts) + poly(bogen(b / 2, 0), M.tuer);
    for (let i = 1; i < 3; i++) s += line(P(a + (b * i) / 3, Y, z + 1), P(a + (b * i) / 3, Y, z + h - 3), M.tuerHell, 2);
    s += line(P(a + 2, Y, z + h * 0.3), P(a + b - 2, Y, z + h * 0.3), M.eisen, 2.5) + line(P(a + 2, Y, z + h * 0.65), P(a + b - 2, Y, z + h * 0.65), M.eisen, 2.5);
    const k = P(a + b - 4, Y, z + h * 0.45); s += `<circle cx="${k[0].toFixed(1)}" cy="${k[1].toFixed(1)}" r="2.2" fill="#e8b23a"/>`;
    return s;
  };
  return { P, poly, line, box, steine, fachL, fachR, satteldach, zeltdach, fenster, tuer };
}

// --- Bausatz: Grundhaus und Anbauten (alle aus denselben Bauteilen) ---
function grundhaus(t, abend) {
  const { P, box, steine, fachL, fachR, satteldach, fenster, tuer, line } = t;
  let s = '';
  s += box(0, 0, 0, 100, 76, 44, M.stein) + steine(0, 0, 0, 100, 76, 44);
  s += tuer(18, 76, 2, 20, 34) + fenster('L', 60, 76, 16, 14, 14, abend) + fenster('R', 30, 100, 16, 14, 14, abend);
  // Vorkragendes Obergeschoss mit Balkenköpfen.
  for (let xx = 4; xx < 100; xx += 12) s += box(xx, 76, 41, 4, 5, 4, M.holz);
  for (let yy = 4; yy < 76; yy += 12) s += box(100, yy, 41, 5, 4, 4, M.holz);
  s += box(-2, -2, 45, 106, 82, 40, M.putz);
  s += fachL(-2, 104, 80, 45, 85) + fachR(104, -2, 80, 45, 85);
  s += fenster('L', 10, 80, 56, 12, 16, abend) + fenster('L', 76, 80, 56, 12, 16, abend) + fenster('R', 18, 104, 56, 12, 16, abend) + fenster('R', 52, 104, 56, 12, 16, abend);
  s += satteldach(-2, -2, 85, 106, 82, 64);
  s += box(66, 10, 120, 13, 13, 44, M.stein) + box(64, 8, 162, 17, 17, 5, M.stein);
  if (!abend) { const r = P(72, 16, 176); s += `<circle cx="${r[0] + 4}" cy="${r[1] - 6}" r="6" fill="#fff" opacity="0.75"/><circle cx="${r[0] + 12}" cy="${r[1] - 20}" r="9" fill="#fff" opacity="0.55"/>`; }
  return s;
}

function turm(t, x, y, abend) {
  const { box, steine, fachL, fachR, zeltdach, fenster } = t;
  let s = box(x, y, 0, 38, 38, 104, M.stein) + steine(x, y, 0, 38, 38, 104);
  s += fenster('L', x + 13, y + 38, 30, 11, 16, abend) + fenster('R', y + 13, x + 38, 64, 11, 16, abend);
  s += box(x - 3, y - 3, 104, 44, 44, 30, M.putz) + fachL(x - 3, x + 41, y + 41, 104, 134, 15) + fachR(x + 41, y - 3, y + 41, 104, 134, 15);
  s += fenster('L', x + 14, y + 41, 112, 12, 14, abend);
  s += zeltdach(x - 3, y - 3, 134, 44, 44, 70);
  return s;
}

function werkstatt(t, x, y, abend) {
  const { P, poly, box, steine, fachL, fenster, line } = t;
  let s = box(x, y, 0, 46, 56, 14, M.stein) + steine(x, y, 0, 46, 56, 14);
  s += box(x, y, 14, 46, 56, 28, M.putz) + fachL(x, x + 46, y + 56, 14, 42, 23) + fenster('L', x + 14, y + 56, 20, 14, 13, abend);
  // Pultdach aus denselben Ziegeln, hoch an der Hauswand (x + 46), tief außen.
  const a = P(x - 5, y - 4, 40), d = P(x - 5, y + 62, 40), b = P(x + 46, y - 4, 66), c = P(x + 46, y + 62, 66);
  s += poly([a, b, c, d], M.ziegel.vorn);
  for (let i = 1; i <= 5; i++) { const tt = i / 5; const l = [b[0] + (a[0] - b[0]) * tt, b[1] + (a[1] - b[1]) * tt], r = [c[0] + (d[0] - c[0]) * tt, c[1] + (d[1] - c[1]) * tt]; s += `<path d="${bogenreihe(l, r, 8)}" fill="none" stroke="${M.ziegel.kante}" stroke-width="1.8"/>`; }
  s += line(a, d, M.ziegel.licht, 3) + line(d, c, M.balken, 3.5) + line(a, b, M.balken, 3);
  // Holzstapel davor.
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3 - i; j++) { const p = P(x + 6 + j * 9 + i * 4.5, y + 66, 4 + i * 7); s += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4.6" fill="#c9915a" stroke="${M.balken}" stroke-width="1.6"/>`; }
  return s;
}
function bogenreihe(a, b, k) {
  let d = '';
  for (let i = 0; i < k; i++) {
    const p = [a[0] + ((b[0] - a[0]) * i) / k, a[1] + ((b[1] - a[1]) * i) / k], q = [a[0] + ((b[0] - a[0]) * (i + 1)) / k, a[1] + ((b[1] - a[1]) * (i + 1)) / k];
    const r = (Math.hypot(q[0] - p[0], q[1] - p[1]) * 0.55).toFixed(1);
    d += `M${p[0].toFixed(1)},${p[1].toFixed(1)} A${r} ${r} 0 0 0 ${q[0].toFixed(1)},${q[1].toFixed(1)} `;
  }
  return d;
}

function brunnen(t, x, y) {
  const { P, poly, box, steine, line, satteldach } = t;
  let s = box(x, y, 0, 26, 26, 14, M.stein) + steine(x, y, 0, 26, 26, 14);
  s += poly([P(x + 3, y + 3, 14), P(x + 23, y + 3, 14), P(x + 23, y + 23, 14), P(x + 3, y + 23, 14)], '#2d4a6b');
  s += line(P(x + 2, y + 13, 14), P(x + 2, y + 13, 44), M.balken, 4) + line(P(x + 24, y + 13, 14), P(x + 24, y + 13, 44), M.balkenR, 4);
  s += line(P(x + 2, y + 13, 34), P(x + 24, y + 13, 34), M.balkenHell, 3) + line(P(x + 13, y + 13, 34), P(x + 13, y + 13, 24), '#8a7a5a', 1.5);
  s += box(x + 10, y + 10, 18, 6, 6, 6, M.holz);
  s += satteldach(x - 2, y + 1, 44, 30, 24, 16, 4, false);
  return s;
}

function zaun(t, x0, x1, Y) {
  const { P, line } = t;
  let s = '';
  for (let xx = x0; xx <= x1; xx += 14) s += line(P(xx, Y, 0), P(xx, Y, 18), M.balken, 4.5);
  s += line(P(x0, Y, 13), P(x1, Y, 13), M.holz.links, 4) + line(P(x0, Y, 6), P(x1, Y, 6), M.holz.links, 4);
  return s;
}

function laterne(t, x, y, abend) {
  const { P, line, poly } = t;
  let s = line(P(x, y, 0), P(x, y, 50), M.eisen, 4) + line(P(x, y, 50), P(x + 10, y, 50), M.eisen, 3);
  const k = P(x + 10, y, 42);
  s += `<rect x="${(k[0] - 5).toFixed(1)}" y="${(k[1] - 8).toFixed(1)}" width="10" height="13" rx="2" fill="${abend ? '#ffd27a' : '#cfc6a8'}" stroke="${M.eisen}" stroke-width="2.5"/>`;
  s += poly([[k[0] - 7, k[1] - 8], [k[0] + 7, k[1] - 8], [k[0], k[1] - 14]], M.eisen);
  if (abend) glows.push(`<circle cx="${k[0].toFixed(1)}" cy="${(k[1] + 18).toFixed(1)}" r="70" fill="url(#lampe)"/>`);
  return s;
}

function garten(t, x, y) {
  const { P, poly, box } = t;
  let s = box(x, y, 0, 40, 18, 5, M.holz);
  s += poly([P(x + 2, y + 2, 5), P(x + 38, y + 2, 5), P(x + 38, y + 16, 5), P(x + 2, y + 16, 5)], '#6b4a2e');
  for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) { const p = P(x + 6 + i * 7, y + 5 + j * 7, 9); s += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.4" fill="${(i + j) % 2 ? '#5aae45' : '#3f8f35'}"/>` + (j ? `<circle cx="${p[0].toFixed(1)}" cy="${(p[1] - 3).toFixed(1)}" r="1.8" fill="${['#ff7aa8', '#ffd34d', '#c58cff'][i % 3]}"/>` : ''); }
  return s;
}

function szene(ox, oy, voll, abend) {
  const t = iso(ox, oy);
  const { P, poly } = t;
  let s = '';
  const g = [P(-70, -40), P(190, -40), P(190, 160), P(-70, 160)];
  s += poly(g.map(([a, b]) => [a, b + 10]), '#4f8f30') + poly(g, lin([[0, '#9ccf66'], [1, '#7cbc4c']]));
  s += poly([P(18, 80), P(38, 80), P(38, 160), P(18, 160)], '#d8c9a8') + [0, 1, 2, 3, 4].map((i) => poly([P(20, 86 + i * 15), P(36, 86 + i * 15), P(36, 96 + i * 15), P(20, 96 + i * 15)], '#c4b48f')).join('');
  s += poly([P(0, 0), P(100, 0), P(118, 18), P(118, 92), P(18, 92), P(0, 76)].map(([a, b]) => [a + 6, b + 4]), '#24401a', 'opacity="0.2"');
  if (voll) s += werkstatt(t, -46, 14, abend);
  s += grundhaus(t, abend);
  if (voll) {
    s += turm(t, 112, 4, abend);
    s += garten(t, 58, 104);
    s += brunnen(t, 132, 86);
    s += zaun(t, -60, 10, 150) + zaun(t, 46, 180, 150);
    s += laterne(t, 44, 128, abend);
  }
  return s;
}

function panel(x, titel, voll, abend) {
  glows = [];
  const himmel = abend ? lin([[0, '#1d2b5c'], [0.6, '#4f4688'], [1, '#e89a5a']]) : lin([[0, '#bfe7ff'], [1, '#eaf8ff']]);
  let inhalt = szene(250, 250, voll, abend);
  inhalt = inhalt.replace(/__FENSTER_GIEBEL_([\d.]+),([\d.]+)__/g, (_, a, b) => { if (abend) glows.push(`<circle cx="${a}" cy="${(+b + 6).toFixed(1)}" r="30" fill="url(#fenster)"/>`); return ''; });
  const sterne = abend ? Array.from({ length: 22 }, (_, i) => `<circle cx="${(i * 97) % 360 + 10}" cy="${(i * 53) % 150 + 20}" r="${i % 3 ? 1.4 : 2.3}" fill="#fff" opacity="0.8"/>`).join('') : '';
  return `<g transform="translate(${x} 0)"><rect width="380" height="440" rx="24" fill="${himmel}"/>${sterne}
  <g transform="translate(-55 25) scale(0.78)">${inhalt}</g>
  ${abend ? '<rect width="380" height="440" rx="24" fill="#0f1a45" opacity="0.36"/>' + `<g transform="translate(-55 25) scale(0.78)">${glows.join('')}</g>` : ''}
  <text x="22" y="40" font-family="Nunito, sans-serif" font-weight="800" font-size="20" fill="${abend ? '#fff' : '#2d3a1f'}">${titel}</text></g>`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1180 470" width="1180" height="470"><rect width="1180" height="470" fill="#fdf6ea"/>
${panel(15, 'Grundhaus', false, false)}${panel(400, 'Ausgebaut (Tag)', true, false)}${panel(785, 'Ausgebaut (Abend)', true, true)}
<defs>${defs.join('')}<radialGradient id="fenster"><stop offset="0" stop-color="#ffcf6b" stop-opacity="0.7"/><stop offset="1" stop-color="#ffcf6b" stop-opacity="0"/></radialGradient><radialGradient id="lampe"><stop offset="0" stop-color="#ffd27a" stop-opacity="0.7"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs></svg>`;
writeFileSync(process.argv[2], svg);
