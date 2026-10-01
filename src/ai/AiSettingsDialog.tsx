// "KI im Baukasten": the provider and key of this device, the models for big and small jobs, the monthly limit and
// what was spent. The key stays on this device: it is not in backups and does not travel with the sync file.
import { useEffect, useState } from 'react';
import { ExternalLink, KeyRound, Trash2 } from 'lucide-react';
import { SegField } from '../editor/fields';
import { Icon } from '../icons';
import { checkKey } from './client';
import { dollars } from './prices';
import { AI_MODELS, ANTHROPIC_CHOICES, monthOf, type AiJob, type AiSettings, type Provider } from './settings';
import { setAiSettings, useAiSettings } from './useAi';

const KEY_PAGES: Record<Provider, string> = {
  anthropic: 'https://console.anthropic.com/settings/keys',
  openrouter: 'https://openrouter.ai/settings/keys',
};

/** Claude models on OpenRouter (the list is public); the batch variants are left out. */
async function openRouterModels(): Promise<{ v: string; l: string }[]> {
  const res = await fetch('https://openrouter.ai/api/v1/models');
  const data = ((await res.json()) as { data?: { id: string; name?: string }[] }).data ?? [];
  return data.filter((m) => m.id.startsWith('anthropic/claude') && !m.id.includes(':')).map((m) => ({ v: m.id, l: m.name || m.id }));
}

