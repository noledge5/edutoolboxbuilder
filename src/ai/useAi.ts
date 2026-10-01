// The KI settings of this device for the whole app, and a request with its cost counted and the monthly limit asked.
import { useEffect, useState } from 'react';
import { askClaude, type AiAnswer, type AiRequest } from './client';
import { dollars } from './prices';
import { loadAiSettings, overLimit, saveAiSettings, withSpent, type AiSettings } from './settings';

/** undefined: not loaded yet; null: no key on this device. */
let current: AiSettings | null | undefined;
const listeners = new Set<(s: AiSettings | null) => void>();
let loading: Promise<AiSettings | null> | null = null;

export function getAiSettings(): Promise<AiSettings | null> {
  if (current !== undefined) return Promise.resolve(current);
  loading ??= loadAiSettings()
    .catch(() => null)
    .then((s) => (current = s));
  return loading;
}

export async function setAiSettings(s: AiSettings | null) {
  current = s;
  await saveAiSettings(s);
  for (const l of listeners) l(s);
}

export function useAiSettings(): AiSettings | null | undefined {
  const [s, setS] = useState(current);
  useEffect(() => {
    let alive = true;
    getAiSettings().then((x) => alive && setS(x));
    listeners.add(setS);
    return () => {
      alive = false;
      listeners.delete(setS);
    };
  }, []);
  return s;
}

/**
 * A request with this device's key: asks first when this month's limit is reached, counts the cost afterwards.
 * null: no key, or the teacher did not want to go over the limit.
 */
export async function runAi(r: AiRequest): Promise<AiAnswer | null> {
  const s = await getAiSettings();
  if (!s) return null;
  if (overLimit(s) && !window.confirm(`Diesen Monat hast du auf diesem Gerät schon ${dollars(s.spent)} für Claude ausgegeben (Limit ${dollars(s.limit)}). Trotzdem fortfahren?`)) return null;
  const answer = await askClaude(s, r);
  const now = (await getAiSettings()) ?? s;
  await setAiSettings(withSpent(now, r.what, answer.model, answer.usd));
  return answer;
}
