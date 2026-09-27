// One slide at its full size (1920 × 1080), after the design's slide reference. The caller scales it.
import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { Lightbulb, User, Users } from 'lucide-react';
import { Icon } from '../icons';
import { itemSteps, shownItems, type Slide, type SlideAnim } from '../model/slides';
import { THEMES, WORK_FORMS_EN } from '../model/themes';
import type { Lang } from '../model/types';
import { themeVars } from '../sheet/SheetPage';
import { useImageUrl } from '../storage/images';
import { topicIcon } from '../topicIcons';
import { ElementView } from './elements';
import { Rich } from './Rich';

export { Rich };

export const SLIDE_W = 1920;
export const SLIDE_H = 1080;

/** What all slides of a lesson share. */
export interface SlideContext {
  icon: string;
  lang: Lang;
  /** Header bar line: "Der Treibhauseffekt · Klasse 9 · Stunde 2" */
  kicker: string;
  /** Title slide line: "Klasse 9 · Modul 1: Das Klima kippt · Stunde 2" */
  titleKicker: string;
  footer: string;
}

interface SlideViewProps {
  slide: Slide;
  /** Slide number in the footer. */
  number: number;
  ctx: SlideContext;
  /**
   * Presenting: the clicks so far on this slide; what comes later is hidden, what just came is animated.
   * null shows everything (editing, printing, thumbnails).
   */
  step: number | null;
  /** Editing: answers that come on a click are pale, entries that come on a click show their click number. */
  edit?: boolean;
  /** Presenting: videos play. */
  live?: boolean;
  /** Printing: videos become a QR code. */
  print?: boolean;
  style?: CSSProperties;
}

const TEXT = {
  de: { question: 'Leitfrage', note: 'Hinweis' },
  en: { question: 'Key question', note: 'Note' },
};

function Header({ slide, ctx }: { slide: Slide; ctx: SlideContext }) {
  const en = ctx.lang === 'en';
  const form = slide.form ? (en ? WORK_FORMS_EN[slide.form] : slide.form) : '';
  const formText = [form, slide.minutes ? `${slide.minutes} min` : ''].filter(Boolean).join(' · ');
  return (
    <div className="sl-bar">
      <div className="sl-bar-icon">
        <Icon icon={topicIcon(ctx.icon)} size={36} />
      </div>
      <div className="sl-bar-kicker">{ctx.kicker}</div>
      {slide.phase && <div className="sl-phase">{slide.phase}</div>}
      {formText && (
        <div className="sl-form">
          {slide.form && <Icon icon={slide.form === 'allein' ? User : Users} size={24} />}
          {formText}
        </div>
      )}
    </div>
  );
}

function Footer({ ctx, number }: { ctx: SlideContext; number: number }) {
  return (
    <div className="sl-foot">
      <span>{ctx.footer}</span>
      <b>{number}</b>
    </div>
  );
}

/** Classes of something that appears on click `at`: hidden before, animated when it comes. */
type Appear = (at: number, anim: SlideAnim) => string;

function Answer({ text, at, appear, ghost, lang }: { text: string; at: number; appear: Appear; ghost: boolean; lang: Lang }) {
  if (!text) return null;
  return (
    <div className={'sl-answer' + (text.length > 24 ? ' is-long' : '') + (ghost ? ' is-ghost' : '') + appear(at, 'fade')}>
      <Rich text={text} lang={lang} />
    </div>
  );
}

/** In the editor: the click on which something appears. */
const Badge = ({ at, edit }: { at: number; edit: boolean }) => (edit && at > 0 ? <span className="sl-step-badge">{at}</span> : null);

function Picture({ id, source }: { id: string; source: string }) {
  const img = useImageUrl(id);
  return (
    <figure className="sl-figure">
      <div className={'sl-picture' + (img.status === 'ready' ? ' has-image' : '')}>
        {img.status === 'ready' ? <img src={img.url} alt="" /> : <span>{img.status === 'missing' ? 'Bild fehlt auf diesem Gerät' : 'Bild'}</span>}
      </div>
      {source && <figcaption>Quelle: {source}</figcaption>}
    </figure>
  );
}

