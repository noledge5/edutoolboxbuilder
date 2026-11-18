// Stilprobe 2: modulares Haus schräg von oben (isometrisch), Tag und Abend, Duolingo-artige Figur.
import { writeFileSync } from 'node:fs';
let glows = [];
let n = 0; const uid = (p) => `${p}${++n}`; const defs = [];
const lin = (s, x2 = 0, y2 = 1) => { const i = uid('l'); defs.push(`<linearGradient id="${i}" x1="0" y1="0" x2="${x2}" y2="${y2}">${s.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`); return `url(#${i})`; };
const rad = (s) => { const i = uid('r'); defs.push(`<radialGradient id="${i}">${s.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</radialGradient>`); return `url(#${i})`; };
const S = 1;
function iso(ox, oy) {
  const P = (x, y, z = 0) => [ox + (x - y) * 0.866 * S, oy + (x + y) * 0.5 * S - z * S];
  const poly = (pts, f, extra = '') => `<polygon points="${pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ')}" fill="${f}" ${extra}/>`;
  const line = (a, b, c, w = 2, o = 1) => `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" opacity="${o}"/>`;
  // Kasten: sichtbar sind Deckel, Vorderseite links (y = y+d) und rechts (x = x+w).
  const box = (x, y, z, w, d, h, c) => poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], c.top) +
    poly([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], c.links) +
    poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], c.rechts);
  // Satteldach in x-Richtung über einem Kasten (First in der Mitte von y), Überstand o.
  const dach = (x, y, z, w, d, h, c, o = 6, ziegel = true) => {
    const m = y + d / 2;
    const vorn = [P(x - o, y + d + o, z - 2), P(x + w + o, y + d + o, z - 2), P(x + w + o, m, z + h), P(x - o, m, z + h)];
    const giebel = [P(x + w, y, z), P(x + w, y + d, z), P(x + w, m, z + h)];
    const hinten = [P(x - o, y - o, z - 2), P(x + w + o, y - o, z - 2), P(x + w + o, m, z + h), P(x - o, m, z + h)];
    let s = poly(hinten, c.tief) + poly(giebel, c.wand) + poly(vorn, c.dach);
    if (ziegel) for (let i = 1; i < 6; i++) { const t = i / 6; const a = P(x - o, m + (y + d + o - m) * t, z + h + (-2 - h) * t); const b = P(x + w + o, m + (y + d + o - m) * t, z + h + (-2 - h) * t); s += line(a, b, c.linie, 2.5, 0.5); }
    for (let i = 1; i < Math.floor((w + 2 * o) / 9); i++) { const xx = x - o + i * 9; s += line(P(xx, m, z + h), P(xx, y + d + o, z - 2), c.linie, 1.5, 0.25); }
    s += line(P(x - o, m, z + h), P(x + w + o, m, z + h), c.licht, 4, 0.9);
    return s;
  };
  // Fenster auf der linken Vorderseite (Ebene y = yy) bei x, Höhe z.
  const fensterL = (x, yy, z, w, h, licht, glas) => poly([P(x - 2, yy, z - 2), P(x + w + 2, yy, z - 2), P(x + w + 2, yy, z + h + 2), P(x - 2, yy, z + h + 2)], '#6b4226') +
    poly([P(x, yy, z), P(x + w, yy, z), P(x + w, yy, z + h), P(x, yy, z + h)], glas) + line(P(x + w / 2, yy, z), P(x + w / 2, yy, z + h), '#6b4226', 2) + line(P(x, yy, z + h / 2), P(x + w, yy, z + h / 2), '#6b4226', 2) +
    (licht ? (glows.push(`<circle cx="${P(x + w / 2, yy, z + h / 2)[0]}" cy="${P(x + w / 2, yy, z + h / 2)[1] + 6}" r="${w * 2.2}" fill="url(#fenster)"/>`), '') : '');
  const fensterR = (xx, y, z, d, h, licht, glas) => poly([P(xx, y - 2, z - 2), P(xx, y + d + 2, z - 2), P(xx, y + d + 2, z + h + 2), P(xx, y - 2, z + h + 2)], '#5b3415') +
    poly([P(xx, y, z), P(xx, y + d, z), P(xx, y + d, z + h), P(xx, y, z + h)], glas) + line(P(xx, y + d / 2, z), P(xx, y + d / 2, z + h), '#5b3415', 2) +
    (licht ? (glows.push(`<circle cx="${P(xx, y + d / 2, z + h / 2)[0]}" cy="${P(xx, y + d / 2, z + h / 2)[1] + 6}" r="${d * 2}" fill="url(#fenster)"/>`), '') : '');
  return { P, poly, line, box, dach, fensterL, fensterR };
}

