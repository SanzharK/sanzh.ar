import { describe, expect, it } from 'vitest';
import { clipIntervals, freeWindows, mergeIntervals, subtractIntervals } from '../lib/windows';

describe('mergeIntervals', () => {
  it('merges overlapping and touching intervals', () => {
    expect(
      mergeIntervals([
        { start: 480, end: 540 },
        { start: 540, end: 600 },
        { start: 700, end: 720 },
      ])
    ).toEqual([
      { start: 480, end: 600 },
      { start: 700, end: 720 },
    ]);
  });

  it('drops invalid intervals (start >= end, non-finite)', () => {
    expect(
      mergeIntervals([
        { start: 600, end: 600 },
        { start: 700, end: 600 },
        { start: Number.NaN, end: 800 },
      ])
    ).toEqual([]);
  });
});

describe('subtractIntervals', () => {
  it('splits base around a blocker in the middle', () => {
    expect(subtractIntervals([{ start: 480, end: 1200 }], [{ start: 750, end: 810 }])).toEqual([
      { start: 480, end: 750 },
      { start: 810, end: 1200 },
    ]);
  });

  it('handles adjacent blockers merging into one gap', () => {
    expect(
      subtractIntervals(
        [{ start: 480, end: 1200 }],
        [
          { start: 600, end: 660 },
          { start: 660, end: 720 },
        ]
      )
    ).toEqual([
      { start: 480, end: 600 },
      { start: 720, end: 1200 },
    ]);
  });

  it('returns empty when the base is fully blocked', () => {
    expect(subtractIntervals([{ start: 480, end: 600 }], [{ start: 400, end: 700 }])).toEqual([]);
  });

  it('is unaffected by blockers outside the base', () => {
    expect(subtractIntervals([{ start: 480, end: 600 }], [{ start: 600, end: 700 }])).toEqual([
      { start: 480, end: 600 },
    ]);
  });
});

describe('clipIntervals', () => {
  it('clips to bounds and drops empties', () => {
    expect(
      clipIntervals(
        [
          { start: 400, end: 700 },
          { start: 100, end: 200 },
        ],
        { start: 480, end: 660 }
      )
    ).toEqual([{ start: 480, end: 660 }]);
  });
});

describe('freeWindows', () => {
  it('drops fragments shorter than minDuration', () => {
    // Free 8:00-9:00 only; 90-minute minimum → nothing (US2 acceptance scenario 1)
    expect(
      freeWindows([{ start: 480, end: 540 }], [], { start: 420, end: 720 }, 90)
    ).toEqual([]);
  });

  it('keeps a window straddling the query bounds, clipped', () => {
    expect(
      freeWindows([{ start: 400, end: 1300 }], [{ start: 750, end: 810 }], { start: 1020, end: 1260 }, 60)
    ).toEqual([{ start: 1020, end: 1260 }]);
  });

  it('returns empty for empty bookable input', () => {
    expect(freeWindows([], [{ start: 480, end: 540 }], { start: 480, end: 1200 }, 30)).toEqual([]);
  });

  it('reproduces the busy-fixture shape: booking splits the day', () => {
    const bookable = [
      { start: 420, end: 750 },
      { start: 810, end: 1350 },
    ];
    const blocked = [{ start: 750, end: 810 }];
    expect(freeWindows(bookable, blocked, { start: 420, end: 1350 }, 30)).toEqual([
      { start: 420, end: 750 },
      { start: 810, end: 1350 },
    ]);
  });
});
