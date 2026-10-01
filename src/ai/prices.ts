// What a request to Claude costs, in US dollars (the providers bill in dollars). Prices per million tokens, as
// published by Anthropic (September 2026); writing to the prompt cache costs 1.25 × the input price.

export interface Price {
  input: number;
  output: number;
  cacheRead: number;
}

export const PRICES: Record<string, Price> = {
  'claude-opus-5-5': { input: 4, output: 20, cacheRead: 0.2 },
  'claude-sonnet-5-5': { input: 2, output: 10, cacheRead: 0.2 },
  'claude-opus-5': { input: 5, output: 25, cacheRead: 0.5 },
  'claude-opus-4-8': { input: 5, output: 25, cacheRead: 0.5 },
  'claude-sonnet-5': { input: 2, output: 10, cacheRead: 0.2 },
  'claude-haiku-4-5': { input: 1, output: 5, cacheRead: 0.1 },
};

export interface Usage {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

/** The price of a model; unknown models are counted like Opus 5.5 (an estimate on the safe side). */
export const priceOf = (model: string): Price => PRICES[model.replace(/^anthropic\//, '').replace(/\./g, '-')] ?? PRICES['claude-opus-5-5'];

/** Dollars for the tokens of one request. */
export function costOf(model: string, u: Usage, price: Price = priceOf(model)): number {
  const m = 1_000_000;
  return (u.input * price.input + u.cacheWrite * price.input * 1.25 + u.cacheRead * price.cacheRead + u.output * price.output) / m;
}

/** "0,62 $", "< 0,01 $" */
export const dollars = (usd: number) => (usd > 0 && usd < 0.01 ? '< 0,01 $' : `${usd.toFixed(2).replace('.', ',')} $`);
