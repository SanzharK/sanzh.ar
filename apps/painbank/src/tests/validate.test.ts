import { describe, expect, it } from 'vitest';
import {
  isBankableDay,
  isExerciseForDay,
  isUuid,
  isValidCount,
  isValidExercise,
  isValidName,
} from '../lib/validate';
import { TEST_CHALLENGE } from './fixtures/entries';

describe('isUuid', () => {
  it('accepts crypto.randomUUID output', () => {
    expect(isUuid(crypto.randomUUID())).toBe(true);
    expect(isUuid('11111111-1111-4111-8111-111111111111')).toBe(true);
  });

  it('rejects non-uuids', () => {
    expect(isUuid('not-a-uuid')).toBe(false);
    expect(isUuid('')).toBe(false);
    expect(isUuid(42)).toBe(false);
    expect(isUuid(null)).toBe(false);
    expect(isUuid('11111111111111111111111111111111')).toBe(false);
  });
});

describe('isValidName', () => {
  it('accepts 1–24 chars', () => {
    expect(isValidName('S')).toBe(true);
    expect(isValidName('Sanzhar')).toBe(true);
    expect(isValidName('a'.repeat(24))).toBe(true);
  });

  it('rejects empty, too long, untrimmed, or non-string', () => {
    expect(isValidName('')).toBe(false);
    expect(isValidName('a'.repeat(25))).toBe(false);
    expect(isValidName(' padded ')).toBe(false);
    expect(isValidName(7)).toBe(false);
  });
});

describe('isValidExercise', () => {
  it('accepts the closed set only', () => {
    expect(isValidExercise('pushups')).toBe(true);
    expect(isValidExercise('squats')).toBe(true);
    expect(isValidExercise('burpees')).toBe(false);
    expect(isValidExercise('')).toBe(false);
  });
});

describe('isValidCount', () => {
  it('accepts non-zero integers within ±500', () => {
    expect(isValidCount(1)).toBe(true);
    expect(isValidCount(-10)).toBe(true);
    expect(isValidCount(500)).toBe(true);
    expect(isValidCount(-500)).toBe(true);
  });

  it('rejects zero, fractions, out-of-bounds, and non-numbers', () => {
    expect(isValidCount(0)).toBe(false);
    expect(isValidCount(1.5)).toBe(false);
    expect(isValidCount(501)).toBe(false);
    expect(isValidCount(-501)).toBe(false);
    expect(isValidCount('10')).toBe(false);
    expect(isValidCount(NaN)).toBe(false);
  });
});

describe('isBankableDay', () => {
  it('accepts workout days inside the challenge', () => {
    expect(isBankableDay('2026-07-13', TEST_CHALLENGE)).toBe(true);
  });

  it('rejects rest days, out-of-range dates, and malformed input', () => {
    expect(isBankableDay('2026-07-14', TEST_CHALLENGE)).toBe(false); // rest
    expect(isBankableDay('2026-07-12', TEST_CHALLENGE)).toBe(false); // before start
    expect(isBankableDay('2026-08-01', TEST_CHALLENGE)).toBe(false); // after end
    expect(isBankableDay('2026-02-30', TEST_CHALLENGE)).toBe(false); // impossible date
    expect(isBankableDay('13/07/2026', TEST_CHALLENGE)).toBe(false);
    expect(isBankableDay(20260713, TEST_CHALLENGE)).toBe(false);
  });
});

describe('isExerciseForDay', () => {
  it('always allows push-ups on a workout day', () => {
    expect(isExerciseForDay('pushups', '2026-07-13', TEST_CHALLENGE)).toBe(true);
  });

  it('allows other exercises only when in that day’s mixed set', () => {
    expect(isExerciseForDay('pullups', '2026-07-13', TEST_CHALLENGE)).toBe(true);
    expect(isExerciseForDay('situps', '2026-07-13', TEST_CHALLENGE)).toBe(false); // not in day 1 mix
    expect(isExerciseForDay('situps', '2026-07-16', TEST_CHALLENGE)).toBe(true);
  });

  it('rejects everything on rest days', () => {
    expect(isExerciseForDay('pushups', '2026-07-14', TEST_CHALLENGE)).toBe(false);
  });
});
