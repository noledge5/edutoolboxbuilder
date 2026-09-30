// The lessons opened last on this device, for the empty search ("Zuletzt geöffnet"). A convenience, so plain
// localStorage: private mode or a cleared browser just starts with an empty list.
const KEY = 'arbeitsblatt-baukasten:zuletzt';
const KEEP = 12;

export function recentLessons(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** Puts a lesson at the top of the list. */
export function noteRecent(lessonId: string): void {
  const list = [lessonId, ...recentLessons().filter((id) => id !== lessonId)].slice(0, KEEP);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Not available: the list is just not kept.
  }
}
