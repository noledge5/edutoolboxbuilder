// Stilprobe Klassendorf v2: SVG aus Code, mehr Tiefe, Licht und Material.
import { writeFileSync } from 'node:fs';
const out = process.argv[2];
let id = 0; const uid = (p) => `${p}${++id}`;
const defs = [];
const lin = (stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) => { const i = uid('g'); defs.push(`<linearGradient id="${i}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`); return `url(#${i})`; };
const rad = (stops, cx = 0.5, cy = 0.5, r = 0.5) => { const i = uid('r'); defs.push(`<radialGradient id="${i}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</radialGradient>`); return `url(#${i})`; };
const pill = (x, y, w, a = 0.22) => `<rect x="${x - w / 2}" y="${y - 6}" width="${w}" height="12" rx="6" fill="#2d4a1a" opacity="${a}"/>`;

// Baum: Stamm, drei Laubtöne, Lichtkante, Glanzpunkte.
function baum(x, y, s = 1) {
  const g = (dx, dy, r, f) => `<circle cx="${dx}" cy="${dy}" r="${r}" fill="${f}"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s})">${pill(4, 0, 70, 0.2)}
  <path d="M-7 0 Q-5 -30 -3 -48 L5 -48 Q7 -30 9 0 Z" fill="#8a5a33"/><path d="M3 -46 Q5 -25 8 -2 L9 0 L2 0 Q2 -24 1 -46Z" fill="#6b4226"/>
  <path d="M-2 -40 Q-14 -50 -20 -58" stroke="#8a5a33" stroke-width="5" stroke-linecap="round" fill="none"/>
  <g>${g(-22, -62, 24, '#3f8f3a')}${g(18, -60, 25, '#3f8f3a')}${g(0, -88, 30, '#3f8f3a')}${g(-4, -56, 26, '#3f8f3a')}</g>
  <g>${g(-24, -66, 19, '#5aae45')}${g(14, -66, 20, '#5aae45')}${g(-3, -92, 24, '#5aae45')}</g>
  <g>${g(-28, -72, 11, '#7fcc5a')}${g(-10, -100, 13, '#7fcc5a')}${g(8, -74, 9, '#7fcc5a')}</g>
  <path d="M8 -62 a26 26 0 0 0 30 4 a20 20 0 0 1 -26 10 Z" fill="#2f7330" opacity="0.6"/>
  ${g(-18, -102, 3.5, '#b7ee8a')}${g(-32, -78, 3, '#b7ee8a')}${g(-2, -80, 2.5, '#b7ee8a')}
  </g>`;
}
function busch(x, y, s = 1, blume = false) {
  return `<g transform="translate(${x} ${y}) scale(${s})">${pill(2, 0, 50, 0.18)}
  <circle cx="-12" cy="-12" r="14" fill="#3f8f3a"/><circle cx="10" cy="-12" r="15" fill="#3f8f3a"/><circle cx="0" cy="-22" r="15" fill="#5aae45"/>
  <circle cx="-14" cy="-16" r="8" fill="#7fcc5a"/><circle cx="-4" cy="-30" r="6" fill="#7fcc5a"/>
  ${blume ? '<circle cx="-6" cy="-18" r="3.5" fill="#ff7aa8"/><circle cx="8" cy="-24" r="3.5" fill="#ffd34d"/><circle cx="12" cy="-10" r="3.5" fill="#ff7aa8"/>' : ''}</g>`;
}
function blume(x, y, c) { return `<g transform="translate(${x} ${y})"><path d="M0 0 V-10" stroke="#3f8f3a" stroke-width="2.5" stroke-linecap="round"/>${[0, 72, 144, 216, 288].map((a) => `<circle cx="${4 * Math.cos(a * Math.PI / 180)}" cy="${-12 + 4 * Math.sin(a * Math.PI / 180)}" r="3" fill="${c}"/>`).join('')}<circle cx="0" cy="-12" r="2.2" fill="#ffe08a"/></g>`; }

// Namensschild am Grundstück.
function schild(x, y, name) {
  return `<g transform="translate(${x} ${y})"><rect x="-3" y="-26" width="6" height="26" rx="2" fill="#8a5a33"/>
  <rect x="-34" y="-46" width="68" height="24" rx="8" fill="#f6e3c0"/><rect x="-34" y="-28" width="68" height="6" rx="3" fill="#e6c995"/>
  <text x="0" y="-29" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="800" font-size="14" fill="#5b3a1e">${name}</text></g>`;
}

