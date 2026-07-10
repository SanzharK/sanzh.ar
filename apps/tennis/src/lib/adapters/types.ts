import type { Venue } from '../../data/venues';

export interface AvailabilityQuery {
  /** 'YYYY-MM-DD', Sydney calendar date. */
  date: string;
  /** Minutes from midnight, venue-local (Sydney). */
  startMinutes: number;
  endMinutes: number;
  minDurationMinutes: number;
}

export interface AvailabilityWindow {
  courtId: string;
  courtName: string;
  /** Minutes from midnight, venue-local. */
  startMinutes: number;
  endMinutes: number;
  /** AUD; omitted when ambiguous — never guessed. */
  guestPricePerHour?: number;
  memberPricePerHour?: number;
  includesLighting?: boolean;
}

export type FetchStatus = 'ok' | 'timeout' | 'error';

export interface VenueAvailability {
  venueId: string;
  status: FetchStatus;
  /** Empty unless status === 'ok'. */
  windows: AvailabilityWindow[];
  /** Deep link; present even on failure so the UI always has a fallback CTA. */
  bookingUrl: string;
  /** Short, client-safe; never a raw upstream body. */
  errorMessage?: string;
}

export interface VenueAdapter<V extends Venue = Venue> {
  readonly system: V['system'];
  fetchAvailability(venue: V, query: AvailabilityQuery, signal: AbortSignal): Promise<VenueAvailability>;
}
