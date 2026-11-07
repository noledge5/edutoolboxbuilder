import { useEffect, useId, useRef } from 'react';
import { PUNKTE_HAND_WOCHE } from '../rules';

interface Props {
  name: string;
  /** How many points by hand are still allowed this week (1–5). */
  rest: number;
  onGive(n: number): void;
  onClose(): void;
}

/** „Klassenpunkte geben“: one button per allowed amount, so it works with a finger on the iPad (no window.prompt). */
export function PunkteDialog({ name, rest, onGive, onClose }: Props) {
  const titleId = useId();
  // A quick double tap (or key repeat) must give the points once only.
  const given = useRef(false);
  const give = (n: number) => {
    if (given.current) return;
    given.current = true;
    onGive(n);
  };
  const giveRef = useRef(give);
  giveRef.current = give;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= rest) giveRef.current(n);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, rest]);

  return (
    <div className="dialog-backdrop" data-noprint="1" onClick={onClose}>
      <div className="dialog lqt-punkte-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title" id={titleId}>
          Klassenpunkte geben
        </div>
        <p className="dialog-body">
          Wie viele Klassenpunkte bekommt {name}? Von Hand höchstens {PUNKTE_HAND_WOCHE} je Woche, diese Woche noch {rest}.
        </p>
        <div className="lqt-punkte-wahl">
          {Array.from({ length: rest }, (_, i) => i + 1).map((n) => (
            <button key={n} type="button" className="btn btn-secondary ui-btn" aria-label={`${n} ${n === 1 ? 'Klassenpunkt' : 'Klassenpunkte'}`} onClick={() => give(n)}>
              +{n}
            </button>
          ))}
        </div>
        <div className="dialog-actions">
          <button type="button" className="btn btn-ghost ui-btn" onClick={onClose}>
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}
