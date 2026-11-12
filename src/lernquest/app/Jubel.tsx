// Confetti for a moment of joy (Stufe E, Teil 6): a star, a perfect round, a milestone, a rare find in a chest.
// Pure CSS pieces that fall once; with „Bewegung reduzieren“ nothing shows (lernquest.css). Decorative only.
import type { CSSProperties } from 'react';

export function Jubel({ stark = false }: { stark?: boolean }) {
  const n = stark ? 36 : 22;
  return (
    <div className="lq-jubel" aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          style={
            {
              '--x': `${(i * 37 + 7) % 100}%`,
              '--v': `${(i * 53) % 700}ms`,
              '--d': `${1500 + ((i * 71) % 900)}ms`,
              '--r': `${(i * 47) % 360}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
