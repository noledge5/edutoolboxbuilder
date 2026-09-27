// One slide at its full size (1920 × 1080), after the design's slide reference. The caller scales it.
import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { Lightbulb, User, Users } from 'lucide-react';
import { Icon } from '../icons';
import { slideItems, type Slide } from '../model/slides';
import { THEMES, WORK_FORMS_EN } from '../model/themes';
import type { Lang } from '../model/types';
import { themeVars } from '../sheet/SheetPage';
import { typo } from '../sheet/lang';
import { useImageUrl } from '../storage/images';
import { topicIcon } from '../topicIcons';

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
  /** Answers and meanings of a slide with `reveal` are shown. */
  revealed: boolean;
  /** Hidden answers are shown pale (editing), instead of not at all (presenting). */
  ghost?: boolean;
  style?: CSSProperties;
}

const TEXT = {
  de: { question: 'Leitfrage', note: 'Hinweis' },
  en: { question: 'Key question', note: 'Note' },
};

/** Text with **bold** and {{marked}} parts, typographic quotes and line breaks. */
export function Rich({ text, lang }: { text: string; lang: Lang }) {
  const lines = typo(text, lang).split('\n');
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line.split(/(\*\*[^*]+\*\*|\{\{[^}]+\}\})/).map((part, k) =>
            part.startsWith('**') && part.endsWith('**') ? (
              <strong key={k}>{part.slice(2, -2)}</strong>
            ) : part.startsWith('{{') && part.endsWith('}}') ? (
              <mark key={k} className="sl-mark">
                {part.slice(2, -2)}
              </mark>
            ) : (
              part
            ),
          )}
        </Fragment>
      ))}
    </>
  );
}

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

function Answer({ text, shown, ghost, lang }: { text: string; shown: boolean; ghost?: boolean; lang: Lang }) {
  if (!text || (!shown && !ghost)) return null;
  return (
    <div className={'sl-answer' + (text.length > 24 ? ' is-long' : '') + (!shown ? ' is-ghost' : '')}>
      <Rich text={text} lang={lang} />
    </div>
  );
}

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

export function SlideView({ slide: s, number, ctx, revealed, ghost, style }: SlideViewProps) {
  const lang = ctx.lang;
  const shown = !s.reveal || revealed;
  const items = slideItems(s.items);
  const vars = { ...themeVars(THEMES[s.type] ?? THEMES.uebung), ...style } as CSSProperties;
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
      return (
        <div className="sl-slide is-title" style={vars} lang={lang}>
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
        </div>
      );
    case 'exit':
      return (
        <div className="sl-slide is-exit" style={vars} lang={lang}>
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
        </div>
      );
    case 'list':
      body = (
        <>
          <div className="sl-head">
            {h1()}
            {sub}
          </div>
          <div className={'sl-list' + (items.length > 4 ? ' is-many' : '')}>
            {items.map(([q, a], i) => (
              <div key={i} className="sl-item">
                <div className="sl-num">{i + 1}</div>
                <div className="sl-item-text">
                  <Rich text={q} lang={lang} />
                </div>
                <Answer text={a} shown={shown} ghost={ghost} lang={lang} />
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
          <div className="sl-compare" style={{ gridTemplateColumns: `repeat(${Math.min(3, Math.max(1, items.length))}, minmax(0, 1fr))` }}>
            {items.slice(0, 3).map(([head, text], i) => (
              <div key={i} className="sl-box" style={{ background: BOX_COLORS[i % BOX_COLORS.length] }}>
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
    case 'flow': {
      const steps = items.slice(0, 5);
      body = (
        <>
          {h1()}
          <div className={'sl-flow' + (steps.length > 4 ? ' is-many' : '')} style={{ gridTemplateColumns: steps.map(() => 'minmax(0, 1fr)').join(' 56px ') }}>
            {steps.map(([head, text], i) => (
              <Fragment key={i}>
                {i > 0 && <div className="sl-arrow">→</div>}
                <div className="sl-step" style={{ background: FLOW_COLORS[i % FLOW_COLORS.length] }}>
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
    }
    case 'words':
      body = (
        <>
          <div className="sl-head">
            {h1()}
            {sub}
          </div>
          <div className={'sl-words' + (items.length > 6 ? ' is-many' : '')}>
            {items.slice(0, 12).map(([word, meaning], i) => (
              <div key={i} className="sl-word">
                <div className="sl-word-main">
                  <Rich text={word} lang={lang} />
                </div>
                {meaning && (shown || ghost) && (
                  <div className={'sl-word-meaning' + (!shown ? ' is-ghost' : '')}>
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
  }

  return (
    <div className={'sl-slide is-' + s.layout} style={vars} lang={lang}>
      <Header slide={s} ctx={ctx} />
      {body}
      <Footer ctx={ctx} number={number} />
    </div>
  );
}

/** A slide at a given width, scaled from its full size. */
export function SlideBox({ slide, number, ctx, width, revealed = true, ghost = false }: { slide: Slide; number: number; ctx: SlideContext; width: number; revealed?: boolean; ghost?: boolean }) {
  const scale = width / SLIDE_W;
  return (
    <div className="sl-box-frame" style={{ width, height: SLIDE_H * scale }}>
      <SlideView slide={slide} number={number} ctx={ctx} revealed={revealed} ghost={ghost} style={{ transform: `scale(${scale})` }} />
    </div>
  );
}
