import { describe, expect, it } from 'vitest';
import {
  DEGREES_PER_REP,
  angleDelta,
  clampDegrees,
  degreesToReps,
  handlePosition,
  pointToAngle,
} from '../lib/dial';

describe('pointToAngle', () => {
  const cx = 100;
  const cy = 100;

  it('is 0° at 12 o’clock', () => {
    expect(pointToAngle(cx, cy, 100, 0)).toBe(0);
  });

  it('is 90° at 3 o’clock (clockwise)', () => {
    expect(pointToAngle(cx, cy, 200, 100)).toBe(90);
  });

  it('is 180° at 6 o’clock', () => {
    expect(pointToAngle(cx, cy, 100, 200)).toBe(180);
  });

  it('is 270° at 9 o’clock', () => {
    expect(pointToAngle(cx, cy, 0, 100)).toBe(270);
  });

  it('handles diagonal quadrants', () => {
    expect(pointToAngle(cx, cy, 150, 50)).toBeCloseTo(45);
    expect(pointToAngle(cx, cy, 50, 50)).toBeCloseTo(315);
  });
});

describe('angleDelta', () => {
  it('returns signed shortest rotation', () => {
    expect(angleDelta(10, 30)).toBe(20);
    expect(angleDelta(30, 10)).toBe(-20);
  });

  it('wraps across 0°: 359→1 is +2, not −358', () => {
    expect(angleDelta(359, 1)).toBe(2);
  });

  it('wraps across 0° counter-clockwise: 1→359 is −2', () => {
    expect(angleDelta(1, 359)).toBe(-2);
  });

  it('maps a 180° flip to +180 (never −180)', () => {
    expect(angleDelta(0, 180)).toBe(180);
    expect(angleDelta(180, 0)).toBe(180);
  });
});

describe('degreesToReps', () => {
  it('gives one rep per 36° clockwise', () => {
    expect(degreesToReps(0)).toBe(0);
    expect(degreesToReps(35.9)).toBe(0);
    expect(degreesToReps(36)).toBe(1);
    expect(degreesToReps(360)).toBe(10);
  });

  it('is symmetric counter-clockwise (a lap back = −10)', () => {
    expect(degreesToReps(-35.9)).toBe(0);
    expect(degreesToReps(-36)).toBe(-1);
    expect(degreesToReps(-360)).toBe(-10);
  });

  it('does not drift over many laps', () => {
    // Simulate 5 laps of small pointer deltas (5° steps).
    let degrees = 0;
    for (let i = 0; i < (5 * 360) / 5; i += 1) degrees += 5;
    expect(degreesToReps(degrees)).toBe(50);
  });

  it('accumulated small deltas across the 0° wrap keep counting up', () => {
    // Walk clockwise from 350° through 0° in 4° steps using angleDelta.
    let accumulated = 350;
    let prev = 350;
    for (const next of [354, 358, 2, 6, 10]) {
      accumulated += angleDelta(prev, next);
      prev = next;
    }
    expect(accumulated).toBe(370);
    expect(degreesToReps(accumulated)).toBe(10);
  });
});

describe('clampDegrees', () => {
  it('does not let reps go below min', () => {
    expect(degreesToReps(clampDegrees(-100, -2, 500))).toBe(-2);
    expect(degreesToReps(clampDegrees(-100, 0, 500))).toBe(0);
  });

  it('does not let reps exceed max', () => {
    expect(degreesToReps(clampDegrees(36 * 600, -2, 500))).toBe(500);
  });

  it('leaves in-range degrees untouched', () => {
    expect(clampDegrees(72, 0, 500)).toBe(72);
  });
});

describe('handlePosition', () => {
  it('sits at 12 o’clock for 0°', () => {
    const p = handlePosition(0, 100, 100, 50);
    expect(p.x).toBeCloseTo(100);
    expect(p.y).toBeCloseTo(50);
  });

  it('sits at 3 o’clock after a quarter lap and wraps full laps', () => {
    const quarter = handlePosition(90, 100, 100, 50);
    expect(quarter.x).toBeCloseTo(150);
    expect(quarter.y).toBeCloseTo(100);
    const wrapped = handlePosition(360 + 90, 100, 100, 50);
    expect(wrapped.x).toBeCloseTo(150);
    expect(wrapped.y).toBeCloseTo(100);
  });
});

describe('constants', () => {
  it('a lap is exactly 10 reps', () => {
    expect(360 / DEGREES_PER_REP).toBe(10);
  });
});
