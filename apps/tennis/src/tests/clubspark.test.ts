import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bookingUrl, parseVenueSessions } from '../lib/adapters/clubspark';
import type { AvailabilityQuery } from '../lib/adapters/types';

function fixture(name: string): unknown {
  return JSON.parse(readFileSync(join(__dirname, 'fixtures', `clubspark-${name}.json`), 'utf8'));
}

const fullDay = (minDurationMinutes = 30): AvailabilityQuery => ({
  date: '2026-07-03',
  startMinutes: 6 * 60,
  endMinutes: 23 * 60,
  minDurationMinutes,
});

describe('parseVenueSessions — recorded fixtures', () => {
  it('busy day: booked slot is excluded, grid split is preserved', () => {
    // Court 1: Default 420-750, Booking 750-810 (blocked), Default 810-1350
    const windows = parseVenueSessions(fixture('busy'), fullDay());
    const court1 = windows.filter((w) => w.courtName === 'Court 1');
    expect(court1).toEqual([
      expect.objectContaining({ startMinutes: 420, endMinutes: 750 }),
      expect.objectContaining({ startMinutes: 810, endMinutes: 1350 }),
    ]);
    // Court 1's booked interval 750-810 never appears as free on Court 1 (SC-003)
    for (const w of court1) {
      expect(w.startMinutes >= 810 || w.endMinutes <= 750).toBe(true);
    }
    const court2 = windows.filter((w) => w.courtName === 'Court 2');
    expect(court2).toEqual([expect.objectContaining({ startMinutes: 420, endMinutes: 1350 })]);
  });

  it('free day: every court fully open 480-1200', () => {
    const windows = parseVenueSessions(fixture('free'), fullDay(60));
    expect(windows).toHaveLength(8);
    for (const w of windows) {
      expect(w).toMatchObject({ startMinutes: 480, endMinutes: 1200 });
    }
  });

  it('closed day: zero windows, no error', () => {
    expect(parseVenueSessions(fixture('closed'), fullDay())).toEqual([]);
  });

  it('respects the query window and minDuration', () => {
    // Busy fixture, query 12:00-14:00 (720-840) with 60-min minimum:
    // Court 1 fragments are 720-750 (30m) and 810-840 (30m) → both dropped; Court 2 → 720-840.
    const windows = parseVenueSessions(fixture('busy'), {
      date: '2026-07-03',
      startMinutes: 720,
      endMinutes: 840,
      minDurationMinutes: 60,
    });
    expect(windows).toEqual([
      expect.objectContaining({ courtName: 'Court 2', startMinutes: 720, endMinutes: 840 }),
    ]);
  });
});

describe('parseVenueSessions — fail closed on unknown data', () => {
  it('returns no windows for non-object bodies', () => {
    expect(parseVenueSessions(null, fullDay())).toEqual([]);
    expect(parseVenueSessions([], fullDay())).toEqual([]);
    expect(parseVenueSessions('nope', fullDay())).toEqual([]);
    expect(parseVenueSessions({}, fullDay())).toEqual([]);
  });

  it('a session with missing Capacity is not free', () => {
    const body = {
      Resources: [
        { ID: 'c1', Name: 'Court 1', Days: [{ Sessions: [{ Category: 0, Name: 'Default', StartTime: 480, EndTime: 1200 }] }] },
      ],
    };
    expect(parseVenueSessions(body, fullDay())).toEqual([]);
  });

  it('an unknown Capacity=0 category still blocks overlapping bookable time', () => {
    const body = {
      Resources: [
        {
          ID: 'c1',
          Name: 'Court 1',
          Days: [
            {
              Sessions: [
                { Category: 0, Name: 'Default', StartTime: 480, EndTime: 720, Capacity: 4, Interval: 60 },
                { Category: 9999, Name: 'Mystery', StartTime: 600, EndTime: 660, Capacity: 0 },
              ],
            },
          ],
        },
      ],
    };
    expect(parseVenueSessions(body, fullDay())).toEqual([
      expect.objectContaining({ startMinutes: 480, endMinutes: 600 }),
      expect.objectContaining({ startMinutes: 660, endMinutes: 720 }),
    ]);
  });

  it('malformed session times are ignored, not treated as free', () => {
    const body = {
      Resources: [
        {
          ID: 'c1',
          Name: 'Court 1',
          Days: [{ Sessions: [{ Category: 0, Name: 'Default', StartTime: 'x', EndTime: 1200, Capacity: 4 }] }],
        },
      ],
    };
    expect(parseVenueSessions(body, fullDay())).toEqual([]);
  });
});

describe('bookingUrl', () => {
  it('deep-links to the searched date', () => {
    expect(bookingUrl('fivedockparktenniscentre', '2026-07-04')).toBe(
      'https://play.tennis.com.au/fivedockparktenniscentre/Booking/BookByDate#?date=2026-07-04'
    );
  });
});
