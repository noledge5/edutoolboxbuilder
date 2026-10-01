// The soft gong when the timer runs out, made with Web Audio (no sound file, works offline).
// Browsers, above all on the iPad, play sound only after a tap: `unlockSound` runs inside the tap that starts the timer.

let audio: AudioContext | null = null;

export function unlockSound() {
  try {
    audio ??= new AudioContext();
    if (audio.state === 'suspended') audio.resume().catch(() => {});
  } catch {
    // No Web Audio: the timer just stays silent.
  }
}

/** A bell: a few partials that fade out over about two seconds. */
export function gong() {
  if (!audio) return;
  const t = audio.currentTime;
  const partials: [number, number][] = [
    [1, 0.5],
    [2.01, 0.22],
    [3.02, 0.1],
    [4.16, 0.05],
  ];
  const out = audio.createGain();
  out.gain.setValueAtTime(0.0001, t);
  out.gain.exponentialRampToValueAtTime(0.35, t + 0.015);
  out.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
  out.connect(audio.destination);
  for (const [ratio, level] of partials) {
    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = 'sine';
    osc.frequency.value = 523.25 * ratio;
    g.gain.value = level;
    osc.connect(g).connect(out);
    osc.start(t);
    osc.stop(t + 2.7);
  }
}

const SOUND_KEY = 'arbeitsblatt-baukasten:timer-ton';

/** Whether the timer ends with a gong (on this device; on by default). */
export function soundOn(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'aus';
  } catch {
    return true;
  }
}

export function setSoundOn(on: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, on ? 'an' : 'aus');
  } catch {
    // Not kept: fine for this presentation.
  }
}
