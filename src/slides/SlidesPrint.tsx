// Printing slides: a handout with two slides per A4 page, a version with the speaker notes for the
// teacher (three per page), or the slides themselves as A4 landscape pages (for a PDF to share).
import { ArrowLeft, Printer } from 'lucide-react';
import { Icon } from '../icons';
import { PrintFrame } from '../library/ModulePrint';
import type { Slide } from '../model/slides';
import type { Doc, Page } from '../model/types';
import { SheetPage } from '../sheet/SheetPage';
import { topicIcon } from '../topicIcons';
import { SlideBox, type SlideContext } from './SlideView';

export type SlidesPrintKind = 'handout' | 'notes' | 'slides';

interface SlidesPrintProps {
  kind: SlidesPrintKind;
  slides: Slide[];
  ctx: SlideContext;
  title: string;
  onClose(): void;
}

const PER_PAGE: Record<SlidesPrintKind, number> = { handout: 2, notes: 3, slides: 1 };
const TITLE: Record<SlidesPrintKind, string> = { handout: 'Handout', notes: 'Folien mit Notizen', slides: 'Folien als PDF' };

/** A4 landscape in CSS pixels. */
const LAND_W = 1123;
const LAND_H = 794;

export function SlidesPrint({ kind, slides, ctx, title, onClose }: SlidesPrintProps) {
  const per = PER_PAGE[kind];
  const pages: { slide: Slide; n: number }[][] = [];
  slides.forEach((slide, k) => {
    if (k % per === 0) pages.push([]);
    pages[pages.length - 1].push({ slide, n: k + 1 });
  });
  const doc: Doc = { icon: ctx.icon, lang: ctx.lang, help: false, footer: ctx.footer, code: '', pages: [] };
  const page: Page = {
    title: `${kind === 'notes' ? 'Folien mit Notizen' : 'Folien'}: ${title}`,
    kicker: ctx.kicker,
    type: kind === 'notes' ? 'lehrkraft' : 'sicherung',
    form: 'allein',
    nameField: 'aus',
    blocks: [],
  };

  return (
    <div className="app is-preview">
      {kind === 'slides' && <style>{'@media print { @page { size: A4 landscape; margin: 0; } }'}</style>}
      <header className="topbar" data-noprint="1">
        <button type="button" className="iconbtn topbar-back" onClick={onClose} title="Zurück zu den Folien" aria-label="Zurück zu den Folien">
          <Icon icon={ArrowLeft} size={18} />
        </button>
        <div className="topbar-icon">
          <Icon icon={topicIcon(ctx.icon)} size={20} />
        </div>
        <div className="topbar-name">
          <div className="topbar-title">{TITLE[kind]}</div>
          <div className="topbar-place">
            {title}
            {kind === 'slides' ? ' · Querformat: beim Drucken „Als PDF sichern“ wählen' : ''}
          </div>
        </div>
        <button type="button" className="btn btn-primary ui-btn" onClick={() => window.print()}>
          <Icon icon={Printer} />
          <span className="btn-label">Drucken / PDF</span>
        </button>
      </header>
      <div className="workspace">
        <main className="canvas">
          <div className="pages">
            {kind === 'slides'
              ? slides.map((s, k) => (
                  <div key={s.id} className="sl-print-land" style={{ width: LAND_W, height: LAND_H }}>
                    <SlideBox slide={s} number={k + 1} ctx={ctx} width={LAND_W} print />
                  </div>
                ))
              : pages.map((group, i) => (
                  <PrintFrame key={i}>
                    <SheetPage doc={doc} page={page} index={i} editing={false} hideForm>
                      <div className={'sl-print-list is-' + kind}>
                        {group.map(({ slide, n }) => (
                          <div key={slide.id} className="sl-print-item">
                            <SlideBox slide={slide} number={n} ctx={ctx} width={kind === 'notes' ? 400 : 722} print />
                            {kind === 'notes' && (
                              <div className="sl-print-notes">
                                <b>Folie {n}</b>
                                <p>{slide.notes || '—'}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </SheetPage>
                  </PrintFrame>
                ))}
          </div>
        </main>
      </div>
    </div>
  );
}
