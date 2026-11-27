import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Blocks,
  Braces,
  ChevronDown,
  ChevronRight,
  Download,
  Expand,
  Eye,
  FolderOpen,
  History,
  KeyRound,
  Keyboard,
  ListChecks,
  Minus,
  PenLine,
  Play,
  Plus,
  Presentation,
  Printer,
  Redo2,
  Send,
  Sparkles,
  Trash2,
  Undo2,
} from 'lucide-react';
import { Icon } from '../icons';
import { SearchButton } from '../library/SearchDialog';
import type { Handout } from '../share/assignment';
import { topicIcon } from '../topicIcons';

interface TopBarProps {
  /** Topic icon key of the open document. */
  icon: string;
  /** Where the worksheet sits in the library ("Geographie · Klasse 9 · Modul 1 · Stunde 1: …"): the path above the title. */
  place?: string;
  onBack?(): void;
  editing: boolean;
  compact: boolean;
  canUndo: boolean;
  canRedo: boolean;
  toolboxOpen: boolean;
  onToggleToolbox(): void;
  onUndo(): void;
  onRedo(): void;
  onOpenFile(): void;
  onSaveFile(): void;
  onOpenJson(): void;
  onTogglePreview(): void;
  onPrint(): void;
  /** In the preview: which version is shown, e.g. "Lösungsfassung, S/W". */
  modeLabel?: string;
  /** Opens the lesson's slides (in the library). */
  onSlides?(): void;
  onPresent?(): void;
  /** Number of slides of the lesson. */
  slideCount?: number;
  onDeleteSlides?(): void;
  /** Earlier versions of the lesson (in the library). */
  onVersions?(): void;
  onCheckAi?(): void;
  onKeys?(): void;
  /** Hands out the whole worksheet digitally. */
  onShareAll?(): void;
  /** "Mit KI bauen": the lesson, one more sheet, a revision, a PDF or the vocabulary list. */
  onClaude?(): void;
  /** Claude's key and costs on this device. */
  onAiSettings?(): void;
  /** "Präsi in Canva …" (Runde 9). */
  onCanva?(): void;
  handouts?: Handout[];
  onOpenHandout?(id: string): void;
}

/** The editor's bar (26.11.2026, Dose, stage 4): the way back and the path over the lesson's title, undo, the switch
 *  between editing and the preview, then the lesson's menus and Drucken. Zoom sits on the canvas (ZoomDock). */
