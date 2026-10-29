// Single slides from the worksheet to put in after the slide shown ("Aus dem Arbeitsblatt einfügen").
import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Icon } from '../icons';
import type { Slide } from '../model/slides';
import type { SuggestSection } from './fromDoc';
import { SlideBox, type SlideContext } from './SlideView';

interface SuggestDialogProps {
  sections: SuggestSection[];
  ctx: SlideContext;
  onDone(slides: Slide[]): void;
  onClose(): void;
}

export function SuggestDialog({ sections, ctx, onDone, onClose }: SuggestDialogProps) {
  const [on, setOn] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const toggle = (id: string) =>
    setOn((x) => {
      const n = new Set(x);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const picked = sections.flatMap((s) => s.items.filter((i) => on.has(i.id)).map((i) => i.slide));
  const count = `${picked.length} ${picked.length === 1 ? 'Folie' : 'Folien'}`;
  let all = 0;
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog sl-suggest" role="dialog" aria-modal="true" aria-label="Aus dem Arbeitsblatt einfügen" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">Aus dem Arbeitsblatt einfügen</div>
        <p className="dialog-body">Tippe die Folien an, die nach der gezeigten Folie dazukommen sollen.</p>
        <div className="sl-suggest-list">
          {sections.map((s) => (
            <section key={s.id} className="sl-suggest-section">
              <h3>{s.label}</h3>
              {s.note && <p className="sl-suggest-note">{s.note}</p>}
              {s.items.length > 0 && (
                <div className="sl-suggest-grid">
                  {s.items.map((i) => {
                    const checked = on.has(i.id);
                    all++;
                    return (
                      <button key={i.id} type="button" className={'sl-suggest-item' + (checked ? ' is-on' : '')} aria-pressed={checked} onClick={() => toggle(i.id)} title={i.label}>
                        <span className="sl-suggest-thumb">
                          <SlideBox slide={i.slide} number={all} ctx={ctx} width={192} />
                          <span className="sl-suggest-check">{checked && <Icon icon={Check} size={16} />}</span>
                        </span>
                        <span className="sl-suggest-label">{i.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
        <div className="dialog-actions">
          <span className="sl-suggest-count">{count}</span>
          <button type="button" className="btn btn-secondary ui-btn" onClick={onClose}>
            Abbrechen
          </button>
          <button type="button" className="btn btn-primary ui-btn" disabled={!picked.length} onClick={() => onDone(picked)}>
            Einfügen
          </button>
        </div>
      </div>
    </div>
  );
}
