// PowerPoint export. The slides are drawn once more, full size and off screen, in their design; every box, text,
// picture and icon of that drawing becomes an editable PowerPoint shape, text box or picture at the same place.
// What appears on a click while presenting becomes an entrance animation, so solutions come on a click in
// PowerPoint and Keynote too. Gaps are two text boxes on top of each other: the sentence with empty gaps, and the
// same sentence with only the gap words visible, which comes on the click.
import type PptxGenJS from 'pptxgenjs';
import { leanSlide, partSteps, slideImages, type Slide, type SlideAnim, type SlideDesign, type SlideTransition } from '../model/slides';
import { toDataUrl } from '../storage/backup';
import { getImage } from '../storage/db';

type PptxSlide = PptxGenJS.Slide;
type TextRun = PptxGenJS.TextProps;

/** Inches per slide pixel: 1920 px are the 13.333 in of PowerPoint's 16:9 slide. Points per pixel: 0.5. */
const IN = 13.333 / 1920;
const PT = 0.5;

export interface PptxOptions {
  /** Entrance animations for what comes on a click; false shows everything at once. */
  clicks: boolean;
  title: string;
  lang: 'de' | 'en';
  design: SlideDesign;
}

/** The slides as the Baukasten keeps them, inside the PowerPoint file, so they come back unchanged. */
export const PPTX_SLIDES_PATH = 'baukasten/folien.json';
export const PPTX_SLIDES_FORMAT = 'arbeitsblatt-baukasten-folien';

export interface PptxSlidesFile {
  format: typeof PPTX_SLIDES_FORMAT;
  version: 1;
  design: SlideDesign;
  slides: ReturnType<typeof leanSlide>[];
  /** Image id → data URL. */
  images: Record<string, string>;
  /** Per slide: fingerprint of its words in the PowerPoint file (see `wordsPrint`). */
  prints: string[];
}

/**
 * Fingerprint of the words on a PowerPoint slide. A slide whose words were changed in PowerPoint gets
 * another fingerprint and is read like any other PowerPoint slide.
 */
