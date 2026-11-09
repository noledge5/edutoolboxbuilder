// The hero drawn (Avatar-Stil in docs/design/lernquest/README.md): flat shapes without outlines, two tones per area,
// one canvas (viewBox 0 0 240 240) for every part and fixed layers from back to front: background, companion,
// body/skin, clothes, hair, eyes, mouth, head, tool. Each part is its own group that sits right without its neighbours.
// Part colours are fixed values here, not UI tokens. Higher rarity = more detail, gold from Episch, sparkle for Legendär.
import { useContext, type ReactNode } from 'react';
import { angelegt, frisurVon, HAARFARBEN, haarfarbeVon, HAUT, mundVon, type Avatar, type Slot, type Teil } from '../teile';
import { haareBild, koerperBild, mundBild, teilBild } from './teilBilder';
import { HochgeladeneBilder } from './bilderKontext';

/** Shadow tone per skin tone (`HAUT`). */
const HAUT_SCHATTEN = ['#DDAE80', '#D29A6E', '#AE744A', '#8E5833', '#5F3A20', '#E8C3A2'];
const INK = '#1F1A3D';

/** A four-pointed sparkle; it twinkles unless „Bewegung reduzieren“ is on (lernquest.css). */
const funkeln = (x: number, y: number, r = 8) => (
  <path className="lq-funkeln" d={`M${x} ${y - r}L${x + r / 4} ${y - r / 4}L${x + r} ${y}L${x + r / 4} ${y + r / 4}L${x} ${y + r}L${x - r / 4} ${y + r / 4}L${x - r} ${y}L${x - r / 4} ${y - r / 4}Z`} fill="#FFF6C8" />
);

