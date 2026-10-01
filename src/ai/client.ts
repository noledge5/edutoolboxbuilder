// One request to Claude: directly with the Anthropic SDK (in the browser, with the teacher's own key) or through
// OpenRouter. The long instructions go first and are cached, so the second request of a session costs much less for
// them. The answer streams in; `onText` tells how far it got. What it cost is counted on this device.
import { costOf, type Usage } from './prices';
import { AI_MODELS, type AiJob, type AiSettings, type Provider } from './settings';

export interface AiRequest {
  job: AiJob;
  /** For the cost log, in German: "Stunde ausarbeiten". */
  what: string;
  /** Instructions that stay the same between requests (cached). */
  system: string;
  user: string;
  maxTokens: number;
  effort: 'low' | 'medium' | 'high';
  signal?: AbortSignal;
  /** Characters of the answer so far. */
  onText?(chars: number): void;
}

export interface AiAnswer {
  text: string;
  /** The model that answered (after a fallback, the one that took over). */
  model: string;
  usd: number;
  usage: Usage;
}

export type AiErrorKind = 'key' | 'credit' | 'rate' | 'network' | 'refusal' | 'cut' | 'abort' | 'other';

export class AiError extends Error {
  constructor(
    readonly kind: AiErrorKind,
    message: string,
  ) {
    super(message);
  }
}

const MESSAGES: Record<AiErrorKind, string> = {
  key: 'Der KI-Schlüssel wird nicht angenommen. Prüfe ihn in den Einstellungen („KI im Baukasten“).',
  credit: 'Das Guthaben beim Anbieter ist aufgebraucht. Lade es dort auf.',
  rate: 'Gerade zu viele Anfragen. Versuch es in einer Minute noch einmal.',
  network: 'Keine Verbindung zum Anbieter. Ist das Gerät online?',
  refusal: 'Claude hat die Anfrage abgelehnt. Formuliere die Wünsche anders und versuch es noch einmal.',
  cut: 'Die Antwort war zu lang und wurde abgeschnitten. Versuch es mit weniger auf einmal (z. B. erst das Gerüst).',
  abort: 'Abgebrochen.',
  other: 'Die Anfrage hat nicht geklappt.',
};
const fail = (kind: AiErrorKind, detail = '') => new AiError(kind, detail ? `${MESSAGES[kind]} (${detail})` : MESSAGES[kind]);

export const modelFor = (s: AiSettings, job: AiJob) => s.models[job] || AI_MODELS[s.provider][job];

export async function askClaude(s: AiSettings, r: AiRequest): Promise<AiAnswer> {
  return s.provider === 'openrouter' ? askOpenRouter(s, r) : askAnthropic(s, r);
}

async function askAnthropic(s: AiSettings, r: AiRequest): Promise<AiAnswer> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: s.key, dangerouslyAllowBrowser: true, maxRetries: 2 });
  const model = modelFor(s, r.job);
  try {
    const stream = client.beta.messages.stream(
      {
        model,
        max_tokens: r.maxTokens,
        // When a safety check declines, the API answers with the model Anthropic suggests for it.
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        system: [{ type: 'text', text: r.system, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: r.user }],
        thinking: { type: 'adaptive' },
        output_config: { effort: r.effort },
      },
      { signal: r.signal },
    );
    let chars = 0;
    stream.on('text', (delta) => {
      chars += delta.length;
      r.onText?.(chars);
    });
    const msg = await stream.finalMessage();
    if (msg.stop_reason === 'refusal') throw fail('refusal', msg.stop_details?.explanation ?? '');
    if (msg.stop_reason === 'max_tokens') throw fail('cut');
    const text = msg.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
    const usage: Usage = {
      input: msg.usage.input_tokens,
      output: msg.usage.output_tokens,
      cacheRead: msg.usage.cache_read_input_tokens ?? 0,
      cacheWrite: msg.usage.cache_creation_input_tokens ?? 0,
    };
    return { text, model: msg.model, usage, usd: costOf(msg.model, usage) };
  } catch (e) {
    if (e instanceof AiError) throw e;
    if (e instanceof Anthropic.APIUserAbortError) throw fail('abort');
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) throw fail('key');
    if (e instanceof Anthropic.RateLimitError) throw fail('rate');
    if (e instanceof Anthropic.APIConnectionError) throw fail('network');
    if (e instanceof Anthropic.APIError) throw fail(/credit|billing/i.test(e.message) ? 'credit' : 'other', `${e.status ?? ''} ${e.message}`.trim());
    throw fail('other', e instanceof Error ? e.message : '');
  }
}

const OPENROUTER = 'https://openrouter.ai/api/v1';

