// "Präsi in Canva …" (Runde 9): prepares the request for a Claude chat with the Canva connection. Step 1 hands the
// lesson's pictures to the server (private, one hour), step 2 copies the request; the finished presentation's link is
// kept with the lesson. The templates (per subject, per module) set the style of new presentations.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ClipboardCopy, ExternalLink, Presentation } from 'lucide-react';
import { Icon } from '../icons';
import type { Lesson, Module, Settings } from '../library/types';
import { canvaLink } from '../library/read';
import { canvaPrompt, lessonImages } from './prompt';
import { shareImages } from './upload';

interface Props {
  settings: Settings;
  module: Module;
  lesson: Lesson;
  /** Saves what changed onto the current library state (links already checked; '' = none). */
  onSave(change: { subjectTemplate?: string; moduleTemplate?: string; link?: string }): void;
  onClose(): void;
}

export function CanvaDialog({ settings, module: m, lesson: l, onSave, onClose }: Props) {
  const images = useMemo(() => lessonImages(l.doc), [l.doc]);
  const [subjectTemplate, setSubjectTemplate] = useState(settings.canvaTemplates?.[m.subject] ?? '');
  const [moduleTemplate, setModuleTemplate] = useState(m.canvaTemplate ?? '');
  const [ownTemplate, setOwnTemplate] = useState(!!m.canvaTemplate);
  const [link, setLink] = useState(l.canvaUrl ?? '');
  const [done, setDone] = useState(-1);
  const [request, setRequest] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const bad = (v: string) => v.trim() !== '' && !canvaLink(v);
  const template = ownTemplate && canvaLink(moduleTemplate) ? canvaLink(moduleTemplate) : canvaLink(subjectTemplate);
  const busy = done >= 0 && !request && !error;

  /** Hands over only what changed, so `updatedAt` moves only there. */
  const save = () => {
    const change: { subjectTemplate?: string; moduleTemplate?: string; link?: string } = {};
    const subj = canvaLink(subjectTemplate);
    if (subj !== (settings.canvaTemplates?.[m.subject] ?? '')) change.subjectTemplate = subj;
    const mod = ownTemplate ? canvaLink(moduleTemplate) : '';
    if (mod !== (m.canvaTemplate ?? '')) change.moduleTemplate = mod;
    const url = canvaLink(link);
    if (url !== (l.canvaUrl ?? '')) change.link = url;
    if (Object.keys(change).length) onSave(change);
  };

  const prepare = async () => {
    setError('');
    setRequest('');
    setDone(0);
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    try {
      const links = await shareImages(images, setDone, ctrl.signal);
      setRequest(canvaPrompt(m, l, template, links));
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError((e as Error).message);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(request);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setError('Kopieren ging nicht. Erlaube dem Baukasten den Zugriff auf die Zwischenablage.');
    }
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog canva-dialog" role="dialog" aria-modal="true" aria-label="Präsi in Canva" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">
          <Icon icon={Presentation} /> Präsi in Canva
        </div>
        <p className="dialog-body">
          Claude baut die Präsentation in deinem Canva, mit den Bildern vom Arbeitsblatt. Du brauchst einen Claude-Chat, in dem Canva verbunden ist.
        </p>
        <div className="field">
          <label htmlFor="cv-subject">Vorlage für {m.subject} (Link zu einer Canva-Präsentation, deren Stil neue Präsis übernehmen)</label>
          <input id="cv-subject" className="input" value={subjectTemplate} placeholder="https://www.canva.com/design/…" onChange={(e) => setSubjectTemplate(e.target.value)} />
          {bad(subjectTemplate) && <p className="ai-hint is-warn">Das ist kein Canva-Link (https://www.canva.com/design/…).</p>}
        </div>
        <label className="check-row">
          <input type="checkbox" checked={ownTemplate} onChange={(e) => setOwnTemplate(e.target.checked)} /> Für dieses Modul eine andere Vorlage
        </label>
        {ownTemplate && (
          <div className="field">
            <input className="input" aria-label="Vorlage für dieses Modul" value={moduleTemplate} placeholder="https://www.canva.com/design/…" onChange={(e) => setModuleTemplate(e.target.value)} />
            {bad(moduleTemplate) && <p className="ai-hint is-warn">Das ist kein Canva-Link (https://www.canva.com/design/…).</p>}
          </div>
        )}
        <ol className="share-steps">
          <li>
            <button type="button" className="btn btn-secondary ui-btn" onClick={prepare} disabled={busy}>
              {busy ? `Bilder ${done} von ${images.length} …` : request ? 'Neu vorbereiten' : 'Auftrag vorbereiten'}
            </button>{' '}
            {images.length
              ? `${images.length} ${images.length === 1 ? 'Bild geht' : 'Bilder gehen'} über einen privaten Link an Canva; der Link gilt eine Stunde, der Server löscht die Bilder nach 18 Stunden.`
              : 'Die Stunde hat keine Bilder; Claude nimmt passende aus Canva.'}
          </li>
          <li>
            <button type="button" className="btn btn-secondary ui-btn" onClick={copy} disabled={!request}>
              <Icon icon={copied ? Check : ClipboardCopy} />
              {copied ? 'Kopiert' : 'Auftrag kopieren'}
            </button>{' '}
            und im Claude-Chat mit Canva einfügen. Claude zeigt dir die Gliederung, dann entsteht die Präsi.
          </li>
          <li>
            Link der fertigen Präsi (bleibt bei der Stunde):
            <div className="canva-link-row">
              <input className="input" aria-label="Link der Präsi in Canva" value={link} placeholder="https://www.canva.com/design/…" onChange={(e) => setLink(e.target.value)} />
              {canvaLink(link) && (
                <a className="btn btn-secondary ui-btn" href={canvaLink(link)} target="_blank" rel="noopener noreferrer">
                  <Icon icon={ExternalLink} /> Öffnen
                </a>
              )}
            </div>
            {bad(link) && <p className="ai-hint is-warn">Das ist kein Canva-Link (https://www.canva.com/design/…).</p>}
          </li>
        </ol>
        {error && <p className="ai-hint is-warn">{error}</p>}
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary ui-btn" onClick={onClose}>
            Abbrechen
          </button>
          <button
            type="button"
            className="btn btn-primary ui-btn"
            onClick={() => {
              save();
              onClose();
            }}
          >
            Fertig
          </button>
        </div>
      </div>
    </div>
  );
}
