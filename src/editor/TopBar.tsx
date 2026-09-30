import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Blocks, Braces, ChevronDown, Download, Expand, Eye, FolderOpen, History, Minus, Plus, Presentation, Printer, Redo2, Sparkles, Trash2, Undo2 } from 'lucide-react';
import { Icon } from '../icons';
import { SearchButton } from '../library/SearchDialog';
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
  /** In the preview: which version is shown, e.g. "Lösungsfassung · S/W". */
  modeLabel?: string;
  /** Opens the lesson's slides (in the library). */
  onSlides?(): void;
  /** Number of slides of the lesson. */
  slideCount?: number;
  /** New slides from this worksheet, replacing the old ones. */
  onRegenerateSlides?(): void;
  onDeleteSlides?(): void;
  /** Earlier versions of the lesson (in the library). */
  onVersions?(): void;
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
      <SearchButton />
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
          ...(p.onVersions ? [{ label: 'Frühere Fassungen …', icon: History, onClick: p.onVersions }] : []),
        ]}
      />
      {p.modeLabel && <span className="topbar-mode">{p.modeLabel}</span>}
      {p.onSlides && <SlidesMenu count={p.slideCount ?? 0} onOpen={p.onSlides} onRegenerate={p.onRegenerateSlides} onDelete={p.onDeleteSlides} fromSheet="diesem Arbeitsblatt" />}
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
export function Menu({ label, icon, items, className = '' }: { label: string; icon: typeof FolderOpen; items: MenuItem[]; className?: string }) {
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
      <button type="button" className={'btn btn-secondary ui-btn ' + className + (open ? ' is-on' : '')} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
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

/** The slides of a lesson: open them, make them anew from the worksheet, or delete them all. */
export function SlidesMenu({
  count,
  onOpen,
  onRegenerate,
  onDelete,
  fromSheet = 'dem Arbeitsblatt',
  className = '',
}: {
  count: number;
  onOpen(): void;
  onRegenerate?(): void;
  onDelete?(): void;
  fromSheet?: string;
  className?: string;
}) {
  const items: MenuItem[] = [{ label: count ? 'Folien öffnen' : 'Folien öffnen (noch keine)', icon: Presentation, onClick: onOpen }];
  if (onRegenerate) items.push({ label: count ? `Neu aus ${fromSheet} erzeugen …` : `Aus ${fromSheet} erzeugen`, icon: Sparkles, onClick: onRegenerate });
  if (onDelete && count) items.push({ label: `Alle ${count} Folien löschen …`, icon: Trash2, onClick: onDelete });
  return <Menu label={count ? `Folien · ${count}` : 'Folien'} icon={Presentation} items={items} className={className + (count ? '' : ' is-empty')} />;
}
