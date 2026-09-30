// Times for lists: "heute, 14:32", "gestern, 09:05", "Mo, 28.9., 10:05" or, further back, "28.9.2025".

const time = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' });
const day = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' });
const date = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'numeric', year: 'numeric' });

const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export function whenText(t: number, now = Date.now()): string {
  const days = Math.round((startOfDay(now) - startOfDay(t)) / 86_400_000);
  if (days === 0) return `heute, ${time.format(t)}`;
  if (days === 1) return `gestern, ${time.format(t)}`;
  if (days < 180) return `${day.format(t)}, ${time.format(t)}`;
  return date.format(t);
}

/** "vor 3 Tagen", "heute" */
export function daysAgo(t: number, now = Date.now()): string {
  const days = Math.round((startOfDay(now) - startOfDay(t)) / 86_400_000);
  return days <= 0 ? 'heute' : days === 1 ? 'gestern' : `vor ${days} Tagen`;
}
