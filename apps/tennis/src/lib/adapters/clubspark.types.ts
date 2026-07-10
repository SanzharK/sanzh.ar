/**
 * Raw GetVenueSessions response shape — partial and defensive: every field is
 * optional and runtime-guarded, because we don't control this API.
 *
 * Classification ground truth (derived from ClubSpark's own booking SPA and
 * live probes via apps/tennis/scripts/probe-venues.mjs, 2026-07-03):
 *   - Sessions with Capacity > 0 are the bookable grid
 *     (observed: Category=0, Name "Default" / "Default Schedule").
 *   - Sessions with Capacity === 0 are blockers:
 *     Category=1000 Name="Booking" → booked slot,
 *     Category=2000 → coaching,
 *     Category=8000 Name="Closed" → closed.
 *   - The grid itself is split around bookings (e.g. Default 420-750,
 *     Booking 750-810, Default 810-1350), so "free = union(Capacity>0) minus
 *     union(Capacity==0)" is doubly safe.
 *   - Anything unrecognized (missing Capacity, missing times) contributes NO
 *     free time — fail closed per FR-005/SC-003.
 * Times are minutes-from-midnight, venue-local (TimeZone: Australia/Sydney).
 */

export interface RawSession {
  ID?: unknown;
  Category?: unknown;
  Name?: unknown;
  StartTime?: unknown;
  EndTime?: unknown;
  Interval?: unknown;
  Capacity?: unknown;
  Cost?: unknown;
  CourtCost?: unknown;
  LightingCost?: unknown;
  MemberPrice?: unknown;
  GuestPrice?: unknown;
}

export interface RawDay {
  Date?: unknown;
  Sessions?: unknown;
}

export interface RawResource {
  ID?: unknown;
  Name?: unknown;
  Lighting?: unknown;
  Days?: unknown;
}

export interface RawVenueSessions {
  TimeZone?: unknown;
  MinimumInterval?: unknown;
  Resources?: unknown;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