/** Tokens and cost OpenRouter reports in the last chunk. */
interface OpenRouterUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  cost?: number;
  prompt_tokens_details?: { cached_tokens?: number };
}

async function askOpenRouter(s: AiSettings, r: AiRequest): Promise<AiAnswer> {
  const model = modelFor(s, r.job);
  let res: Response;
  try {
    res = await fetch(`${OPENROUTER}/chat/completions`, {
      method: 'POST',
      signal: r.signal,
      headers: { Authorization: `Bearer ${s.key}`, 'Content-Type': 'application/json', 'X-Title': 'Arbeitsblatt-Baukasten' },
      body: JSON.stringify({
        model,
        max_tokens: r.maxTokens,
        stream: true,
        usage: { include: true },
        reasoning: { effort: r.effort },
        messages: [
          { role: 'system', content: [{ type: 'text', text: r.system, cache_control: { type: 'ephemeral' } }] },
          { role: 'user', content: r.user },
        ],
      }),
    });
  } catch (e) {
    throw e instanceof DOMException && e.name === 'AbortError' ? fail('abort') : fail('network');
  }
  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => '');
    throw fail(res.status === 401 || res.status === 403 ? 'key' : res.status === 402 ? 'credit' : res.status === 429 ? 'rate' : 'other', `${res.status} ${detail.slice(0, 160)}`.trim());
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let text = '';
  let finish = '';
  let served = model;
  const got: { usage: OpenRouterUsage | null } = { usage: null };
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data === '[DONE]') continue;
        let chunk: { model?: string; error?: { message?: string }; choices?: { delta?: { content?: string }; finish_reason?: string | null }[]; usage?: OpenRouterUsage };
        try {
          chunk = JSON.parse(data);
        } catch {
          continue;
        }
        if (chunk.error) throw fail('other', chunk.error.message ?? '');
        if (chunk.model) served = chunk.model;
        const c = chunk.choices?.[0];
        if (c?.delta?.content) {
          text += c.delta.content;
          r.onText?.(text.length);
        }
        if (c?.finish_reason) finish = c.finish_reason;
        if (chunk.usage) got.usage = chunk.usage;
      }
    }
  } catch (e) {
    if (e instanceof AiError) throw e;
    throw e instanceof DOMException && e.name === 'AbortError' ? fail('abort') : fail('network');
  }
  if (finish === 'length') throw fail('cut');
  if (finish === 'content_filter') throw fail('refusal');
  const usage = got.usage;
  const cached = usage?.prompt_tokens_details?.cached_tokens ?? 0;
  const u: Usage = { input: Math.max(0, (usage?.prompt_tokens ?? 0) - cached), output: usage?.completion_tokens ?? 0, cacheRead: cached, cacheWrite: 0 };
  return { text, model: served, usage: u, usd: typeof usage?.cost === 'number' ? usage.cost : costOf(served, u) };
}

/** Checks a key without a paid request: the model list (Anthropic) or the key's info (OpenRouter). */
export async function checkKey(provider: Provider, key: string): Promise<string> {
  if (provider === 'openrouter') {
    const res = await fetch(`${OPENROUTER}/key`, { headers: { Authorization: `Bearer ${key}` } }).catch(() => null);
    if (!res) throw fail('network');
    if (!res.ok) throw fail(res.status === 401 || res.status === 403 ? 'key' : 'other', String(res.status));
    const info = (await res.json().catch(() => ({}))) as { data?: { limit_remaining?: number | null } };
    const left = info.data?.limit_remaining;
    return typeof left === 'number' ? `Schlüssel gilt. Restguthaben laut OpenRouter: ${left.toFixed(2).replace('.', ',')} $.` : 'Schlüssel gilt.';
  }
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true, maxRetries: 1 });
  try {
    await client.models.retrieve('claude-opus-5-5');
    return 'Schlüssel gilt, Claude Opus 5.5 ist verfügbar.';
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) throw fail('key');
    if (e instanceof Anthropic.APIConnectionError) throw fail('network');
    throw fail('other', e instanceof Error ? e.message : '');
  }
}

/** The JSON object in an answer (Claude may put text or a code fence around it). */
export function jsonOf(text: string): unknown {
  const fence = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const body = fence ? fence[1] : text;
  const a = body.indexOf('{');
  const b = body.lastIndexOf('}');
  if (a < 0 || b <= a) throw new AiError('other', 'In der Antwort steht kein JSON.');
  try {
    return JSON.parse(body.slice(a, b + 1));
  } catch {
    throw new AiError('other', 'Das JSON in der Antwort ist unvollständig oder fehlerhaft.');
  }
}