// Duolingo-artige Figur: runde Formen, flach, keine Umrisse, Pillenschatten.
function kind(x, y, s = 1, abend = false) {
  const haut = '#f2c29b', hautT = '#e0a77c';
  return `<g transform="translate(${x} ${y}) scale(${s})">
  <rect x="-20" y="-5" width="40" height="10" rx="5" fill="#000" opacity="0.18"/>
  <rect x="-12" y="-26" width="9" height="24" rx="4.5" fill="#3b4a8c"/><rect x="3" y="-26" width="9" height="24" rx="4.5" fill="#2f3c75"/>
  <rect x="-14" y="-4" width="12" height="7" rx="3.5" fill="#fff"/><rect x="2" y="-4" width="12" height="7" rx="3.5" fill="#e8e8f0"/>
  <rect x="-18" y="-58" width="36" height="38" rx="14" fill="#58cc02"/><rect x="2" y="-58" width="16" height="38" rx="10" fill="#46a302"/>
  <rect x="-26" y="-54" width="10" height="26" rx="5" fill="#58cc02"/><circle cx="-21" cy="-27" r="5" fill="${haut}"/>
  <rect x="16" y="-54" width="10" height="26" rx="5" fill="#46a302"/><circle cx="21" cy="-27" r="5" fill="${hautT}"/>
  <rect x="-6" y="-64" width="12" height="9" rx="4" fill="${hautT}"/>
  <circle cx="0" cy="-86" r="26" fill="${haut}"/><path d="M0 -112 a26 26 0 0 1 26 26 a26 26 0 0 1 -6 16 a24 24 0 0 0 -20 -42z" fill="${hautT}" opacity="0.5"/>
  <path d="M-27 -88 C -28 -116 26 -122 27 -94 C 18 -104 4 -106 -8 -98 C -14 -96 -22 -92 -27 -88 Z" fill="#6b3f1f"/>
  <circle cx="-16" cy="-102" r="9" fill="#6b3f1f"/><circle cx="-4" cy="-110" r="9" fill="#6b3f1f"/><circle cx="12" cy="-108" r="9" fill="#7d4a25"/>
  <rect x="-13" y="-92" width="9" height="13" rx="4.5" fill="#2b2b3a"/><rect x="5" y="-92" width="9" height="13" rx="4.5" fill="#2b2b3a"/>
  <circle cx="-7" cy="-88" r="2.2" fill="#fff"/><circle cx="11" cy="-88" r="2.2" fill="#fff"/>
  <circle cx="-17" cy="-75" r="5" fill="#ff9a9a" opacity="0.6"/><circle cx="17" cy="-75" r="5" fill="#ff9a9a" opacity="0.6"/>
  <path d="M-8 -73 Q2 -64 11 -74 Q2 -70 -8 -73Z" fill="#a33b3b"/>
  ${abend ? '<rect x="22" y="-46" width="3" height="16" rx="1.5" fill="#6b4226"/><rect x="17" y="-34" width="13" height="14" rx="4" fill="#ffd27a"/><circle cx="23" cy="-27" r="22" fill="url(#lampe)"/>' : ''}
  </g>`;
}