export function wordsPrint(xml: string): string {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const words = [...doc.getElementsByTagNameNS('http://schemas.openxmlformats.org/drawingml/2006/main', 't')].map((t) => t.textContent ?? '').join('\u0001');
  let h = 0x811c9dc5;
  for (let i = 0; i < words.length; i++) {
    h ^= words.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${words.length}-${h.toString(16)}`;
}

interface Anim {
  step: number;
  anim: SlideAnim;
  /** A cover: it goes on its click instead of coming. */
  exit?: boolean;
}

/** An object on a PowerPoint slide that appears on a click. */
interface Placed extends Anim {
  name: string;
  picture: boolean;
}

// — Colours —

const probe = typeof document !== 'undefined' ? document.createElement('canvas') : null;
const colors = new Map<string, { hex: string; alpha: number } | null>();
const hex = (n: number) =>
  Math.round(Math.min(255, Math.max(0, n)))
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();

/** A CSS colour (rgb(), rgba(), color(srgb …) …) as PowerPoint hex and opacity; null when invisible. */
export function cssColor(css: string): { hex: string; alpha: number } | null {
  if (!css || css === 'transparent' || css === 'none') return null;
  if (colors.has(css)) return colors.get(css)!;
  let rgba: number[] | null = null;
  const m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+)(%?))?\s*\)$/.exec(css);
  if (m) rgba = [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : m[5] ? +m[4] / 100 : +m[4]];
  else if (probe) {
    // Anything else (color-mix results, named colours) the browser paints for us.
    probe.width = probe.height = 1;
    const ctx = probe.getContext('2d', { willReadFrequently: true })!;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#000';
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    rgba = [d[0], d[1], d[2], d[3] / 255];
  }
  const out = rgba && rgba[3] > 0.02 ? { hex: hex(rgba[0]) + hex(rgba[1]) + hex(rgba[2]), alpha: rgba[3] } : null;
  colors.set(css, out);
  return out;
}

const transparency = (alpha: number) => Math.round((1 - alpha) * 100);

// — Pictures —

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'));
    img.src = src;
  });
}

/** An SVG drawing as PNG data, `scale` times its size. */
async function rasterSvg(xml: string, w: number, h: number, scale: number): Promise<string> {
  const img = await loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * scale));
  c.height = Math.max(1, Math.round(h * scale));
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/png');
}

const attr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** The background of a box (colour, gradients, patterns) as a picture. */
async function rasterBackground(cs: CSSStyleDeclaration, w: number, h: number): Promise<string> {
  const style = ['background-color', 'background-image', 'background-size', 'background-position', 'background-repeat'].map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';');
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${w}px;height:${h}px;${attr(style)}"></div></foreignObject></svg>`;
  return rasterSvg(xml, w, h, 1);
}

/** The page's style rules without fonts, for drawing a part of a slide as a picture (cached per export). */
let ruleText: string | null = null;
function pageRules(): string {
  if (ruleText !== null) return ruleText;
  const out: string[] = [];
  for (const sheet of [...document.styleSheets]) {
    try {
      for (const rule of [...sheet.cssRules]) if (!(rule instanceof CSSFontFaceRule)) out.push(rule.cssText);
    } catch {
      // A sheet from another origin cannot be read.
    }
  }
  return (ruleText = out.join('\n'));
}

/**
 * A box of a subject design with what CSS draws around it (masked motifs, ::before/::after, clip-path) as a picture.
 * Its children are left out: they are added as shapes on top. `root` gives the classes and variables of the slide.
 */
async function rasterDecor(el: HTMLElement, root: HTMLElement, w: number, h: number): Promise<string> {
  const clone = el.cloneNode(el === root ? false : true) as HTMLElement;
  clone.classList.add('om-raster');
  clone.style.cssText += `;position:absolute;left:0;top:0;width:${w}px;height:${h}px;margin:0;transform:none;`;
  const inner =
    el === root
      ? clone.outerHTML.replace(/^<div /, '<div xmlns="http://www.w3.org/1999/xhtml" ')
      : `<div xmlns="http://www.w3.org/1999/xhtml" class="${attr(root.className)} om-wrap" style="${attr(root.getAttribute('style') ?? '')};position:relative;width:${w}px;height:${h}px;overflow:visible;background:none">${clone.outerHTML}</div>`;
  const style = `${pageRules()}\n.om-wrap::before,.om-wrap::after{display:none!important}.om-raster>*{visibility:hidden!important}`;
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><foreignObject width="100%" height="100%"><style xmlns="http://www.w3.org/1999/xhtml">${style.replace(/</g, '\\3c ')}</style>${inner}</foreignObject></svg>`;
  return rasterSvg(xml, w, h, 1);
}

/** What an <img> shows (with object-fit), as data and the rectangle it covers. */
async function pictureData(img: HTMLImageElement, r: DOMRect): Promise<{ data: string; x: number; y: number; w: number; h: number } | null> {
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  if (!nw || !nh) return null;
  const fit = getComputedStyle(img).objectFit;
  let x = r.left;
  let y = r.top;
  let w = r.width;
  let h = r.height;
  let sx = 0;
  let sy = 0;
  let sw = nw;
  let sh = nh;
  if (fit === 'contain' || fit === 'scale-down') {
    const s = Math.min(r.width / nw, r.height / nh);
    w = nw * s;
    h = nh * s;
    x += (r.width - w) / 2;
    y += (r.height - h) / 2;
  } else if (fit === 'cover') {
    const s = Math.max(r.width / nw, r.height / nh);
    sw = r.width / s;
    sh = r.height / s;
    sx = (nw - sw) / 2;
    sy = (nh - sh) / 2;
  }
  const scale = Math.min(2, 2400 / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * scale));
  c.height = Math.max(1, Math.round(h * scale));
  c.getContext('2d')!.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
  // Photos as JPEG keep the file small; anything that may be transparent stays PNG.
  const photo = /jpe?g/i.test(img.src) || img.currentSrc.startsWith('blob:');
  const data = photo && !(await hasAlpha(c)) ? c.toDataURL('image/jpeg', 0.88) : c.toDataURL('image/png');
  return { data, x, y, w, h };
}

async function hasAlpha(c: HTMLCanvasElement): Promise<boolean> {
  const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
  for (let i = 3; i < d.length; i += 4 * 37) if (d[i] < 250) return true;
  return false;
}

// — Animations and transitions (PresentationML) —

const TRANSITIONS: Partial<Record<SlideTransition, string>> = {
  fade: '<p:transition spd="med"><p:fade/></p:transition>',
  push: '<p:transition spd="med"><p:push dir="l"/></p:transition>',
  zoom: '<p:transition spd="med"><p:zoom/></p:transition>',
};

/** Entrance of one object: made visible, then faded (and moved or grown) in. */
function effect(id: number, anim: SlideAnim, first: boolean, next: () => number): string {
  const target = `<p:tgtEl><p:spTgt spid="${id}"/></p:tgtEl>`;
  const show = `<p:set><p:cBhvr><p:cTn id="${next()}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>${target}<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>`;
  const move = (attrName: string, from: string, to: string) =>
    `<p:anim calcmode="lin" valueType="num"><p:cBhvr additive="base"><p:cTn id="${next()}" dur="500" fill="hold"/>${target}<p:attrNameLst><p:attrName>${attrName}</p:attrName></p:attrNameLst></p:cBhvr><p:tavLst><p:tav tm="0"><p:val><p:strVal val="${from}"/></p:val></p:tav><p:tav tm="100000"><p:val><p:strVal val="${to}"/></p:val></p:tav></p:tavLst></p:anim>`;
  let behaviours = show;
  let preset = '1';
  if (anim !== 'none') {
    preset = '10';
    behaviours += `<p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="${next()}" dur="500"/>${target}</p:cBhvr></p:animEffect>`;
    if (anim === 'rise') behaviours += move('ppt_y', '#ppt_y+0.06', '#ppt_y');
    if (anim === 'left') behaviours += move('ppt_x', '#ppt_x-0.06', '#ppt_x');
    if (anim === 'zoom') behaviours += move('ppt_w', '#ppt_w*0.6', '#ppt_w') + move('ppt_h', '#ppt_h*0.6', '#ppt_h');
  }
  return `<p:par><p:cTn id="${next()}" presetID="${preset}" presetClass="entr" presetSubtype="0" fill="hold" grpId="0" nodeType="${first ? 'clickEffect' : 'withEffect'}"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>${behaviours}</p:childTnLst></p:cTn></p:par>`;
}

/** Exit of a cover: faded out, then hidden. */
function exitEffect(id: number, first: boolean, next: () => number): string {
  const target = `<p:tgtEl><p:spTgt spid="${id}"/></p:tgtEl>`;
  const fade = `<p:animEffect transition="out" filter="fade"><p:cBhvr><p:cTn id="${next()}" dur="500"/>${target}</p:cBhvr></p:animEffect>`;
  const hide = `<p:set><p:cBhvr><p:cTn id="${next()}" dur="1" fill="hold"><p:stCondLst><p:cond delay="499"/></p:stCondLst></p:cTn>${target}<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="hidden"/></p:to></p:set>`;
  return `<p:par><p:cTn id="${next()}" presetID="10" presetClass="exit" presetSubtype="0" fill="hold" grpId="1" nodeType="${first ? 'clickEffect' : 'withEffect'}"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>${fade}${hide}</p:childTnLst></p:cTn></p:par>`;
}

/** The click sequence of a slide: one click per step, all objects of a step together; covers go on theirs. */
export function timingXml(objects: { id: number; step: number; anim: SlideAnim; picture: boolean; exit?: boolean }[]): string {
  const steps = [...new Set(objects.filter((o) => o.step > 0).map((o) => o.step))].sort((a, b) => a - b);
  if (!steps.length) return '';
  let n = 2;
  const next = () => ++n;
  const clicks = steps
    .map((step) => {
      const outer = next();
      const inner = next();
      const effects = objects
        .filter((o) => o.step === step)
        .map((o, k) => (o.exit ? exitEffect(o.id, k === 0, next) : effect(o.id, o.anim, k === 0, next)))
        .join('');
      return `<p:par><p:cTn id="${outer}" fill="hold"><p:stCondLst><p:cond delay="indefinite"/></p:stCondLst><p:childTnLst><p:par><p:cTn id="${inner}" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>${effects}</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par>`;
    })
    .join('');
  const builds = objects
    .filter((o) => o.step > 0 && !o.picture)
    .map((o) => `<p:bldP spid="${o.id}" grpId="${o.exit ? 1 : 0}" animBg="1"/>`)
    .join('');
  return (
    `<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>` +
    `<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>${clicks}</p:childTnLst></p:cTn>` +
    `<p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>` +
    `<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>` +
    `</p:childTnLst></p:cTn></p:par></p:tnLst>${builds ? `<p:bldLst>${builds}</p:bldLst>` : ''}</p:timing>`
  );
}

/** Adds the transition and click animations to a slide's XML; objects are found by their names. */
export function addTiming(xml: string, placed: Placed[], transition: SlideTransition): string {
  const ids = new Map<string, number>();
  for (const m of xml.matchAll(/<p:cNvPr id="(\d+)" name="([^"]*)"/g)) ids.set(m[2], Number(m[1]));
  const objects = placed.flatMap((p) => (ids.has(p.name) ? [{ id: ids.get(p.name)!, step: p.step, anim: p.anim, picture: p.picture, exit: p.exit }] : []));
  const extra = (TRANSITIONS[transition] ?? '') + timingXml(objects);
  if (!extra) return xml;
  return xml.includes('</p:clrMapOvr>') ? xml.replace('</p:clrMapOvr>', '</p:clrMapOvr>' + extra) : xml.replace('</p:sld>', extra + '</p:sld>');
}

// — Drawing one slide —

interface Run {
  text: string;
  el: HTMLElement;
  step: Anim;
  /** Words in a gap: the colour of its line. */
  gap: string;
  /** A gap without a given word. */
  blank: boolean;
  br: boolean;
}

const INLINE = new Set(['inline', 'contents']);

/** Whether a child belongs to the text around it (words, bold, marks, gaps) rather than being a box of its own. */
function inlineText(el: HTMLElement): boolean {
  if (el.tagName === 'BR' || el.classList.contains('sl-gap') || el.classList.contains('sl-gap-word')) return true;
  if (!INLINE.has(getComputedStyle(el).display)) return false;
  return !el.querySelector('svg, img, video, iframe');
}

function fontFace(cs: CSSStyleDeclaration): string {
  return cs.fontFamily
    .split(',')[0]
    .trim()
    .replace(/^["']|["']$/g, '');
}

function caseOf(text: string, cs: CSSStyleDeclaration): string {
  if (cs.textTransform === 'uppercase') return text.toUpperCase();
  if (cs.textTransform === 'lowercase') return text.toLowerCase();
  return text;
}

export async function drawSlide(root: HTMLElement, s: Slide, pptx: PptxGenJS, opts: PptxOptions): Promise<{ slide: PptxSlide; placed: Placed[] }> {
  const slide = pptx.addSlide();
  ruleText = null;
  const base = root.getBoundingClientRect();
  const parts = partSteps(s);
  const placed: Placed[] = [];
  const lang = opts.lang === 'en' ? 'en-GB' : 'de-DE';
  let count = 0;
  const pos = (x: number, y: number, w: number, h: number) => ({ x: (x - base.left) * IN, y: (y - base.top) * IN, w: Math.max(w, 1) * IN, h: Math.max(h, 1) * IN });
  const name = (kind: string, a: Anim, picture = false) => {
    const n = `${kind} ${++count}`;
    if (a.step > 0) placed.push({ name: n, step: a.step, anim: a.anim, picture, exit: a.exit });
    return n;
  };
  /** On which click an element appears: from the part or element it belongs to. */
  const stepOf = (el: Element): Anim => {
    if (!opts.clicks) return { step: 0, anim: 'none' };
    for (let p: Element | null = el; p && p !== root.parentElement; p = p.parentElement) {
      if (!(p instanceof HTMLElement)) continue;
      const id = p.dataset.el;
      if (id) {
        const e = s.elements.find((x) => x.id === id);
        if (e) return { step: e.step, anim: e.anim, exit: e.kind === 'cover' };
      }
      const key = p.dataset.part ?? p.dataset.with;
      const part = key ? parts.get(key) : undefined;
      if (part) return { step: part.step, anim: part.anim };
    }
    return { step: 0, anim: 'none' };
  };
  const linkOf = (el: Element) => {
    const id = el.closest<HTMLElement>('[data-el]')?.dataset.el;
    const e = id ? s.elements.find((x) => x.id === id) : undefined;
    return e && (e.kind === 'qr' || e.kind === 'video') && /^https?:\/\//.test(e.url) ? e.url : '';
  };

  /** The colour behind a box: of the nearest solid box around it, or of the slide. */
  const behind = (el: HTMLElement) => {
    for (let p: HTMLElement | null = el; p && p !== root; p = p.parentElement) {
      const c = cssColor(getComputedStyle(p).backgroundColor);
      if (c && c.alpha > 0.95) return c;
    }
    return cssColor(getComputedStyle(root).backgroundColor) ?? { hex: 'FFFFFF', alpha: 1 };
  };

  // The slide's own background: a colour, or a picture of a pattern (squared paper).
  const rcs = getComputedStyle(root);
  const bg = cssColor(rcs.backgroundColor);
  if (root.classList.contains('is-fd')) {
    // A subject design: tinted paper, pattern and frame (::before) as one picture.
    try {
      slide.background = { data: await rasterDecor(root, root, 1920, 1080) };
    } catch {
      if (bg) slide.background = { color: bg.hex };
    }
  } else if (rcs.backgroundImage && rcs.backgroundImage !== 'none') {
    try {
      slide.background = { data: await rasterBackground(rcs, 1920, 1080) };
    } catch {
      if (bg) slide.background = { color: bg.hex };
    }
  } else if (bg) slide.background = { color: bg.hex };

  /** Fill and frame of a box. */
  const box = (el: HTMLElement, cs: CSSStyleDeclaration, r: DOMRect) => {
    const fill = cssColor(cs.backgroundColor);
    const sides = (['Top', 'Right', 'Bottom', 'Left'] as const).map((side) => ({
      side,
      width: cs.getPropertyValue(`border-${side.toLowerCase()}-style`) === 'none' ? 0 : parseFloat(cs.getPropertyValue(`border-${side.toLowerCase()}-width`)) || 0,
      color: cssColor(cs.getPropertyValue(`border-${side.toLowerCase()}-color`)),
      dashed: /dash|dott/.test(cs.getPropertyValue(`border-${side.toLowerCase()}-style`)),
    }));
    const drawn = sides.filter((x) => x.width > 0.2 && x.color);
    if (!fill && !drawn.length) return;
    const a = stepOf(el);
    const uniform = drawn.length === 4 && drawn.every((x) => x.width === drawn[0].width && x.color!.hex === drawn[0].color!.hex);
    const radius = Math.min(parseFloat(cs.borderTopLeftRadius) * (cs.borderTopLeftRadius.endsWith('%') ? r.width / 100 : 1) || 0, Math.min(r.width, r.height) / 2);
    const round = radius >= Math.min(r.width, r.height) / 2 - 0.5;
    const shape = round && Math.abs(r.width - r.height) < 1.5 ? pptx.ShapeType.ellipse : radius > 0.5 ? pptx.ShapeType.roundRect : pptx.ShapeType.rect;
    if (fill || uniform) {
      const line = uniform
        ? { color: drawn[0].color!.hex, width: drawn[0].width * PT, transparency: transparency(drawn[0].color!.alpha), dashType: drawn[0].dashed ? ('dash' as const) : ('solid' as const) }
        : { type: 'none' as const };
      // A frame is drawn on the middle of the box's edge in PowerPoint, inside it in the browser.
      const inset = uniform ? drawn[0].width / 2 : 0;
      slide.addShape(shape, {
        ...pos(r.left + inset, r.top + inset, r.width - 2 * inset, r.height - 2 * inset),
        fill: fill ? { color: fill.hex, transparency: transparency(fill.alpha) } : { type: 'none' },
        line,
        rectRadius: shape === pptx.ShapeType.roundRect ? Math.max(0, radius - inset) * IN : undefined,
        objectName: name('Form', a),
      });
    }
    // Single edges (a line under the header, a coloured side) as thin bars.
    if (!uniform)
      for (const d of drawn) {
        const w = d.width;
        const [x, y, bw, bh] =
          d.side === 'Top'
            ? [r.left, r.top, r.width, w]
            : d.side === 'Bottom'
              ? [r.left, r.bottom - w, r.width, w]
              : d.side === 'Left'
                ? [r.left, r.top, w, r.height]
                : [r.right - w, r.top, w, r.height];
        slide.addShape(pptx.ShapeType.rect, { ...pos(x, y, bw, bh), fill: { color: d.color!.hex, transparency: transparency(d.color!.alpha) }, line: { type: 'none' }, objectName: name('Linie', a) });
      }
  };

  /** Words of a text in runs, with their look and the click on which they come. */
  const collect = (nodes: Node[], out: Run[]) => {
    for (const n of nodes) {
      if (n.nodeType === Node.TEXT_NODE) {
        const el = n.parentElement!;
        const text = (n.textContent ?? '').replace(/\s+/g, ' ');
        if (!text) continue;
        const gap = el.closest<HTMLElement>('.sl-gap');
        out.push({ text, el, step: stepOf(el), gap: gap ? getComputedStyle(gap).borderBottomColor : '', blank: false, br: false });
      } else if (n instanceof HTMLElement) {
        const cs = getComputedStyle(n);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        if (n.tagName === 'BR') {
          if (out.length) out[out.length - 1].br = true;
          continue;
        }
        // A gap without a given word: a line to write on.
        if (n.classList.contains('sl-gap') && !n.textContent?.trim()) {
          const size = parseFloat(cs.fontSize) || 36;
          out.push({
            text: ' ' + '_'.repeat(Math.max(4, Math.round(n.getBoundingClientRect().width / (size * 0.5)))) + ' ',
            el: n,
            step: { step: 0, anim: 'none' },
            gap: cs.borderBottomColor,
            blank: true,
            br: false,
          });
          continue;
        }
        collect([...n.childNodes], out);
      }
    }
  };

  /** A text box for words that belong together (a heading, an entry, an answer …). */
  const text = (container: HTMLElement, nodes: Node[]) => {
    const runs: Run[] = [];
    collect(nodes, runs);
    // Spaces as the browser shows them: none at the start or end of a line, never two in a row.
    for (let i = 0; i < runs.length; i++) {
      const prev = runs[i - 1];
      if (!prev || prev.br || prev.text.endsWith(' ')) runs[i].text = runs[i].text.replace(/^ /, '');
      if (runs[i].br || i === runs.length - 1) runs[i].text = runs[i].text.replace(/ $/, '');
    }
    const shown = runs.filter((r) => r.text || r.br);
    if (!shown.some((r) => r.text.trim())) return;
    // Where the words are.
    let x1 = Infinity;
    let y1 = Infinity;
    let x2 = -Infinity;
    let y2 = -Infinity;
    const range = document.createRange();
    const bottoms: number[] = [];
    const within = (n: Node) => {
      if (n.nodeType === Node.TEXT_NODE && n.textContent?.trim()) {
        range.selectNodeContents(n);
        for (const q of range.getClientRects()) {
          if (q.width < 0.1) continue;
          bottoms.push(q.bottom);
          x1 = Math.min(x1, q.left);
          y1 = Math.min(y1, q.top);
          x2 = Math.max(x2, q.right);
          y2 = Math.max(y2, q.bottom);
        }
      } else if (n instanceof HTMLElement && n.classList.contains('sl-gap') && !n.textContent?.trim()) {
        const q = n.getBoundingClientRect();
        x1 = Math.min(x1, q.left);
        y1 = Math.min(y1, q.top);
        x2 = Math.max(x2, q.right);
        y2 = Math.max(y2, q.bottom);
      } else n.childNodes.forEach(within);
    };
    nodes.forEach(within);
    if (!Number.isFinite(x1)) return;
    const cs = getComputedStyle(container);
    const align = /center/.test(cs.textAlign) ? 'center' : /right|end/.test(cs.textAlign) ? 'right' : 'left';
    // Text on one line stays on one line, even where PowerPoint's type is a little wider.
    const size = parseFloat(cs.fontSize) || 36;
    bottoms.sort((a, b) => a - b);
    const lines = 1 + bottoms.filter((b, i) => i > 0 && b - bottoms[i - 1] > size * 0.5).length;
    // Long lines may wrap rather than run off the slide.
    const oneLine = cs.whiteSpace === 'nowrap' || (lines <= 1 && x2 - x1 < 1100);
    // PowerPoint's type runs a little wider than the browser's; the box gets some room on its open side.
    const room = Math.max(size * 0.6, (x2 - x1) * 0.06);
    if (align === 'center') x1 -= room / 2;
    else if (align === 'right') x1 -= room;
    x2 += align === 'center' ? room / 2 : align === 'left' ? room : 0;
    const lh = parseFloat(cs.lineHeight);
    const lineSpacingMultiple = Number.isFinite(lh) ? Math.min(3, Math.max(0.7, lh / size / 1.2)) : undefined;
    // One box per click, all with the same words, so they lie exactly on top of each other: first the sentence
    // with its gap words in the colour of the background (only their line shows), on the click the whole sentence.
    const steps = [...new Map(shown.map((r) => [r.step.step, r.step])).values()].sort((a, b) => a.step - b.step);
    const cover = steps.length > 1 ? behind(container) : null;
    steps.forEach((st, k) => {
      const items: TextRun[] = shown.map((r) => {
        const rcs = getComputedStyle(r.el);
        const later = r.step.step > st.step;
        const c = (later && cover) || (r.blank ? cssColor(r.gap) : null) || cssColor(rcs.color) || { hex: '000000', alpha: 1 };
        const mark = cssColor(rcs.backgroundColor);
        return {
          text: caseOf(r.text, rcs),
          options: {
            fontFace: fontFace(rcs),
            fontSize: (parseFloat(rcs.fontSize) || size) * PT,
            bold: Number(rcs.fontWeight) >= 600,
            italic: rcs.fontStyle === 'italic',
            color: c.hex,
            transparency: transparency(c.alpha),
            highlight: !later && mark && r.el.closest('mark') ? mark.hex : undefined,
            underline: r.gap && !r.blank ? { style: 'sng' as const, color: cssColor(r.gap)?.hex } : undefined,
            charSpacing: parseFloat(rcs.letterSpacing) ? parseFloat(rcs.letterSpacing) * PT : undefined,
            breakLine: r.br || undefined,
            lang,
          },
        };
      });
      slide.addText(items, {
        ...pos(x1, y1, x2 - x1, y2 - y1),
        margin: 0,
        valign: 'top',
        align,
        wrap: !oneLine,
        fit: 'none',
        lineSpacingMultiple,
        fill: k > 0 && cover ? { color: cover.hex } : undefined,
        objectName: name('Text', st),
      });
    });
  };

  const svg = async (el: SVGSVGElement) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    const clone = el.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', String(r.width));
    clone.setAttribute('height', String(r.height));
    if (Number(cs.opacity) < 1) clone.setAttribute('opacity', cs.opacity);
    // Colours from CSS variables (the pen's ink) do not work in a picture on its own: they are written out.
    const own = el.querySelectorAll('[fill^="var("]');
    clone.querySelectorAll('[fill^="var("]').forEach((n, k) => n.setAttribute('fill', getComputedStyle(own[k]).fill));
    const xml = new XMLSerializer().serializeToString(clone).replace(/currentColor/g, cs.color);
    const data = await rasterSvg(xml, r.width, r.height, Math.min(3, 1200 / Math.max(r.width, r.height)));
    const url = linkOf(el);
    slide.addImage({ data, ...pos(r.left, r.top, r.width, r.height), objectName: name('Bild', stepOf(el), true), ...(url ? { hyperlink: { url, tooltip: url } } : {}) });
  };

  const visit = async (el: HTMLElement) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.01) return;
    const r = el.getBoundingClientRect();
    if (el !== root) {
      if (r.width < 0.5 || r.height < 0.5) return;
      if (el.hasAttribute('data-om-raster')) {
        // Motifs of a subject design (masks, clip-path, pseudo-elements) cannot be shapes: a picture of the box.
        const data = await rasterDecor(el, root, r.width, r.height).catch(() => null);
        if (data) slide.addImage({ data, ...pos(r.left, r.top, r.width, r.height), objectName: name('Form', { step: 0, anim: 'none' }) });
        else box(el, cs, r);
      } else box(el, cs, r);
    }
    if (el instanceof HTMLImageElement) {
      const p = await pictureData(el, r).catch(() => null);
      if (p) slide.addImage({ data: p.data, ...pos(p.x, p.y, p.w, p.h), objectName: name('Bild', stepOf(el), true) });
      return;
    }
    // Words directly in this box, in groups between the boxes inside it.
    let group: Node[] = [];
    const flush = () => {
      if (group.length) text(el, group);
      group = [];
    };
    for (const c of [...el.childNodes]) {
      if (c.nodeType === Node.TEXT_NODE) group.push(c);
      else if (c instanceof SVGSVGElement) {
        flush();
        await svg(c);
      } else if (c instanceof HTMLElement) {
        if (c.tagName === 'STYLE' || c.tagName === 'SCRIPT') continue;
        if (inlineText(c)) group.push(c);
        else {
          flush();
          await visit(c);
        }
      }
    }
    flush();
  };

  await visit(root);
  if (s.notes.trim()) slide.addNotes(s.notes);
  return { slide, placed };
}

