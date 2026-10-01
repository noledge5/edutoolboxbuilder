// Claude in the Baukasten: the provider and key of this device (never in backups or the sync file), the models for
// big and small jobs, and what was spent this month, with a limit to ask before going over it.
import { del, get, set } from 'idb-keyval';
import { kv } from '../storage/db';

export type Provider = 'anthropic' | 'openrouter';

/** Big jobs: a whole lesson, a year plan. Small jobs: rewriting a block, a solution. */
export type AiJob = 'big' | 'small';

export interface Spent {
  at: number;
  /** What it was for, in German: "Stunde ausarbeiten", "Umformulieren" … */
  what: string;
  model: string;
  usd: number;
}

export interface AiSettings {
  provider: Provider;
  key: string;
  models: Record<AiJob, string>;
  /** Ask before a request once this month's spending reaches it (dollars; 0 = no limit). */
  limit: number;
  /** "2026-10" and what was spent in it on this device. */
  month: string;
  spent: number;
  log: Spent[];
}

export const AI_MODELS: Record<Provider, Record<AiJob, string>> = {
  anthropic: { big: 'claude-opus-5-5', small: 'claude-sonnet-5-5' },
  openrouter: { big: 'anthropic/claude-opus-5.5', small: 'anthropic/claude-sonnet-5.5' },
};

/** Claude models to choose from (direct). */
export const ANTHROPIC_CHOICES = [
  { v: 'claude-opus-5-5', l: 'Claude Opus 5.5 (beste Qualität)' },
  { v: 'claude-sonnet-5-5', l: 'Claude Sonnet 5.5 (halb so teuer, schneller)' },
];

/** "claude-opus-5-5" or "anthropic/claude-opus-5.5" → "Claude Opus 5.5". */
export function modelLabel(id: string): string {
  const m = /^(?:anthropic\/)?claude-([a-z]+)-(\d+)(?:[-.](\d+))?(?:$|[-:])/.exec(id);
  return m ? `Claude ${m[1][0].toUpperCase()}${m[1].slice(1)} ${m[2]}${m[3] ? `.${m[3]}` : ''}` : id;
}

const KEY = 'geraet:ki';
const LOG = 30;

export const monthOf = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export function readAiSettings(raw: unknown, now = Date.now()): AiSettings | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<AiSettings>;
  if (typeof r.key !== 'string' || !r.key.trim()) return null;
  const provider: Provider = r.provider === 'openrouter' ? 'openrouter' : 'anthropic';
  const month = monthOf(now);
  const same = r.month === month;
  return {
    provider,
    key: r.key.trim(),
    models: { big: r.models?.big || AI_MODELS[provider].big, small: r.models?.small || AI_MODELS[provider].small },
    limit: Number(r.limit) >= 0 ? Number(r.limit) : 10,
    month,
    spent: same ? Number(r.spent) || 0 : 0,
    log: Array.isArray(r.log) ? r.log.slice(0, LOG) : [],
  };
}

export const loadAiSettings = async (): Promise<AiSettings | null> => readAiSettings(await get(KEY, kv()));
export const saveAiSettings = (s: AiSettings | null) => (s ? set(KEY, s, kv()) : del(KEY, kv()));

/** The settings after a request that cost `usd`. */
export function withSpent(s: AiSettings, what: string, model: string, usd: number, now = Date.now()): AiSettings {
  const month = monthOf(now);
  const spent = (s.month === month ? s.spent : 0) + usd;
  return { ...s, month, spent, log: [{ at: now, what, model, usd }, ...s.log].slice(0, LOG) };
}

/** Whether the next request would go over the limit (then the Baukasten asks first). */
export const overLimit = (s: AiSettings) => s.limit > 0 && s.spent >= s.limit;
