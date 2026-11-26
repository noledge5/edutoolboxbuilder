// Reading English aloud. First choice since 26.11.2026: the recording the teacher's Baukasten made with Google's voice
// when she sent the station (src/lernquest/stimme.ts, server 20261206_lernquest_ton.sql); it sounds the same on every
// device. Recordings are loaded ahead (`tonVorladen`, as soon as a speaker or exercise shows), so a tap plays at once (iPads
// play sound only inside the tap). Without a recording (none made yet, offline, older server) the device's own voice
// speaks (Web Speech API, decided in Stufe 5: good on the iPad, tinny on some phones).
import { toeneHolen } from '../server';
import { tonSchluessel, vorleseText } from '../stimme';

const kannSprechen = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
/** A recording can play or the device can speak. */
export const kannVorlesen = () => typeof window !== 'undefined' && (typeof window.Audio === 'function' || kannSprechen());

/** Spoken text → object URL of its recording, or null when the server has none. */
const aufnahmen = new Map<string, string | null>();
const unterwegs = new Set<string>();
const wartend = new Set<string>();
let timer: ReturnType<typeof setTimeout> | null = null;

/** Loads the recordings of these texts in the background (one request for all texts asked for within 40 ms). */
export function tonVorladen(texte: readonly string[]) {
  if (typeof window === 'undefined' || typeof URL.createObjectURL !== 'function' || !globalThis.crypto?.subtle) return;
  for (const t of texte) {
    const v = vorleseText(t);
    if (v && !aufnahmen.has(v) && !unterwegs.has(v)) wartend.add(v);
  }
  if (!wartend.size || timer) return;
  timer = setTimeout(() => {
    timer = null;
    const liste = [...wartend];
    wartend.clear();
    void laden(liste);
  }, 40);
}

async function laden(texte: string[]) {
  for (let i = 0; i < texte.length; i += 60) {
    const teil = texte.slice(i, i + 60);
    teil.forEach((t) => unterwegs.add(t));
    try {
      const keys = await Promise.all(teil.map(tonSchluessel));
      const antwort = (await toeneHolen(keys)) ?? {};
      teil.forEach((t, j) => {
        const b64 = antwort[keys[j]];
        if (typeof b64 !== 'string') {
          aufnahmen.set(t, null);
          return;
        }
        try {
          const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
          aufnahmen.set(t, URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' })));
        } catch {
          aufnahmen.set(t, null);
        }
      });
    } catch {
      // Offline or an older server: nothing is marked, the next speaker asks again.
    } finally {
      teil.forEach((t) => unterwegs.delete(t));
    }
  }
}

/** Whether the recording of this text is ready to play (for tests and the workshop). */
export const aufnahmeBereit = (text: string) => !!aufnahmen.get(vorleseText(text));

let player: HTMLAudioElement | null = null;

/** Reads `text` in English; `langsam` for a second, slower listen. Call it from a tap (iPads play only then). */
export function vorlesen(text: string, langsam = false) {
  const v = vorleseText(text);
  if (!v) return;
  const url = aufnahmen.get(v);
  if (url && typeof window.Audio === 'function') {
    try {
      if (kannSprechen()) window.speechSynthesis.cancel();
      player ??= new Audio();
      player.pause();
      player.src = url;
      player.preservesPitch = true;
      player.defaultPlaybackRate = langsam ? 0.7 : 1;
      player.playbackRate = langsam ? 0.7 : 1;
      void player.play().catch(() => sprechen(v, langsam));
      return;
    } catch {
      // fall back to the device voice
    }
  }
  sprechen(v, langsam);
}

/** A British voice if there is one, else any English one. */
function stimme(): SpeechSynthesisVoice | undefined {
  const all = window.speechSynthesis.getVoices();
  return all.find((v) => v.lang === 'en-GB') ?? all.find((v) => v.lang.replace('_', '-').startsWith('en'));
}

function sprechen(text: string, langsam: boolean) {
  if (!kannSprechen()) return;
  try {
    player?.pause();
    const s = window.speechSynthesis;
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-GB';
    const v = stimme();
    if (v) u.voice = v;
    u.rate = langsam ? 0.6 : 0.9;
    s.speak(u);
  } catch {
    // No voice: the text stays on screen.
  }
}
