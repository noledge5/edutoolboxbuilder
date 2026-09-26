// One printed A4 page: header band (Kopfband), optional name field, 12-column body grid, footer band (Fußband).
import { useContext, useMemo, type CSSProperties, type MouseEvent, type ReactNode, type Ref } from 'react';
import { User, Users } from 'lucide-react';
import { Icon } from '../icons';
import { BLOCK_TYPES } from '../model/blockTypes';
import { THEMES, WORK_FORMS_EN, type SheetTheme } from '../model/themes';
import type { Doc, Page } from '../model/types';
import { topicIcon } from '../topicIcons';
import { Editable } from './inlineEdit';
import { SheetModeContext } from './sheetMode';
import { SHEET_TEXT, SheetDocContext } from './lang';

export const PAGE_W = 794;
export const PAGE_H = 1123;

export const themeOf = (page: Page): SheetTheme => THEMES[page.type] ?? THEMES.uebung;

/** Task number (1, 2, 3 …) of each block on the page, or null for non-task blocks. */
export function taskNumbers(page: Page): (number | null)[] {
  let n = 0;
  return page.blocks.map((b) => (BLOCK_TYPES[b.type]?.task ? ++n : null));
}

export const themeVars = (t: SheetTheme): CSSProperties =>
  ({
    '--t-band': t.band,
    '--t-circle': t.circle,
    '--t-circle-fg': t.circleFg,
    '--t-pill': t.pill,
    '--t-pill-fg': t.pillFg,
    '--t-kicker': t.kicker,
    '--t-num': t.num,
    '--t-num-fg': t.numFg,
  }) as CSSProperties;

interface SheetPageProps {
  doc: Doc;
  page: Page;
  index: number;
  editing: boolean;
  headerSelected?: boolean;
  onHeaderClick?: (e: MouseEvent) => void;
  onBodyClick?: (e: MouseEvent) => void;
  bodyRef?: Ref<HTMLDivElement>;
  /** Show the drop bar at the end of the body. */
  dropEnd?: boolean;
  style?: CSSProperties;
  /** Overview pages (content overview, competence grid) have no work form. */
  hideForm?: boolean;
  /** The page's blocks, already wrapped by the caller. */
  children?: ReactNode;
  /** Page number in the footer; teacher pages have none. Defaults to index + 1. */
  number?: number | null;
}

export function SheetPage({ doc, page, index, editing, headerSelected, onHeaderClick, onBodyClick, bodyRef, dropEnd, style, hideForm, children, number = index + 1 }: SheetPageProps) {
  const t = themeOf(page);
  const mode = useContext(SheetModeContext);
  // Pages for the teacher stay German, also in English modules.
  const lang = page.type === 'lehrkraft' ? 'de' : doc.lang;
  const sheetDoc = useMemo(() => (lang === doc.lang ? doc : { ...doc, lang }), [doc, lang]);
  const en = lang === 'en';
  const txt = SHEET_TEXT[lang];
  return (
    <SheetDocContext.Provider value={sheetDoc}>
      <div className={'ws-page' + (mode.bw ? ' is-bw' : '')} style={{ ...themeVars(t), ...style }} data-page={index} lang={lang}>
        <div className={'ws-band' + (headerSelected ? ' is-selected' : '')} onClick={onHeaderClick}>
          <div className="ws-band-icon">
            <Icon icon={topicIcon(doc.icon)} size={26} />
          </div>
          <div className="ws-band-text">
            <Editable className="ws-kicker" target={`page${index}:kicker`} value={page.kicker} />
            <Editable as="h1" className="ws-title" target={`page${index}:title`} value={page.title} />
          </div>
          <div className="ws-band-side">
            {mode.solutions === 'shown' && <div className="ws-solution-pill">{txt.solution}</div>}
            <div className="ws-type-pill">{en ? t.labelEn : t.label}</div>
            {!hideForm && (
              <div className="ws-form-pill">
                <Icon icon={page.form === 'allein' ? User : Users} size={14} />
                {en ? WORK_FORMS_EN[page.form] : page.form}
              </div>
            )}
          </div>
        </div>
        {page.nameField !== 'aus' && (
          <div className="ws-names">
            <b>{page.nameField === 'namen' ? txt.names : txt.name}</b>
            <div className="ws-line" />
            {page.nameField === 'klasse' && (
              <>
                <b>{txt.klasse}</b>
                <div className="ws-line is-short" />
              </>
            )}
            <b>{txt.date}</b>
            <div className="ws-line is-date" />
          </div>
        )}
        <div className="ws-body" ref={bodyRef} onClick={onBodyClick} data-page-body={index}>
          {editing && (
            <div className="ws-grid" aria-hidden="true">
              {Array.from({ length: 12 }, (_, k) => (
                <div key={k} />
              ))}
            </div>
          )}
          {editing && page.blocks.length === 0 && <div className="ws-empty">Element aus der Toolbox hierher ziehen</div>}
          {children}
          {dropEnd && <div className="ws-drop-end" />}
        </div>
        <div className="ws-foot">
          <span className="ws-foot-text">{doc.footer}</span>
          <span className="ws-foot-code">{doc.code}</span>
          <span className="ws-foot-page">{number === null ? 'Lehrkraft' : txt.page(number)}</span>
        </div>
      </div>
    </SheetDocContext.Provider>
  );
}
