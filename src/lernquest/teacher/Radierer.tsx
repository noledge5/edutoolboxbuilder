// The eraser on the teacher page („Bilder der Teile“): the finished layer large on a checkerboard; drawing with a finger
// or the mouse erases. Strokes are kept in layer pixels (480 × 480) and applied after the sliders (pixel.ts `radieren`),
// so a new preview keeps them in place.
import { useRef, useState } from 'react';
import { Eraser, Undo2 } from 'lucide-react';
import { Icon } from '../../icons';
import type { Strich } from '../bilder/pixel';
import { EBENE_GROESSE as G } from '../bilder/vorlagen';

const GROESSE = 320;

export function Radierer({ url, striche, setStriche }: { url: string; striche: Strich[]; setStriche(s: Strich[]): void }) {
  const [r, setR] = useState(10);
  const [jetzt, setJetzt] = useState<Strich | null>(null);
  const flaeche = useRef<HTMLDivElement>(null);
  const punkt = (e: React.PointerEvent): [number, number] => {
    const b = flaeche.current!.getBoundingClientRect();
    return [((e.clientX - b.left) / b.width) * G, ((e.clientY - b.top) / b.height) * G];
  };
  const k = GROESSE / G;
  return (
    <div className="lqt-radierer">
      <div
        ref={flaeche}
        className="lqt-radierer-flaeche"
        style={{ width: GROESSE, height: GROESSE }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setJetzt({ r, punkte: [punkt(e)] });
        }}
        onPointerMove={(e) => jetzt && setJetzt({ ...jetzt, punkte: [...jetzt.punkte, punkt(e)] })}
        onPointerUp={() => {
          if (jetzt) setStriche([...striche, jetzt]);
          setJetzt(null);
        }}
        onPointerCancel={() => setJetzt(null)}
        role="img"
        aria-label="Bild zum Radieren: mit Finger oder Maus über die Stellen fahren, die weg sollen"
      >
        <img src={url} alt="" draggable={false} />
        {jetzt && (
          <svg viewBox={`0 0 ${GROESSE} ${GROESSE}`} aria-hidden>
            <polyline
              points={jetzt.punkte.map(([x, y]) => `${x * k},${y * k}`).join(' ')}
              fill="none"
              stroke="rgba(220, 40, 40, .5)"
              strokeWidth={jetzt.r * 2 * k}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <div className="lqt-radierer-leiste">
        <label>
          <span>
            <Icon icon={Eraser} size={16} /> Radiergröße: <b>{r}</b>
          </span>
          <input type="range" min={2} max={40} step={1} value={r} onChange={(e) => setR(Number(e.target.value))} />
        </label>
        <button type="button" className="btn btn-secondary ui-btn is-small" disabled={!striche.length} onClick={() => setStriche(striche.slice(0, -1))}>
          <Icon icon={Undo2} />
          Rückgängig
        </button>
        <button type="button" className="btn btn-secondary ui-btn is-small" disabled={!striche.length} onClick={() => setStriche([])}>
          Alles wieder da
        </button>
        <p className="lqt-hint">Am besten zuletzt radieren, nach den Reglern.</p>
      </div>
    </div>
  );
}