export function AiSettingsDialog({ onClose }: { onClose(): void }) {
  const saved = useAiSettings();
  const [provider, setProvider] = useState<Provider>('anthropic');
  const [key, setKey] = useState('');
  const [models, setModels] = useState<Record<AiJob, string>>(AI_MODELS.anthropic);
  const [limit, setLimit] = useState(10);
  const [check, setCheck] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [choices, setChoices] = useState(ANTHROPIC_CHOICES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (saved === undefined || loaded) return;
    setLoaded(true);
    if (!saved) return;
    setProvider(saved.provider);
    setKey(saved.key);
    setModels(saved.models);
    setLimit(saved.limit);
  }, [saved, loaded]);

  useEffect(() => {
    if (provider === 'anthropic') {
      setChoices(ANTHROPIC_CHOICES);
      return;
    }
    let alive = true;
    openRouterModels()
      .then((list) => alive && list.length && setChoices(list))
      .catch(() => alive && setChoices([AI_MODELS.openrouter.big, AI_MODELS.openrouter.small].map((v) => ({ v, l: v }))));
    return () => {
      alive = false;
    };
  }, [provider]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const pickProvider = (p: Provider) => {
    setProvider(p);
    setModels(AI_MODELS[p]);
    setCheck(null);
  };
  const test = async () => {
    setBusy(true);
    setCheck(null);
    try {
      setCheck({ ok: true, text: await checkKey(provider, key.trim()) });
    } catch (e) {
      setCheck({ ok: false, text: e instanceof Error ? e.message : 'Der Schlüssel konnte nicht geprüft werden.' });
    } finally {
      setBusy(false);
    }
  };
  const save = async () => {
    const month = monthOf(Date.now());
    const s: AiSettings = {
      provider,
      key: key.trim(),
      models,
      limit: Math.max(0, limit),
      month,
      spent: saved && saved.month === month ? saved.spent : 0,
      log: saved?.log ?? [],
    };
    await setAiSettings(s);
    onClose();
  };
  const remove = async () => {
    if (!window.confirm('Den KI-Schlüssel von diesem Gerät entfernen?')) return;
    await setAiSettings(null);
    onClose();
  };
  const modelField = (job: AiJob, label: string) => (
    <div className="field">
      <label htmlFor={`ai-model-${job}`}>{label}</label>
      <select id={`ai-model-${job}`} className="input" value={models[job]} onChange={(e) => setModels({ ...models, [job]: e.target.value })}>
        {[...choices, ...(choices.some((c) => c.v === models[job]) ? [] : [{ v: models[job], l: models[job] }])].map((c) => (
          <option key={c.v} value={c.v}>
            {c.l}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog sync-dialog ai-settings" role="dialog" aria-modal="true" aria-label="KI im Baukasten" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">KI im Baukasten</div>
        <p className="dialog-body">
          Mit einem eigenen Schlüssel arbeitet Claude direkt im Baukasten: Stunden ausarbeiten, Jahrespläne entwerfen, Bausteine umformulieren. Ohne Schlüssel geht alles weiter über den Claude-Chat.
        </p>
        <SegField<Provider>
          label="Anbieter"
          value={provider}
          options={[
            { v: 'anthropic', l: 'Claude direkt (Anthropic)' },
            { v: 'openrouter', l: 'OpenRouter' },
          ]}
          onPick={pickProvider}
        />
        <ol className="share-steps">
          <li>
            {provider === 'anthropic' ? (
              <>Bei Anthropic anmelden (eigenes Konto, nicht das Claude-Abo), Guthaben aufladen und einen Schlüssel erstellen: </>
            ) : (
              <>Bei OpenRouter anmelden, Guthaben aufladen und einen Schlüssel erstellen: </>
            )}
            <a href={KEY_PAGES[provider]} target="_blank" rel="noreferrer">
              Schlüssel erstellen <Icon icon={ExternalLink} size={12} />
            </a>
          </li>
          <li>Den Schlüssel hier einfügen und prüfen. Er bleibt nur auf diesem Gerät; auf dem iPad einmal eigens eintragen.</li>
        </ol>
        <div className="field">
          <label htmlFor="ai-key">Schlüssel</label>
          <div className="ai-key-row">
            <input
              id="ai-key"
              className="input"
              type="password"
              autoComplete="off"
              value={key}
              placeholder={provider === 'anthropic' ? 'sk-ant-…' : 'sk-or-…'}
              onChange={(e) => (setKey(e.target.value), setCheck(null))}
            />
            <button type="button" className="btn btn-secondary ui-btn" onClick={test} disabled={!key.trim() || busy}>
              <Icon icon={KeyRound} />
              {busy ? 'Prüfe …' : 'Prüfen'}
            </button>
          </div>
          {check && <p className={check.ok ? 'ai-ok' : 'json-err'}>{check.text}</p>}
        </div>
        {modelField('big', 'Stunden und Jahrespläne')}
        {modelField('small', 'Helfer am Baustein (umformulieren, Niveaus, Lösungen)')}
        <div className="field">
          <label htmlFor="ai-limit">Monatslimit in US-Dollar (vorher fragen, 0 = nie fragen)</label>
          <input id="ai-limit" className="input" type="number" min={0} step={1} value={limit} onChange={(e) => setLimit(Number(e.target.value) || 0)} />
        </div>
        {saved && (
          <div className="ai-spent">
            <b>Diesen Monat auf diesem Gerät: {dollars(saved.month === monthOf(Date.now()) ? saved.spent : 0)}</b>
            {saved.log.length > 0 && (
              <ul>
                {saved.log.slice(0, 6).map((x, k) => (
                  <li key={k}>
                    {new Date(x.at).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })} · {x.what} · {dollars(x.usd)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <p className="sync-tip">An Claude gehen nur deine Unterrichtsmaterialien (Blätter, Planung, Kompetenzen), nie Namen oder Antworten von Schülerinnen und Schülern. Abgerechnet wird beim Anbieter in US-Dollar; die Beträge hier sind Schätzungen.</p>
        <div className="dialog-actions">
          {saved && (
            <button type="button" className="btn btn-secondary ui-btn is-danger" onClick={remove} style={{ marginRight: 'auto' }}>
              <Icon icon={Trash2} />
              Schlüssel entfernen
            </button>
          )}
          <button type="button" className="btn btn-secondary ui-btn" onClick={onClose}>
            Abbrechen
          </button>
          <button type="button" className="btn btn-primary ui-btn" onClick={save} disabled={!key.trim()}>
            Sichern
          </button>
        </div>
      </div>
    </div>
  );
}
