import type { FetchStatus } from './adapters/types';

export interface AvailabilityResponse {
  query: { date: string; start: string; end: string; minDurationMinutes: number };
  /** ISO timestamp of when this response was generated. */
  generatedAt: string;
  /** Sorted by distanceKm ascending; every registry venue is always present. */
  results: VenueResult[];
}

export interface VenueSummary {
  id: string;
  name: string;
  suburb: string;
  /** Straight-line km from Drummoyne, one decimal. */
  distanceKm: number;
}

export type VenueResult =
  | {
      kind: 'availability';
      venue: VenueSummary;
      status: FetchStatus;
      windows: AvailabilityWindowDto[];
      bookingUrl: string;
      errorMessage?: string;
    }
  | {
      kind: 'link-only';
      venue: VenueSummary;
      bookingUrl: string;
      systemName?: string;
    };

export interface AvailabilityWindowDto {
  court: string;
  /** 'HH:MM', Sydney-local. */
  start: string;
  end: string;
  guestPricePerHour?: number;
  includesLighting?: boolean;
}
