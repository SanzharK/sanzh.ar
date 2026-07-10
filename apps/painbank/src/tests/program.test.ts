import { describe, expect, it } from 'vitest';
import { CHALLENGE, type WorkoutDay } from '../data/program';
import {
  buildLeaderboard,
  dayCompletion,
  dayState,
  getDayProgram,
  totalsForDay,
  workoutDays,
} from '../lib/program';
import { todaySydney } from '../lib/time';
import { ALICE, ALICE_ENTRIES, BOB, BOB_ENTRIES, TEST_CHALLENGE } from './fixtures/entries';

const DAY1 = getDayProgram('2026-07-13', TEST_CHALLENGE) as WorkoutDay;

describe('program config (production)', () => {
  it('covers every date from start to end with no gaps or duplicates', () => {
    const dates = CHALLENGE.days.map((d) => d.date);
    expect(dates[0]).toBe(CHALLENGE.startDate);
    expect(dates[dates.length - 1]).toBe(CHALLENGE.endDate);
    expect(new Set(dates).size).toBe(dates.length);
    expect([...dates].sort()).toEqual(dates);
  });

  it('every workout day has positive targets in both modes', () => {
    for (const day of workoutDays(CHALLENGE)) {
      expect(day.pushupsOnly).toBeGreaterThan(0);
      expect(day.mixed.length).toBeGreaterThan(0);
      for (const set of day.mixed) expect(set.count).toBeGreaterThan(0);
    }
  });
});

describe('totalsForDay', () => {
  it('sums signed deltas per exercise for one day only', () => {
    const totals = totalsForDay(
      [
        { day: '2026-07-13', exercise: 'pushups', count: 30 },
        { day: '2026-07-13', exercise: 'pushups', count: -10 },
        { day: '2026-07-15', exercise: 'pushups', count: 99 },
      ],
      '2026-07-13',
    );
    expect(totals.pushups).toBe(20);
  });

  it('clamps a negative sum at 0', () => {
    const totals = totalsForDay([{ day: '2026-07-13', exercise: 'squats', count: -50 }], '2026-07-13');
    expect(totals.squats).toBe(0);
  });
});

describe('dayCompletion (either-mode rule)', () => {
  it('completes via push-ups only', () => {
    expect(dayCompletion(DAY1, { pushups: 100 }).complete).toBe(true);
  });

  it('completes via the full mixed set', () => {
    const result = dayCompletion(DAY1, { pushups: 30, squats: 50, pullups: 20 });
    expect(result.complete).toBe(true);
    expect(result.mixedMet).toBe(true);
    expect(result.pushupsOnlyMet).toBe(false);
  });

  it('is incomplete when one mixed exercise falls short', () => {
    const result = dayCompletion(DAY1, { pushups: 30, squats: 50, pullups: 19 });
    expect(result.complete).toBe(false);
  });

  it('push-up entries count toward both modes', () => {
    // 30 push-ups meets the mixed push-up target and 30% of push-ups-only.
    const result = dayCompletion(DAY1, { pushups: 30 });
    expect(result.pushupsOnlyMet).toBe(false);
    expect(result.progress).toBeGreaterThan(0);
  });

  it('progress reflects the closer-to-done mode', () => {
    // 90/100 push-ups-only (0.9) beats mixed min-progress.
    expect(dayCompletion(DAY1, { pushups: 90 }).progress).toBeCloseTo(0.9);
  });
});

describe('dayState', () => {
  it('marks rest, future, none, partial, complete', () => {
    const rest = getDayProgram('2026-07-14', TEST_CHALLENGE)!;
    expect(dayState(rest, {}, '2026-07-15')).toBe('rest');
    expect(dayState(DAY1, {}, '2026-07-12')).toBe('future');
    expect(dayState(DAY1, {}, '2026-07-13')).toBe('none');
    expect(dayState(DAY1, { pushups: 10 }, '2026-07-13')).toBe('partial');
    expect(dayState(DAY1, { pushups: 100 }, '2026-07-13')).toBe('complete');
  });
});

describe('buildLeaderboard', () => {
  const entries = [...ALICE_ENTRIES, ...BOB_ENTRIES];

  it('ranks by percent complete, ties by total reps', () => {
    // Both completed day 1 (of 3 workout days → 33%); Alice has more total reps.
    const rows = buildLeaderboard([BOB, ALICE], entries, '2026-07-16', TEST_CHALLENGE);
    expect(rows.map((r) => r.name)).toEqual(['Alice', 'Bob']);
    expect(rows[0]?.percentComplete).toBe(33);
    expect(rows[0]?.totalReps).toBe(120);
    expect(rows[1]?.totalReps).toBe(100);
  });

  it('includes zero-entry participants at 0%', () => {
    const rows = buildLeaderboard([ALICE, { id: BOB.id, name: 'Bob' }], ALICE_ENTRIES, '2026-07-16', TEST_CHALLENGE);
    const bob = rows.find((r) => r.participantId === BOB.id);
    expect(bob?.percentComplete).toBe(0);
    expect(bob?.totalReps).toBe(0);
  });

  it('emits per-day states and totals for every challenge day', () => {
    const rows = buildLeaderboard([ALICE], ALICE_ENTRIES, '2026-07-15', TEST_CHALLENGE);
    const perDay = rows[0]?.perDay ?? [];
    expect(perDay.map((d) => d.state)).toEqual(['complete', 'rest', 'partial', 'future']);
    expect(perDay[0]?.totals.pushups).toBe(100);
  });
});

describe('todaySydney', () => {
  it('rolls the date at Sydney midnight, not UTC midnight', () => {
    // 2026-07-13T14:30:00Z is 00:30 on July 14 in Sydney (UTC+10 in July).
    expect(todaySydney(new Date('2026-07-13T14:30:00Z'))).toBe('2026-07-14');
    // 13:30Z is still 23:30 on July 13 in Sydney.
    expect(todaySydney(new Date('2026-07-13T13:30:00Z'))).toBe('2026-07-13');
  });
});
