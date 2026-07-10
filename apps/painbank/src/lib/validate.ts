import { EXERCISES, type Challenge, type ExerciseId, CHALLENGE } from '../data/program';
import { getDayProgram } from './program';
import { isValidDateString } from './time';

/** Single-entry bound: nobody banks more than this in one go. */
export const MAX_ENTRY_COUNT = 500;
export const MAX_NAME_LENGTH = 24;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

export function isValidName(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length >= 1 && trimmed.length <= MAX_NAME_LENGTH && trimmed === value;
}

export function isValidExercise(value: unknown): value is ExerciseId {
  return typeof value === 'string' && (EXERCISES as readonly string[]).includes(value);
}

/** Valid bank amount: non-zero integer within ±MAX_ENTRY_COUNT. */
export function isValidCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value !== 0 && Math.abs(value) <= MAX_ENTRY_COUNT;
}

/** A bankable day: a well-formed date that is a WORKOUT day inside the challenge. */
export function isBankableDay(value: unknown, challenge: Challenge = CHALLENGE): value is string {
  if (typeof value !== 'string' || !isValidDateString(value)) return false;
  const day = getDayProgram(value, challenge);
  return day !== null && day.kind === 'workout';
}

/** The exercise must be reachable on that day: push-ups always, others only via the mixed set. */
export function isExerciseForDay(exercise: ExerciseId, day: string, challenge: Challenge = CHALLENGE): boolean {
  const program = getDayProgram(day, challenge);
  if (program === null || program.kind !== 'workout') return false;
  if (exercise === 'pushups') return true;
  return program.mixed.some((set) => set.exercise === exercise);
}
