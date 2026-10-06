// "Mit KI erzeugen" in the picture dialog: describe the picture, choose a style and shape, get two suggestions, take one.
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Check, KeyRound, LoaderCircle, Sparkles } from 'lucide-react';
import { Icon } from '../icons';
import { AiSettingsDialog } from './AiSettingsDialog';
import { defaultStyle, fileOfDataUrl, IMAGE_STYLES, imagePrompt, keepStyle, runImages, type ImageAspect, type ImageStyle, type MadeImage } from './images';
import { dollars } from './prices';
import { IMAGE_CHOICES, imageKeyOf } from './settings';
import { useAiSettings } from './useAi';

/** The grade of what is being edited (for the default picture style); set by the app. */
export const AiGradeContext = createContext<number | undefined>(undefined);

const ASPECTS: { v: ImageAspect; l: string }[] = [
  { v: '1:1', l: 'Quadrat' },
  { v: '4:3', l: 'Quer' },
  { v: '16:9', l: 'Breit' },
];

/** "KI-Bild (Nano Banana 2)" for the source line. */
export const imageCredit = (model: string) => `KI-Bild (${(IMAGE_CHOICES.find((c) => c.v === model)?.l ?? model.split('/').pop() ?? model).replace(/\s*\(.*\)$/, '')})`;

interface ImageAiPaneProps {
  /** What the picture shows, e.g. from the caption or Claude's description. */
  initial: string;
  aspect?: ImageAspect;
  onPick(file: File, credit: string): void;
  onClose(): void;
}

export function ImageAiPane({ initial, aspect: firstAspect = '4:3', onPick, onClose }: ImageAiPaneProps) {
  const grade = useContext(AiGradeContext);
  const settings = useAiSettings();
  const [what, setWhat] = useState(initial);
  const [style, setStyle] = useState<ImageStyle>(() => defaultStyle(grade));
  const [aspect, setAspect] = useState<ImageAspect>(firstAspect);
  const [two, setTwo] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState('');
  const [made, setMade] = useState<MadeImage[]>([]);
  const [picked, setPicked] = useState(0);
  const [keyOpen, setKeyOpen] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const hasKey = !!imageKeyOf(settings);

  useEffect(() => {
    if (busy === null) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [busy]);
  useEffect(() => () => abort.current?.abort(), []);

  const run = async () => {
    if (!what.trim()) return;
    keepStyle(grade, style);
    setError('');
    const ctrl = new AbortController();
    abort.current = ctrl;
    setBusy(Date.now());
    setNow(Date.now());
    try {
      const pics = await runImages(imagePrompt(what, style), aspect, two ? 2 : 1, ctrl.signal);
      if (pics) {
        setMade((m) => [...pics, ...m]);
        setPicked(0);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
      abort.current = null;
    }
  };
  const take = async () => {
    const m = made[picked];
    if (!m) return;
    onPick(await fileOfDataUrl(m.url, 'ki-bild'), imageCredit(m.model));
  };
  const cost = made.reduce((n, m) => n + m.usd, 0);
  const seconds = busy === null ? 0 : Math.round((now - busy) / 1000);

  return (
    <>
      <div className="img-ai">
        {settings !== undefined && !hasKey && (
          <div className="ai-hint is-warn">
            Für KI-Bilder braucht der Baukasten einen OpenRouter-Schlüssel auf diesem Gerät.{' '}
            <button type="button" className="btn btn-secondary ui-btn is-small" onClick={() => setKeyOpen(true)}>
              <Icon icon={KeyRound} />
              Einrichten …
            </button>
          </div>
        )}
        <div className="field">
          <label htmlFor="img-ai-what">Was soll zu sehen sein? (Deutsch oder Englisch)</label>
          <textarea id="img-ai-what" className="input" rows={3} value={what} placeholder="z. B. ein Kompass auf einer Wanderkarte, daneben ein Rucksack" onChange={(e) => setWhat(e.target.value)} />
        </div>
        <div className="img-ai-row">
          <div className="seg-pills" role="radiogroup" aria-label="Stil">
            {IMAGE_STYLES.map((s) => (
              <button key={s.v} type="button" role="radio" aria-checked={style === s.v} className={'seg-pill' + (style === s.v ? ' is-on' : '')} onClick={() => setStyle(s.v)}>
                {s.l}
              </button>
            ))}
          </div>
        </div>
        <div className="img-ai-row">
          <div className="seg-pills" role="radiogroup" aria-label="Format">
            {ASPECTS.map((a) => (
              <button key={a.v} type="button" role="radio" aria-checked={aspect === a.v} className={'seg-pill' + (aspect === a.v ? ' is-on' : '')} onClick={() => setAspect(a.v)}>
                {a.l}
              </button>
            ))}
          </div>
          <label className="img-search-free">
            <input type="checkbox" checked={two} onChange={(e) => setTwo(e.target.checked)} />
            zwei Vorschläge
          </label>
          <button type="button" className="btn btn-primary ui-btn" onClick={run} disabled={!hasKey || busy !== null || !what.trim()} style={{ marginLeft: 'auto' }}>
            <span className={busy !== null ? 'is-spinning' : undefined}>
              <Icon icon={busy !== null ? LoaderCircle : Sparkles} />
            </span>
            {busy !== null ? `Erzeuge … ${seconds} s` : made.length ? 'Noch einmal' : 'Erzeugen'}
          </button>
        </div>
        {error && <p className="json-err">{error}</p>}
        <div className="img-search-grid img-ai-grid">
          {made.map((m, k) => (
            <button key={k} type="button" className={'img-tile' + (picked === k ? ' is-on' : '')} aria-pressed={picked === k} onClick={() => setPicked(k)} onDoubleClick={() => (setPicked(k), void take())}>
              <img src={m.url} alt={`Vorschlag ${k + 1}`} />
              {picked === k && (
                <span className="img-tile-check">
                  <Icon icon={Check} size={16} />
                </span>
              )}
            </button>
          ))}
        </div>
        {!made.length && busy === null && <p className="lib-empty">Beschreibe das Bild und tippe auf „Erzeugen“. Ein Bild dauert etwa 10 bis 30 Sekunden.</p>}
      </div>
      <div className="img-search-foot">
        <p className="img-search-picked img-search-hint">
          {made.length ? `Bisher etwa ${dollars(cost)}. ` : ''}Als Quelle steht „KI-Bild“ unter dem Bild. Prüfe, ob alles stimmt: KI-Bilder irren sich gern bei Karten, Zahlen und Händen.
        </p>
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary ui-btn" onClick={onClose}>
            Abbrechen
          </button>
          <button type="button" className="btn btn-primary ui-btn" disabled={!made.length} onClick={() => void take()}>
            Bild übernehmen
          </button>
        </div>
      </div>
      {keyOpen && <AiSettingsDialog onClose={() => setKeyOpen(false)} />}
    </>
  );
}
