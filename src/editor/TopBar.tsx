import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Blocks, Braces, ChevronDown, Download, Expand, Eye, FolderOpen, Minus, Plus, Printer, Redo2, Undo2 } from 'lucide-react';
import { Icon } from '../icons';
import { topicIcon } from '../topicIcons';

interface TopBarProps {
  /** Topic icon key of the open document. */
  icon: string;
  /** Where the worksheet sits in the library, shown under the title. */
  place?: string;
  onBack?(): void;
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
  onFitZoom(): void;
  onOpenFile(): void;
  onSaveFile(): void;
  onOpenJson(): void;
  onTogglePreview(): void;
  onPrint(): void;
}

export function TopBar(p: TopBarProps) {
  return (
    <header className="topbar" data-noprint="1">
      {p.onBack && (
        <button type="button" className="iconbtn topbar-back" onClick={p.onBack} title="Zur Übersicht" aria-label="Zur Übersicht">
          <Icon icon={ArrowLeft} size={18} />
        </button>
      )}
      <div className="topbar-icon">
        <Icon icon={topicIcon(p.icon)} size={20} />
      </div>
      <div className="topbar-name">
        <div className="topbar-title">Arbeitsblatt-Baukasten</div>
        {p.place && <div className="topbar-place">{p.place}</div>}
      </div>
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
        <button type="button" className="iconbtn" onClick={p.onFitZoom} title="Seite einpassen" aria-label="Seite einpassen">
          <Icon icon={Expand} />
        </button>
      </div>
      <Menu
        label="Datei"
        icon={FolderOpen}
        items={[
          { label: 'Öffnen …', icon: FolderOpen, onClick: p.onOpenFile },
          { label: 'Als Datei sichern', icon: Download, onClick: p.onSaveFile },
          { label: 'Daten anzeigen (JSON)', icon: Braces, onClick: p.onOpenJson },
        ]}
      />
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

interface MenuItem {
  label: string;
  icon: typeof FolderOpen;
  onClick(): void;
}

/** A button with a small drop-down list; closes on outside click, Esc or choosing an item. */
export function Menu({ label, icon, items }: { label: string; icon: typeof FolderOpen; items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return (
    <div className="menu" ref={root}>
      <button type="button" className={'btn btn-secondary ui-btn' + (open ? ' is-on' : '')} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Icon icon={icon} />
        <span className="btn-label">{label}</span>
        <Icon icon={ChevronDown} size={14} />
      </button>
      {open && (
        <div className="menu-list" role="menu">
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              className="menu-item"
              onClick={() => {
                setOpen(false);
                it.onClick();
              }}
            >
              <Icon icon={it.icon} />
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