/** All slides as a PowerPoint file. `roots` are the drawn slides, in order. */
export async function buildPptx(roots: HTMLElement[], slides: Slide[], opts: PptxOptions): Promise<Blob> {
  const [{ default: Pptx }, { default: JSZip }] = await Promise.all([import('pptxgenjs'), import('jszip')]);
  const pptx = new Pptx();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.title = opts.title;
  pptx.company = 'Arbeitsblatt-Baukasten';
  const all: Placed[][] = [];
  for (let k = 0; k < slides.length; k++) all.push((await drawSlide(roots[k], slides[k], pptx, opts)).placed);
  const zip = await JSZip.loadAsync((await pptx.write({ outputType: 'arraybuffer' })) as ArrayBuffer);
  const prints: string[] = [];
  for (let k = 0; k < slides.length; k++) {
    const path = `ppt/slides/slide${k + 1}.xml`;
    const xml = await zip.file(path)?.async('string');
    if (xml) zip.file(path, addTiming(xml, all[k], slides[k].transition));
    prints.push(xml ? wordsPrint(xml) : '');
  }
  const images: Record<string, string> = {};
  for (const id of new Set(slideImages(slides))) {
    const blob = await getImage(id).catch(() => undefined);
    if (blob) images[id] = await toDataUrl(blob);
  }
  const kept: PptxSlidesFile = { format: PPTX_SLIDES_FORMAT, version: 1, design: opts.design, slides: slides.map(leanSlide), images, prints };
  zip.file(PPTX_SLIDES_PATH, JSON.stringify(kept));
  // Every part of the package needs a content type; the relationship lets PowerPoint know the part belongs.
  const types = await zip.file('[Content_Types].xml')?.async('string');
  if (types && !types.includes('Extension="json"')) zip.file('[Content_Types].xml', types.replace('<Default ', '<Default Extension="json" ContentType="application/json"/><Default '));
  const rels = await zip.file('_rels/.rels')?.async('string');
  if (rels)
    zip.file(
      '_rels/.rels',
      rels.replace('</Relationships>', `<Relationship Id="rIdBaukasten" Type="https://noledge5.github.io/edutoolboxbuilder/folien" Target="${PPTX_SLIDES_PATH}"/></Relationships>`),
    );
  return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
}
