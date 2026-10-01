// The suggested slides as a list to tick, phase by phase, before they are made; or single slides from the worksheet
// to put in after the slide shown ("Aus dem Blatt einfügen").
import { useEffect, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { Icon } from '../icons';
import type { Slide } from '../model/slides';
import type { SuggestSection } from './fromDoc';
import { SlideBox, type SlideContext } from './SlideView';

interface SuggestDialogProps {
  sections: SuggestSection[];
  ctx: SlideContext;
  /** "suggest": the slides for the lesson (ticked as suggested); "pick": single slides, none ticked. */
  mode: 'suggest' | 'pick';
  /** The lesson has slides: the new ones replace them or come after them. */
  hasSlides: boolean;
  onDone(slides: Slide[], how: 'replace' | 'append' | 'insert'): void;
  onClose(): void;
}

export function SuggestDialog({ sections, ctx, mode, hasSlides, onDone, onClose }: SuggestDialogProps) {
  const [on, setOn] = useState<Set<string>>(() => new Set(mode === 'suggest' ? sections.flatMap((s) => s.items.filter((i) => i.on).map((i) => i.id)) : []));
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
  let number = 0;
  let all = 0;
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog sl-suggest" role="dialog" aria-modal="true" aria-label={mode === 'pick' ? 'Aus dem Arbeitsblatt einfügen' : 'Folien vorschlagen'} onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">{mode === 'pick' ? 'Aus dem Arbeitsblatt einfügen' : 'Folien vorschlagen'}</div>
        <p className="dialog-body">
          {mode === 'pick'
            ? 'Tippe die Folien an, die nach der gezeigten Folie dazukommen sollen.'
            : 'Der Vorschlag folgt dem Stundenverlauf auf der Lehrkraft-Seite: Einstieg, je Arbeitsphase ein Auftrag mit Zeit und Sozialform, die Aufgaben zur Besprechung mit den Lösungen unter Karten, am Ende der Merksatz. Nimm heraus, was du nicht brauchst, und hake an, was fehlt.'}
        </p>
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
                    if (checked) number++;
                    return (
                      <button key={i.id} type="button" className={'sl-suggest-item' + (checked ? ' is-on' : '')} aria-pressed={checked} onClick={() => toggle(i.id)} title={i.label}>
                        <span className="sl-suggest-thumb">
                          <SlideBox slide={i.slide} number={mode === 'pick' ? all : checked ? number : 0} ctx={ctx} width={192} />
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
          {mode === 'pick' ? (
            <button type="button" className="btn btn-primary ui-btn" disabled={!picked.length} onClick={() => onDone(picked, 'insert')}>
              Einfügen
            </button>
          ) : hasSlides ? (
            <>
              <button type="button" className="btn btn-secondary ui-btn" disabled={!picked.length} onClick={() => onDone(picked, 'append')} title="Die vorgeschlagenen Folien kommen nach den vorhandenen">
                Anhängen
              </button>
              <button type="button" className="btn btn-primary ui-btn" disabled={!picked.length} onClick={() => onDone(picked, 'replace')} title="Die vorhandenen Folien werden ersetzt (⌘Z holt sie zurück)">
                <Icon icon={Sparkles} />
                Folien ersetzen
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-primary ui-btn" disabled={!picked.length} onClick={() => onDone(picked, 'replace')}>
              <Icon icon={Sparkles} />
              Folien erstellen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
