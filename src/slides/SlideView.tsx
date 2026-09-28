// One slide at its full size (1920 × 1080), after the design's slide reference. The caller scales it.
import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { Lightbulb, Star, User, Users } from 'lucide-react';
import { Icon } from '../icons';
import { partSteps, shownItems, type Slide, type SlideAnim, type SlideDesign } from '../model/slides';
import { THEMES, WORK_FORMS_EN } from '../model/themes';
import type { Lang } from '../model/types';
import { typo } from '../sheet/lang';
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
  /** The look of the slides (fonts, background, bars, boxes). */
  design: SlideDesign;
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
  /** Handout for the class: solutions that come on a click stay blank. */
  noAnswers?: boolean;
  style?: CSSProperties;
}

const TEXT = {
  de: { question: 'Leitfrage', note: 'Hinweis', solution: 'Lösung' },
  en: { question: 'Key question', note: 'Note', solution: 'Solution' },
};

function Header({ slide, ctx, edit }: { slide: Slide; ctx: SlideContext; edit: boolean }) {
  const en = ctx.lang === 'en';
  const form = slide.form ? (en ? WORK_FORMS_EN[slide.form] : slide.form) : '';
  const formText = [form, slide.minutes ? `${slide.minutes} min` : ''].filter(Boolean).join(' · ');
  return (
    <div className="sl-bar">
      <div className="sl-bar-icon">
        <Icon icon={topicIcon(ctx.icon)} size={36} />
      </div>
      <div className="sl-bar-kicker">{ctx.kicker}</div>
      {slide.phase && (
        <div className="sl-phase" {...(edit ? { 'data-edit': 'phase' } : {})}>
          {slide.phase}
        </div>
      )}
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

/** The line above a task: "Aufgabe 2 · ★★☆ · 3 P.", with the stars drawn like on the sheet. */
function TaskLabel({ text }: { text: string }) {
  return (
    <>
      {text.split(/([★☆]+)/).map((bit, k) =>
        k % 2 ? (
          <span key={k} className="sl-stars">
            {[...bit].map((c, j) => (
              <Star key={j} size={30} strokeWidth={2.5} fill={c === '★' ? 'currentColor' : 'none'} className={c === '★' ? '' : 'is-off'} aria-hidden="true" />
            ))}
          </span>
        ) : (
          bit
        ),
      )}
    </>
  );
}

/**
 * Text with gaps: "The cat [[sits]] on the mat." The words in the gaps come on a click; "___" is a gap
 * without a given word.
 */
function GapText({ text, lang, cls, ghost, data }: { text: string; lang: Lang; cls: string; ghost: boolean; data: Record<string, string> }) {
  return (
    <>
      {text.split(/(\[\[.+?\]\]|_{3,})/).map((bit, k) =>
        k % 2 === 0 ? (
          <Rich key={k} text={bit} lang={lang} />
        ) : bit.startsWith('_') ? (
          <span key={k} className="sl-gap is-empty" />
        ) : (
          <span key={k} className="sl-gap" {...data}>
            <span className={'sl-gap-word' + (ghost ? ' is-ghost' : '') + cls}>{typo(bit.slice(2, -2), lang)}</span>
          </span>
        ),
      )}
    </>
  );
}

const BOX_COLORS = ['var(--color-surface)', 'var(--color-accent-200)', 'var(--color-accent-2-200)', 'var(--color-accent-3-200)'];
const FLOW_COLORS = ['var(--color-accent-200)', 'var(--color-accent-2-200)', 'var(--color-accent-300)', 'var(--color-neutral-300)', 'var(--color-accent-3-200)', 'var(--color-accent-4-200)'];

export function SlideView({ slide: s, number, ctx, step, edit = false, live = false, print = false, noAnswers = false, style }: SlideViewProps) {
  const lang = ctx.lang;
  const items = shownItems(s);
  const parts = partSteps(s);
  const vars = { ...themeVars(THEMES[s.type] ?? THEMES.uebung), ...style } as CSSProperties;
  const appear: Appear = (at, anim) => {
    if (step === null || at === 0) return '';
    if (at > step) return ' is-later';
    return anim === 'none' ? '' : ` sl-anim-${anim}`;
  };
  /** Classes and marks of a part: hidden or animated while presenting, its click number while editing. */
  const part = (key: string) => {
    const p = parts.get(key);
    const at = p?.step ?? 0;
    const hidden = noAnswers && p?.answer && at > 0;
    return { cls: hidden ? ' is-later' : appear(at, p?.anim ?? 'fade'), badge: <Badge at={at} edit={edit} />, at, data: { 'data-part': key } };
  };
  /** In the editor: a text that can be edited right on the slide (double click or double tap). */
  const ed = (target: string) => (edit ? { 'data-edit': target } : {});
  // Answers (and box texts, meanings) that come after their entry are pale while editing.
  const ghost = (i: number) => edit && (parts.get(`answer:${i}`)?.step ?? 0) > (parts.get(`item:${i}`)?.step ?? 0);
  /** The big sentence of a Merksatz or statement, with its gaps. */
  const gapTitle = () => {
    const g = part('gaps');
    return <GapText text={s.title} lang={lang} cls={g.cls} ghost={edit && g.at > (parts.get('title')?.step ?? 0)} data={g.data} />;
  };
  const h1 = (cls = '') => {
    const p = part('title');
    return (
      <h1 className={'sl-h1' + cls + p.cls} {...p.data} {...ed('title')}>
        {p.badge}
        <Rich text={s.title} lang={lang} />
      </h1>
    );
  };
  const sub = () => {
    if (!s.text) return null;
    const p = part('text');
    return (
      <div className={'sl-sub' + p.cls} {...p.data} {...ed('text')}>
        {p.badge}
        <Rich text={s.text} lang={lang} />
      </div>
    );
  };
  const second = (i: number, cls: string, text: string, long = false) => {
    const p = part(`answer:${i}`);
    return (
      <div className={cls + (long && text.length > 24 ? ' is-long' : '') + (ghost(i) ? ' is-ghost' : '') + p.cls} {...p.data} {...ed(`answer:${i}`)}>
        {p.badge}
        <Rich text={text} lang={lang} />
      </div>
    );
  };

  let body: ReactNode;
  switch (s.layout) {
    case 'title': {
      const t = part('title');
      const x = part('text');
      body = (
        <>
          <div className="sl-deco is-one" />
          <div className="sl-deco is-two" />
          <div className="sl-title-icon">
            <Icon icon={topicIcon(ctx.icon)} size={60} />
          </div>
          <div className="sl-title-kicker">{ctx.titleKicker}</div>
          <h1 className={'sl-title-h1' + t.cls} {...t.data} {...ed('title')}>
            {t.badge}
            <Rich text={s.title} lang={lang} />
          </h1>
          {s.text && (
            <div className={'sl-title-sub' + x.cls} {...x.data} {...ed('text')}>
              {x.badge}
              <Rich text={s.text} lang={lang} />
            </div>
          )}
        </>
      );
      break;
    }
    case 'exit': {
      const t = part('title');
      const x = part('text');
      body = (
        <>
          <div className="sl-deco is-exit" />
          <Header slide={s} ctx={ctx} edit={edit} />
          {s.text && (
            <div className={'sl-exit-text' + x.cls} {...x.data} {...ed('text')}>
              {x.badge}
              <Rich text={s.text} lang={lang} />
            </div>
          )}
          <div className={'sl-exit-main' + t.cls} {...t.data}>
            {t.badge}
            {s.label && (
              <div className="sl-exit-label" {...ed('label')}>
                {s.label}
              </div>
            )}
            <h1 className="sl-exit-h1" {...ed('title')}>
              {gapTitle()}
            </h1>
          </div>
          <Footer ctx={ctx} number={number} />
        </>
      );
      break;
    }
    case 'list':
      body = (
        <>
          <div className="sl-head">
            {h1()}
            {sub()}
          </div>
          <div className={'sl-list' + (items.length > 4 ? ' is-many' : '')}>
            {items.map(([q, a], i) => {
              const p = part(`item:${i}`);
              return (
                <div key={i} className={'sl-item' + p.cls} {...p.data}>
                  {p.badge}
                  <div className="sl-num">{i + 1}</div>
                  <div className="sl-item-text" {...ed(`item:${i}`)}>
                    <Rich text={q} lang={lang} />
                  </div>
                  {a && second(i, 'sl-answer', a, true)}
                </div>
              );
            })}
          </div>
        </>
      );
      break;
    case 'task': {
      const t = part('title');
      const x = part('text');
      const pic = part('image');
      const num = /\d+[a-z]?/i.exec(s.label)?.[0] ?? '';
      const main = items.length > 0 || !!s.text.trim();
      body = (
        <>
          <div className={'sl-task-head' + t.cls} {...t.data}>
            {t.badge}
            {num && <div className="sl-num is-task">{num}</div>}
            <div className="sl-task-lead">
              {s.label && (
                <div className="sl-label" {...ed('label')}>
                  <TaskLabel text={s.label} />
                </div>
              )}
              <h1 className={'sl-task-h1' + (s.title.length > 110 ? ' is-long' : '')} {...ed('title')}>
                <Rich text={s.title} lang={lang} />
              </h1>
              {s.help && (
                <div className="sl-task-help" lang="de" {...ed('help')}>
                  <Rich text={s.help} lang="de" />
                </div>
              )}
            </div>
          </div>
          <div className={'sl-task-body' + (s.image && main ? ' has-image' : '')}>
            {main && (
              <div className="sl-task-main">
                {items.length > 0 && (
                  <div className={'sl-task-items' + (items.length > 4 ? ' is-many' : '')}>
                    {items.map(([q, a], i) => {
                      const p = part(`item:${i}`);
                      const g = part(`answer:${i}`);
                      return (
                        <div key={i} className={'sl-task-item' + p.cls} {...p.data}>
                          {p.badge}
                          {items.length > 1 && <div className="sl-task-letter">{String.fromCharCode(97 + i)}</div>}
                          <div className="sl-item-text" {...ed(`item:${i}`)}>
                            <GapText text={q} lang={lang} cls={g.cls} ghost={ghost(i)} data={g.data} />
                          </div>
                          {a && second(i, 'sl-answer', a, true)}
                        </div>
                      );
                    })}
                  </div>
                )}
                {s.text.trim() && (
                  <div className={'sl-solution' + (edit && x.at > 0 ? ' is-ghost' : '') + x.cls} {...x.data}>
                    {x.badge}
                    <div className="sl-solution-label">{TEXT[lang].solution}</div>
                    <div className="sl-solution-text" {...ed('text')}>
                      <Rich text={s.text} lang={lang} />
                    </div>
                  </div>
                )}
              </div>
            )}
            {s.image && (
              <div className={'sl-figure-wrap' + pic.cls} {...pic.data}>
                {pic.badge}
                <Picture id={s.image} source={s.source} />
              </div>
            )}
          </div>
        </>
      );
      break;
    }
    case 'quote': {
      const x = part('text');
      const t = part('title');
      body = (
        <>
          {s.text && (
            <div className={'sl-quote' + x.cls} {...x.data}>
              {x.badge}
              {s.label && (
                <div className="sl-small" {...ed('label')}>
                  {s.label}
                </div>
              )}
              <div className="sl-quote-text" {...ed('text')}>
                <Rich text={s.text} lang={lang} />
              </div>
            </div>
          )}
          <div className={'sl-lead' + t.cls} {...t.data}>
            {t.badge}
            <div className="sl-label">{TEXT[lang].question}</div>
            <h1 className="sl-h1 is-big" {...ed('title')}>
              <Rich text={s.title} lang={lang} />
            </h1>
          </div>
        </>
      );
      break;
    }
    case 'statement': {
      const t = part('title');
      const x = part('text');
      body = (
        <>
          <div className={'sl-lead' + t.cls} {...t.data}>
            {t.badge}
            {s.label && (
              <div className="sl-label" {...ed('label')}>
                {s.label}
              </div>
            )}
            <h1 className="sl-h1 is-statement" {...ed('title')}>
              {gapTitle()}
            </h1>
          </div>
          {s.text && (
            <div className={'sl-hint' + x.cls} {...x.data}>
              {x.badge}
              <div className="sl-hint-icon">
                <Icon icon={Lightbulb} size={36} />
              </div>
              <div className="sl-hint-text" {...ed('text')}>
                <Rich text={s.text} lang={lang} />
              </div>
            </div>
          )}
        </>
      );
      break;
    }
    case 'compare':
      body = (
        <>
          {h1()}
          <div className="sl-compare" style={{ gridTemplateColumns: `repeat(${Math.max(1, items.length)}, minmax(0, 1fr))` }}>
            {items.map(([head, text], i) => {
              const p = part(`item:${i}`);
              return (
                <div key={i} className={'sl-box' + p.cls} style={{ background: BOX_COLORS[i % BOX_COLORS.length] }} {...p.data}>
                  {p.badge}
                  <div className="sl-box-head" {...ed(`item:${i}`)}>
                    <Rich text={head} lang={lang} />
                  </div>
                  {text && second(i, 'sl-box-text', text)}
                </div>
              );
            })}
          </div>
          {sub()}
        </>
      );
      break;
    case 'flow':
      body = (
        <>
          {h1()}
          <div className={'sl-flow' + (items.length > 4 ? ' is-many' : '')} style={{ gridTemplateColumns: items.map(() => 'minmax(0, 1fr)').join(' 56px ') }}>
            {items.map(([head, text], i) => {
              const p = part(`item:${i}`);
              const anim = parts.get(`item:${i}`)?.anim ?? 'fade';
              return (
                <Fragment key={i}>
                  {i > 0 && (
                    <div className={'sl-arrow' + appear(p.at, anim === 'none' ? 'none' : 'fade')} data-with={`item:${i}`}>
                      →
                    </div>
                  )}
                  <div className={'sl-step' + p.cls} style={{ background: FLOW_COLORS[i % FLOW_COLORS.length] }} {...p.data}>
                    {p.badge}
                    <div className="sl-step-head" {...ed(`item:${i}`)}>
                      <Rich text={head} lang={lang} />
                    </div>
                    {text && second(i, 'sl-step-text', text)}
                  </div>
                </Fragment>
              );
            })}
          </div>
          {sub()}
        </>
      );
      break;
    case 'words':
      body = (
        <>
          <div className="sl-head">
            {h1()}
            {sub()}
          </div>
          <div className={'sl-words' + (items.length > 6 ? ' is-many' : '')}>
            {items.map(([word, meaning], i) => {
              const p = part(`item:${i}`);
              return (
                <div key={i} className={'sl-word' + p.cls} {...p.data}>
                  {p.badge}
                  <div className="sl-word-main" {...ed(`item:${i}`)}>
                    <Rich text={word} lang={lang} />
                  </div>
                  {meaning && second(i, 'sl-word-meaning', meaning)}
                </div>
              );
            })}
          </div>
        </>
      );
      break;
    case 'image': {
      const pic = part('image');
      const x = part('text');
      body = (
        <>
          {h1()}
          <div className={'sl-image-row' + (s.text ? ' has-text' : '')}>
            <div className={'sl-figure-wrap' + pic.cls} {...pic.data}>
              {pic.badge}
              <Picture id={s.image} source={s.source} />
            </div>
            {s.text && (
              <div className={'sl-image-text' + x.cls} {...x.data} {...ed('text')}>
                {x.badge}
                <Rich text={s.text} lang={lang} />
              </div>
            )}
          </div>
        </>
      );
      break;
    }
    case 'blank':
      body = s.title.trim() ? h1() : null;
      break;
  }

  const framed = s.layout !== 'title' && s.layout !== 'exit';
  return (
    <div className={`sl-slide is-${s.layout} is-d-${ctx.design}`} style={vars} lang={lang}>
      {framed && <Header slide={s} ctx={ctx} edit={edit} />}
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
export function SlideBox(props: { slide: Slide; number: number; ctx: SlideContext; width: number; edit?: boolean; print?: boolean; noAnswers?: boolean }) {
  const { slide, number, ctx, width, edit = false, print = false, noAnswers = false } = props;
  const scale = width / SLIDE_W;
  return (
    <div className="sl-box-frame" style={{ width, height: SLIDE_H * scale }}>
      <SlideView slide={slide} number={number} ctx={ctx} step={null} edit={edit} print={print} noAnswers={noAnswers} style={{ transform: `scale(${scale})` }} />
    </div>
  );
}