const BOX_COLORS = ['var(--color-surface)', 'var(--color-accent-200)', 'var(--color-accent-2-200)', 'var(--color-accent-3-200)'];
const FLOW_COLORS = ['var(--color-accent-200)', 'var(--color-accent-2-200)', 'var(--color-accent-300)', 'var(--color-neutral-300)', 'var(--color-accent-3-200)', 'var(--color-accent-4-200)'];

export function SlideView({ slide: s, number, ctx, step, edit = false, live = false, print = false, style }: SlideViewProps) {
  const lang = ctx.lang;
  const items = shownItems(s);
  const steps = itemSteps(s);
  const vars = { ...themeVars(THEMES[s.type] ?? THEMES.uebung), ...style } as CSSProperties;
  const appear: Appear = (at, anim) => {
    if (step === null || at === 0) return '';
    if (at > step) return ' is-later';
    return anim === 'none' ? '' : ` sl-anim-${anim}`;
  };
  // Answers that come after their question are pale while editing.
  const ghostAnswer = (i: number) => edit && steps[i].answer > steps[i].item;
  const h1 = (cls = '') => (
    <h1 className={'sl-h1' + cls}>
      <Rich text={s.title} lang={lang} />
    </h1>
  );
  const sub = s.text && (
    <div className="sl-sub">
      <Rich text={s.text} lang={lang} />
    </div>
  );

  let body: ReactNode;
  switch (s.layout) {
    case 'title':
      body = (
        <>
          <div className="sl-deco is-one" />
          <div className="sl-deco is-two" />
          <div className="sl-title-icon">
            <Icon icon={topicIcon(ctx.icon)} size={60} />
          </div>
          <div className="sl-title-kicker">{ctx.titleKicker}</div>
          <h1 className="sl-title-h1">
            <Rich text={s.title} lang={lang} />
          </h1>
          {s.text && (
            <div className="sl-title-sub">
              <Rich text={s.text} lang={lang} />
            </div>
          )}
        </>
      );
      break;
    case 'exit':
      body = (
        <>
          <div className="sl-deco is-exit" />
          <Header slide={s} ctx={ctx} />
          {s.text && (
            <div className="sl-exit-text">
              <Rich text={s.text} lang={lang} />
            </div>
          )}
          <div className="sl-exit-main">
            {s.label && <div className="sl-exit-label">{s.label}</div>}
            <h1 className="sl-exit-h1">
              <Rich text={s.title} lang={lang} />
            </h1>
          </div>
          <Footer ctx={ctx} number={number} />
        </>
      );
      break;
    case 'list':
      body = (
        <>
          <div className="sl-head">
            {h1()}
            {sub}
          </div>
          <div className={'sl-list' + (items.length > 4 ? ' is-many' : '')}>
            {items.map(([q, a], i) => (
              <div key={i} className={'sl-item' + appear(steps[i].item, s.itemAnim)}>
                <Badge at={steps[i].item} edit={edit} />
                <div className="sl-num">{i + 1}</div>
                <div className="sl-item-text">
                  <Rich text={q} lang={lang} />
                </div>
                <Answer text={a} at={steps[i].answer} appear={appear} ghost={ghostAnswer(i)} lang={lang} />
              </div>
            ))}
          </div>
        </>
      );
      break;
    case 'quote':
      body = (
        <>
          {s.text && (
            <div className="sl-quote">
              {s.label && <div className="sl-small">{s.label}</div>}
              <div className="sl-quote-text">
                <Rich text={s.text} lang={lang} />
              </div>
            </div>
          )}
          <div className="sl-lead">
            <div className="sl-label">{TEXT[lang].question}</div>
            {h1(' is-big')}
          </div>
        </>
      );
      break;
    case 'statement':
      body = (
        <>
          <div className="sl-lead">
            {s.label && <div className="sl-label">{s.label}</div>}
            {h1(' is-statement')}
          </div>
          {s.text && (
            <div className="sl-hint">
              <div className="sl-hint-icon">
                <Icon icon={Lightbulb} size={36} />
              </div>
              <div className="sl-hint-text">
                <Rich text={s.text} lang={lang} />
              </div>
            </div>
          )}
        </>
      );
      break;
    case 'compare':
      body = (
        <>
          {h1()}
          <div className="sl-compare" style={{ gridTemplateColumns: `repeat(${Math.max(1, items.length)}, minmax(0, 1fr))` }}>
            {items.map(([head, text], i) => (
              <div key={i} className={'sl-box' + appear(steps[i].item, s.itemAnim)} style={{ background: BOX_COLORS[i % BOX_COLORS.length] }}>
                <Badge at={steps[i].item} edit={edit} />
                <div className="sl-box-head">
                  <Rich text={head} lang={lang} />
                </div>
                {text && (
                  <div className="sl-box-text">
                    <Rich text={text} lang={lang} />
                  </div>
                )}
              </div>
            ))}
          </div>
          {sub}
        </>
      );
      break;
    case 'flow':
      body = (
        <>
          {h1()}
          <div className={'sl-flow' + (items.length > 4 ? ' is-many' : '')} style={{ gridTemplateColumns: items.map(() => 'minmax(0, 1fr)').join(' 56px ') }}>
            {items.map(([head, text], i) => (
              <Fragment key={i}>
                {i > 0 && <div className={'sl-arrow' + appear(steps[i].item, s.itemAnim === 'none' ? 'none' : 'fade')}>→</div>}
                <div className={'sl-step' + appear(steps[i].item, s.itemAnim)} style={{ background: FLOW_COLORS[i % FLOW_COLORS.length] }}>
                  <Badge at={steps[i].item} edit={edit} />
                  <div className="sl-step-head">
                    <Rich text={head} lang={lang} />
                  </div>
                  {text && (
                    <div className="sl-step-text">
                      <Rich text={text} lang={lang} />
                    </div>
                  )}
                </div>
              </Fragment>
            ))}
          </div>
          {sub}
        </>
      );
      break;
    case 'words':
      body = (
        <>
          <div className="sl-head">
            {h1()}
            {sub}
          </div>
          <div className={'sl-words' + (items.length > 6 ? ' is-many' : '')}>
            {items.map(([word, meaning], i) => (
              <div key={i} className={'sl-word' + appear(steps[i].item, s.itemAnim)}>
                <Badge at={steps[i].item} edit={edit} />
                <div className="sl-word-main">
                  <Rich text={word} lang={lang} />
                </div>
                {meaning && (
                  <div className={'sl-word-meaning' + (ghostAnswer(i) ? ' is-ghost' : '') + appear(steps[i].answer, 'fade')}>
                    <Rich text={meaning} lang={lang} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      );
      break;
    case 'image':
      body = (
        <>
          {h1()}
          <div className={'sl-image-row' + (s.text ? ' has-text' : '')}>
            <Picture id={s.image} source={s.source} />
            {s.text && (
              <div className="sl-image-text">
                <Rich text={s.text} lang={lang} />
              </div>
            )}
          </div>
        </>
      );
      break;
    case 'blank':
      body = s.title.trim() ? h1() : null;
      break;
  }

  const framed = s.layout !== 'title' && s.layout !== 'exit';
  return (
    <div className={'sl-slide is-' + s.layout} style={vars} lang={lang}>
      {framed && <Header slide={s} ctx={ctx} />}
      {body}
      {framed && <Footer ctx={ctx} number={number} />}
      {s.elements.length > 0 && (
        <div className="sl-elements">
          {s.elements.map((e) => (
            <ElementView key={e.id} e={e} lang={lang} className={appear(e.step, e.anim).trim()} live={live} print={print} />
          ))}
        </div>
      )}
    </div>
  );
}

/** A slide at a given width, scaled from its full size. */
export function SlideBox({ slide, number, ctx, width, edit = false, print = false }: { slide: Slide; number: number; ctx: SlideContext; width: number; edit?: boolean; print?: boolean }) {
  const scale = width / SLIDE_W;
  return (
    <div className="sl-box-frame" style={{ width, height: SLIDE_H * scale }}>
      <SlideView slide={slide} number={number} ctx={ctx} step={null} edit={edit} print={print} style={{ transform: `scale(${scale})` }} />
    </div>
  );
}
