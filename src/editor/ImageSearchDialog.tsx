// "Bild aus dem Internet": search Openverse or Wikimedia Commons, pick a picture, and it is stored
// with its author and licence as the source line. Large tiles, so it works with a finger on the iPad.
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Check, ExternalLink, LoaderCircle, Search, Sparkles } from 'lucide-react';
import { ImageAiPane } from '../ai/ImageAiPane';
import type { ImageAspect } from '../ai/images';
import { Icon } from '../icons';
import { creditOf, downloadImage, searchImages, SearchError, type FoundImage, type ImageKind, type ImageSource, type SearchOptions } from '../storage/imageSearch';

interface ImageSearchDialogProps {
  /** First search words, e.g. from the caption or the vocabulary word. */
  initialQuery: string;
  /** Start with public domain images only (where the sheet has no room for a source line). */
  freeOnly?: boolean;
  /** A description of the picture for "Mit KI erzeugen" (else the search words). */
  describe?: string;
  /** Shape of a picture made with KI. */
  aspect?: ImageAspect;
  /** Open on "Mit KI erzeugen". */
  startAi?: boolean;
  onPick(file: File, credit: string, img?: FoundImage): void;
  onClose(): void;
}

const SOURCES: { v: ImageSource; l: string; note: string }[] = [
  { v: 'openverse', l: 'Openverse', note: 'Über 800 Millionen freie Fotos und Grafiken, u. a. von Flickr, Wikimedia und Museen' },
  { v: 'commons', l: 'Wikimedia Commons', note: 'Das Bildarchiv der Wikipedia: stark bei Karten, Schaubildern, Zeichnungen' },
];

const KINDS: { v: ImageKind; l: string }[] = [
  { v: 'alle', l: 'Alle' },
  { v: 'foto', l: 'Fotos' },
  { v: 'grafik', l: 'Zeichnungen & Grafiken' },
];

const errorOf = (e: unknown) => (e instanceof SearchError ? e.message : 'Die Bildsuche hat nicht geklappt. Bitte noch einmal versuchen.');

/** "Abb. 1: Der Treibhauseffekt" → "Der Treibhauseffekt" */
export const queryFromCaption = (caption: string) =>
  caption
    .replace(/^\s*(abb\.?|abbildung|fig\.?|figure|bild)\s*\d*\s*[:.–-]?\s*/i, '')
    .replace(/bildunterschrift/i, '')
    .trim();

