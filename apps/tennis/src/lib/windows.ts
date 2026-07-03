/**
 * Pure interval math over minutes-from-midnight. No timezone logic here —
 * inputs are venue-local minutes and outputs are venue-local minutes.
 */

export interface Interval {
  start: number;
  end: number;
}

function isValid(interval: Interval): boolean {
  return Number.isFinite(interval.start) && Number.isFinite(interval.end) && interval.start < interval.end;
}

/** Merge overlapping/touching intervals into a sorted minimal set. */
export function mergeIntervals(intervals: Interval[]): Interval[] {
  const sorted = intervals.filter(isValid).sort((a, b) => a.start - b.start);
  const merged: Interval[] = [];
  for (const current of sorted) {
    const last = merged[merged.length - 1];
    if (last && current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push({ ...current });
    }
  }
  return merged;
}

/** Subtract blockers from base intervals. */
export function subtractIntervals(base: Interval[], blockers: Interval[]): Interval[] {
  const mergedBlockers = mergeIntervals(blockers);
  let result = mergeIntervals(base);
  for (const blocker of mergedBlockers) {
    const next: Interval[] = [];
    for (const interval of result) {
      if (blocker.end <= interval.start || blocker.start >= interval.end) {
        next.push(interval);
        continue;
      }
      if (blocker.start > interval.start) next.push({ start: interval.start, end: blocker.start });
      if (blocker.end < interval.end) next.push({ start: blocker.end, end: interval.end });
    }
    result = next;
  }
  return result;
}

/** Clip intervals to the query bounds. */
export function clipIntervals(intervals: Interval[], bounds: Interval): Interval[] {
  return intervals
    .map((i) => ({ start: Math.max(i.start, bounds.start), end: Math.min(i.end, bounds.end) }))
    .filter(isValid);
}

/**
 * The full pipeline for one court: bookable minus blocked, clipped to the
 * query window, dropping fragments shorter than minDuration.
 */
export function freeWindows(
  bookable: Interval[],
  blocked: Interval[],
  bounds: Interval,
  minDurationMinutes: number
): Interval[] {
  return clipIntervals(subtractIntervals(bookable, blocked), bounds).filter(
    (i) => i.end - i.start >= minDurationMinutes
  );
}
