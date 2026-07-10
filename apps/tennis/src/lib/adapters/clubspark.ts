import type { ClubSparkVenue } from '../../data/venues';
import { freeWindows, type Interval } from '../windows';
import type { AvailabilityQuery, AvailabilityWindow, VenueAdapter, VenueAvailability } from './types';
import { asFiniteNumber, asString, isRecord } from './clubspark.types';

const USER_AGENT = 'sanzh.ar-tennis-butler/1.0 (personal tool; contact: sanzhar.kushekbayev@gmail.com)';

export function bookingUrl(slug: string, date: string): string {
  return `https://play.tennis.com.au/${slug}/Booking/BookByDate#?date=${date}`;
}

function sessionsUrl(slug: string, date: string): string {
  return `https://play.tennis.com.au/v0/VenueBooking/${slug}/GetVenueSessions?startDate=${date}&endDate=${date}`;
}

interface ParsedSession {
  interval: Interval;
  bookable: boolean;
  /** Per-hour, only when affirmatively derivable. */
  guestPricePerHour?: number;
  memberPricePerHour?: number;
  includesLighting?: boolean;
}

function parseSession(raw: unknown): ParsedSession | undefined {
  if (!isRecord(raw)) return undefined;
  const start = asFiniteNumber(raw.StartTime);
  const end = asFiniteNumber(raw.EndTime);
  if (start === undefined || end === undefined || start >= end) return undefined;

  // Fail closed: only Capacity > 0 is bookable; missing/zero/unknown blocks.
  const capacity = asFiniteNumber(raw.Capacity);
  const bookable = capacity !== undefined && capacity > 0;

  const session: ParsedSession = { interval: { start, end }, bookable };
  if (!bookable) return session;

  const slotMinutes = asFiniteNumber(raw.Interval);
  const perHour = (cost: number | undefined): number | undefined =>
    cost !== undefined && cost > 0 && slotMinutes !== undefined && slotMinutes > 0
      ? Math.round(cost * (60 / slotMinutes) * 100) / 100
      : undefined;

  const lightingCost = asFiniteNumber(raw.LightingCost);
  const courtCost = asFiniteNumber(raw.CourtCost);
  const guest = perHour(asFiniteNumber(raw.GuestPrice)) ?? perHour(courtCost);
  const member = perHour(asFiniteNumber(raw.MemberPrice));
  if (guest !== undefined) session.guestPricePerHour = guest;
  if (member !== undefined) session.memberPricePerHour = member;
  if (lightingCost !== undefined && lightingCost > 0) session.includesLighting = true;
  return session;
}

/** Parse a raw GetVenueSessions body into free windows for the query. Pure; exported for tests. */
export function parseVenueSessions(body: unknown, query: AvailabilityQuery): AvailabilityWindow[] {
  if (!isRecord(body) || !Array.isArray(body.Resources)) return [];
  const bounds: Interval = { start: query.startMinutes, end: query.endMinutes };
  const windows: AvailabilityWindow[] = [];

  for (const resource of body.Resources) {
    if (!isRecord(resource)) continue;
    const courtName = asString(resource.Name) ?? 'Court';
    const courtId = asString(resource.ID) ?? courtName;
    if (!Array.isArray(resource.Days)) continue;

    const bookable: Interval[] = [];
    const blocked: Interval[] = [];
    const priced: ParsedSession[] = [];
    for (const day of resource.Days) {
      if (!isRecord(day) || !Array.isArray(day.Sessions)) continue;
      for (const rawSession of day.Sessions) {
        const session = parseSession(rawSession);
        if (!session) continue; // unparseable → contributes no free time
        if (session.bookable) {
          bookable.push(session.interval);
          priced.push(session);
        } else {
          blocked.push(session.interval);
        }
      }
    }

    for (const free of freeWindows(bookable, blocked, bounds, query.minDurationMinutes)) {
      // Attach pricing from the bookable session containing this window, if unambiguous.
      const source = priced.find((s) => s.interval.start <= free.start && s.interval.end >= free.end);
      windows.push({
        courtId,
        courtName,
        startMinutes: free.start,
        endMinutes: free.end,
        ...(source?.guestPricePerHour !== undefined && { guestPricePerHour: source.guestPricePerHour }),
        ...(source?.memberPricePerHour !== undefined && { memberPricePerHour: source.memberPricePerHour }),
        ...(source?.includesLighting !== undefined && { includesLighting: source.includesLighting }),
      });
    }
  }
  return windows;
}

export const clubSparkAdapter: VenueAdapter<ClubSparkVenue> = {
  system: 'clubspark',
  async fetchAvailability(venue, query, signal): Promise<VenueAvailability> {
    const url = bookingUrl(venue.clubsparkSlug, query.date);
    try {
      const response = await fetch(sessionsUrl(venue.clubsparkSlug, query.date), {
        signal,
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      });
      if (!response.ok) {
        return {
          venueId: venue.id,
          status: 'error',
          windows: [],
          bookingUrl: url,
          errorMessage: 'Booking system returned an error',
        };
      }
      const body: unknown = await response.json();
      return { venueId: venue.id, status: 'ok', windows: parseVenueSessions(body, query), bookingUrl: url };
    } catch (error) {
      const timedOut = error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError');
      return {
        venueId: venue.id,
        status: timedOut ? 'timeout' : 'error',
        windows: [],
        bookingUrl: url,
        errorMessage: timedOut ? "Booking system didn't respond" : 'Could not read booking system',
      };
    }
  },
};
