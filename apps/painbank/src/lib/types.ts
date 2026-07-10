import type { ExerciseId } from '../data/program';

export interface Participant {
  id: string; // client-generated UUID
  name: string;
}

/** One banked session: an append-only signed rep delta. */
export interface Entry {
  id: string; // client-generated UUID — idempotency key
  participantId: string;
  day: string; // YYYY-MM-DD, Sydney-local challenge date
  exercise: ExerciseId;
  count: number; // signed, [-500, 500], never 0
}

/** Clamped-at-zero rep totals keyed by exercise. */
export type Totals = Partial<Record<ExerciseId, number>>;

export type DayState = 'complete' | 'partial' | 'none' | 'rest' | 'future';

export interface LeaderboardRow {
  participantId: string;
  name: string;
  totalsByExercise: Totals;
  totalReps: number;
  daysComplete: number;
  percentComplete: number; // 0–100, of all workout days in the challenge
  perDay: { day: string; state: DayState; totals: Totals }[];
}

export interface ParticipantsResponse {
  participants: Participant[];
}

export interface LeaderboardResponse {
  challenge: { name: string; slogan: string; startDate: string; endDate: string };
  rows: LeaderboardRow[];
}

export interface ApiError {
  error: string;
}
