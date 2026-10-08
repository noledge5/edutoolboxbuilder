// Elements placed freely on a slide: text fields, pictures, videos, QR codes, covers and sketches.
import { useMemo } from 'react';
import { Link, Play } from 'lucide-react';
import { Icon } from '../icons';
import type { SlideElement } from '../model/slides';
import type { Lang } from '../model/types';
import { qrCode, QrSvg } from '../sheet/parts';
import { useImageUrl } from '../storage/images';
import { InkSvg } from './Ink';
import { Rich } from './Rich';

export interface VideoInfo {
  kind: 'youtube' | 'vimeo' | 'file' | 'unknown';
  /** Address of the player (iframe) or of the file (video element). */
  src: string;
  /** Still picture for the editor, if the service has one without an account. */
  thumb: string;
}

/** "1m30s", "90" or "90s" → 90 */
function seconds(t: string | null): number {
  if (!t) return 0;
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/.exec(t);
  if (!m) return 0;
  return (Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0)) * 60 + Number(m[3] ?? 0);
}

/** What kind of video a link is and how to embed it: YouTube (privacy mode), Vimeo or a video file. */
export function videoInfo(link: string): VideoInfo {
  const url = link.trim();
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return { kind: 'unknown', src: '', thumb: '' };
  }
  const host = u.hostname.replace(/^(www|m)\./, '');
  let yt = '';
  if (host === 'youtu.be') yt = u.pathname.slice(1).split('/')[0];
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com' || host === 'music.youtube.com') {
    yt = u.searchParams.get('v') ?? /^\/(?:embed|shorts|live|v)\/([\w-]+)/.exec(u.pathname)?.[1] ?? '';
  }
  if (/^[\w-]{6,}$/.test(yt)) {
    const start = seconds(u.searchParams.get('t') ?? u.searchParams.get('start'));
    return {
      kind: 'youtube',
      src: `https://www.youtube-nocookie.com/embed/${yt}?rel=0&modestbranding=1&playsinline=1${start ? `&start=${start}` : ''}`,
      thumb: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`,
    };
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const m = /\/(?:video\/)?(\d+)(?:\/(\w+))?/.exec(u.pathname);
    if (m) return { kind: 'vimeo', src: `https://player.vimeo.com/video/${m[1]}${m[2] ? `?h=${m[2]}` : ''}`, thumb: '' };
  }
  if (/\.(mp4|webm|ogv|ogg|mov|m4v)$/i.test(u.pathname)) return { kind: 'file', src: url, thumb: '' };
  return { kind: 'unknown', src: '', thumb: '' };
}

function Qr({ link }: { link: string }) {
  const qr = useMemo(() => qrCode(link), [link]);
  if (!qr || qr === 'error') return <div className="sl-qr-empty">{qr === 'error' ? 'Link zu lang' : 'Link fehlt'}</div>;
  return <QrSvg qr={qr} label={link} className="sl-qr-code" frame />;
}

function Picture({ e }: { e: SlideElement }) {
  const img = useImageUrl(e.image);
  return (
    <div className={'sl-el-picture' + (img.status === 'ready' ? ' has-image' : '')}>
      {img.status === 'ready' ? <img src={img.url} alt="" style={{ objectFit: e.fit }} draggable={false} /> : <span>{img.status === 'missing' ? 'Bild fehlt auf diesem Gerät' : 'Bild'}</span>}
    </div>
  );
}

function Video({ e, live, print, lang }: { e: SlideElement; live: boolean; print: boolean; lang: Lang }) {
  const v = videoInfo(e.url);
  if (print)
    return (
      <div className="sl-video-print">
        <Qr link={e.url} />
        <span>
          <b>Video</b>
          {e.text && (
            <>
              {': '}
              <Rich text={e.text} lang={lang} />
            </>
          )}
        </span>
      </div>
    );
  if (live && (v.kind === 'youtube' || v.kind === 'vimeo'))
    return (
      <iframe
        className="sl-video-frame"
        src={v.src}
        title={e.text || 'Video'}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  if (live && v.kind === 'file') return <video className="sl-video-frame" src={v.src} controls playsInline preload="metadata" />;
  return (
    <div className="sl-video-still" style={v.thumb ? { backgroundImage: `url(${v.thumb})` } : undefined}>
      <span className="sl-video-play">
        <Icon icon={Play} size={48} />
      </span>
      <span className="sl-video-label">
        {v.kind === 'unknown'
          ? e.url
            ? 'Link wird nicht erkannt: YouTube, Vimeo oder MP4'
            : 'Video-Link eintragen'
          : e.text || (v.kind === 'youtube' ? 'YouTube' : v.kind === 'vimeo' ? 'Vimeo' : 'Video')}
      </span>
    </div>
  );
}

interface ElementViewProps {
  e: SlideElement;
  lang: Lang;
  /** Classes for appearing later and the entrance animation. */
  className: string;
  live: boolean;
  print: boolean;
  /** A cover: what it shows (its text or number). */
  label?: string;
}

export function ElementView({ e, lang, className, live, print, label = '' }: ElementViewProps) {
  const box = { left: e.x, top: e.y, width: e.w, height: e.h };
  const caption = (e.kind === 'image' && (e.text || e.source)) || (e.kind === 'qr' && e.text);
  let body;
  switch (e.kind) {
    case 'text':
      return (
        <div className={`sl-el sl-el-text is-${e.style} ${className}`} style={{ ...box, fontSize: e.size, textAlign: e.align }} data-el={e.id}>
          <div>
            <Rich text={e.text} lang={lang} />
          </div>
        </div>
      );
    case 'cover':
      // Tapped while presenting, it goes (see Presenter); `data-card` names it like a card on an answer.
      return (
        <div className={`sl-el sl-el-cover is-${e.style} ${className}`} style={box} data-el={e.id} data-card={`el:${e.id}`}>
          <span>{label}</span>
        </div>
      );
    case 'ink':
      return (
        <div className={`sl-el sl-el-ink ${className}`} style={box} data-el={e.id}>
          <InkSvg strokes={e.strokes} w={e.vw || e.w} h={e.vh || e.h} />
        </div>
      );
    case 'image':
      body = <Picture e={e} />;
      break;
    case 'video':
      body = <Video e={e} live={live} print={print} lang={lang} />;
      break;
    case 'qr':
      body = (
        <div className="sl-el-qr">
          <Qr link={e.url} />
        </div>
      );
      break;
  }
  return (
    <figure className={`sl-el sl-el-${e.kind}${live && e.kind === 'video' ? ' is-live' : ''} ${className}`} style={box} data-el={e.id}>
      {body}
      {caption && (
        <figcaption>
          {e.kind === 'qr' && <Icon icon={Link} size={20} />}
          {e.text && <Rich text={e.text} lang={lang} />}
          {e.kind === 'image' && e.source && <span className="sl-el-source">Quelle: {e.source}</span>}
        </figcaption>
      )}
    </figure>
  );
}
