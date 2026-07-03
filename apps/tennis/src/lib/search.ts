import { VENUES, type ClubSparkVenue, type ExternalVenue, type Venue } from '../data/venues';
import { adapters } from './adapters';
import type { AvailabilityQuery } from './adapters/types';
import { distanceFromHomeKm } from './geo';
import { ceilToHalfHour, minutesToHhmm, nowMinutesSydney, todaySydney } from './time';
import type { AvailabilityResponse, VenueResult, VenueSummary } from './types';

const PER_VENUE_TIMEOUT_MS = 4000;

// The registry is static per deploy, so distances never change per request.
const distances = new Map<string, number>(VENUES.map((v) => [v.id, distanceFromHomeKm(v)]));

function summarize(venue: Venue): VenueSummary {
  return { id: venue.id, name: venue.name, suburb: venue.suburb, distanceKm: distances.get(venue.id) ?? 0 };
}

function linkOnlyResult(venue: ExternalVenue): VenueResult {
  return {
    kind: 'link-only',
    venue: summarize(venue),
    bookingUrl: venue.bookingUrl,
    ...(venue.systemName !== undefined && { systemName: venue.systemName }),
  };
}

async function availabilityResult(venue: ClubSparkVenue, query: AvailabilityQuery): Promise<VenueResult> {
  const availability = await adapters.clubspark.fetchAvailability(
    venue,
    query,
    AbortSignal.timeout(PER_VENUE_TIMEOUT_MS)
  );
  return {
    kind: 'availability',
    venue: summarize(venue),
    status: availability.status,
    windows: availability.windows.map((w) => ({
      court: w.courtName,
      start: minutesToHhmm(w.startMinutes),
      end: minutesToHhmm(w.endMinutes),
      ...(w.guestPricePerHour !== undefined && { guestPricePerHour: w.guestPricePerHour }),
      ...(w.includesLighting !== undefined && { includesLighting: w.includesLighting }),
    })),
    bookingUrl: availability.bookingUrl,
    ...(availability.errorMessage !== undefined && { errorMessage: availability.errorMessage }),
  };
}

/**
 * Fan out to every supported venue in parallel and assemble the full,
 * distance-sorted result set. Never throws for upstream failures — a venue
 * that fails becomes a status:'error'/'timeout' result (FR-008).
 */
export async function runSearch(query: AvailabilityQuery): Promise<AvailabilityResponse> {
  // When searching today, past times can't be booked — clip to now (US2).
  const effectiveQuery: AvailabilityQuery =
    query.date === todaySydney()
      ? { ...query, startMinutes: Math.max(query.startMinutes, ceilToHalfHour(nowMinutesSydney())) }
      : query;

  const clubSparkVenues = VENUES.filter((v): v is ClubSparkVenue => v.system === 'clubspark');
  const externalVenues = VENUES.filter((v): v is ExternalVenue => v.system === 'external');

  const settled = await Promise.allSettled(
    clubSparkVenues.map((venue) => availabilityResult(venue, effectiveQuery))
  );
  const results: VenueResult[] = settled.map((outcome, index) => {
    const venue = clubSparkVenues[index] as ClubSparkVenue;
    if (outcome.status === 'fulfilled') return outcome.value;
    return {
      kind: 'availability',
      venue: summarize(venue),
      status: 'error',
      windows: [],
      bookingUrl: `https://play.tennis.com.au/${venue.clubsparkSlug}/Booking/BookByDate#?date=${effectiveQuery.date}`,
      errorMessage: 'Could not read booking system',
    };
  });

  results.push(...externalVenues.map(linkOnlyResult));
  results.sort((a, b) => a.venue.distanceKm - b.venue.distanceKm);

  return {
    query: {
      date: effectiveQuery.date,
      start: minutesToHhmm(effectiveQuery.startMinutes),
      end: minutesToHhmm(effectiveQuery.endMinutes),
      minDurationMinutes: effectiveQuery.minDurationMinutes,
    },
    generatedAt: new Date().toISOString(),
    results,
  };
}
