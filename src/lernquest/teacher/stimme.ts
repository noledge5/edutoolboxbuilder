// Recording the English texts of a station with Google's voice when the teacher sends it to a class (Wunsch
// 26.11.2026, Google chosen by the teacher). Her Google key lives only in this browser (localStorage: not in the
// library, not synced, sent only to Google). The recordings go to the server (20261206_lernquest_ton.sql) under the key
// of src/lernquest/stimme.ts; the children's app plays them. Publishing never fails because of the voice: problems
// show in the card „Vorlesen mit guter Stimme“ (StimmeKarte.tsx).
import { toeneFehlend, toeneSpeichern } from '../server';
import { tonSchluessel, vorleseTexte } from '../stimme';
import type { Paket } from '../types';

const K_SCHLUESSEL = 'lernquest:google-stimme';
const K_STIMME = 'lernquest:google-stimme-name';

const lesen = (k: string) => {
  try {
    return localStorage.getItem(k) ?? '';
  } catch {
    return '';
  }
};
export const googleSchluessel = () => lesen(K_SCHLUESSEL);
export function googleSchluesselSetzen(k: string) {
  try {
    if (k.trim()) localStorage.setItem(K_SCHLUESSEL, k.trim());
    else localStorage.removeItem(K_SCHLUESSEL);
  } catch {
    // private mode: nothing kept
  }
}

/** British voices, best first; the first one Google accepts is kept for next time. */
export const STIMMEN = ['en-GB-Chirp3-HD-Aoede', 'en-GB-Neural2-C', 'en-GB-Wavenet-C', 'en-GB-Standard-C'];

export class StimmeFehler extends Error {}

const kurz = (s: string) => s.replace(/\s+/g, ' ').slice(0, 160);

/** One recording as base64 MP3. Throws StimmeFehler with a German message for the teacher. */
export async function aufnehmen(schluessel: string, text: string): Promise<string> {
  const gemerkt = lesen(K_STIMME);
  const reihe = gemerkt && STIMMEN.includes(gemerkt) ? [gemerkt, ...STIMMEN.filter((s) => s !== gemerkt)] : STIMMEN;
  let letzter = '';
  for (const name of reihe) {
    let res: Response;
    try {
      res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(schluessel)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: { text }, voice: { languageCode: 'en-GB', name }, audioConfig: { audioEncoding: 'MP3' } }),
      });
    } catch {
      throw new StimmeFehler('Keine Verbindung zu Google. Ist das Gerät online?');
    }
    const body = await res.text();
    if (res.ok) {
      let audio: unknown;
      try {
        audio = (JSON.parse(body) as { audioContent?: unknown }).audioContent;
      } catch {
        audio = undefined;
      }
      if (typeof audio === 'string' && audio) {
        try {
          localStorage.setItem(K_STIMME, name);
        } catch {
          // not kept
        }
        return audio;
      }
      letzter = 'Google hat keinen Ton geschickt.';
      continue;
    }
    if (res.status === 429) throw new StimmeFehler('Google hat gerade zu viele Anfragen. Versuch es in ein paar Minuten noch einmal.');
    if (res.status === 401 || res.status === 403 || /API key|API_KEY|PERMISSION_DENIED|referer|billing/i.test(body))
      throw new StimmeFehler(`Google nimmt den Schlüssel nicht an. Ist die Text-to-Speech-API aktiviert, die Abrechnung verknüpft und die Website https://noledge5.github.io/* beim Schlüssel eingetragen? (${kurz(body)})`);
    // An unknown voice (400) or a passing error: the next voice.
    letzter = `Google: ${res.status} ${kurz(body)}`;
  }
  throw new StimmeFehler(letzter || 'Google hat keinen Ton geschickt.');
}

/** What the recording is doing, for the card (cumulative while this page is open). */
export interface TonStand {
  laeuft: boolean;
  fertig: number;
  gesamt: number;
  fehler: string;
}
let stand: TonStand = { laeuft: false, fertig: 0, gesamt: 0, fehler: '' };
const hoerer = new Set<() => void>();
export const tonStand = () => stand;
export function tonStandHoeren(f: () => void) {
  hoerer.add(f);
  return () => {
    hoerer.delete(f);
  };
}
const setzen = (s: Partial<TonStand>) => {
  stand = { ...stand, ...s };
  hoerer.forEach((f) => f());
};

/** Base64 we send to the server in one call at most (it takes 20 recordings per call). */
const PAKET_BYTES = 150_000;

/**
 * Records the texts of a package that have no recording on the server yet and stores them. Never throws: without a key
 * it does nothing, a problem shows in the card.
 */
export async function toeneErzeugen(keys: string[], paket: Pick<Paket, 'lang' | 'uebungen'>): Promise<void> {
  const schluessel = googleSchluessel();
  if (!schluessel) return;
  const texte = vorleseTexte(paket);
  if (!texte.length) return;
  try {
    const hashes = await Promise.all(texte.map(tonSchluessel));
    const fehlend = new Set<string>();
    for (let i = 0; i < hashes.length; i += 500) for (const h of await toeneFehlend(hashes.slice(i, i + 500))) fehlend.add(h);
    const auftrag = texte.map((t, i) => ({ t, s: hashes[i] })).filter((x) => fehlend.has(x.s));
    if (!auftrag.length) return;
    setzen({ laeuft: true, gesamt: stand.gesamt + auftrag.length, fehler: '' });
    let puffer: { s: string; d: string }[] = [];
    let groesse = 0;
    let abbruch = false;
    const abschicken = async () => {
      const p = puffer;
      puffer = [];
      groesse = 0;
      if (p.length) await toeneSpeichern(keys, p);
    };
    const arbeiter = async () => {
      while (auftrag.length && !abbruch) {
        const a = auftrag.shift()!;
        try {
          const d = await aufnehmen(schluessel, a.t);
          puffer.push({ s: a.s, d });
          groesse += d.length;
          if (puffer.length >= 20 || groesse >= PAKET_BYTES) await abschicken();
          setzen({ fertig: stand.fertig + 1 });
        } catch (e) {
          abbruch = true;
          throw e;
        }
      }
    };
    await Promise.all([arbeiter(), arbeiter(), arbeiter()]);
    await abschicken();
  } catch (e) {
    setzen({ fehler: e instanceof StimmeFehler ? e.message : `Die Aufnahmen konnten nicht gespeichert werden (${e instanceof Error ? e.message : String(e)}).` });
  } finally {
    if (stand.laeuft) setzen({ laeuft: false });
  }
}
