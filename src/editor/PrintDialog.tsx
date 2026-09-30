import { useEffect, useId, useState } from 'react';
import { Eye, Printer } from 'lucide-react';
import { Icon } from '../icons';
import { ALL_LEVELS, type TestGroup } from '../model/variants';
import { SegField } from './fields';

export interface PrintMode {
  solutions: boolean;
  bw: boolean;
  /** Levels whose tasks are printed ('1' G, '2' M, '3' E). */
  levels: string[];
  group: TestGroup;
}

export const DEFAULT_PRINT: PrintMode = { solutions: false, bw: false, levels: ALL_LEVELS, group: '' };

interface PrintDialogProps {
  mode: PrintMode;
  /** The document has pages "Für die Lehrkraft" (printed only with the solution sheet). */
  hasTeacherPages: boolean;
  /** Tasks have levels: a version with only some levels can be printed. */
  hasLevels: boolean;
  /** Tasks whose answers or entries group B gets in another order. */
  canShuffle: boolean;
  onPreview(mode: PrintMode): void;
  onPrint(mode: PrintMode): void;
  onClose(): void;
}

const LEVELS = [
  { v: '1', l: '★ G' },
  { v: '2', l: '★★ M' },
  { v: '3', l: '★★★ E' },
];

/** Choose student or solution sheet, colour or black-and-white copy master, levels and test group before printing. */
export function PrintDialog({ mode, hasTeacherPages, hasLevels, canShuffle, onPreview, onPrint, onClose }: PrintDialogProps) {
  const [m, setM] = useState(mode);
  const levelsId = useId();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const toggleLevel = (l: string) => {
    const levels = m.levels.includes(l) ? m.levels.filter((x) => x !== l) : [...m.levels, l].sort();
    if (levels.length) setM({ ...m, levels });
  };
  const someLevels = hasLevels && m.levels.length < ALL_LEVELS.length;
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
        {hasLevels && (
          <div className="field">
            <label id={levelsId}>Aufgaben auf dem Blatt (Niveau)</label>
            <div className="seg-pills" role="group" aria-labelledby={levelsId}>
              {LEVELS.map((o) => {
                const on = m.levels.includes(o.v);
                return (
                  <button key={o.v} type="button" aria-pressed={on} className={'seg-pill' + (on ? ' is-on' : '')} onClick={() => toggleLevel(o.v)}>
                    {o.l}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <SegField<TestGroup>
          label="Testgruppe"
          value={m.group}
          options={[
            { v: '', l: 'keine' },
            { v: 'A', l: 'Gruppe A' },
            { v: 'B', l: 'Gruppe B' },
          ]}
          onPick={(group) => setM({ ...m, group })}
        />
        <p className="dialog-body print-hint">
          {m.solutions ? 'Die Lösungsfassung zeigt die hinterlegten Lösungen in den Lücken, Tabellen, Schreiblinien und beim Ankreuzen und Zuordnen.' : 'Die Schülerfassung zeigt keine Lösungen.'}{' '}
          {hasTeacherPages && (m.solutions ? 'Die Seiten „Für die Lehrkraft“ sind dabei.' : 'Die Seiten „Für die Lehrkraft“ werden nicht gedruckt.')}{' '}
          {m.bw ? 'Die S/W-Kopiervorlage ersetzt Farbflächen durch Umrisse, damit Kopien sauber bleiben.' : ''}{' '}
          {someLevels ? 'Aufgaben der anderen Niveaus fallen weg (Aufgaben ohne Niveau bleiben); Nummern, Punkte und Notenschlüssel passen sich an, im Fußband steht das Niveau.' : ''}{' '}
          {m.group === 'B'
            ? canShuffle
              ? 'Gruppe B hat die Antworten beim Ankreuzen, Zuordnen und Richtig/Falsch und die Einträge (Sätze ordnen, Umformen, Vokabeltest, Bild-Vokabeln, Bingo) in anderer Reihenfolge; die Lösungsfassung passt dazu.'
              : 'Auf diesem Blatt gibt es nichts zu mischen: Gruppe B sieht aus wie Gruppe A.'
            : m.group === 'A'
              ? 'Gruppe A ist das Blatt, wie es ist, mit „Gruppe A“ im Kopfband.'
              : ''}
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