// Stufe 1: Zelt.
function zelt(x, y) {
  return `<g transform="translate(${x} ${y})">${pill(4, 0, 110)}
  <path d="M-48 0 L0 -70 L48 0 Z" fill="${lin([[0, '#ffb35c'], [1, '#f08a2c']])}"/>
  <path d="M0 -70 L48 0 L16 0 Z" fill="#d46f1c"/>
  <path d="M-14 0 L0 -40 L14 0 Z" fill="#5b3415"/><path d="M0 -40 L14 0 L6 0 Z" fill="#3f230d"/>
  <path d="M-40 -6 L-4 -60" stroke="#ffd59a" stroke-width="5" stroke-linecap="round" opacity="0.7"/>
  <path d="M0 -70 V-84" stroke="#6b4226" stroke-width="4" stroke-linecap="round"/><path d="M0 -84 l16 5 -16 6Z" fill="#e8455b"/>
  <path d="M-56 2 L-48 0 M56 2 L48 0" stroke="#6b4226" stroke-width="3" stroke-linecap="round"/></g>`;
}
// Stufe 2: Holzhütte (3/4-Ansicht: Vorderseite + Seitenwand).
function huette(x, y) {
  const balken = [0, 1, 2, 3, 4].map((i) => `<rect x="-44" y="${-12 - i * 11}" width="62" height="10" rx="5" fill="${i % 2 ? '#a8713f' : '#b98049'}"/>`).join('');
  const seite = [0, 1, 2, 3, 4].map((i) => `<path d="M18 ${-12 - i * 11} l30 -10 v10 l-30 10Z" fill="${i % 2 ? '#8a5a33' : '#94623a'}"/>`).join('');
  return `<g transform="translate(${x} ${y})">${pill(6, 0, 120)}
  ${seite}${balken}
  <path d="M-52 -62 L-13 -98 L26 -62 Z" fill="#a8713f"/>
  <path d="M-56 -60 L-13 -102 L-8 -97 L-48 -58Z" fill="#5f8f3a"/><path d="M-13 -102 L50 -122 L58 -82 L26 -60 L-8 -97Z" fill="${lin([[0, '#7cb84a'], [1, '#4f8a2e']], 0, 0, 1, 1)}"/>
  <path d="M-10 -100 L48 -118" stroke="#a6dc6c" stroke-width="4" stroke-linecap="round"/>
  <rect x="-24" y="-40" width="20" height="28" rx="9" fill="#5b3415"/><circle cx="-8" cy="-26" r="2" fill="#f2c14e"/>
  <rect x="-2" y="-46" width="16" height="14" rx="3" fill="${lin([[0, '#fff2b0'], [1, '#ffc95a']])}"/><path d="M6 -46 v14 M-2 -39 h16" stroke="#6b4226" stroke-width="2"/>
  <rect x="32" y="-68" width="10" height="18" fill="#8d8d99"/><circle cx="40" cy="-80" r="6" fill="#fff" opacity="0.6"/><circle cx="48" cy="-92" r="8" fill="#fff" opacity="0.45"/></g>`;
}
// Stufe 3: Fachwerkhaus mit Ziegeldach, Blumenkasten, Licht im Fenster.
function fachwerk(x, y, dach = '#d9534f', dachDunkel = '#b23b3b') {
  const ziegel = [];
  for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++) ziegel.push(`<path d="M${-64 + c * 14 + (r % 2) * 7} ${-76 - r * 8} q7 6 14 0" stroke="${dachDunkel}" stroke-width="2" fill="none" opacity="0.55"/>`);
  return `<g transform="translate(${x} ${y})">${pill(8, 0, 150)}
  <path d="M30 -4 L64 -16 V-80 L30 -70Z" fill="#e7d3a8"/><path d="M30 -4 L64 -16 V-80 L30 -70Z" fill="#000" opacity="0.08"/>
  <path d="M40 -8 V-72 M52 -12 V-76 M30 -38 L64 -48" stroke="#7a4b28" stroke-width="4"/>
  <rect x="-56" y="-72" width="86" height="72" fill="${lin([[0, '#fff3d6'], [1, '#f0dcae']])}"/>
  <path d="M-56 -72 H30 M-56 -36 H30 M-56 0 H30 M-56 -72 V0 M30 -72 V0 M-30 -72 V0 M4 -72 V-36 M-56 -72 L-30 -36 M4 -72 L30 -36" stroke="#7a4b28" stroke-width="5" stroke-linecap="round"/>
  <path d="M-64 -70 L-13 -122 L38 -70 Z" fill="${lin([[0, '#f07a6a'], [1, dach]])}"/>
  <path d="M-13 -122 L44 -136 L74 -82 L38 -70 Z" fill="${dachDunkel}"/>
  <clipPath id="${uid('c')}"></clipPath>
  <g clip-path="url(#dz${x})">${ziegel.join('')}</g>
  <clipPath id="dz${x}"><path d="M-64 -70 L-13 -122 L38 -70 Z"/></clipPath>
  <path d="M-58 -72 L-14 -116" stroke="#ffb3a6" stroke-width="5" stroke-linecap="round"/>
  <rect x="46" y="-140" width="14" height="28" fill="#b06a4a"/><rect x="44" y="-144" width="18" height="6" rx="2" fill="#8c4f36"/>
  <circle cx="58" cy="-156" r="7" fill="#fff" opacity="0.65"/><circle cx="68" cy="-170" r="10" fill="#fff" opacity="0.45"/><circle cx="80" cy="-188" r="12" fill="#fff" opacity="0.3"/>
  <path d="M-22 0 V-26 a9 9 0 0 1 18 0 V0Z" fill="#6b3f1f"/><circle cx="-8" cy="-12" r="2" fill="#f2c14e"/>
  <rect x="-4" y="-66" width="22" height="22" rx="4" fill="${rad([[0, '#fff6c2'], [1, '#ffb84a']])}"/><path d="M7 -66 v22 M-4 -55 h22" stroke="#7a4b28" stroke-width="2.5"/>
  <rect x="-50" y="-30" width="20" height="18" rx="4" fill="${rad([[0, '#fff6c2'], [1, '#ffb84a']])}"/>
  <rect x="-54" y="-12" width="28" height="7" rx="3" fill="#8a5a33"/>
  <circle cx="-50" cy="-14" r="4" fill="#ff7aa8"/><circle cx="-41" cy="-15" r="4" fill="#ffd34d"/><circle cx="-32" cy="-14" r="4" fill="#ff7aa8"/>
  </g>`;
}
// Freies Grundstück: abgesteckt, mit Schild.
function frei(x, y) {
  return `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="-6" rx="54" ry="16" fill="#b9d98a"/><ellipse cx="0" cy="-6" rx="54" ry="16" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="8 7" opacity="0.8"/>
  ${[-50, 50].map((dx) => `<rect x="${dx - 3}" y="-24" width="6" height="22" rx="2" fill="#a8713f"/>`).join('')}</g>`;
}
// Dorfplatz mit Brunnen (3/4-Ansicht).
function brunnen(x, y) {
  const steine = [];
  for (let i = 0; i < 9; i++) { const a = Math.PI * (i / 8); steine.push(`<path d="M${-46 * Math.cos(a)} ${-10 + 14 * Math.sin(a)}" />`); }
  return `<g transform="translate(${x} ${y})">
  <ellipse cx="0" cy="0" rx="120" ry="44" fill="#e9d7b0"/><ellipse cx="0" cy="-2" rx="110" ry="38" fill="${rad([[0, '#f7ead0'], [1, '#e2cc9d']])}"/>
  ${Array.from({ length: 18 }, (_, i) => { const a = (i / 18) * Math.PI * 2; return `<ellipse cx="${88 * Math.cos(a)}" cy="${-2 + 30 * Math.sin(a)}" rx="9" ry="4" fill="#d6bd8a"/>`; }).join('')}
  ${pill(6, 6, 120, 0.25)}
  <path d="M-48 -18 V6 Q0 26 48 6 V-18Z" fill="${lin([[0, '#c9c3b6'], [1, '#a59e90']])}"/>
  <path d="M-48 -6 Q0 14 48 -6 M-48 6" stroke="#8f887a" stroke-width="2.5" fill="none"/>
  ${[-36, -16, 6, 28].map((dx, i) => `<path d="M${dx} ${-2 + (i % 2) * 2} v12" stroke="#8f887a" stroke-width="2.5"/>`).join('')}
  <ellipse cx="0" cy="-18" rx="48" ry="16" fill="#dcd6ca"/><ellipse cx="0" cy="-18" rx="38" ry="11" fill="${rad([[0, '#9be4ff'], [1, '#3aa3d8']], 0.4, 0.4, 0.6)}"/>
  <ellipse cx="-12" cy="-21" rx="12" ry="3" fill="#fff" opacity="0.7"/>
  <rect x="-40" y="-96" width="8" height="80" rx="3" fill="#8a5a33"/><rect x="32" y="-96" width="8" height="80" rx="3" fill="#6b4226"/>
  <path d="M-60 -88 L0 -126 L60 -88 Q0 -80 -60 -88Z" fill="${lin([[0, '#5aa0e6'], [1, '#2f6fbf']])}"/>
  <path d="M0 -126 L60 -88 Q30 -84 6 -86Z" fill="#245a9c" opacity="0.7"/>
  <path d="M-52 -90 L-6 -120" stroke="#a8d4ff" stroke-width="4" stroke-linecap="round"/>
  <path d="M-36 -70 H36" stroke="#6b4226" stroke-width="6" stroke-linecap="round"/><path d="M0 -70 V-44" stroke="#5b3415" stroke-width="2"/>
  <path d="M-8 -44 H8 L6 -34 H-6Z" fill="#a8713f"/>
  <circle cx="44" cy="-20" r="3" fill="#ffd34d"/></g>`;
}

