/**
 * Pure angle math for the rep dial. No DOM — fully unit-testable.
 *
 * Convention: 0° at 12 o'clock, degrees grow clockwise, normalized to [0, 360).
 * Tracing clockwise accumulates degrees continuously across laps;
 * one rep per DEGREES_PER_REP (a full lap = +10 reps), counter-clockwise subtracts.
 */

export const DEGREES_PER_REP = 36;
export const REPS_PER_LAP = 360 / DEGREES_PER_REP;

/** Angle of (x, y) around center (cx, cy): 0° at 12 o'clock, clockwise, [0, 360). */
export function pointToAngle(cx: number, cy: number, x: number, y: number): number {
  // Screen y grows downward, so "up" is -dy.
  const degrees = (Math.atan2(x - cx, -(y - cy)) * 180) / Math.PI;
  return (degrees + 360) % 360;
}

/** Signed shortest rotation from prev to next, in (-180, 180]. Wrap-safe: 359→1 = +2. */
export function angleDelta(prev: number, next: number): number {
  let delta = next - prev;
  while (delta > 180) delta -= 360;
  while (delta <= -180) delta += 360;
  return delta;
}

/** Continuous accumulated degrees → whole reps (symmetric: ±36° per rep). */
export function degreesToReps(degrees: number): number {
  // `|| 0` normalizes Math.trunc's -0 so callers never emit "-0" in the UI.
  return Math.trunc(degrees / DEGREES_PER_REP) || 0;
}

/** Clamp accumulated degrees so the rep count stays within [minReps, maxReps]. */
export function clampDegrees(degrees: number, minReps: number, maxReps: number): number {
  const min = minReps * DEGREES_PER_REP;
  // Allow up to (but not including) the next boundary above maxReps so the
  // handle still moves within the current rep.
  const max = (maxReps + 1) * DEGREES_PER_REP - 1e-9;
  return Math.min(max, Math.max(min, degrees));
}

/** Handle position for accumulated degrees, as a point on a circle of the given radius. */
export function handlePosition(degrees: number, cx: number, cy: number, radius: number): { x: number; y: number } {
  const rad = ((degrees % 360) * Math.PI) / 180;
  return { x: cx + radius * Math.sin(rad), y: cy - radius * Math.cos(rad) };
}
