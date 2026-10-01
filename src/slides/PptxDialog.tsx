// Saving the slides as a PowerPoint file: a few choices, then the slides are drawn off screen, full size and
// in their design, and turned into PowerPoint shapes (see pptx.ts).
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, FileUp } from 'lucide-react';
import { SegField } from '../editor/fields';
import { Icon } from '../icons';
import { slideImages, type Slide } from '../model/slides';
import { downloadBlob, safeFileName } from '../storage/backup';
import { preloadImages } from '../storage/images';
import { buildPptx } from './pptx';
import { SlideView, type SlideContext } from './SlideView';

interface PptxDialogProps {
  slides: Slide[];
  ctx: SlideContext;
  /** Lesson title, for the file name. */
  title: string;
  onClose(): void;
}

type Fonts = 'standard' | 'app';

export function PptxDialog({ slides, ctx, title, onClose }: PptxDialogProps) {
  const [fonts, setFonts] = useState<Fonts>('standard');
  const [clicks, setClicks] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  // Once the slides are drawn off screen: wait for fonts and pictures, then build the file.
  useEffect(() => {
    if (!busy) return;
    let alive = true;
    (async () => {
      try {
        const el = host.current;
        if (!el) return;
        await document.fonts.ready;
        await Promise.all([...el.querySelectorAll('img')].map((img) => img.decode().catch(() => undefined)));
        await new Promise((r) => requestAnimationFrame(r));
        const roots = [...el.querySelectorAll<HTMLElement>(':scope > .sl-slide')];
        const blob = await buildPptx(roots, slides, { clicks, title, lang: ctx.lang, design: ctx.design });
        if (!alive) return;
        downloadBlob(blob, `${safeFileName(title) || 'Folien'}.pptx`);
        onClose();
      } catch (e) {
        if (!alive) return;
        setError(`Die PowerPoint-Datei konnte nicht erstellt werden${e instanceof Error && e.message ? ` (${e.message})` : ''}.`);
        setBusy(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [busy]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = async () => {
    setError('');
    await preloadImages(slideImages(slides));
    setBusy(true);
  };

  return (
    <div className="dialog-backdrop" onClick={() => !busy && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label="Als PowerPoint sichern" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">Als PowerPoint sichern</div>
        <SegField<Fonts>
          label="Schriften"
          value={fonts}
          options={[
            { v: 'standard', l: 'Standardschriften' },
            { v: 'app', l: 'Wie im Baukasten' },
          ]}
          onPick={setFonts}
        />
        <SegField<boolean>
          label="Lösungen und Einträge, die auf Klick kommen"
          value={clicks}
          options={[
            { v: true, l: 'auf Klick (Animation)' },
            { v: false, l: 'gleich sichtbar' },
          ]}
          onPick={setClicks}
        />
        <p className="dialog-body print-hint">
          {fonts === 'standard'
            ? 'Georgia, Arial und Comic Sans gibt es auf jedem Mac und Windows-Rechner; die Folien sehen fast so aus wie hier.'
            : 'Caprasimo, Figtree und Kalam (kostenlos bei Google Fonts) müssen auf dem Rechner installiert sein, sonst nimmt PowerPoint eine Ersatzschrift.'}{' '}
          Alle Texte, Kästen und Bilder lassen sich in PowerPoint und Keynote weiter bearbeiten; Sprechernotizen und Übergänge kommen mit.
        </p>
        {error && <p className="dialog-body sl-export-error">{error}</p>}
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary ui-btn" onClick={onClose} disabled={busy}>
            Abbrechen
          </button>
          <button type="button" className="btn btn-primary ui-btn" onClick={start} disabled={busy || !slides.length}>
            <Icon icon={Download} />
            {busy ? 'Wird erstellt …' : 'PowerPoint sichern'}
          </button>
        </div>
      </div>
      {busy &&
        createPortal(
          <div ref={host} className={'sl-export' + (fonts === 'standard' ? ' is-std' : '')} aria-hidden="true">
            {slides.map((s, k) => (
              <SlideView key={s.id} slide={s} number={k + 1} ctx={ctx} step={null} print keepCovers={clicks} />
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}

interface PptxImportDialogProps {
  fileName: string;
  count: number;
  /** Slides that came back exactly as the Baukasten exported them. */
  kept: number;
  notes: string[];
  /** The lesson has slides already: they can stay (the new ones follow) or be replaced. */
  hasSlides: boolean;
  onAppend(): void;
  onReplace(): void;
  onClose(): void;
}

/** What was read from a PowerPoint file, and whether it joins or replaces the slides of the lesson. */
export function PptxImportDialog({ fileName, count, kept, notes, hasSlides, onAppend, onReplace, onClose }: PptxImportDialogProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label="PowerPoint öffnen" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">PowerPoint öffnen</div>
        <p className="dialog-body">
          {count === 1 ? 'Eine Folie' : `${count} Folien`} aus „{fileName}“ gelesen.{' '}
          {kept === count && count > 0
            ? 'Sie kommen aus dem Baukasten und sind wieder genau so, wie sie waren.'
            : kept > 0
              ? `${kept} davon kommen unverändert aus dem Baukasten; die anderen sind nach Titel, Aufzählung, Bildern und Tabellen in passende Folienarten übernommen.`
              : 'Titel, Aufzählungen, Bilder, Tabellen und Sprechernotizen sind in passende Folienarten übernommen; Farben und Schriften kommen vom Design des Baukastens.'}
        </p>
        {notes.length > 0 && (
          <ul className="dialog-body sl-import-notes">
            {notes.map((n, k) => (
              <li key={k}>{n}</li>
            ))}
          </ul>
        )}
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary ui-btn" onClick={onClose}>
            Abbrechen
          </button>
          {hasSlides && (
            <button type="button" className="btn btn-secondary ui-btn" onClick={onReplace} disabled={!count}>
              Folien ersetzen
            </button>
          )}
          <button type="button" className="btn btn-primary ui-btn" onClick={onAppend} disabled={!count}>
            <Icon icon={FileUp} />
            {hasSlides ? 'Hinten anhängen' : 'Übernehmen'}
          </button>
        </div>
      </div>
    </div>
  );
}