const W = 780, H = 1100;
const weg = `<path d="M390 1100 C 330 980, 200 940, 210 840 S 420 700, 390 560 S 160 430, 250 300 S 470 160, 420 40" fill="none" stroke="#e8cf9c" stroke-width="64" stroke-linecap="round"/>
<path d="M390 1100 C 330 980, 200 940, 210 840 S 420 700, 390 560 S 160 430, 250 300 S 470 160, 420 40" fill="none" stroke="#f5e2b8" stroke-width="48" stroke-linecap="round"/>
<path d="M390 1100 C 330 980, 200 940, 210 840 S 420 700, 390 560 S 160 430, 250 300 S 470 160, 420 40" fill="none" stroke="#fff3d6" stroke-width="10" stroke-linecap="round" stroke-dasharray="2 26" opacity="0.9"/>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<rect width="${W}" height="${H}" fill="${lin([[0, '#bfe7ff'], [0.25, '#e4f6ff'], [0.26, '#9ad46a'], [1, '#6fbf4a']])}"/>
<path d="M0 290 C 120 220, 260 250, 380 230 S 640 200, 780 250 V 320 H0Z" fill="#a9d6b2" opacity="0.8"/>
<path d="M0 310 C 160 260, 300 300, 460 270 S 700 260, 780 290 V340 H0Z" fill="#8cc96a"/>
<ellipse cx="120" cy="90" rx="70" ry="22" fill="#fff" opacity="0.85"/><ellipse cx="160" cy="76" rx="44" ry="22" fill="#fff" opacity="0.85"/>
<ellipse cx="620" cy="130" rx="60" ry="18" fill="#fff" opacity="0.8"/><ellipse cx="650" cy="118" rx="34" ry="18" fill="#fff" opacity="0.8"/>
<rect y="330" width="${W}" height="${H - 330}" fill="${lin([[0, '#8fcf5f'], [1, '#62b03f']])}"/>
${Array.from({ length: 60 }, (_, i) => `<path d="M${(i * 137) % W} ${360 + ((i * 89) % 720)} q3 -8 6 0" stroke="#4f9a34" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.6"/>`).join('')}
${weg}
${baum(60, 360, 0.8)}${baum(720, 350, 0.75)}${baum(640, 420, 0.9)}
${frei(560, 330)}${schild(560, 330, 'frei')}
${zelt(110, 480)}${schild(40, 500, 'Ben')}
${brunnen(400, 600)}
${huette(610, 520)}${schild(700, 530, 'Lea')}
${busch(300, 470, 0.9, true)}${busch(520, 700, 1, true)}
${fachwerk(140, 760)}${schild(250, 770, 'Mia')}
${fachwerk(600, 860, '#5aa0e6', '#2f6fbf')}${schild(700, 875, 'Noah')}
${baum(40, 920, 1)}${baum(740, 1000, 1.05)}${busch(250, 960, 1.1, true)}
${frei(470, 1010)}${schild(470, 1010, 'frei')}
${[[330, 690, '#ff7aa8'], [350, 700, '#ffd34d'], [480, 760, '#c58cff'], [90, 640, '#ff7aa8'], [700, 680, '#ffd34d'], [300, 880, '#c58cff']].map(([x, y, c]) => blume(x, y, c)).join('')}
<defs>${defs.join('')}</defs></svg>`;
writeFileSync(out, svg);
