/**
 * The challenge program — Pain Bank's single onboarding surface.
 *
 * A challenge is an ordered list of Sydney-local calendar days, each either a
 * rest day or a workout day with two equivalent ways to complete it:
 * the push-ups-only target, or every exercise of the mixed set.
 *
 * To run a new month: replace CHALLENGE below (dates + targets), commit, deploy.
 * Mixed-set equivalences are the program author's judgment call, not a formula —
 * `workout()` provides a default split (30% push-ups / 50% squats / 20% pull-ups)
 * that any day can override by passing an explicit mixed set.
 */

export const EXERCISES = ['pushups', 'squats', 'pullups', 'situps'] as const;
export type ExerciseId = (typeof EXERCISES)[number];

export const EXERCISE_LABELS: Record<ExerciseId, string> = {
  pushups: 'Push-ups',
  squats: 'Squats',
  pullups: 'Pull-ups',
  situps: 'Sit-ups',
};

export interface ExerciseSet {
  exercise: ExerciseId;
  count: number;
}

export interface WorkoutDay {
  date: string; // YYYY-MM-DD, Sydney-local
  kind: 'workout';
  pushupsOnly: number;
  mixed: readonly ExerciseSet[];
}

export interface RestDay {
  date: string;
  kind: 'rest';
}

export type DayProgram = WorkoutDay | RestDay;

export interface Challenge {
  name: string;
  slogan: string;
  startDate: string;
  endDate: string;
  days: readonly DayProgram[];
}

function workout(date: string, pushupsOnly: number, mixed?: readonly ExerciseSet[]): WorkoutDay {
  return {
    date,
    kind: 'workout',
    pushupsOnly,
    mixed: mixed ?? [
      { exercise: 'pushups', count: Math.round(pushupsOnly * 0.3) },
      { exercise: 'squats', count: Math.round(pushupsOnly * 0.5) },
      { exercise: 'pullups', count: Math.round(pushupsOnly * 0.2) },
    ],
  };
}

function rest(date: string): RestDay {
  return { date, kind: 'rest' };
}

export const CHALLENGE: Challenge = {
  name: 'Pain Bank — July 2026',
  slogan: 'Pain is just weakness leaving your body.',
  startDate: '2026-07-10',
  endDate: '2026-07-31',
  days: [
    workout('2026-07-10', 60),
    workout('2026-07-11', 65),
    rest('2026-07-12'),
    workout('2026-07-13', 70),
    workout('2026-07-14', 75),
    workout('2026-07-15', 80),
    workout('2026-07-16', 85),
    workout('2026-07-17', 88),
    workout('2026-07-18', 90),
    rest('2026-07-19'),
    workout('2026-07-20', 92),
    workout('2026-07-21', 95),
    workout('2026-07-22', 98),
    workout('2026-07-23', 100),
    workout('2026-07-24', 104),
    workout('2026-07-25', 108),
    rest('2026-07-26'),
    workout('2026-07-27', 110),
    workout('2026-07-28', 112),
    workout('2026-07-29', 115),
    workout('2026-07-30', 118),
    workout('2026-07-31', 120),
  ],
};
