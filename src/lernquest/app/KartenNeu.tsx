// What is new on the map since the child last looked (27.11.2026): new stars of a station pop in one after the other,
// and when another station became the current one, the hero hops over to it. Remembered on this device only
// (`lernquest:karte-gesehen`), written a moment after showing, so a remount (React's double mount in development) does
// not swallow the moment.
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Avatar } from '../teile';
import { AvatarBild } from './avatar';
import { ton } from './ton';

const SCHLUESSEL = 'lernquest:karte-gesehen';
interface Gesehen {
  sterne: Record<string, number>;
  aktuell?: string;
}

function gesehen(): Gesehen | null {
  try {
    return JSON.parse(localStorage.getItem(SCHLUESSEL) ?? 'null');
  } catch {
    return null;
  }
}

/** Writes what the map shows now, a moment later (and not at all when it is gone by then). */
function useMerken(f: (g: Gesehen) => void, abh: unknown[]) {
  useEffect(() => {
    const t = window.setTimeout(() => {
      const g = gesehen() ?? { sterne: {} };
      f(g);
      try {
        localStorage.setItem(SCHLUESSEL, JSON.stringify(g));
      } catch {
        // private window: the map just shows no news
      }
    }, 1200);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, abh);
}

/** The three stars of a station; the ones won since the child last saw the map pop in, with the star sound. */
export function StationsSterne({ stunde, sterne, icon }: { stunde?: string; sterne: number; icon: ReactNode }) {
  const [vorher] = useState(() => (stunde ? gesehen()?.sterne[stunde] : undefined));
  const neu = vorher === undefined ? 0 : Math.max(0, sterne - vorher);
  useEffect(() => {
    if (!neu) return;
    const t = window.setTimeout(() => ton('stern'), 450);
    return () => window.clearTimeout(t);
  }, [neu]);
  useMerken(
    (g) => {
      if (stunde) g.sterne[stunde] = sterne;
    },
    [stunde, sterne],
  );
  return (
    <span className="lq-stufen" aria-hidden>
      {[0, 1, 2].map((i) => {
        const frisch = i < sterne && i >= sterne - neu;
        return (
          <span key={i} className={i < sterne ? (frisch ? 'an neu' : 'an') : ''} style={frisch ? { animationDelay: `${450 + (i - (sterne - neu)) * 260}ms` } : undefined}>
            {icon}
          </span>
        );
      })}
    </span>
  );
}

/** The hero beside the current station; when the current station changed since the last look, it hops over. */
export function PfadHeld({ stunde, avatar }: { stunde?: string; avatar: Avatar }) {
  const [vorher] = useState(() => gesehen()?.aktuell);
  const kommt = vorher !== undefined && !!stunde && vorher !== stunde;
  useMerken(
    (g) => {
      g.aktuell = stunde;
    },
    [stunde],
  );
  return <AvatarBild avatar={{ ...avatar, hintergrund: '' }} className={`lq-pfad-held${kommt ? ' kommt' : ''}`} lebendig animation={kommt ? 'huepfen' : undefined} />;
}
