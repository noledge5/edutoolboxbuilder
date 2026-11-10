// Reading English aloud with the device's own voice (Web Speech API): no server, no sound files, works offline where
// the device has a voice. Decided with the teacher (Stufe 5): good on the iPad, some old phones sound tinny.
import { richParts } from '../../model/text';

export const kannVorlesen = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';

/** A British voice if there is one, else any English one. */
function stimme(): SpeechSynthesisVoice | undefined {
  const all = window.speechSynthesis.getVoices();
  return all.find((v) => v.lang === 'en-GB') ?? all.find((v) => v.lang.replace('_', '-').startsWith('en'));
}

/** Text without **bold** and {{marks}}. */
export const ohneZeichen = (text: string) =>
  richParts(text)
    .map((p) => p.text)
    .join('');

/** Reads `text` in English; `langsam` for a second, slower listen. Call it from a tap (iPads speak only then). */
export function vorlesen(text: string, langsam = false) {
  if (!kannVorlesen() || !text.trim()) return;
  try {
    const s = window.speechSynthesis;
    s.cancel();
    const u = new SpeechSynthesisUtterance(ohneZeichen(text));
    u.lang = 'en-GB';
    const v = stimme();
    if (v) u.voice = v;
    u.rate = langsam ? 0.6 : 0.9;
    s.speak(u);
  } catch {
    // No voice: the text stays on screen.
  }
}