function haus(ox, oy, voll, abend) {
  const { P, poly, line, box, dach, fensterL, fensterR } = iso(ox, oy);
  const glas = abend ? lin([[0, '#fff3b0'], [1, '#ffb347']]) : lin([[0, '#d9f3ff'], [1, '#8ccdf0']]);
  const holz = { top: '#c99258', links: '#b98049', rechts: '#8f5c33' };
  const putz = { top: '#fff3d6', links: '#fbe9c4', rechts: '#e2c99a' };
  const stein = { top: '#d9d4c7', links: '#c4beb0', rechts: '#a39d8f' };
  const rot = { dach: lin([[0, '#f07a6a'], [1, '#c94a43']]), tief: '#9e3532', wand: '#e2c99a', linie: '#8f2f2b', licht: '#ffb3a6' };
  const blau = { dach: lin([[0, '#6fb3f2'], [1, '#2f6fbf']]), tief: '#24578f', wand: '#c4beb0', linie: '#1f4f88', licht: '#bfe0ff' };
  let s = '';
  // Grundstück: Rasen-Raute mit Kante.
  const g = [P(-50, -50), P(185, -50), P(185, 175), P(-50, 175)];
  s += poly(g.map(([a, b]) => [a, b + 10]), '#4f9a34') + poly(g, lin([[0, '#9ad46a'], [1, '#78c050']]));
  // Weg zur Tür.
  s += poly([P(30, 90), P(52, 90), P(52, 175), P(30, 175)], '#f5e2b8') + [0, 1, 2, 3].map((i) => poly([P(33, 96 + i * 14), P(49, 96 + i * 14), P(49, 106 + i * 14), P(33, 106 + i * 14)], '#e8cf9c')).join('');
  // Schatten.
  s += poly([P(0, 0), P(110, 0), P(130, 20), P(130, 100), P(20, 100), P(0, 80)].map(([a, b]) => [a + 8, b + 6]), '#2d4a1a', 'opacity="0.18"');
  if (voll) {
    // Anbau rechts hinten (Werkstatt, Stein) mit Pultdach.
    s += box(110, 10, 0, 50, 55, 46, stein);
    s += poly([P(106, 6, 50), P(164, 6, 50), P(164, 69, 38), P(106, 69, 38)], blau.dach) + line(P(106, 6, 50), P(164, 6, 50), blau.licht, 3);
    s += fensterR(160, 24, 14, 22, 18, abend, glas);
    for (let i = 0; i < 4; i++) s += line(P(160, 12 + i * 14, 4), P(160, 18 + i * 14, 4), '#8a8478', 3, 0.6);
  }
  // Haupthaus: Steinsockel, Putz-Erdgeschoss, Fachwerk-Obergeschoss.
  s += box(0, 0, 0, 110, 90, 10, stein);
  s += box(0, 0, 10, 110, 90, 52, putz);
  s += box(-3, -3, 62, 116, 96, 44, holz);
  // Fachwerkbalken (links vorn und rechts).
  const yv = 93;
  for (const xx of [-3, 26, 55, 84, 113]) s += line(P(xx, yv, 62), P(xx, yv, 106), '#6b4226', 4);
  s += line(P(-3, yv, 84), P(113, yv, 84), '#6b4226', 3) + line(P(-3, yv, 62), P(26, yv, 84), '#6b4226', 3) + line(P(84, yv, 84), P(113, yv, 106), '#6b4226', 3);
  for (const yy of [-3, 30, 60, 93]) s += line(P(113, yy, 62), P(113, yy, 106), '#4f2f17', 4);
  // Tür mit Vordach und Lampe.
  s += poly([P(30, 90, 10), P(52, 90, 10), P(52, 90, 46), P(30, 90, 46)], '#6b3f1f') + poly([P(32, 90, 12), P(50, 90, 12), P(50, 90, 44), P(32, 90, 44)], '#7d4a25');
  s += `<circle cx="${P(47, 90, 28)[0]}" cy="${P(47, 90, 28)[1]}" r="2.5" fill="#f2c14e"/>`;
  s += poly([P(26, 90, 50), P(56, 90, 50), P(56, 104, 44), P(26, 104, 44)], rot.dach);
  const lampe = P(60, 90, 40);
  s += `<rect x="${lampe[0] - 4}" y="${lampe[1] - 6}" width="8" height="11" rx="3" fill="${abend ? '#ffd27a' : '#e8e1c8'}"/>` + (abend ? (glows.push(`<circle cx="${lampe[0]}" cy="${lampe[1] + 20}" r="70" fill="url(#lampe)"/>`), '') : '');
  // Fenster.
  s += fensterL(68, 90, 22, 24, 22, abend, glas) + fensterL(4, 93, 72, 18, 18, abend, glas) + fensterL(64, 93, 72, 18, 18, abend, glas);
  s += fensterR(110, 18, 22, 26, 22, abend, glas) + fensterR(113, 52, 72, 22, 20, abend, glas);
  // Blumenkasten.
  s += poly([P(66, 92, 18), P(94, 92, 18), P(94, 92, 22), P(66, 92, 22)], '#8a5a33') + [70, 77, 84, 90].map((xx, i) => { const p = P(xx, 92, 24); return `<circle cx="${p[0]}" cy="${p[1]}" r="3.6" fill="${i % 2 ? '#ffd34d' : '#ff7aa8'}"/>`; }).join('');
  // Dach.
  s += dach(-3, -3, 106, 116, 96, 48, rot, 8);
  // Schornstein mit Rauch.
  s += box(70, 20, 128, 14, 14, 36, { top: '#8c4f36', links: '#b06a4a', rechts: '#8c4f36' });
  const r = P(77, 27, 170);
  s += abend ? '' : `<circle cx="${r[0] + 4}" cy="${r[1] - 6}" r="7" fill="#fff" opacity="0.7"/><circle cx="${r[0] + 12}" cy="${r[1] - 22}" r="10" fill="#fff" opacity="0.5"/>`;
  if (voll) {
    // Turm links vorn mit Kegeldach.
    const tx = -20, ty = 60;
    s += box(tx, ty, 0, 36, 36, 150, stein);
    for (let i = 1; i < 8; i++) s += line(P(tx + (i % 2 ? 6 : 20), ty + 36, i * 18), P(tx + (i % 2 ? 16 : 30), ty + 36, i * 18), '#a39d8f', 3, 0.7);
    s += fensterL(tx + 10, ty + 36, 110, 16, 22, abend, glas);
    const top = P(tx + 18, ty + 18, 150), spitze = P(tx + 18, ty + 18, 215);
    const l = P(tx - 6, ty + 42, 150), rr = P(tx + 42, ty - 6, 150), v = P(tx + 42, ty + 42, 150);
    s += poly([l, v, spitze], lin([[0, '#6fb3f2'], [1, '#2f6fbf']])) + poly([v, rr, spitze], '#24578f');
    s += `<line x1="${spitze[0]}" y1="${spitze[1]}" x2="${spitze[0]}" y2="${spitze[1] - 20}" stroke="#6b4226" stroke-width="3"/><path d="M${spitze[0]} ${spitze[1] - 20} l16 5 -16 6Z" fill="#ffd34d"/>`;
    // Balkon am Obergeschoss rechts.
    s += box(113, 30, 70, 14, 40, 4, { top: '#c99258', links: '#a8713f', rechts: '#8f5c33' });
    for (let i = 0; i <= 6; i++) s += line(P(127, 30 + i * 6.6, 74), P(127, 30 + i * 6.6, 88), '#8f5c33', 2.5);
    s += line(P(127, 30, 88), P(127, 70, 88), '#a8713f', 4);
    // Garten: Zaun, Beet, Baum.
    for (let i = 0; i <= 10; i++) s += line(P(80 + i * 8, 140, 0), P(80 + i * 8, 140, 16), '#fff', 4) ;
    s += line(P(78, 140, 10), P(162, 140, 10), '#f0f0f0', 3);
    s += poly([P(110, 108), P(160, 108), P(160, 128), P(110, 128)], '#8a5a33') + [0, 1, 2, 3, 4, 5].map((i) => { const p = P(116 + i * 8, 118, 6); return `<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="${['#ff7aa8', '#ffd34d', '#c58cff'][i % 3]}"/>`; }).join('');
  }
  return s;
}

