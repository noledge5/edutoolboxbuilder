import { Blocks, Braces, Eye, Minus, Plus, Printer, Redo2, Undo2 } from 'lucide-react';
import { Icon, TOPIC_ICON } from '../icons';

interface TopBarProps {
  editing: boolean;
  compact: boolean;
  zoom: number;
  canUndo: boolean;
  canRedo: boolean;
  toolboxOpen: boolean;
  onToggleToolbox(): void;
  onUndo(): void;
  onRedo(): void;
  onZoom(dir: -1 | 1): void;
  onOpenJson(): void;
  onTogglePreview(): void;
  onPrint(): void;
}

export function TopBar(p: TopBarProps) {
  return (
    <header className="topbar" data-noprint="1">
      <div className="topbar-icon">
        <Icon icon={TOPIC_ICON} size={20} />
      </div>
      <div className="topbar-title">Arbeitsblatt-Baukasten</div>
      {p.editing && p.compact && (
        <button type="button" className={'btn btn-secondary ui-btn' + (p.toolboxOpen ? ' is-on' : '')} onClick={p.onToggleToolbox} aria-pressed={p.toolboxOpen}>
          <Icon icon={Blocks} />
          <span className="btn-label">Toolbox</span>
        </button>
      )}
      {p.editing && (
        <div className="pillgroup">
          <button type="button" className="iconbtn" onClick={p.onUndo} disabled={!p.canUndo} title="Rückgängig" aria-label="Rückgängig">
            <Icon icon={Undo2} />
          </button>
          <button type="button" className="iconbtn" onClick={p.onRedo} disabled={!p.canRedo} title="Wiederholen" aria-label="Wiederholen">
            <Icon icon={Redo2} />
          </button>
        </div>
      )}
      <div className="pillgroup">
        <button type="button" className="iconbtn" onClick={() => p.onZoom(-1)} title="Verkleinern" aria-label="Verkleinern">
          <Icon icon={Minus} />
        </button>
        <span className="zoom-label">{Math.round(p.zoom * 100)}%</span>
        <button type="button" className="iconbtn" onClick={() => p.onZoom(1)} title="Vergrößern" aria-label="Vergrößern">
          <Icon icon={Plus} />
        </button>
      </div>
      <button type="button" className="btn btn-secondary ui-btn" onClick={p.onOpenJson}>
        <Icon icon={Braces} />
        <span className="btn-label">Daten</span>
      </button>
      <button type="button" className={'btn btn-secondary ui-btn' + (p.editing ? '' : ' is-on')} onClick={p.onTogglePreview}>
        <Icon icon={Eye} />
        <span className="btn-label">{p.editing ? 'Vorschau' : 'Bearbeiten'}</span>
      </button>
      <button type="button" className="btn btn-primary ui-btn" onClick={p.onPrint}>
        <Icon icon={Printer} />
        <span className="btn-label">Drucken / PDF</span>
      </button>
    </header>
  );
}
