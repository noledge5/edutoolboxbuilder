// Vocabulary test from the unit's vocabulary lists: a random choice of words becomes a new lesson with a test page.
import { useEffect, useState } from 'react';
import { Shuffle } from 'lucide-react';
import { NumberField, SegField } from '../editor/fields';
import { Icon } from '../icons';
import type { TestDirection } from '../model/language';

export interface VocabTestOptions {
  count: number;
  direction: TestDirection;
  fold: boolean;
  gradeScale: boolean;
}

interface VocabTestDialogProps {
  /** Number of words in the module's vocabulary lists. */
  available: number;
  onCreate(o: VocabTestOptions): void;
  onClose(): void;
}

export function VocabTestDialog({ available, onCreate, onClose }: VocabTestDialogProps) {
  const [o, setO] = useState<VocabTestOptions>({ count: Math.min(10, available), direction: 'de-en', fold: false, gradeScale: true });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label="Vokabeltest erstellen" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">Vokabeltest erstellen</div>
        <p className="dialog-body">
          In den Vokabellisten dieses Moduls stehen {available} {available === 1 ? 'Wort' : 'Wörter'}. Der Baukasten wählt zufällig aus und legt eine neue Stunde mit dem Test an. Jeder Aufruf mischt
          neu.
        </p>
        <NumberField label="Anzahl Wörter" value={o.count} min={1} max={Math.max(1, available)} onChange={(count) => setO({ ...o, count })} />
        <SegField<TestDirection>
          label="Richtung"
          value={o.direction}
          options={[
            { v: 'de-en', l: 'Deutsch → Englisch' },
            { v: 'en-de', l: 'Englisch → Deutsch' },
            { v: 'mixed', l: 'Gemischt' },
          ]}
          onPick={(direction) => setO({ ...o, direction })}
        />
        <SegField<boolean>
          label="Art"
          value={o.fold}
          options={[
            { v: false, l: 'Test (Lösung in der Lösungsfassung)' },
            { v: true, l: 'Knicktest zum Üben' },
          ]}
          onPick={(fold) => setO({ ...o, fold })}
        />
        <SegField<boolean>
          label="Notenschlüssel"
          value={o.gradeScale}
          options={[
            { v: true, l: 'Dazu' },
            { v: false, l: 'Ohne' },
          ]}
          onPick={(gradeScale) => setO({ ...o, gradeScale })}
        />
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary ui-btn" onClick={onClose}>
            Abbrechen
          </button>
          <button type="button" className="btn btn-primary ui-btn" onClick={() => onCreate(o)}>
            <Icon icon={Shuffle} />
            Test erstellen
          </button>
        </div>
      </div>
    </div>
  );
}