export function TopBar(p: TopBarProps) {
  const parts = p.place ? p.place.split(' · ') : [];
  const title = parts.at(-1) || 'Arbeitsblatt-Baukasten';
  const path = parts.slice(0, -1);
  return (
    <header className="topbar topbar-ed" data-noprint="1">
      {p.onBack && (
        <button type="button" className="iconbtn topbar-back" onClick={p.onBack} title="Zurück" aria-label="Zurück">
          <Icon icon={ArrowLeft} size={18} />
        </button>
      )}
      <div className="topbar-icon">
        <Icon icon={topicIcon(p.icon)} size={20} />
      </div>
      <div className="topbar-name">
        {path.length > 0 && (
          <div className="ed-crumbs" title={p.place}>
            {path.map((c, i) => (
              <span key={i}>
                {i > 0 && <ChevronRight size={12} strokeWidth={2.5} aria-hidden="true" focusable="false" />}
                {c}
              </span>
            ))}
          </div>
        )}
        <div className="topbar-title" title={p.place}>
          {title}
        </div>
      </div>
      {p.editing && (
        <div className="ed-history" role="group" aria-label="Verlauf">
          <button type="button" className="iconbtn" onClick={p.onUndo} disabled={!p.canUndo} title="Rückgängig (⌘Z)" aria-label="Rückgängig">
            <Icon icon={Undo2} />
          </button>
          <button type="button" className="iconbtn" onClick={p.onRedo} disabled={!p.canRedo} title="Wiederholen (⇧⌘Z)" aria-label="Wiederholen">
            <Icon icon={Redo2} />
          </button>
        </div>
      )}
      <div className="ed-mode" role="radiogroup" aria-label="Ansicht">
        <button type="button" role="radio" aria-checked={p.editing} className={'seg-pill' + (p.editing ? ' is-on' : '')} onClick={() => !p.editing && p.onTogglePreview()} title="Bearbeiten">
          <Icon icon={PenLine} size={16} />
          <span className="btn-label">Bearbeiten</span>
        </button>
        <button type="button" role="radio" aria-checked={!p.editing} className={'seg-pill' + (!p.editing ? ' is-on' : '')} onClick={() => p.editing && p.onTogglePreview()} title="Vorschau">
          <Icon icon={Eye} size={16} />
          <span className="btn-label">Vorschau</span>
        </button>
      </div>
      {p.modeLabel && <span className="topbar-mode">{p.modeLabel}</span>}
      <div className="ed-actions">
        <SearchButton />
        {p.editing && p.compact && (
          <button type="button" className={'btn btn-secondary ui-btn' + (p.toolboxOpen ? ' is-on' : '')} onClick={p.onToggleToolbox} aria-pressed={p.toolboxOpen} title="Toolbox">
            <Icon icon={Blocks} />
            <span className="btn-label">Toolbox</span>
          </button>
        )}
        <Menu
          label="Datei"
          icon={FolderOpen}
          items={[
            { label: 'Öffnen …', icon: FolderOpen, onClick: p.onOpenFile },
            { label: 'Als Datei sichern', icon: Download, onClick: p.onSaveFile },
            { label: 'Daten anzeigen (JSON)', icon: Braces, onClick: p.onOpenJson },
            ...(p.onVersions ? [{ label: 'Frühere Fassungen …', icon: History, onClick: p.onVersions }] : []),
            ...(p.onKeys ? [{ label: 'Tastenkürzel (?)', icon: Keyboard, onClick: p.onKeys }] : []),
          ]}
        />
        {p.onSlides && <SlidesMenu count={p.slideCount ?? 0} onOpen={p.onSlides} onPresent={p.onPresent} onDelete={p.onDeleteSlides} />}
        {p.onShareAll && (
          <Menu
            label={p.handouts?.length ? `Digital (${p.handouts.length})` : 'Digital'}
            icon={Send}
            items={[
              { label: 'Ganzes Arbeitsblatt austeilen …', icon: Send, onClick: p.onShareAll },
              ...(p.handouts ?? []).slice(0, 8).map((h) => ({
                label: `${h.mode === 'loesung' ? 'Lösungsblatt' : 'Auswertung'}: ${h.title.length > 30 ? h.title.slice(0, 29) + '…' : h.title}, ${new Date(h.createdAt).toLocaleString('de-DE', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
                icon: BarChart3,
                onClick: () => p.onOpenHandout?.(h.id),
              })),
            ]}
          />
        )}
        {p.onClaude && (
          <Menu
            label="KI"
            icon={Sparkles}
            className="menu-claude"
            items={[
              { label: 'Mit KI bauen …', icon: Sparkles, onClick: p.onClaude },
              ...(p.onCanva ? [{ label: 'Präsi in Canva …', icon: Presentation, onClick: p.onCanva }] : []),
              ...(p.onCheckAi ? [{ label: 'Stunde prüfen …', icon: ListChecks, onClick: p.onCheckAi }] : []),
              ...(p.onAiSettings ? [{ label: 'KI im Baukasten …', icon: KeyRound, onClick: p.onAiSettings }] : []),
            ]}
          />
        )}
        <button type="button" className="btn btn-primary ui-btn" onClick={p.onPrint} title="Drucken / PDF">
          <Icon icon={Printer} />
          <span className="btn-label">Drucken / PDF</span>
        </button>
      </div>
    </header>
  );
}

/** The desk's foot: how many pages the lesson has, and the zoom (smaller, the zoom, larger, fit the page). It sits
 *  under the desk, so it never covers a page. */
export function ZoomDock({ zoom, pages, onZoom, onFit }: { zoom: number; pages: number; onZoom(dir: -1 | 1): void; onFit(): void }) {
  return (
    <div className="desk-bar" data-noprint="1">
      <span className="desk-count">{pages === 1 ? '1 Seite' : `${pages} Seiten`}</span>
      <div className="zoom-dock" role="group" aria-label="Zoom">
        <button type="button" className="iconbtn" onClick={() => onZoom(-1)} title="Verkleinern" aria-label="Verkleinern">
          <Icon icon={Minus} />
        </button>
        <span className="zoom-label" aria-live="polite">
          {Math.round(zoom * 100)} %
        </span>
        <button type="button" className="iconbtn" onClick={() => onZoom(1)} title="Vergrößern" aria-label="Vergrößern">
          <Icon icon={Plus} />
        </button>
        <button type="button" className="iconbtn" onClick={onFit} title="Seite einpassen" aria-label="Seite einpassen">
          <Icon icon={Expand} />
        </button>
      </div>
    </div>
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
      <button
        type="button"
        className={'btn btn-secondary ui-btn ' + className + (open ? ' is-on' : '')}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={() => setOpen((o) => !o)}
      >
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

/** The slides of a lesson: open them, present them, or delete them all. */
export function SlidesMenu({
  count,
  onOpen,
  onPresent,
  onDelete,
  className = '',
}: {
  count: number;
  onOpen(): void;
  /** Opens the slides and starts presenting at once. */
  onPresent?(): void;
  onDelete?(): void;
  className?: string;
}) {
  const items: MenuItem[] = [
    ...(onPresent && count ? [{ label: 'Präsentieren', icon: Play, onClick: onPresent }] : []),
    { label: count ? 'Folien öffnen' : 'Folien öffnen (noch keine)', icon: Presentation, onClick: onOpen },
  ];
  if (onDelete && count) items.push({ label: `Alle ${count} Folien löschen …`, icon: Trash2, onClick: onDelete });
  return <Menu label={count ? `Folien (${count})` : 'Folien'} icon={Presentation} items={items} className={className + (count ? '' : ' is-empty')} />;
}