export function ImageSearchDialog({ initialQuery, freeOnly = false, describe = '', aspect, startAi = false, onPick, onClose }: ImageSearchDialogProps) {
  const [mode, setMode] = useState<'search' | 'ai'>(startAi ? 'ai' : 'search');
  const [source, setSource] = useState<ImageSource>('openverse');
  const [query, setQuery] = useState(initialQuery);
  const [opts, setOpts] = useState<SearchOptions>({ kind: 'alle', free: freeOnly });
  const [images, setImages] = useState<FoundImage[]>([]);
  const [next, setNext] = useState<number | null>(null);
  const [busy, setBusy] = useState<'search' | 'more' | 'pick' | null>(null);
  const [error, setError] = useState('');
  const [picked, setPicked] = useState<FoundImage | null>(null);
  const [searched, setSearched] = useState('');
  // Previews that do not load (the picture was deleted at its source) are left out.
  const [broken, setBroken] = useState<Set<string>>(() => new Set());
  const run = useRef(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const search = async (src = source, o = opts, q = query) => {
    const words = q.trim();
    if (!words) {
      input.current?.focus();
      return;
    }
    const id = ++run.current;
    setBusy('search');
    setError('');
    setPicked(null);
    try {
      const page = await searchImages(src, words, o);
      if (id !== run.current) return;
      setImages(page.images);
      setNext(page.next);
      setSearched(words);
    } catch (e) {
      if (id === run.current) {
        setImages([]);
        setNext(null);
        setError(errorOf(e));
      }
    } finally {
      if (id === run.current) setBusy(null);
    }
  };

  // Search right away when the dialog opens with words from the block.
  useEffect(() => {
    if (initialQuery.trim()) search();
    else input.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const more = async () => {
    if (next === null) return;
    const id = run.current;
    setBusy('more');
    try {
      const page = await searchImages(source, searched, opts, next);
      if (id !== run.current) return;
      setImages((list) => [...list, ...page.images.filter((i) => !list.some((x) => x.id === i.id))]);
      setNext(page.next);
    } catch (e) {
      if (id === run.current) setError(errorOf(e));
    } finally {
      if (id === run.current) setBusy(null);
    }
  };

  const take = async (img = picked) => {
    if (!img) return;
    setBusy('pick');
    setError('');
    try {
      const file = await downloadImage(img);
      onPick(file, creditOf(img), img);
    } catch (e) {
      setError(errorOf(e));
      setBusy(null);
    }
  };

  const change = (src: ImageSource, o: SearchOptions) => {
    setSource(src);
    setOpts(o);
    if (searched || query.trim()) search(src, o);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    search();
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog img-search" role="dialog" aria-modal="true" aria-label="Bild einfügen" onClick={(e) => e.stopPropagation()}>
        <div className="img-search-tabs seg-pills" role="tablist" aria-label="Woher das Bild kommt">
          <button type="button" role="tab" aria-selected={mode === 'search'} className={'seg-pill' + (mode === 'search' ? ' is-on' : '')} onClick={() => setMode('search')}>
            <Icon icon={Search} size={15} /> Im Internet suchen
          </button>
          <button type="button" role="tab" aria-selected={mode === 'ai'} className={'seg-pill' + (mode === 'ai' ? ' is-on' : '')} onClick={() => setMode('ai')}>
            <Icon icon={Sparkles} size={15} /> Mit KI erzeugen
          </button>
        </div>
        {mode === 'ai' ? (
          <ImageAiPane initial={describe || initialQuery} aspect={aspect} onPick={(file, credit) => onPick(file, credit)} onClose={onClose} />
        ) : (
        <>
        <div className="img-search-head">
          <div className="dialog-title">Bild aus dem Internet</div>
          <div className="seg-pills" role="radiogroup" aria-label="Bilddatenbank">
            {SOURCES.map((x) => (
              <button key={x.v} type="button" role="radio" aria-checked={source === x.v} className={'seg-pill' + (source === x.v ? ' is-on' : '')} title={x.note} onClick={() => change(x.v, opts)}>
                {x.l}
              </button>
            ))}
          </div>
        </div>

        <form className="img-search-bar" onSubmit={submit}>
          <input
            ref={input}
            className="input"
            type="search"
            enterKeyHint="search"
            value={query}
            placeholder="Suchwort, z. B. dog, volcano, London"
            aria-label="Suchwort"
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-primary ui-btn" disabled={busy === 'search'}>
            <span className={busy === 'search' ? 'is-spinning' : undefined}>
              <Icon icon={busy === 'search' ? LoaderCircle : Search} />
            </span>
            Suchen
          </button>
        </form>

        <div className="img-search-filters">
          <div className="seg-pills" role="radiogroup" aria-label="Bildart">
            {KINDS.map((k) => (
              <button
                key={k.v}
                type="button"
                role="radio"
                aria-checked={opts.kind === k.v}
                className={'seg-pill' + (opts.kind === k.v ? ' is-on' : '')}
                onClick={() => change(source, { ...opts, kind: k.v })}
              >
                {k.l}
              </button>
            ))}
          </div>
          <label className="img-search-free">
            <input type="checkbox" checked={opts.free} onChange={(e) => change(source, { ...opts, free: e.target.checked })} />
            nur gemeinfrei (keine Quellenangabe nötig)
          </label>
        </div>

        <div className="img-search-results" aria-busy={busy === 'search'}>
          {error && <p className="json-err">{error}</p>}
          {!error && searched && images.every((i) => broken.has(i.id)) && busy !== 'search' && (
            <p className="lib-empty">Nichts gefunden. Englische Suchwörter finden meist mehr (z. B. „dog“ statt „Hund“).</p>
          )}
          {!searched && !error && busy !== 'search' && <p className="lib-empty">Suchwort eingeben. Englische Wörter finden meist mehr.</p>}
          <div className="img-search-grid">
            {images
              .filter((img) => !broken.has(img.id))
              .map((img) => (
                <button
                  key={img.source + img.id}
                  type="button"
                  className={'img-tile' + (picked?.id === img.id ? ' is-on' : '')}
                  aria-pressed={picked?.id === img.id}
                  title={`${img.title} · ${img.license}`}
                  onClick={() => setPicked(img)}
                  onDoubleClick={() => {
                    setPicked(img);
                    void take(img);
                  }}
                >
                  <img src={img.thumb} alt={img.title} loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken((b) => new Set(b).add(img.id))} />
                  <span className={'img-tile-license' + (img.attribution ? '' : ' is-free')}>{img.attribution ? img.license : 'gemeinfrei'}</span>
                  {picked?.id === img.id && (
                    <span className="img-tile-check">
                      <Icon icon={Check} size={16} />
                    </span>
                  )}
                </button>
              ))}
          </div>
          {next !== null && images.length > 0 && (
            <button type="button" className="btn btn-secondary ui-btn img-search-more" disabled={busy === 'more'} onClick={more}>
              {busy === 'more' && (
                <span className="is-spinning">
                  <Icon icon={LoaderCircle} />
                </span>
              )}
              Mehr Bilder
            </button>
          )}
        </div>

        <div className="img-search-foot">
          {picked ? (
            <div className="img-search-picked">
              <b>{picked.title}</b>
              <span>
                {creditOf(picked)}
                {picked.page && (
                  <>
                    {' · '}
                    <a href={picked.page} target="_blank" rel="noreferrer">
                      Bildseite <Icon icon={ExternalLink} size={12} />
                    </a>
                  </>
                )}
              </span>
              {picked.attribution && <span className="img-search-hint">Die Quelle kommt automatisch unter das Bild.</span>}
            </div>
          ) : (
            <p className="img-search-picked img-search-hint">Tippe ein Bild an. Bei CC-Lizenzen trägt der Baukasten Urheber und Lizenz als Quelle ein.</p>
          )}
          <div className="dialog-actions">
            <button type="button" className="btn btn-secondary ui-btn" onClick={onClose}>
              Abbrechen
            </button>
            <button type="button" className="btn btn-primary ui-btn" disabled={!picked || busy === 'pick'} onClick={() => take()}>
              {busy === 'pick' && (
                <span className="is-spinning">
                  <Icon icon={LoaderCircle} />
                </span>
              )}
              Bild übernehmen
            </button>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