function panel(x, titel, voll, abend) {
  const himmel = abend ? lin([[0, '#1d2b5c'], [0.6, '#5a4a8a'], [1, '#f2a65a']]) : lin([[0, '#bfe7ff'], [1, '#eaf8ff']]);
  return `<g transform="translate(${x} 0)">
  <rect width="560" height="620" rx="28" fill="${himmel}"/>
  ${abend ? Array.from({ length: 24 }, (_, i) => `<circle cx="${(i * 97) % 540 + 10}" cy="${(i * 53) % 200 + 20}" r="${i % 3 ? 1.5 : 2.5}" fill="#fff" opacity="0.8"/>`).join('') + '<circle cx="460" cy="80" r="26" fill="#fff4c9"/><circle cx="472" cy="72" r="24" fill="#3a3a70" opacity="0.9"/>' : '<ellipse cx="110" cy="80" rx="60" ry="18" fill="#fff"/><ellipse cx="140" cy="68" rx="34" ry="18" fill="#fff"/>'}
  ${(glows = [], '')}<g>${haus(260, 260, voll, abend)}</g>
  ${kind(178, 405, 0.62, abend)}
  ${abend ? '<rect width="560" height="620" rx="28" fill="#0f1a45" opacity="0.38" style="mix-blend-mode:multiply"/>' + glows.join('') + '<circle cx="190" cy="388" r="40" fill="url(#lampe)"/>' : ''}
  <text x="28" y="48" font-family="Nunito, sans-serif" font-weight="800" font-size="24" fill="${abend ? '#fff' : '#2d3a1f'}">${titel}</text></g>`;
}

