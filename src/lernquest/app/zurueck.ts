// The phone's back key (and the browser's back arrow) goes one step back inside Lernquest instead of leaving it:
// while a page below the map is open (`tief`), one entry sits in the browser's history; going back takes it away and
// calls `zurueck`. The address stays the same, so the class code or `#probe=…` in it is kept.
import { useEffect, useRef, useState } from 'react';

export function useZurueck(tief: boolean, zurueck: () => void) {
  const liegt = useRef(false);
  const eigen = useRef(false);
  const cb = useRef(zurueck);
  cb.current = zurueck;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (tief && !liegt.current) {
      history.pushState({ lernquest: true }, '');
      liegt.current = true;
    } else if (!tief && liegt.current) {
      // Back on the map by a button: take our entry away again (the event this causes is ours, not a key press).
      liegt.current = false;
      eigen.current = true;
      history.back();
    }
  }, [tief, tick]);

  useEffect(() => {
    const on = () => {
      if (eigen.current) {
        eigen.current = false;
        return;
      }
      if (!liegt.current) return;
      liegt.current = false;
      cb.current();
      // Still below the map after the step back (station → map is not, shop → hero is): lay the entry again.
      setTick((t) => t + 1);
    };
    window.addEventListener('popstate', on);
    return () => {
      window.removeEventListener('popstate', on);
      // Leaving while an entry lies (signing out from the hero page): take it along, or one back press would do nothing.
      if (liegt.current) {
        liegt.current = false;
        history.back();
      }
    };
  }, []);
}
