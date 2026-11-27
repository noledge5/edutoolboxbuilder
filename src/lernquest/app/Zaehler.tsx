// A reward that counts up (Belohnungen, 27.11.2026): from `von` to `wert` after `verzoegerung` ms, with a small pop at
// the end and, if asked, a coin sound. Still (the final number at once) when motion is reduced. Screen readers get the
// final number only.
import { useEffect, useState } from 'react';
import { ruhig } from '../figuren/Figur';
import { zaehlerDauer, zaehlerWert } from '../zaehler';
import { ton } from './ton';

export function Zaehler({ wert, von = 0, verzoegerung = 0, klang = false, className }: { wert: number; von?: number; verzoegerung?: number; klang?: boolean; className?: string }) {
  const still = ruhig() || von === wert;
  const [n, setN] = useState(still ? wert : von);
  const [fertig, setFertig] = useState(still);
  useEffect(() => {
    if (still) {
      setN(wert);
      setFertig(true);
      return;
    }
    setN(von);
    setFertig(false);
    let raf = 0;
    let start = 0;
    const dauer = zaehlerDauer(von, wert);
    const schritt = (jetzt: number) => {
      start ||= jetzt;
      const t = jetzt - start;
      setN(zaehlerWert(von, wert, t, dauer));
      if (t < dauer) raf = requestAnimationFrame(schritt);
      else {
        setFertig(true);
        if (klang && wert > von) ton('muenze');
      }
    };
    const warte = window.setTimeout(() => (raf = requestAnimationFrame(schritt)), verzoegerung);
    return () => {
      window.clearTimeout(warte);
      cancelAnimationFrame(raf);
    };
  }, [wert, von, verzoegerung, still, klang]);
  return (
    <span className={`lq-zaehler${fertig && !still ? ' fertig' : ''}${className ? ` ${className}` : ''}`}>
      <span aria-hidden>{n}</span>
      <span className="lq-unsichtbar">{wert}</span>
    </span>
  );
}
