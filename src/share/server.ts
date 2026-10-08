// The server for results (Supabase, Frankfurt): it only stores what the students' browsers encrypted, deletes it
// after 14 days and can be reached only through two functions, "einreichen" (hand in) and "ergebnisse_holen" (fetch
// the results of one assignment). The key here is the public one meant for browsers.

export const SERVER = {
  url: 'https://txafdkaeotgekoxzgcxd.supabase.co',
  key: 'sb_publishable_956BMuhr1RsRXwF3gQ4-3Q_bMXrUxFS',
};

/** Days the server keeps results. */
export const KEEP_DAYS = 14;

/** Calls a server function; network trouble throws TypeError('offline'), a refusal a German message. */
export async function rpc<T>(name: string, args: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${SERVER.url}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: { apikey: SERVER.key, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
      signal,
    });
  } catch {
    throw new TypeError('offline');
  }
  const text = await res.text();
  if (!res.ok) {
    const msg = /"message"\s*:\s*"([^"]*)"/.exec(text)?.[1] ?? String(res.status);
    throw new Error(msg === 'voll' ? 'Der Speicher für den Abgleich ist voll.' : msg === 'zugang' ? 'Der Server kennt diesen Code anders. Koppel die Geräte neu.' : `Der Server antwortet nicht wie erwartet (${msg}).`);
  }
  return (text ? JSON.parse(text) : null) as T;
}

/** Hands in (or updates) a student's encrypted work. */
export const handIn = (auftrag: string, abgabe: string, daten: string) => rpc<null>('einreichen', { p_auftrag: auftrag, p_abgabe: abgabe, p_daten: daten });

export interface ResultRow {
  id: number;
  abgabe: string;
  daten: string;
  erstellt: string;
}

/** The encrypted results of an assignment, newer than row `after`. */
export const fetchResults = (auftrag: string, after = 0) => rpc<ResultRow[]>('ergebnisse_holen', { p_auftrag: auftrag, p_nach: after });
