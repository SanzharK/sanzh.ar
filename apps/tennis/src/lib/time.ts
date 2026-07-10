export const SYDNEY_TZ = 'Australia/Sydney';

/** Earliest/latest selectable times, minutes from midnight (06:00–23:00). */
export const DAY_START_MINUTES = 6 * 60;
export const DAY_END_MINUTES = 23 * 60;
export const MAX_DAYS_AHEAD = 14;
export const MIN_DURATION_OPTIONS = [30, 60, 90, 120] as const;

/** Current calendar date in Sydney as YYYY-MM-DD, regardless of server/browser timezone. */
export function todaySydney(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: SYDNEY_TZ }).format(now);
}

/** Current Sydney wall-clock time as minutes from midnight. */
export function nowMinutesSydney(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: SYDNEY_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return hour * 60 + minute;
}

/** 'YYYY-MM-DD' + n days → 'YYYY-MM-DD' (pure calendar math, timezone-free). */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, (d ?? 0) + days));
  return t.toISOString().slice(0, 10);
}

export function isValidDateString(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 0));
  return t.getUTCFullYear() === y && t.getUTCMonth() === (m ?? 1) - 1 && t.getUTCDate() === d;
}

/** 'HH:MM' → minutes from midnight, or null if malformed. */
export function hhmmToMinutes(hhmm: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function minutesToHhmm(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** '18:30' → '6:30 pm' for display. */
export function minutesToDisplay(totalMinutes: number): string {
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const suffix = hours24 < 12 ? 'am' : 'pm';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return minutes === 0 ? `${hours12}${suffix}` : `${hours12}:${String(minutes).padStart(2, '0')}${suffix}`;
}

export function isHalfHourBoundary(minutes: number): boolean {
  return minutes % 30 === 0;
}

/** Round minutes up to the next half-hour boundary. */
export function ceilToHalfHour(minutes: number): number {
  return Math.ceil(minutes / 30) * 30;
}
