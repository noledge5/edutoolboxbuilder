import { useEffect, useState } from 'react';
import { Eye, Printer } from 'lucide-react';
import { Icon } from '../icons';
import { SegField } from './fields';

export interface PrintMode {
  solutions: boolean;
  bw: boolean;
}

interface PrintDialogProps {
  mode: PrintMode;
  /** The document has pages "Für die Lehrkraft" (printed only with the solution sheet). */
  hasTeacherPages: boolean;
  onPreview(mode: PrintMode): void;
  onPrint(mode: PrintMode): void;
  onClose(): void;
}

/** Choose student or solution sheet and colour or black-and-white copy master before printing. */
export function PrintDialog({ mode, hasTeacherPages, onPreview, onPrint, onClose }: PrintDialogProps) {
  const [m, setM] = useState(mode);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="dialog-backdrop" data-noprint="1" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label="Drucken" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">Drucken / PDF</div>
        <SegField<boolean>
          label="Fassung"
          value={m.solutions}
          options={[
            { v: false, l: 'Schülerfassung' },
            { v: true, l: 'Lösungsfassung' },
          ]}
          onPick={(solutions) => setM({ ...m, solutions })}
        />
        <SegField<boolean>
          label="Druck"
          value={m.bw}
          options={[
            { v: false, l: 'Farbe' },
            { v: true, l: 'S/W-Kopiervorlage' },
          ]}
          onPick={(bw) => setM({ ...m, bw })}
        />
        <p className="dialog-body print-hint">
          {m.solutions ? 'Die Lösungsfassung zeigt die hinterlegten Lösungen in den Lücken, Tabellen, Schreiblinien und beim Ankreuzen und Zuordnen.' : 'Die Schülerfassung zeigt keine Lösungen.'}{' '}
          {hasTeacherPages && (m.solutions ? 'Die Seiten „Für die Lehrkraft“ sind dabei.' : 'Die Seiten „Für die Lehrkraft“ werden nicht gedruckt.')}{' '}
          {m.bw ? 'Die S/W-Kopiervorlage ersetzt Farbflächen durch Umrisse, damit Kopien sauber bleiben.' : ''}
        </p>
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary ui-btn" onClick={onClose}>
            Abbrechen
          </button>
          <button type="button" className="btn btn-secondary ui-btn" onClick={() => onPreview(m)}>
            <Icon icon={Eye} />
            Vorschau
          </button>
          <button type="button" className="btn btn-primary ui-btn" onClick={() => onPrint(m)}>
            <Icon icon={Printer} />
            Drucken
          </button>
        </div>
      </div>
    </div>
  );
}
