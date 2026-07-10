export const SYDNEY_TZ = 'Australia/Sydney';

/** Current calendar date in Sydney as YYYY-MM-DD, regardless of server/browser timezone. */
export function todaySydney(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: SYDNEY_TZ }).format(now);
}

export function isValidDateString(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 0));
  return t.getUTCFullYear() === y && t.getUTCMonth() === (m ?? 1) - 1 && t.getUTCDate() === d;
}

/** '2026-07-13' → 'Mon 13 Jul' for display (timezone-free calendar math). */
export function dateToDisplay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 0));
  return t.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
}
