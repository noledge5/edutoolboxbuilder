// The Tafelbilder of a lesson: what was written on the slides while presenting, kept to show again or print.
import { useEffect } from 'react';
import { Play, Printer, Trash2 } from 'lucide-react';
import { Icon } from '../icons';
import { boardPagesWithInk, type Board } from '../model/ink';
import type { Slide } from '../model/slides';
import { BoardView, InkSvg } from './Ink';
import { SlideBox, type SlideContext } from './SlideView';

interface BoardsDialogProps {
  boards: Board[];
  slides: Slide[];
  ctx: SlideContext;
  onShow(b: Board): void;
  onPrint(b: Board): void;
  onRename(b: Board, name: string): void;
  onDelete(b: Board): void;
  onClose(): void;
}

const THUMB = 168;

/** The first page written on, small. */
function Thumb({ b, slides, ctx }: { b: Board; slides: Slide[]; ctx: SlideContext }) {
  const page = boardPagesWithInk(b.pages)[0];
  if (!page) return <div className="sl-boards-thumb" />;
  const k = slides.findIndex((s) => s.id === page.slideId);
  const h = (THUMB * 1080) / 1920;
  return (
    <div className="sl-boards-thumb" style={{ width: THUMB, height: h }}>
      {k >= 0 ? <SlideBox slide={slides[k]} number={k + 1} ctx={ctx} width={THUMB} /> : <BoardView paper={page.paper} design={ctx.design} style={{ transform: `scale(${THUMB / 1920})` }} />}
      <InkSvg strokes={page.strokes} className="sl-ink" />
    </div>
  );
}

export function BoardsDialog({ boards, slides, ctx, onShow, onPrint, onRename, onDelete, onClose }: BoardsDialogProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog sl-boards" role="dialog" aria-modal="true" aria-label="Tafelbilder" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">Tafelbilder</div>
        {boards.length === 0 ? (
          <p className="dialog-body">
            Noch keine. Beim Präsentieren schreibst du mit dem Stift (am iPad mit dem Pencil, am Mac mit P oder dem Stift-Knopf) auf die Folien; beim Beenden fragt der Baukasten, ob er das
            Tafelbild sichern soll.
          </p>
        ) : (
          <ul className="sl-boards-list">
            {boards.map((b) => {
              const pages = boardPagesWithInk(b.pages);
              const blanks = pages.filter((p) => !p.slideId).length;
              return (
                <li key={b.id} className="sl-boards-item">
                  <Thumb b={b} slides={slides} ctx={ctx} />
                  <div className="sl-boards-info">
                    <input className="input" value={b.name} onChange={(e) => onRename(b, e.target.value)} aria-label="Name des Tafelbilds" />
                    <span>
                      {new Date(b.at).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })} · {pages.length - blanks} {pages.length - blanks === 1 ? 'Folie' : 'Folien'}
                      {blanks ? ` · ${blanks} leere ${blanks === 1 ? 'Tafel' : 'Tafeln'}` : ''}
                    </span>
                    <div className="sl-boards-actions">
                      <button type="button" className="btn btn-primary ui-btn" onClick={() => onShow(b)} title="Präsentieren, mit diesem Tafelbild auf den Folien">
                        <Icon icon={Play} />
                        Zeigen
                      </button>
                      <button type="button" className="btn btn-secondary ui-btn" onClick={() => onPrint(b)} title="Die beschriebenen Folien drucken oder als PDF sichern">
                        <Icon icon={Printer} />
                        Drucken
                      </button>
                      <button
                        type="button"
                        className="iconbtn"
                        title="Tafelbild löschen"
                        aria-label="Tafelbild löschen"
                        onClick={() => window.confirm(`„${b.name || 'Tafelbild'}“ löschen?`) && onDelete(b)}
                      >
                        <Icon icon={Trash2} />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary ui-btn" onClick={onClose}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