/** A five-pointed star path around (cx, cy). */
function stern(cx: number, cy: number, r: number): string {
  const p: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    p.push(`${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `M${p.join('L')}Z`;
}

const TORSO = { x: 84, y: 132, width: 72, height: 76, rx: 28 };

const ZEICHNUNG: Record<string, ReactNode> = {
  // — Background —
  wiese: (
    <>
      <rect width="240" height="240" fill="#CDEBF7" />
      <circle cx="196" cy="44" r="18" fill="#FFE07A" />
      <path d="M0 168c50-30 110-30 160-10s60 10 80 4v78H0Z" fill="#8FCB8F" />
      <path d="M0 196c60-14 120-14 240 0v44H0Z" fill="#6DB46D" />
    </>
  ),
  strand: (
    <>
      <rect width="240" height="240" fill="#BFE6F5" />
      <circle cx="44" cy="44" r="16" fill="#FFE07A" />
      <rect y="146" width="240" height="50" fill="#4FB3D9" />
      <path d="M0 160c20-6 40 6 60 0s40 6 60 0 40 6 60 0 40 6 60 0v8c-20 6-40-6-60 0s-40-6-60 0-40-6-60 0-40-6-60 0Z" fill="#3A97BD" />
      <path d="M0 190c60-10 140-12 240 0v50H0Z" fill="#F3D89A" />
      <path d="M0 214c80-8 160-8 240 0v26H0Z" fill="#E5C27A" />
    </>
  ),
  wald: (
    <>
      <rect width="240" height="240" fill="#D6EEDB" />
      <path d="M0 190 26 96l26 94ZM188 190l26-104 26 104Z" fill="#3E8E5E" />
      <path d="M30 196 60 84l30 112ZM150 196l30-120 30 120Z" fill="#2E6F48" />
      <rect x="56" y="190" width="8" height="14" fill="#6E4A2A" />
      <rect x="176" y="190" width="8" height="14" fill="#6E4A2A" />
      <path d="M0 200c60-12 120-12 240 0v40H0Z" fill="#7DBE7D" />
    </>
  ),
  berge: (
    <>
      <rect width="240" height="240" fill="#D4E4F7" />
      <path d="M0 190 54 92l48 76 50-96 56 98 32-40v60Z" fill="#8C9DB8" />
      <path d="M54 92l48 76H54ZM152 72l56 98h-56Z" fill="#6E7F9C" />
      <path d="M54 92l12 22-12-6-12 6ZM152 72l13 24-13-7-13 7Z" fill="#FFFFFF" />
      <path d="M0 200c60-12 120-12 240 0v40H0Z" fill="#9CCB8E" />
    </>
  ),
  nacht: (
    <>
      <rect width="240" height="240" fill="#2B2E6B" />
      <circle cx="190" cy="50" r="20" fill="#FFE9A8" />
      <circle cx="199" cy="43" r="17" fill="#2B2E6B" />
      {[
        [30, 30],
        [70, 60],
        [120, 24],
        [150, 80],
        [40, 110],
        [210, 120],
      ].map(([x, y]) => (
        <circle key={`${x}`} cx={x} cy={y} r="2.5" fill="#FFFFFF" />
      ))}
      <path d="M0 184c50-24 110-24 160-8s60 8 80 4v60H0Z" fill="#3B4A7A" />
      <path d="M0 206c60-12 120-12 240 0v34H0Z" fill="#2E3B66" />
    </>
  ),
  weltall: (
    <>
      <rect width="240" height="240" fill="#160F3A" />
      {[
        [24, 90],
        [70, 30],
        [120, 60],
        [96, 120],
        [214, 140],
        [150, 20],
      ].map(([x, y]) => (
        <circle key={`${x}`} cx={x} cy={y} r="2" fill="#FFFFFF" />
      ))}
      <circle cx="40" cy="50" r="9" fill="#5BE0C0" />
      <circle cx="182" cy="64" r="26" fill="#8A5CF0" />
      <path d="M182 38a26 26 0 0 1 0 52 18 26 0 0 0 0-52Z" fill="#6A3FD0" />
      <ellipse cx="182" cy="64" rx="44" ry="10" fill="none" stroke="#FFC531" strokeWidth="5" transform="rotate(-18 182 64)" />
      <path d="M0 196c60-16 120-16 240 0v44H0Z" fill="#4B4470" />
      <ellipse cx="60" cy="214" rx="14" ry="5" fill="#3A3460" />
      <ellipse cx="190" cy="222" rx="18" ry="6" fill="#3A3460" />
    </>
  ),
  regenbogen: (
    <>
      <rect width="240" height="240" fill="#CFEFFF" />
      {[
        ['#E8577A', 100],
        ['#FF9F43', 88],
        ['#FFC531', 76],
        ['#3FB37F', 64],
        ['#2F6FDB', 52],
      ].map(([c, r]) => (
        <path key={c} d={`M${120 - Number(r)} 200a${r} ${r} 0 0 1 ${2 * Number(r)} 0`} fill="none" stroke={String(c)} strokeWidth="12" />
      ))}
      <ellipse cx="26" cy="196" rx="30" ry="14" fill="#FFFFFF" />
      <ellipse cx="214" cy="196" rx="30" ry="14" fill="#FFFFFF" />
      <path d="M0 204c60-10 120-10 240 0v36H0Z" fill="#8FCB8F" />
      <path d="M0 222c80-6 160-6 240 0v18H0Z" fill="#6DB46D" />
      {funkeln(196, 40)}
      {funkeln(40, 70, 6)}
    </>
  ),

  // — Companion (left of the hero) —
  schnecke: (
    <>
      <path d="M14 224c0-8 8-12 20-12h40c6 0 8 6 4 10s-10 4-16 4H18c-2 0-4-1-4-2Z" fill="#B9D98A" />
      <path d="M70 214l4-18M76 214l8-16" stroke="#94BE63" strokeWidth="3" strokeLinecap="round" />
      <circle cx="74" cy="195" r="3" fill={INK} />
      <circle cx="84" cy="197" r="3" fill={INK} />
      <circle cx="46" cy="200" r="20" fill="#E59A4E" />
      <path d="M46 200m-12 0a12 12 0 1 1 12 12a6 6 0 1 1 6-6" fill="none" stroke="#C77A30" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  katze: (
    <>
      <path d="M24 212c-14-4-16-22-4-28" fill="none" stroke="#D9862A" strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="44" cy="210" rx="22" ry="16" fill="#F2A541" />
      <path d="M36 200v18M46 198v20" stroke="#D9862A" strokeWidth="4" strokeLinecap="round" />
      <path d="M48 180l2-16 10 10ZM70 180l-2-16-10 10Z" fill="#D9862A" />
      <circle cx="59" cy="186" r="14" fill="#F2A541" />
      <circle cx="54" cy="185" r="2.4" fill={INK} />
      <circle cx="64" cy="185" r="2.4" fill={INK} />
      <path d="m57 190 2 2 2-2Z" fill="#B85C5C" />
    </>
  ),
  eule: (
    <g transform="translate(46 176)">
      <ellipse cx="0" cy="22" rx="22" ry="26" fill="#9B6B43" />
      <ellipse cx="0" cy="30" rx="13" ry="15" fill="#E8C9A0" />
      <circle cx="-8" cy="12" r="8" fill="#FFFFFF" />
      <circle cx="8" cy="12" r="8" fill="#FFFFFF" />
      <circle cx="-8" cy="12" r="4" fill={INK} />
      <circle cx="8" cy="12" r="4" fill={INK} />
      <path d="m-3 19 3 5 3-5Z" fill="#FFC531" />
      <path d="m-18 0 6 6M18 0l-6 6" stroke="#9B6B43" strokeWidth="6" strokeLinecap="round" />
    </g>
  ),
  fuchs: (
    <>
      <path d="M24 216c-18 0-20-26-4-32 2 12 8 20 16 24Z" fill="#E8742C" />
      <path d="M8 196c-2-6 0-10 4-12 0 6 2 10 6 12Z" fill="#FFF3E6" />
      <ellipse cx="44" cy="210" rx="22" ry="16" fill="#E8742C" />
      <ellipse cx="48" cy="214" rx="11" ry="10" fill="#FFF3E6" />
      <path d="M48 176l4-12 8 10ZM76 176l-4-12-8 10Z" fill="#C45A1C" />
      <path d="M44 188c0-10 8-16 18-16s18 6 18 16-8 14-18 14-18-4-18-14Z" fill="#E8742C" />
      <path d="M52 192c4 6 16 6 20 0-2 6-6 9-10 9s-8-3-10-9Z" fill="#FFF3E6" />
      <circle cx="56" cy="186" r="2.4" fill={INK} />
      <circle cx="68" cy="186" r="2.4" fill={INK} />
      <circle cx="62" cy="194" r="2.2" fill={INK} />
    </>
  ),
  roboter: (
    <>
      <path d="M46 168v-12" stroke="#7F8AA1" strokeWidth="3" strokeLinecap="round" />
      <circle cx="46" cy="154" r="4.5" fill="#FFC531" />
      <rect x="26" y="168" width="40" height="30" rx="9" fill="#A9B4C8" />
      <rect x="32" y="174" width="28" height="17" rx="5" fill={INK} />
      <circle cx="40" cy="182" r="3" fill="#5BE0C0" />
      <circle cx="52" cy="182" r="3" fill="#5BE0C0" />
      <rect x="24" y="198" width="44" height="24" rx="8" fill="#7F8AA1" />
      <circle cx="46" cy="208" r="4" fill="#FFC531" />
      <rect x="28" y="220" width="12" height="6" rx="3" fill={INK} />
      <rect x="52" y="220" width="12" height="6" rx="3" fill={INK} />
    </>
  ),
  drache: (
    <>
      <path d="M24 214c-14 4-20 0-22-6 8 2 14 0 20-4Z" fill="#2A8A5E" />
      <path d="M36 196c-20-14-26-34-14-42 4 12 14 20 24 24Z" fill="#2A8A5E" />
      <ellipse cx="46" cy="208" rx="24" ry="18" fill="#3FB37F" />
      <ellipse cx="50" cy="212" rx="12" ry="11" fill="#FFC531" />
      <path d="M56 170l-2-10 8 6ZM72 170l2-10-8 6Z" fill="#FFC531" />
      <circle cx="64" cy="182" r="15" fill="#3FB37F" />
      <ellipse cx="74" cy="188" rx="9" ry="6" fill="#2A8A5E" />
      <circle cx="62" cy="179" r="3" fill={INK} />
      <circle cx="77" cy="187" r="1.5" fill={INK} />
      {funkeln(86, 166, 6)}
    </>
  ),

  // — Clothes —
  tshirt: (
    <>
      <rect {...TORSO} fill="#2F6FDB" />
      <rect x="84" y="176" width="72" height="8" fill="#2459B8" />
    </>
  ),
  pulli: (
    <>
      <rect {...TORSO} fill="#E8577A" />
      <rect x="84" y="160" width="72" height="6" fill="#B83A5C" />
      <rect x="86" y="194" width="68" height="12" rx="6" fill="#B83A5C" />
      <ellipse cx="120" cy="134" rx="16" ry="5" fill="#B83A5C" />
    </>
  ),
  latzhose: (
    <>
      <rect {...TORSO} fill="#FFF3D6" />
      <path d="M84 180h72v0c0 15-13 28-28 28h-16c-15 0-28-13-28-28Z" fill="#3D6FB6" />
      <rect x="100" y="150" width="40" height="34" rx="6" fill="#3D6FB6" />
      <path d="M104 152 94 134M136 152l10-18" stroke="#2B5390" strokeWidth="6" strokeLinecap="round" />
      <rect x="110" y="160" width="20" height="12" rx="3" fill="#2B5390" />
    </>
  ),
  weste: (
    <>
      <rect {...TORSO} fill="#F1E3C6" />
      <path d="M84 160c0-16 12-28 28-28h2l-4 76h-6c-11 0-20-9-20-20Z" fill="#8A6A3A" />
      <path d="M156 160c0-16-12-28-28-28h-2l4 76h6c11 0 20-9 20-20Z" fill="#8A6A3A" />
      <rect x="90" y="170" width="14" height="10" rx="2" fill="#6E5229" />
      <rect x="136" y="170" width="14" height="10" rx="2" fill="#6E5229" />
    </>
  ),
  ruestung: (
    <>
      <rect {...TORSO} fill="#B8C2D3" />
      <rect x="84" y="170" width="72" height="7" fill="#8E9AB0" />
      <rect x="86" y="188" width="68" height="7" fill="#8E9AB0" />
      <circle cx="88" cy="142" r="12" fill="#8E9AB0" />
      <circle cx="152" cy="142" r="12" fill="#8E9AB0" />
      <path d="M110 146h20v10c0 6-5 10-10 12-5-2-10-6-10-12Z" fill="#C4321F" />
    </>
  ),
  sternenmantel: (
    <>
      <path d="M92 132h56l16 76H76Z" fill="#2F6FDB" />
      <path d="M120 132v76" stroke="#2459B8" strokeWidth="3" />
      <path d="M98 132h44l-6 12h-32Z" fill="#2459B8" />
      <circle cx="120" cy="142" r="5" fill="#FFE07A" />
      <path d={stern(102, 168, 7)} fill="#FFE07A" />
      <path d={stern(140, 184, 6)} fill="#FFE07A" />
      <path d={stern(112, 196, 5)} fill="#FFE07A" />
    </>
  ),
  zauberrobe: (
    <>
      <path d="M90 132h60l12 76H78Z" fill="#6A2FC4" />
      <path d="M90 132h14l-6 76H78Z" fill="#4B1F94" />
      <rect x="116" y="132" width="8" height="68" fill="#FFC531" />
      <rect x="78" y="198" width="84" height="10" rx="3" fill="#FFC531" />
      <path d="M144 158a10 10 0 1 0 0 16 8 8 0 1 1 0-16Z" fill="#FFE07A" />
    </>
  ),
  goldruestung: (
    <>
      <rect {...TORSO} fill="#FFC531" />
      <rect x="84" y="172" width="72" height="7" fill="#C98F00" />
      <rect x="86" y="190" width="68" height="7" fill="#C98F00" />
      <circle cx="88" cy="142" r="12" fill="#C98F00" />
      <circle cx="152" cy="142" r="12" fill="#C98F00" />
      <path d="m120 146 9 10-9 10-9-10Z" fill="#2F6FDB" />
      {funkeln(146, 156, 6)}
    </>
  ),

  // — Eyes (centres 104|100 and 136|100) —
  punktaugen: (
    <>
      <circle cx="104" cy="100" r="5.5" fill={INK} />
      <circle cx="136" cy="100" r="5.5" fill={INK} />
      <circle cx="106" cy="98" r="1.8" fill="#FFFFFF" />
      <circle cx="138" cy="98" r="1.8" fill="#FFFFFF" />
    </>
  ),
  froehlich: <path d="M97 102q7-8 14 0M129 102q7-8 14 0" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />,
  brille: (
    <>
      <circle cx="104" cy="100" r="12" fill="#CDEBF7" opacity=".6" />
      <circle cx="136" cy="100" r="12" fill="#CDEBF7" opacity=".6" />
      <circle cx="104" cy="100" r="4.5" fill={INK} />
      <circle cx="136" cy="100" r="4.5" fill={INK} />
      <path d="M116 99h8M92 98H80M148 98h12" stroke="#2B2640" strokeWidth="3" strokeLinecap="round" />
      <circle cx="104" cy="100" r="12" fill="none" stroke="#2B2640" strokeWidth="3" />
      <circle cx="136" cy="100" r="12" fill="none" stroke="#2B2640" strokeWidth="3" />
    </>
  ),
  sternaugen: (
    <>
      <path d={stern(104, 100, 9)} fill="#2F6FDB" />
      <path d={stern(136, 100, 9)} fill="#2F6FDB" />
      <circle cx="104" cy="100" r="2.4" fill="#FFFFFF" />
      <circle cx="136" cy="100" r="2.4" fill="#FFFFFF" />
    </>
  ),
  sonnenbrille: (
    <>
      <rect x="89" y="91" width="28" height="18" rx="8" fill={INK} />
      <rect x="123" y="91" width="28" height="18" rx="8" fill={INK} />
      <rect x="89" y="100" width="28" height="9" rx="4" fill="#3B3560" />
      <rect x="123" y="100" width="28" height="9" rx="4" fill="#3B3560" />
      <rect x="115" y="95" width="10" height="3" fill={INK} />
      <path d="M95 96l6-3M129 96l6-3" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity=".5" />
    </>
  ),
  funkelaugen: (
    <>
      <circle cx="104" cy="100" r="8" fill="#FFFFFF" />
      <circle cx="136" cy="100" r="8" fill="#FFFFFF" />
      <circle cx="104" cy="101" r="6" fill="#6A2FC4" />
      <circle cx="136" cy="101" r="6" fill="#6A2FC4" />
      <circle cx="104" cy="101" r="3" fill={INK} />
      <circle cx="136" cy="101" r="3" fill={INK} />
      <circle cx="106" cy="98" r="2" fill="#FFFFFF" />
      <circle cx="138" cy="98" r="2" fill="#FFFFFF" />
      <path d={stern(88, 86, 5)} fill="#FFC531" />
      <path d={stern(152, 86, 5)} fill="#FFC531" />
    </>
  ),

  // — Head —
  wollmuetze: (
    <>
      <path d="M76 92c0-30 20-50 44-50s44 20 44 50Z" fill="#E8577A" />
      <rect x="74" y="82" width="92" height="14" rx="7" fill="#B83A5C" />
      <circle cx="120" cy="40" r="10" fill="#F7A1B5" />
    </>
  ),
  stirnband: (
    <>
      <rect x="76" y="70" width="88" height="12" rx="6" fill="#1F8A70" />
      <path d="M160 72l18-8-2 12ZM160 78l16 10-8 4Z" fill="#155E4C" />
    </>
  ),
  ritterhelm: (
    <>
      <path d="M74 96c0-32 20-52 46-52s46 20 46 52h-12c0-22-14-34-34-34S86 74 86 96Z" fill="#9AA3B5" />
      <rect x="116" y="44" width="8" height="18" fill="#6B7487" />
      <rect x="72" y="90" width="14" height="30" rx="6" fill="#6B7487" />
      <rect x="154" y="90" width="14" height="30" rx="6" fill="#6B7487" />
    </>
  ),
  entdeckerhut: (
    <>
      <ellipse cx="120" cy="66" rx="64" ry="12" fill="#8A6A3A" />
      <path d="M86 66c0-26 14-40 34-40s34 14 34 40Z" fill="#A9844C" />
      <rect x="86" y="56" width="68" height="9" fill="#5B3FD9" />
    </>
  ),
  piratenhut: (
    <>
      <path d="M66 72c18-8 34-36 54-36s36 28 54 36c-16 10-34 14-54 14s-38-4-54-14Z" fill="#2B2640" />
      <path d="M66 72c16 10 34 14 54 14s38-4 54-14c-4 8-28 18-54 18s-50-10-54-18Z" fill="#1A1628" />
      <path d="M108 70l24-14M108 56l24 14" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      <circle cx="120" cy="58" r="7" fill="#FFFFFF" />
      <circle cx="117" cy="58" r="1.6" fill="#2B2640" />
      <circle cx="123" cy="58" r="1.6" fill="#2B2640" />
    </>
  ),
  zauberhut: (
    <>
      <ellipse cx="120" cy="66" rx="60" ry="11" fill="#3F28A8" />
      <path d="M86 66 126 8c4-6 10-4 8 4L154 66Z" fill="#5B3FD9" />
      <path d="M88 56h64l2 10H86Z" fill="#FFC531" />
      <path d={stern(118, 38, 7)} fill="#FFC531" />
      <path d="M136 30a5 5 0 1 0 0 8 4 4 0 1 1 0-8Z" fill="#FFE07A" />
    </>
  ),
  krone: (
    <>
      <path d="M80 72V38l18 16 22-24 22 24 18-16v34Z" fill="#FFC531" />
      <rect x="80" y="62" width="80" height="12" rx="3" fill="#C98F00" />
      <circle cx="100" cy="68" r="4" fill="#C4321F" />
      <circle cx="120" cy="68" r="5" fill="#2F6FDB" />
      <circle cx="140" cy="68" r="4" fill="#13804A" />
      <circle cx="80" cy="38" r="4" fill="#FFE07A" />
      <circle cx="120" cy="30" r="4" fill="#FFE07A" />
      <circle cx="160" cy="38" r="4" fill="#FFE07A" />
      {funkeln(172, 30, 7)}
    </>
  ),

  // — Tool (right hand at 164|184) —
  lupe: (
    <>
      <path d="M162 194l18-34" stroke="#8A6A3A" strokeWidth="8" strokeLinecap="round" />
      <circle cx="188" cy="144" r="18" fill="#CDEBF7" opacity=".85" />
      <circle cx="188" cy="144" r="18" fill="none" stroke="#9AA3B5" strokeWidth="6" />
      <path d="M180 136a10 10 0 0 1 10-4" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  buch: (
    <>
      <rect x="150" y="166" width="38" height="30" rx="3" fill="#C4321F" />
      <rect x="150" y="166" width="7" height="30" fill="#8E2416" />
      <rect x="183" y="169" width="3" height="24" fill="#FFFFFF" />
      <rect x="164" y="174" width="16" height="4" rx="2" fill="#FFC9C0" />
    </>
  ),
  fernrohr: (
    <g transform="rotate(-30 164 184)">
      <rect x="152" y="176" width="60" height="16" rx="5" fill="#C98F00" />
      <rect x="204" y="172" width="16" height="24" rx="4" fill="#8A6A3A" />
      <rect x="146" y="179" width="10" height="10" rx="3" fill="#8A6A3A" />
    </g>
  ),
  kompass: (
    <>
      <circle cx="180" cy="154" r="4" fill="#8C5523" />
      <circle cx="180" cy="178" r="21" fill="#B87333" />
      <circle cx="180" cy="178" r="15" fill="#FFF8E7" />
      <path d="M180 165l4 13h-8Z" fill="#C4321F" />
      <path d="M180 191l4-13h-8Z" fill="#2F6FDB" />
      <circle cx="180" cy="178" r="2" fill={INK} />
    </>
  ),
  zauberstab: (
    <>
      <path d="M160 196l36-56" stroke="#3B2A1A" strokeWidth="7" strokeLinecap="round" />
      <path d={stern(198, 134, 13)} fill="#FFC531" />
      <circle cx="214" cy="150" r="2.5" fill="#FFE07A" />
      <circle cx="184" cy="122" r="2" fill="#FFE07A" />
      <circle cx="216" cy="122" r="2" fill="#FFE07A" />
    </>
  ),
  sternenschwert: (
    <g transform="rotate(20 164 184)">
      <path d="M158 176h12l2-76-8-12-8 12Z" fill="#CFE3FF" />
      <path d="M164 176h6l2-76-8-12Z" fill="#9DB8E8" />
      <rect x="146" y="172" width="36" height="8" rx="4" fill="#FFC531" />
      <rect x="160" y="184" width="8" height="18" fill="#8A6A3A" />
      <circle cx="164" cy="205" r="5" fill="#FFC531" />
      <path d={stern(164, 176, 5)} fill="#2F6FDB" />
      {funkeln(178, 96, 7)}
    </g>
  ),
  // — Added 06.11.2026 —
  kappe: (
    <>
      <path d="M78 84c0-26 18-40 42-40s42 14 42 40Z" fill="#E4572E" />
      <path d="M120 44c24 0 42 14 42 40h-20c0-22-8-36-22-40Z" fill="#C23F1E" />
      <path d="M118 78h58c7 0 7 10 0 10h-58Z" fill="#C23F1E" />
      <circle cx="120" cy="45" r="4" fill="#FFE07A" />
    </>
  ),
  blumenkranz: (
    <>
      <path d="M78 76q42-26 84 0" fill="none" stroke="#3E8E5E" strokeWidth="6" strokeLinecap="round" />
      {[
        [84, 70, '#F29AC0'],
        [102, 60, '#FFE07A'],
        [120, 57, '#F29AC0'],
        [138, 60, '#9FC6FF'],
        [156, 70, '#FFE07A'],
      ].map(([x, y, c]) => (
        <g key={`${x}`}>
          <circle cx={x as number} cy={y as number} r="7.5" fill={c as string} />
          <circle cx={x as number} cy={y as number} r="3" fill="#E4872E" />
        </g>
      ))}
    </>
  ),
  wikingerhelm: (
    <>
      <path d="M80 70c-16-4-24-20-20-36 6 10 14 16 24 18Z" fill="#F3E6C8" />
      <path d="M160 70c16-4 24-20 20-36-6 10-14 16-24 18Z" fill="#DCCBA5" />
      <path d="M76 86c0-28 20-44 44-44s44 16 44 44Z" fill="#B8C2D3" />
      <path d="M120 42c24 0 44 16 44 44h-22c0-26-8-40-22-44Z" fill="#8E9AB0" />
      <rect x="74" y="78" width="92" height="11" rx="5" fill="#8A6A3A" />
      <rect x="115" y="44" width="10" height="36" fill="#8A6A3A" />
    </>
  ),
  herzaugen: (
    <>
      {[104, 136].map((x) => (
        <g key={x} fill="#E0457B">
          <circle cx={x - 4} cy="97" r="5" />
          <circle cx={x + 4} cy="97" r="5" />
          <path d={`M${x - 9} 99L${x} 109L${x + 9} 99Z`} />
        </g>
      ))}
      <circle cx="101" cy="95" r="1.6" fill="#FFFFFF" />
      <circle cx="133" cy="95" r="1.6" fill="#FFFFFF" />
    </>
  ),
  taucherbrille: (
    <>
      <rect x="72" y="95" width="16" height="8" rx="3" fill="#1F6E78" />
      <rect x="152" y="95" width="16" height="8" rx="3" fill="#1F6E78" />
      <rect x="86" y="86" width="68" height="28" rx="12" fill="#2BB3C0" />
      <rect x="92" y="91" width="24" height="18" rx="7" fill="#CFF3F7" />
      <rect x="124" y="91" width="24" height="18" rx="7" fill="#CFF3F7" />
      <circle cx="104" cy="100" r="4.5" fill={INK} />
      <circle cx="136" cy="100" r="4.5" fill={INK} />
      <path d="M95 94l6 0M127 94l6 0" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  kapuzenpulli: (
    <>
      <rect {...TORSO} fill="#7A5BC7" />
      <path d="M90 136q30 24 60 0v10q-30 20-60 0Z" fill="#5E43A8" />
      <rect x="100" y="178" width="40" height="16" rx="7" fill="#5E43A8" />
      <path d="M112 150v14M128 150v14" stroke="#F3E6C8" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  trikot: (
    <>
      <rect {...TORSO} fill="#E4572E" />
      <rect x="84" y="156" width="72" height="9" fill="#FFFFFF" />
      <rect x="84" y="170" width="72" height="5" fill="#FFFFFF" />
      <path d="M108 133l12 14 12-14Z" fill="#C23F1E" />
      <circle cx="140" cy="146" r="5" fill="#FFE07A" />
    </>
  ),
  drachenruestung: (
    <>
      <rect {...TORSO} fill="#2F8F5B" />
      {[150, 166, 182, 198].map((y) =>
        [96, 112, 128, 144].map((x) => <path key={`${x}-${y}`} d={`M${x - 7} ${y}q7 9 14 0`} fill="none" stroke="#1F6E44" strokeWidth="3" strokeLinecap="round" />),
      )}
      <circle cx="88" cy="142" r="12" fill="#FFC531" />
      <circle cx="152" cy="142" r="12" fill="#FFC531" />
      <path d="m120 140 8 9-8 9-8-9Z" fill="#C4321F" />
    </>
  ),
  pinsel: (
    <>
      <path d="M160 198l26-56" stroke="#C98F4A" strokeWidth="7" strokeLinecap="round" />
      <path d="M182 150l10 4 4-10-10-4Z" fill="#B8C2D3" />
      <path d="M186 140l10 4c4-10 4-20-2-28-8 6-10 16-8 24Z" fill="#2F6FDB" />
    </>
  ),
  laterne: (
    <>
      <path d="M164 182c0-22 32-22 32 0" fill="none" stroke="#3B3B4F" strokeWidth="4" />
      <rect x="166" y="170" width="28" height="36" rx="7" fill="#3B3B4F" />
      <rect x="171" y="176" width="18" height="24" rx="5" fill="#FFE07A" />
      <circle cx="180" cy="190" r="5" fill="#FFA531" />
      <rect x="168" y="204" width="24" height="6" rx="3" fill="#2A2A3A" />
    </>
  ),
  dreizack: (
    <g transform="translate(180 150) rotate(16)">
      <rect x="-3" y="-48" width="6" height="100" rx="3" fill="#C98F00" />
      {[
        [-13, -68],
        [0, -80],
        [13, -68],
      ].map(([x, top]) => (
        <path key={x} d={`M${x - 2.5} -48V${top}h-3l5.5-11 5.5 11h-3V-48Z`} fill="#FFC531" />
      ))}
      <path d="M-17 -54h34v6q-17 10-34 0Z" fill="#FFC531" />
      <circle cx="0" cy="-48" r="4" fill="#2BB3C0" />
    </g>
  ),
  hamster: (
    <>
      <circle cx="30" cy="196" r="6" fill="#C98552" />
      <circle cx="58" cy="196" r="6" fill="#C98552" />
      <ellipse cx="44" cy="212" rx="24" ry="18" fill="#E8A660" />
      <ellipse cx="44" cy="218" rx="14" ry="10" fill="#F8DDB8" />
      <circle cx="36" cy="206" r="2.6" fill={INK} />
      <circle cx="52" cy="206" r="2.6" fill={INK} />
      <circle cx="44" cy="212" r="2" fill="#E0457B" />
    </>
  ),
  pinguin: (
    <>
      <ellipse cx="44" cy="202" rx="19" ry="28" fill="#2B2D42" />
      <ellipse cx="44" cy="208" rx="13" ry="20" fill="#FFFFFF" />
      <circle cx="38" cy="190" r="2.8" fill={INK} />
      <circle cx="50" cy="190" r="2.8" fill={INK} />
      <path d="M40 196h8l-4 6Z" fill="#FFA531" />
      <ellipse cx="36" cy="230" rx="7" ry="3" fill="#FFA531" />
      <ellipse cx="52" cy="230" rx="7" ry="3" fill="#FFA531" />
    </>
  ),
  phoenix: (
    <>
      <path d="M18 198c-8-22 4-40 22-36-10 8-12 20-6 32Z" fill="#FFA531" />
      <path d="M70 198c8-22-4-40-22-36 10 8 12 20 6 32Z" fill="#FFA531" />
      <ellipse cx="44" cy="204" rx="18" ry="20" fill="#E4572E" />
      <path d="M32 220c-6 10-4 16 2 18 0-6 4-10 10-12 6 2 10 6 10 12 6-2 8-8 2-18Z" fill="#FFC531" />
      <path d="M44 180c-4-8-2-14 4-16-2 6 2 8 0 16Z" fill="#FFC531" />
      <circle cx="38" cy="198" r="2.6" fill={INK} />
      <circle cx="50" cy="198" r="2.6" fill={INK} />
      <path d="M41 204h6l-3 5Z" fill="#FFC531" />
      {funkeln(72, 166, 7)}
    </>
  ),
  unterwasser: (
    <>
      <rect width="240" height="240" fill="#4FA3D1" />
      <rect width="240" height="90" fill="#7CC4E6" />
      <path d="M0 206c60-14 140-14 240 0v34H0Z" fill="#F3D89A" />
      <path d="M30 210c-10-20 10-30 0-52M42 210c10-24-8-34 4-56" fill="none" stroke="#3E8E5E" strokeWidth="6" strokeLinecap="round" />
      <path d="M200 212c-8-18 8-28 0-46" fill="none" stroke="#2E6F48" strokeWidth="6" strokeLinecap="round" />
      <circle cx="176" cy="70" r="6" fill="#CFF3F7" />
      <circle cx="188" cy="48" r="4" fill="#CFF3F7" />
      <circle cx="170" cy="30" r="3" fill="#CFF3F7" />
    </>
  ),
  burg: (
    <>
      <rect width="240" height="240" fill="#CFE3F5" />
      <rect x="20" y="96" width="200" height="110" fill="#9AA3B5" />
      {[60, 88, 116, 144, 172].map((x) => (
        <rect key={x} x={x} y="86" width="14" height="10" fill="#9AA3B5" />
      ))}
      <rect x="10" y="64" width="44" height="142" fill="#828CA0" />
      <rect x="186" y="64" width="44" height="142" fill="#828CA0" />
      <path d="M10 64v-10h11v10h11v-10h11v10h11v-10" fill="#828CA0" />
      <path d="M186 64v-10h11v10h11v-10h11v10h11v-10" fill="#828CA0" />
      <rect x="31" y="20" width="3" height="34" fill="#6E4A2A" />
      <path d="M34 20h22l-6 7 6 7H34Z" fill="#FFC531" />
      <path d="M100 206v-36a20 20 0 0 1 40 0v36Z" fill="#5A4636" />
      <path d="M0 204c60-10 140-10 240 0v36H0Z" fill="#8FCB8F" />
    </>
  ),
  // — Added 09.11.2026: two to buy and two chest treasures per place —
  kochmuetze: (
    <>
      <circle cx="96" cy="52" r="18" fill="#F4F1EA" />
      <circle cx="144" cy="52" r="18" fill="#DCD5C8" />
      <circle cx="120" cy="40" r="22" fill="#F4F1EA" />
      <path d="M120 18a22 22 0 0 1 0 44Z" fill="#E6E0D4" />
      <rect x="86" y="52" width="68" height="26" fill="#F4F1EA" />
      <rect x="120" y="52" width="34" height="26" fill="#E6E0D4" />
      <path d="M106 56v20M134 56v20" stroke="#CFC7B8" strokeWidth="3" strokeLinecap="round" />
      <rect x="80" y="74" width="80" height="13" rx="6" fill="#CFC7B8" />
    </>
  ),
  cowboyhut: (
    <>
      <path d="M60 80c10 10 30 12 60 12s50-2 60-12c-2 10-20 18-60 18s-58-8-60-18Z" fill="#8A5A32" />
      <path d="M90 82c-4-24 4-42 14-42 6 0 10 6 16 6s10-6 16-6c10 0 18 18 14 42Z" fill="#A86E45" />
      <path d="M120 46c6 0 10-6 16-6 10 0 18 18 14 42h-30Z" fill="#8A5A32" />
      <rect x="89" y="70" width="62" height="9" rx="3" fill="#5C3A1E" />
      <path d={stern(120, 74, 5)} fill="#D9DEE8" />
    </>
  ),
  raumhelm: (
    <>
      <path d="M120 42a56 56 0 1 1 0 112a56 56 0 1 1 0-112Zm0 18c-24 0-40 16-40 40s16 40 40 40 40-16 40-40-16-40-40-40Z" fill="#F4F6FA" fillRule="evenodd" />
      <path d="M120 42a56 56 0 0 1 0 112v-14c24 0 40-16 40-40s-16-40-40-40Z" fill="#D5DBE6" />
      <circle cx="120" cy="100" r="40" fill="#9FC6FF" opacity=".25" />
      <path d="M92 76a34 34 0 0 1 22-14" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" opacity=".8" />
      <rect x="58" y="92" width="10" height="20" rx="4" fill="#FF9F43" />
      <rect x="172" y="92" width="10" height="20" rx="4" fill="#FF9F43" />
      <path d="M156 56l10-16" stroke="#9AA3B5" strokeWidth="3" strokeLinecap="round" />
      <circle cx="167" cy="38" r="4" fill="#FFC531" />
    </>
  ),
  eiskrone: (
    <>
      <path d="M80 72 84 40l12 18 10-30 14 22 14-22 10 30 12-18 4 32Z" fill="#BFE8FF" />
      <path d="M120 50l14-22 10 30 12-18 4 32h-40Z" fill="#8FD0F2" />
      <rect x="80" y="62" width="80" height="12" rx="3" fill="#D9DEE8" />
      <path d="m120 60 7 8-7 8-7-8Z" fill="#4FB3E8" />
      <circle cx="98" cy="68" r="3" fill="#FFFFFF" />
      <circle cx="142" cy="68" r="3" fill="#FFFFFF" />
      <path d="M96 52l4-14M118 46l2-12" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity=".8" />
      {funkeln(172, 30, 7)}
    </>
  ),
  schlaefrig: (
    <>
      <path d="M97 100a7 7 0 0 0 14 0Z" fill={INK} />
      <path d="M129 100a7 7 0 0 0 14 0Z" fill={INK} />
      <circle cx="107" cy="103" r="1.5" fill="#FFFFFF" />
      <circle cx="139" cy="103" r="1.5" fill="#FFFFFF" />
      <path d="M95 99h18M127 99h18" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <path d="M97 99l-3-3M111 99l3-3M129 99l-3-3M143 99l3-3" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  zwinkern: (
    <>
      <path d="M97 101q7-7 14 0" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="136" cy="100" r="6" fill={INK} />
      <circle cx="138" cy="98" r="2" fill="#FFFFFF" />
      <path d="M95 93l5 3" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  monokel: (
    <>
      <circle cx="104" cy="100" r="5.5" fill={INK} />
      <circle cx="106" cy="98" r="1.8" fill="#FFFFFF" />
      <circle cx="136" cy="100" r="11" fill="#CDEBF7" opacity=".7" />
      <circle cx="136" cy="100" r="5.5" fill={INK} />
      <circle cx="138" cy="98" r="1.8" fill="#FFFFFF" />
      <circle cx="136" cy="100" r="11" fill="none" stroke="#FFC531" strokeWidth="3.5" />
      <path d="M146 106q8 10 4 24" fill="none" stroke="#C98F00" strokeWidth="2" strokeDasharray="3 2" />
      <path d="M129 94a8 8 0 0 1 6-3" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  feueraugen: (
    <>
      {[104, 136].map((x) => (
        <g key={x}>
          <path d={`M${x - 5} 90q-2-7 3-11 0 5 3 5 0-6 4-9 0 8 2 15Z`} fill="#FFA531" />
          <circle cx={x} cy="100" r="8" fill="#FFFFFF" />
          <circle cx={x} cy="101" r="6" fill="#E4572E" />
          <circle cx={x} cy="102" r="3" fill="#FFC531" />
          <circle cx={x + 2} cy="98" r="1.8" fill="#FFFFFF" />
        </g>
      ))}
    </>
  ),
  regenjacke: (
    <>
      <rect {...TORSO} fill="#FFC531" />
      <path d="M96 132l24 16 24-16v10l-24 14-24-14Z" fill="#E5A800" />
      <rect x="118" y="148" width="4" height="60" fill="#E5A800" />
      {[160, 178, 196].map((y) => (
        <rect key={y} x="112" y={y} width="16" height="5" rx="2.5" fill="#8A5A32" />
      ))}
      <rect x="92" y="180" width="18" height="12" rx="3" fill="#E5A800" />
      <rect x="130" y="180" width="18" height="12" rx="3" fill="#E5A800" />
    </>
  ),
  ninjaanzug: (
    <>
      <rect {...TORSO} fill="#2B3A67" />
      <path d="M100 133l20 26 20-26" fill="none" stroke="#5C8FE0" strokeWidth="4" />
      <path d="M120 159l18-26h6l-22 32Z" fill="#1E2A50" />
      <rect x="84" y="172" width="72" height="10" fill="#C4321F" />
      <path d="M126 182l6 16 6-2-6-14Z" fill="#C4321F" />
      <circle cx="126" cy="177" r="5" fill="#9E2617" />
    </>
  ),
  raumanzug: (
    <>
      <rect {...TORSO} fill="#F4F6FA" />
      <rect x="84" y="186" width="72" height="22" rx="10" fill="#D5DBE6" />
      <rect x="84" y="148" width="72" height="5" fill="#FF9F43" />
      <rect x="104" y="158" width="32" height="20" rx="4" fill="#2F6FDB" />
      <circle cx="112" cy="168" r="3" fill="#E4572E" />
      <circle cx="120" cy="168" r="3" fill="#FFC531" />
      <circle cx="128" cy="168" r="3" fill="#3FB37F" />
      <circle cx="98" cy="140" r="6" fill="#2F6FDB" />
      <path d={stern(98, 140, 4)} fill="#FFFFFF" />
    </>
  ),
  kristallruestung: (
    <>
      <rect {...TORSO} fill="#BFE8FF" />
      <path d="M84 160l18-20 18 20 18-20 18 20v20l-18-12-18 12-18-12-18 12Z" fill="#8FD0F2" />
      <rect x="84" y="196" width="72" height="6" fill="#D9DEE8" />
      <path d="M78 142l10-12 12 12-12 12Z" fill="#8FD0F2" />
      <path d="M162 142l-10-12-12 12 12 12Z" fill="#8FD0F2" />
      <path d="m120 150 9 10-9 12-9-12Z" fill="#4FB3E8" />
      <path d="m120 150 9 10h-9Z" fill="#FFFFFF" opacity=".7" />
      {funkeln(146, 156, 6)}
    </>
  ),
  angel: (
    <>
      <path d="M160 198l40-90" stroke="#A86E45" strokeWidth="5" strokeLinecap="round" />
      <circle cx="172" cy="178" r="6" fill="#7F8AA1" />
      <path d="M200 108q16 20 12 58" fill="none" stroke="#9AA3B5" strokeWidth="1.5" />
      <circle cx="212" cy="170" r="6" fill="#FFFFFF" />
      <path d="M206 170a6 6 0 0 1 12 0Z" fill="#E4572E" />
    </>
  ),
  bumerang: (
    <g transform="rotate(-20 176 166)">
      <path d="M150 190c4-26 14-44 30-52l8 8c-12 8-20 24-24 46Z" fill="#C98F4A" />
      <path d="M180 138c18 0 32 8 40 22l-8 8c-6-10-18-18-32-20Z" fill="#B87333" />
      <path d="M156 178l10 2M162 160l10 4M196 146l2 10M208 152l-2 10" stroke="#2F6FDB" strokeWidth="4" strokeLinecap="round" />
      <circle cx="182" cy="146" r="3" fill="#FF9F43" />
    </g>
  ),
  hammer: (
    <g transform="rotate(18 168 180)">
      <rect x="162" y="128" width="9" height="76" rx="4" fill="#8A6A3A" />
      <rect x="161" y="176" width="11" height="22" rx="3" fill="#5C3A1E" />
      <rect x="142" y="112" width="50" height="28" rx="10" fill="#9AA3B5" />
      <rect x="142" y="126" width="50" height="14" rx="6" fill="#7F8AA1" />
      <circle cx="167" cy="126" r="5" fill="#C4321F" />
    </g>
  ),
  blitzstab: (
    <>
      <path d="M162 200l26-74" stroke="#C98F00" strokeWidth="7" strokeLinecap="round" />
      <circle cx="189" cy="124" r="10" fill="#FFC531" />
      <path d="M194 92l-16 26h10l-8 24 20-30h-11l9-20Z" fill="#FFE07A" />
      <path d="M194 92l-6 20h11l-19 30 4-14" fill="#FFC531" />
      <circle cx="210" cy="108" r="2.5" fill="#FFE07A" />
      <circle cx="172" cy="100" r="2" fill="#FFE07A" />
      {funkeln(214, 90, 7)}
    </>
  ),
  igel: (
    <>
      <path d="M18 218c0-26 14-38 30-38s28 12 28 26l-6 12Z" fill="#7A4E2E" />
      {[24, 34, 44, 54, 64].map((x) => (
        <path key={x} d={`M${x - 6} ${196 - (x === 44 ? 6 : 0)}l6-12 6 12Z`} fill="#5F3A20" />
      ))}
      <ellipse cx="62" cy="214" rx="14" ry="12" fill="#E8C3A2" />
      <circle cx="76" cy="214" r="3" fill={INK} />
      <circle cx="62" cy="209" r="2.4" fill={INK} />
      <ellipse cx="36" cy="226" rx="6" ry="3" fill="#5F3A20" />
      <ellipse cx="58" cy="226" rx="6" ry="3" fill="#5F3A20" />
    </>
  ),
  papagei: (
    <>
      <path d="M38 214l-8 22h12l4-18Z" fill="#2F6FDB" />
      <ellipse cx="44" cy="198" rx="16" ry="22" fill="#E4572E" />
      <path d="M32 194c-6 10-4 22 6 26 0-10 2-18 6-24Z" fill="#2F6FDB" />
      <path d="M56 194c4 10 2 20-6 24 0-8-2-16-4-22Z" fill="#FFC531" />
      <circle cx="44" cy="182" r="12" fill="#E4572E" />
      <circle cx="40" cy="179" r="2.6" fill={INK} />
      <path d="M46 184c6-2 10 2 8 8-2-3-5-4-8-4Z" fill="#3B3B4F" />
      <ellipse cx="38" cy="226" rx="5" ry="2.5" fill="#7F8AA1" />
      <ellipse cx="50" cy="226" rx="5" ry="2.5" fill="#7F8AA1" />
    </>
  ),
  axolotl: (
    <>
      <path d="M60 214c12 0 20-6 22-14-8 4-14 4-20 6Z" fill="#F29AC0" />
      <ellipse cx="44" cy="212" rx="22" ry="14" fill="#F7B8D2" />
      {[-1, 1].map((d) => (
        <g key={d} fill="#E0457B">
          <path d={`M${44 + d * 16} 186l${d * 12} -8 ${-d * 2} 6Z`} />
          <path d={`M${44 + d * 17} 192l${d * 14} -2 ${-d * 4} 5Z`} />
          <path d={`M${44 + d * 16} 198l${d * 12} 5 ${-d * 6} 2Z`} />
        </g>
      ))}
      <ellipse cx="44" cy="192" rx="18" ry="14" fill="#F7B8D2" />
      <circle cx="37" cy="190" r="2.6" fill={INK} />
      <circle cx="51" cy="190" r="2.6" fill={INK} />
      <path d="M38 197q6 5 12 0" fill="none" stroke="#B8336A" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  einhorn: (
    <>
      <path d="M18 202c-10 2-14 14-8 22 2-8 6-12 12-14Z" fill="#B79CFF" />
      <path d="M16 206c-6 6-4 16 2 18 0-6 2-10 6-12Z" fill="#F29AC0" />
      <rect x="24" y="210" width="7" height="20" rx="3" fill="#E6D8F0" />
      <rect x="50" y="210" width="7" height="20" rx="3" fill="#E6D8F0" />
      <ellipse cx="40" cy="204" rx="24" ry="14" fill="#FBF3FF" />
      <ellipse cx="40" cy="210" rx="20" ry="7" fill="#EFE3F6" />
      <path d="M56 200l8-18 10 4-6 16Z" fill="#FBF3FF" />
      <circle cx="68" cy="180" r="13" fill="#FBF3FF" />
      <ellipse cx="78" cy="186" rx="8" ry="6" fill="#EFE3F6" />
      <path d="M58 172c-6 6-6 18 0 26 2-8 4-14 8-18Z" fill="#F29AC0" />
      <path d="M62 168c-4 4-6 10-4 14 4-4 8-6 12-6Z" fill="#9FC6FF" />
      <path d="M70 168l4-20 6 18Z" fill="#FFC531" />
      <circle cx="70" cy="178" r="2.6" fill={INK} />
      <circle cx="80" cy="186" r="1.3" fill="#C9A9D9" />
    </>
  ),
  wueste: (
    <>
      <rect width="240" height="240" fill="#FFE9C2" />
      <circle cx="190" cy="48" r="20" fill="#FFC531" />
      <path d="M0 176c40-24 90-24 130-6s70 10 110-4v74H0Z" fill="#F0C77A" />
      <path d="M0 202c70-16 150-16 240 0v38H0Z" fill="#E5B05E" />
      <rect x="30" y="140" width="12" height="50" rx="6" fill="#4F9A5F" />
      <path d="M30 168h-8v-14" fill="none" stroke="#4F9A5F" strokeWidth="8" strokeLinecap="round" />
      <path d="M42 160h8v-12" fill="none" stroke="#3E8450" strokeWidth="8" strokeLinecap="round" />
      <rect x="200" y="154" width="10" height="38" rx="5" fill="#3E8450" />
      <path d="M210 172h6v-10" fill="none" stroke="#3E8450" strokeWidth="7" strokeLinecap="round" />
    </>
  ),
  winterwald: (
    <>
      <rect width="240" height="240" fill="#DDEBF5" />
      {[
        [26, 196, 30],
        [212, 196, 32],
        [62, 200, 22],
        [178, 200, 24],
      ].map(([x, y, h]) => (
        <g key={x}>
          <path d={`M${x - h * 0.6} ${y}L${x} ${y - h * 3}L${x + h * 0.6} ${y}Z`} fill="#2E6F48" />
          <path d={`M${x - h * 0.4} ${y - h * 1.6}L${x} ${y - h * 3}L${x + h * 0.4} ${y - h * 1.6}q-${h * 0.4} 6-${h * 0.8} 0Z`} fill="#FFFFFF" />
        </g>
      ))}
      {[
        [40, 40],
        [96, 70],
        [150, 30],
        [200, 90],
        [120, 120],
        [70, 140],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="#FFFFFF" />
      ))}
      <path d="M0 194c60-14 140-14 240 0v46H0Z" fill="#FFFFFF" />
      <path d="M0 214c80-8 160-8 240 0v26H0Z" fill="#E6EEF5" />
    </>
  ),
  vulkan: (
    <>
      <rect width="240" height="240" fill="#FFD9B8" />
      <path d="M60 150l46-74h28l46 74Z" fill="#7A5A4A" />
      <path d="M120 76h14l46 74h-36Z" fill="#5F4436" />
      <path d="M106 76h28l-6 12-8-6-8 6Z" fill="#FF7A3D" />
      <ellipse cx="128" cy="52" rx="18" ry="12" fill="#C9BDB8" />
      <ellipse cx="146" cy="34" rx="14" ry="10" fill="#DDD4D0" />
      <rect y="148" width="240" height="44" fill="#2BB3C0" />
      <path d="M0 190c60-12 140-12 240 0v50H0Z" fill="#5A4E4E" />
      <path d="M200 200c-2-24 2-44 6-56" fill="none" stroke="#8A5A32" strokeWidth="6" strokeLinecap="round" />
      <path d="M206 144c-16-6-28 0-32 8 12-4 22-4 32-8Zm0 0c14-8 28-4 32 4-12-2-22-2-32-4Z" fill="#3FB37F" />
    </>
  ),
  wolkenschloss: (
    <>
      <rect width="240" height="240" fill="#FFD3E2" />
      <rect width="240" height="110" fill="#FFC9A8" />
      <rect x="64" y="100" width="112" height="80" fill="#FFFFFF" />
      <rect x="52" y="70" width="30" height="110" rx="6" fill="#F4F0FA" />
      <rect x="158" y="70" width="30" height="110" rx="6" fill="#F4F0FA" />
      <rect x="104" y="56" width="32" height="64" rx="6" fill="#FFFFFF" />
      <path d="M48 72l19-30 19 30ZM154 72l19-30 19 30ZM100 58l20-34 20 34Z" fill="#FFC531" />
      <path d="M108 180v-26a12 12 0 0 1 24 0v26Z" fill="#F29AC0" />
      <circle cx="40" cy="190" r="26" fill="#FFFFFF" />
      <circle cx="200" cy="190" r="28" fill="#FFFFFF" />
      <path d="M0 196c60-14 140-14 240 0v44H0Z" fill="#FFFFFF" />
      <path d="M0 220c80-8 160-8 240 0v20H0Z" fill="#F4F0FA" />
      {funkeln(206, 36, 8)}
    </>
  ),
};

/** Hair as vector, in a colour: `hinten` goes behind the head and body (ponytail, long hair), `vorn` on top. */
const HAAR_ZEICHNUNG: Record<string, { hinten?: (c: string) => ReactNode; vorn?: (c: string) => ReactNode }> = {
  kurz: { vorn: (c) => <path d="M78 90c0-28 18-42 42-42s42 14 42 42c-10-12-24-18-42-18s-32 6-42 18Z" fill={c} /> },
  zopf: {
    hinten: (c) => (
      <>
        <path d="M156 66c20-2 30 18 26 42-2 12-10 22-18 24 6-14 6-34-8-46Z" fill={c} />
        <circle cx="160" cy="68" r="6" fill="#E4572E" />
      </>
    ),
    vorn: (c) => <path d="M78 90c0-28 18-42 42-42s42 14 42 42c-10-12-24-18-42-18s-32 6-42 18Z" fill={c} />,
  },
  locken: {
    vorn: (c) => (
      <>
        <path d="M78 90c0-28 18-42 42-42s42 14 42 42c-10-12-24-18-42-18s-32 6-42 18Z" fill={c} />
        {[
          [80, 88],
          [84, 70],
          [96, 57],
          [112, 50],
          [128, 50],
          [144, 57],
          [156, 70],
          [160, 88],
        ].map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="12" fill={c} />
        ))}
      </>
    ),
  },
  lang: {
    hinten: (c) => <rect x="70" y="58" width="100" height="104" rx="40" fill={c} />,
    vorn: (c) => <path d="M76 98c0-32 18-50 44-50s44 18 44 50c-6-16-20-26-44-26s-38 10-44 26Z" fill={c} />,
  },
  zoepfe: {
    hinten: (c) => (
      <>
        <path d="M84 70c-20-2-30 18-26 42 2 12 10 22 18 24-6-14-6-34 8-46Z" fill={c} />
        <path d="M156 70c20-2 30 18 26 42-2 12-10 22-18 24 6-14 6-34-8-46Z" fill={c} />
        <circle cx="80" cy="72" r="6" fill="#2F6FDB" />
        <circle cx="160" cy="72" r="6" fill="#2F6FDB" />
      </>
    ),
    vorn: (c) => <path d="M78 90c0-28 18-42 42-42s42 14 42 42c-10-12-24-18-42-18s-32 6-42 18Z" fill={c} />,
  },
  dutt: {
    vorn: (c) => (
      <>
        <circle cx="120" cy="44" r="15" fill={c} />
        <path d="M78 90c0-28 18-42 42-42s42 14 42 42c-10-12-24-18-42-18s-32 6-42 18Z" fill={c} />
        <rect x="106" y="54" width="28" height="5" rx="2.5" fill="#E0457B" />
      </>
    ),
  },
  stacheln: {
    vorn: (c) => (
      <path d="M76 90l2-28 12 8 4-24 14 14 12-20 12 20 14-14 4 24 12-8 2 28c-10-12-24-18-42-18s-32 6-42 18Z" fill={c} />
    ),
  },
  bob: {
    hinten: (c) => <rect x="72" y="56" width="96" height="84" rx="38" fill={c} />,
    vorn: (c) => <path d="M76 92c0-30 20-46 44-46s44 16 44 46c-14-6-28-8-44-8s-30 2-44 8Z" fill={c} />,
  },
  glatze: {},
};

/** The bald body with a blank face (no eyes, no mouth): the layer every part and the hair sit on. Body and pose are the same for all,
 *  so every part fits every hair and skin tone; `hinten` is the hair behind it (vector drawing only). */
function Koerper({ haut, hinten }: { haut: number; hinten?: ReactNode }) {
  const h = HAUT[haut] ?? HAUT[0];
  const s = HAUT_SCHATTEN[haut] ?? HAUT_SCHATTEN[0];
  return (
    <g>
      {hinten}
      <ellipse cx="120" cy="228" rx="58" ry="8" fill={INK} opacity=".15" />
      <rect x="98" y="196" width="18" height="30" rx="8" fill="#3B2A1A" />
      <rect x="124" y="196" width="18" height="30" rx="8" fill="#3B2A1A" />
      <rect {...TORSO} fill={h} />
      <circle cx="78" cy="184" r="11" fill={h} />
      <circle cx="164" cy="184" r="11" fill={h} />
      <circle cx="76" cy="102" r="9" fill={s} />
      <circle cx="164" cy="102" r="9" fill={s} />
      <circle cx="120" cy="96" r="44" fill={h} />
    </g>
  );
}

const WANGE = '#F29A9A';
const MUND_INNEN = '#7A2E2E';
const ZUNGE = '#F28B8B';
/** The cheeks that belong to every mouth (the painted mouths bring their own). */
const baeckchen = (
  <>
    <circle cx="96" cy="112" r="6" fill={WANGE} opacity=".55" />
    <circle cx="144" cy="112" r="6" fill={WANGE} opacity=".55" />
  </>
);

/** Each mouth drawn, centred at x 120 on the lower third of the face (y 108–128) so it sits on the painted head too;
 *  the vector drawing shows until the painted mouth of that id exists (`mundBild`). */
const MUND_ZEICHNUNG: Record<string, ReactNode> = {
  laecheln: (
    <>
      {baeckchen}
      <path d="M108 116q12 9 24 0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  grinsen: (
    <>
      {baeckchen}
      <path d="M105 113h30q-3 13-15 13t-15-13Z" fill="#FFFFFF" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
    </>
  ),
  lachen: (
    <>
      {baeckchen}
      <path d="M107 112h26q0 15-13 15t-13-15Z" fill={MUND_INNEN} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <ellipse cx="120" cy="122.5" rx="6.5" ry="3.5" fill={ZUNGE} />
    </>
  ),
  staunen: (
    <>
      {baeckchen}
      <ellipse cx="120" cy="118" rx="5.5" ry="7" fill={MUND_INNEN} stroke={INK} strokeWidth="3" />
    </>
  ),
  frech: (
    <>
      {baeckchen}
      <path d="M115 120.5v6a5 5 0 0 0 10 0v-6Z" fill={ZUNGE} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M107 115q13 10 26 0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  ernst: (
    <>
      {baeckchen}
      <path d="M111 120h18" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
    </>
  ),
};

/** Back to front; the body sits between companion and clothes, the hair over the clothes (long hair falls on them),
 *  the mouth under the head part (a diving mask or helmet may cover it). */
const EBENEN: (Slot | 'koerper' | 'haare' | 'mund')[] = ['hintergrund', 'begleiter', 'koerper', 'kleidung', 'haare', 'augen', 'mund', 'kopf', 'werkzeug'];

/** Where a painted Legendär part gets its sparkle (the vector parts draw their own). */
const FUNKELN: Record<Slot, [number, number]> = {
  hintergrund: [206, 36],
  begleiter: [80, 162],
  kleidung: [150, 146],
  augen: [154, 90],
  kopf: [158, 18],
  werkzeug: [212, 104],
};

/** A whole-canvas layer picture (teilBilder.ts). */
const ebene = (href: string) => <image href={href} width="240" height="240" />;

/** One part: its uploaded picture (hochgeladen.tsx), else its built-in painted picture (src/lernquest/app/teile/),
 *  else its vector drawing. */
function Zeichnung({ teil }: { teil: Teil | undefined }) {
  const hochgeladen = useContext(HochgeladeneBilder);
  if (!teil) return null;
  const bild = hochgeladen[teil.id] ?? teilBild(teil.id);
  if (!bild) return <>{ZEICHNUNG[teil.id] ?? null}</>;
  return (
    <>
      {ebene(bild)}
      {teil.seltenheit >= 4 && funkeln(...FUNKELN[teil.slot])}
    </>
  );
}

/** The base figure: painted (in the chosen skin tone) when there is one, else drawn with the hair behind it. */
function Grundfigur({ avatar }: { avatar: Avatar }) {
  const haut = avatar.haut ?? 0;
  const bild = koerperBild(haut);
  if (bild) return ebene(bild);
  return <Koerper haut={haut} hinten={HAAR_ZEICHNUNG[frisurVon(avatar)]?.hinten?.(HAARFARBEN[haarfarbeVon(avatar)].farbe)} />;
}

/** The hair over the body: painted when there is a picture, else the front of the vector hair. */
function Haare({ avatar }: { avatar: Avatar }) {
  const frisur = frisurVon(avatar);
  const farbe = haarfarbeVon(avatar);
  const bild = haareBild(frisur, farbe);
  return bild ? ebene(bild) : <>{HAAR_ZEICHNUNG[frisur]?.vorn?.(HAARFARBEN[farbe].farbe) ?? null}</>;
}

/** The mouth over the blank face: painted when there is a picture, else drawn. */
function Mund({ avatar }: { avatar: Avatar }) {
  const mund = mundVon(avatar);
  const bild = mundBild(mund);
  return bild ? ebene(bild) : <>{MUND_ZEICHNUNG[mund] ?? null}</>;
}

/** The head of the hero with some hair, colour and mouth, for choosing them (`nah`: only the lower face, for mouths). */
export function KopfBild({ avatar, nah }: { avatar: Avatar; nah?: boolean }) {
  return (
    <svg viewBox={nah ? '88 84 64 52' : '58 30 124 104'} aria-hidden focusable="false">
      <Grundfigur avatar={avatar} />
      <Haare avatar={avatar} />
      <Mund avatar={avatar} />
    </svg>
  );
}

/** The head and shoulders of the whole hero, for small round pictures (the head bar). */
export const AUSSCHNITT_KOPF = '45 8 150 150';

/** The whole hero as worn (or the part `ausschnitt` of it). Decorative (the page names the hero in text), so hidden from screen readers. */
export function AvatarBild({ avatar, className, ausschnitt = '0 0 240 240' }: { avatar: Avatar; className?: string; ausschnitt?: string }) {
  return (
    <svg className={className} viewBox={ausschnitt} aria-hidden focusable="false">
      {EBENEN.map((e) =>
        e === 'koerper' ? (
          <Grundfigur key={e} avatar={avatar} />
        ) : e === 'haare' ? (
          <g key={e}>
            <Haare avatar={avatar} />
          </g>
        ) : e === 'mund' ? (
          <g key={e}>
            <Mund avatar={avatar} />
          </g>
        ) : (
          <g key={e}>
            <Zeichnung teil={angelegt(avatar, e)} />
          </g>
        ),
      )}
    </svg>
  );
}

/** The cut-out of the canvas a part is shown in (the same drawing, no second picture). */
const AUSSCHNITT: Record<Slot, string> = {
  hintergrund: '0 0 240 240',
  begleiter: '0 140 100 96',
  kleidung: '64 118 112 100',
  augen: '78 64 84 72',
  kopf: '56 0 128 104',
  werkzeug: '128 96 104 112',
};

/** One part alone, cut out for the grid, the shop and the chest; eyes sit on the hero's head so they read as eyes. */
export function TeilBild({ teil, avatar = {}, className }: { teil: Teil; avatar?: Avatar; className?: string }) {
  return (
    <svg className={className} viewBox={AUSSCHNITT[teil.slot]} aria-hidden focusable="false">
      {teil.slot === 'augen' && (
        <>
          <Grundfigur avatar={avatar} />
          <Haare avatar={avatar} />
        </>
      )}
      <Zeichnung teil={teil} />
    </svg>
  );
}

/** For the test: every part of the catalogue, every hair and every mouth has a drawing. */
export const hatZeichnung = (id: string) => id in ZEICHNUNG;
export const hatHaarZeichnung = (id: string) => id in HAAR_ZEICHNUNG;
export const hatMundZeichnung = (id: string) => id in MUND_ZEICHNUNG;