// Module als Belohnungen (Icons).
const module = ['Turm', 'Anbau', 'Balkon', 'Garten', 'Laterne', 'Zaun'];
function icons(y) {
  return `<g transform="translate(0 ${y})"><text x="28" y="0" font-family="Nunito, sans-serif" font-weight="800" font-size="22" fill="#2d3a1f">Anbauten – auch aus Truhen</text>
  ${module.map((m, i) => `<g transform="translate(${28 + i * 186} 20)"><rect width="170" height="120" rx="22" fill="#fff8ec"/><rect width="170" height="120" rx="22" fill="none" stroke="${['#2459B8', '#13804A', '#6E6990', '#13804A', '#6A2FC4', '#6E6990'][i]}" stroke-width="4"/>
  <text x="85" y="104" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="800" font-size="17" fill="#3a2a18">${m}</text>
  <g transform="translate(85 62)">${[
    '<rect x="-14" y="-30" width="28" height="44" rx="4" fill="#c4beb0"/><rect x="2" y="-30" width="12" height="44" fill="#a39d8f"/><path d="M-20 -30 L0 -58 L20 -30Z" fill="#2f6fbf"/><path d="M0 -58 L20 -30 L4 -30Z" fill="#24578f"/><rect x="-5" y="-16" width="10" height="14" rx="5" fill="#8ccdf0"/>',
    '<rect x="-28" y="-18" width="56" height="32" rx="3" fill="#c4beb0"/><rect x="10" y="-18" width="18" height="32" fill="#a39d8f"/><path d="M-32 -18 L32 -30 V-22 L-32 -12Z" fill="#2f6fbf"/><rect x="-14" y="-8" width="16" height="12" rx="2" fill="#8ccdf0"/>',
    '<rect x="-30" y="-6" width="60" height="8" rx="3" fill="#c99258"/>' + [-26, -16, -6, 4, 14, 24].map((x) => `<rect x="${x}" y="-28" width="4" height="22" rx="2" fill="#8f5c33"/>`).join('') + '<rect x="-30" y="-30" width="60" height="6" rx="3" fill="#a8713f"/>',
    '<rect x="-30" y="-8" width="60" height="18" rx="6" fill="#8a5a33"/>' + [-20, -8, 4, 16].map((x, j) => `<circle cx="${x}" cy="-12" r="7" fill="${['#ff7aa8', '#ffd34d', '#c58cff', '#ff7aa8'][j]}"/>`).join('') + '<circle cx="22" cy="-30" r="12" fill="#5aae45"/>',
    '<rect x="-2" y="-12" width="4" height="26" fill="#3a3a48"/><rect x="-11" y="-36" width="22" height="26" rx="6" fill="#ffd27a"/><rect x="-11" y="-36" width="22" height="26" rx="6" fill="none" stroke="#3a3a48" stroke-width="3"/><circle cx="0" cy="-23" r="26" fill="url(#lampe)"/>',
    [-28, -14, 0, 14, 28].map((x) => `<rect x="${x - 4}" y="-30" width="8" height="40" rx="4" fill="#fff"/><rect x="${x}" y="-30" width="4" height="40" rx="2" fill="#e2e2e8"/>`).join('') + '<rect x="-34" y="-14" width="68" height="6" rx="3" fill="#ececf2"/>',
  ][i]}</g></g>`).join('')}</g>`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1160 820" width="1160" height="820"><rect width="1160" height="820" fill="#fdf6ea"/>
${panel(20, 'Tag: Grundhaus', false, false)}${panel(580, 'Abend: ausgebaut', true, true)}${icons(668)}
<defs><radialGradient id="fenster"><stop offset="0" stop-color="#ffcf6b" stop-opacity="0.65"/><stop offset="1" stop-color="#ffcf6b" stop-opacity="0"/></radialGradient><radialGradient id="lampe"><stop offset="0" stop-color="#ffd27a" stop-opacity="0.75"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>${defs.join('')}</defs></svg>`;
writeFileSync(process.argv[2], svg);
