import { CHALLENGE, type Challenge, type DayProgram, type WorkoutDay } from '../data/program';
import type { DayState, Entry, LeaderboardRow, Participant, Totals } from './types';
import { todaySydney } from './time';

export function getDayProgram(date: string, challenge: Challenge = CHALLENGE): DayProgram | null {
  return challenge.days.find((d) => d.date === date) ?? null;
}

export function workoutDays(challenge: Challenge = CHALLENGE): WorkoutDay[] {
  return challenge.days.filter((d): d is WorkoutDay => d.kind === 'workout');
}

/** Today's program day (Sydney calendar), or null when outside the challenge. */
export function todayProgram(now: Date = new Date(), challenge: Challenge = CHALLENGE): DayProgram | null {
  return getDayProgram(todaySydney(now), challenge);
}

/** Sum of signed entry deltas for one participant-day, clamped at 0 per exercise. */
export function totalsForDay(entries: readonly Pick<Entry, 'day' | 'exercise' | 'count'>[], date: string): Totals {
  const raw: Partial<Record<string, number>> = {};
  for (const e of entries) {
    if (e.day !== date) continue;
    raw[e.exercise] = (raw[e.exercise] ?? 0) + e.count;
  }
  const totals: Totals = {};
  for (const [exercise, sum] of Object.entries(raw)) {
    totals[exercise as keyof Totals] = Math.max(0, sum ?? 0);
  }
  return totals;
}

export interface DayCompletion {
  complete: boolean;
  /** 0–1 progress of the closer-to-done mode (drives the day's partial state). */
  progress: number;
  pushupsOnlyMet: boolean;
  mixedMet: boolean;
}

/**
 * A day is complete when EITHER mode's requirement is met:
 * banked push-ups ≥ pushupsOnly, OR every mixed exercise ≥ its count.
 * Push-up entries count toward both modes; the UI mode toggle never matters here.
 */
export function dayCompletion(day: WorkoutDay, totals: Totals): DayCompletion {
  const pushups = totals.pushups ?? 0;
  const pushupsOnlyProgress = day.pushupsOnly > 0 ? Math.min(1, pushups / day.pushupsOnly) : 1;
  const pushupsOnlyMet = pushups >= day.pushupsOnly;

  let mixedProgress = 1;
  let mixedMet = true;
  for (const set of day.mixed) {
    const done = totals[set.exercise] ?? 0;
    const p = set.count > 0 ? Math.min(1, done / set.count) : 1;
    mixedProgress = Math.min(mixedProgress, p);
    if (done < set.count) mixedMet = false;
  }
  if (day.mixed.length === 0) {
    mixedMet = pushupsOnlyMet;
    mixedProgress = pushupsOnlyProgress;
  }

  return {
    complete: pushupsOnlyMet || mixedMet,
    progress: Math.max(pushupsOnlyProgress, mixedProgress),
    pushupsOnlyMet,
    mixedMet,
  };
}

export function dayState(day: DayProgram, totals: Totals, today: string): DayState {
  if (day.kind === 'rest') return 'rest';
  if (day.date > today) return 'future';
  const completion = dayCompletion(day, totals);
  if (completion.complete) return 'complete';
  return completion.progress > 0 ? 'partial' : 'none';
}

/** One participant's aggregated standing across the whole challenge. */
export function participantStanding(
  participant: Participant,
  entries: readonly Pick<Entry, 'participantId' | 'day' | 'exercise' | 'count'>[],
  today: string,
  challenge: Challenge = CHALLENGE,
): LeaderboardRow {
  const own = entries.filter((e) => e.participantId === participant.id);
  const totalWorkoutDays = workoutDays(challenge).length;

  const totalsByExercise: Totals = {};
  let daysComplete = 0;
  const perDay: { day: string; state: DayState; totals: Totals }[] = [];

  for (const day of challenge.days) {
    const totals = totalsForDay(own, day.date);
    for (const [exercise, count] of Object.entries(totals)) {
      const key = exercise as keyof Totals;
      totalsByExercise[key] = (totalsByExercise[key] ?? 0) + (count ?? 0);
    }
    const state = dayState(day, totals, today);
    if (state === 'complete') daysComplete += 1;
    perDay.push({ day: day.date, state, totals });
  }

  const totalReps = Object.values(totalsByExercise).reduce((a, b) => a + (b ?? 0), 0);
  return {
    participantId: participant.id,
    name: participant.name,
    totalsByExercise,
    totalReps,
    daysComplete,
    percentComplete: totalWorkoutDays > 0 ? Math.round((daysComplete / totalWorkoutDays) * 100) : 0,
    perDay,
  };
}

/** Ranked board: percentComplete desc, ties by totalReps desc, then name. */
export function buildLeaderboard(
  participants: readonly Participant[],
  entries: readonly Pick<Entry, 'participantId' | 'day' | 'exercise' | 'count'>[],
  today: string = todaySydney(),
  challenge: Challenge = CHALLENGE,
): LeaderboardRow[] {
  return participants
    .map((p) => participantStanding(p, entries, today, challenge))
    .sort(
      (a, b) =>
        b.percentComplete - a.percentComplete ||
        b.totalReps - a.totalReps ||
        a.name.localeCompare(b.name),
    );
}
