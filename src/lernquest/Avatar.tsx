// The hero, drawn in layers (design: docs/design/lernquest/Held.dc.html, 358 × 268): background, companion, body with
// the chosen skin tone, clothing, hairstyle (tinted with the hair colour), eyes, head part, tool. Every part is a
// transparent picture placed into its place's box, moved and scaled by its `lage`. Parts without a picture draw the
// simple default (sky, plain shirt, dot eyes) or nothing. Used by the teacher's catalogue page and the children's app.
import { useId } from 'react';
import { angelegt, HAARE, HAUT, LAGE_NORMAL, type Avatar, type Slot, type Teil } from './teile';

export const BUEHNE = { w: 358, h: 268 };

/** The box of each place on the stage (viewBox units): a picture is fitted into it, centred. */
export const SLOT_BOX: Record<Slot, { x: number; y: number; w: number; h: number }> = {
  hintergrund: { x: 0, y: 0, w: 358, h: 268 },
  begleiter: { x: 56, y: 140, w: 76, h: 104 },
  kleidung: { x: 124, y: 132, w: 110, h: 112 },
  frisur: { x: 129, y: 50, w: 100, h: 104 },
  augen: { x: 149, y: 92, w: 60, h: 34 },
  kopf: { x: 109, y: 22, w: 140, h: 74 },
  werkzeug: { x: 196, y: 120, w: 96, h: 96 },
};

/** Line under which hair shows when a head part is worn (the hat's brim). */
const HUTKANTE = 84;

interface Props {
  avatar: Avatar;
  katalog: Teil[];
  /** Shown instead of what is worn on its place (the editor's preview). */
  vorschau?: Teil;
  /** Outline the box of this place (the editor). */
  rahmen?: Slot;
  className?: string;
  label?: string;
}

function Bild({ teil, url, slot }: { teil: Teil; url: string; slot: Slot }) {
  const b = SLOT_BOX[slot];
  const l = teil.lage ?? LAGE_NORMAL;
  const cx = b.x + b.w / 2 + (l.x / 100) * b.w;
  const cy = b.y + b.h / 2 + (l.y / 100) * b.h;
  const w = b.w * l.s;
  const h = b.h * l.s;
  return <image href={url} x={cx - w / 2} y={cy - h / 2} width={w} height={h} preserveAspectRatio={slot === 'hintergrund' ? 'xMidYMid slice' : 'xMidYMid meet'} />;
}

export function AvatarBild({ avatar, katalog, vorschau, rahmen, className, label }: Props) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const teil = (slot: Slot) => (vorschau?.slot === slot ? vorschau : angelegt(avatar, slot, katalog));
  const haut = HAUT[avatar.haut ?? 0] ?? HAUT[0];
  const haar = HAARE[avatar.haar ?? 0] ?? HAARE[0];
  const t = {
    hintergrund: teil('hintergrund'),
    begleiter: teil('begleiter'),
    kleidung: teil('kleidung'),
    frisur: teil('frisur'),
    augen: teil('augen'),
    kopf: teil('kopf'),
    werkzeug: teil('werkzeug'),
  };
  const hut = !!t.kopf?.bild;
  const haarBild = t.frisur && (hut && t.frisur.bildKurz ? t.frisur.bildKurz : t.frisur.bild);
  const lage = (slot: Slot) => {
    const x = t[slot as keyof typeof t];
    return x?.bild ? <Bild key={slot} teil={x} url={x.bild} slot={slot} /> : null;
  };

  return (
    <svg className={className} viewBox={`0 0 ${BUEHNE.w} ${BUEHNE.h}`} role="img" aria-label={label ?? 'Held'}>
      <defs>
        {/* Multiplies the light grey hair with the hair colour, keeping its shading and transparency. */}
        <filter id={`haar${id}`} colorInterpolationFilters="sRGB">
          <feFlood floodColor={haar} result="f" />
          <feBlend in="f" in2="SourceGraphic" mode="multiply" result="m" />
          <feComposite in="m" in2="SourceGraphic" operator="in" />
        </filter>
        <clipPath id={`hut${id}`}>
          <rect x="0" y={HUTKANTE} width={BUEHNE.w} height={BUEHNE.h} />
        </clipPath>
      </defs>
      {t.hintergrund?.bild ? (
        lage('hintergrund')
      ) : (
        <g>
          <rect width="358" height="268" fill="#BFE3F2" />
          <circle cx="292" cy="58" r="26" fill="#FFE07A" />
          <path d="M0 190 60 120l50 50 60-80 80 90 50-40 58 50v78H0Z" fill="#8FC7A6" />
          <path d="M0 210c60-24 120-24 179-8s120 14 179-6v72H0Z" fill="#5FA77E" />
        </g>
      )}
      <ellipse cx="179" cy="240" rx="70" ry="12" fill="#3F7F5B" opacity=".5" />
      {lage('begleiter')}
      {/* Body: legs, plain shirt, head, hand. */}
      <rect x="156" y="216" width="18" height="24" rx="8" fill="#3B2A1A" />
      <rect x="184" y="216" width="18" height="24" rx="8" fill="#3B2A1A" />
      {t.kleidung?.bild ? lage('kleidung') : <rect x="146" y="138" width="66" height="84" rx="26" fill="#2F6FDB" />}
      <circle cx="179" cy="108" r="40" fill={haut} />
      <circle cx="154" cy="122" r="6" fill="#F29A9A" opacity=".6" />
      <circle cx="204" cy="122" r="6" fill="#F29A9A" opacity=".6" />
      <path d="M170 126c6 5 12 5 18 0" fill="none" stroke="#1F1A3D" strokeWidth="3" strokeLinecap="round" />
      {haarBild && t.frisur && (
        <g filter={`url(#haar${id})`} clipPath={hut && !t.frisur.bildKurz ? `url(#hut${id})` : undefined}>
          <Bild teil={t.frisur} url={haarBild} slot="frisur" />
        </g>
      )}
      {t.augen?.bild ? (
        lage('augen')
      ) : (
        <g>
          <circle cx="165" cy="110" r="5.5" fill="#1F1A3D" />
          <circle cx="193" cy="110" r="5.5" fill="#1F1A3D" />
          <circle cx="167" cy="108" r="1.8" fill="#fff" />
          <circle cx="195" cy="108" r="1.8" fill="#fff" />
        </g>
      )}
      {lage('kopf')}
      {lage('werkzeug')}
      <circle cx="214" cy="178" r="11" fill={haut} />
      {rahmen && (
        <rect
          x={SLOT_BOX[rahmen].x}
          y={SLOT_BOX[rahmen].y}
          width={SLOT_BOX[rahmen].w}
          height={SLOT_BOX[rahmen].h}
          fill="none"
          stroke="#5B3FD9"
          strokeWidth="1.5"
          strokeDasharray="5 4"
          rx="6"
        />
      )}
    </svg>
  );
}
