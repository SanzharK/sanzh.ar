/**
 * The venue registry — Tennis Butler's single onboarding surface.
 *
 * To onboard a club, add one entry here (see specs/001-tennis-butler/quickstart.md):
 * - ClubSpark clubs (booking page on play.tennis.com.au/{slug}) get live availability.
 * - Anything else is 'external': shown with distance and an outbound booking link.
 *
 * lat/lng are hand-entered from Google Maps (right-click → copy coordinates).
 * Verify new ClubSpark slugs with: node apps/tennis/scripts/probe-venues.mjs
 */

export type BookingSystem = 'clubspark' | 'external';

interface VenueBase {
  /** Stable kebab-case id, unique across the registry. */
  id: string;
  name: string;
  suburb: string;
  lat: number;
  lng: number;
  notes?: string;
}

export interface ClubSparkVenue extends VenueBase {
  system: 'clubspark';
  /** Path segment on play.tennis.com.au. */
  clubsparkSlug: string;
}

export interface ExternalVenue extends VenueBase {
  system: 'external';
  /** Full URL to their booking page. */
  bookingUrl: string;
  /** Display only, e.g. 'SimplyBook.me' or 'Skedda'. */
  systemName?: string;
}

export type Venue = ClubSparkVenue | ExternalVenue;

export const VENUES: readonly Venue[] = [
  {
    id: 'five-dock-park',
    name: 'Five Dock Park Tennis Centre',
    suburb: 'Five Dock',
    lat: -33.8641,
    lng: 151.1285,
    system: 'clubspark',
    clubsparkSlug: 'fivedockparktenniscentre',
  },
  {
    id: 'ryde-balmain-meadowbank',
    name: 'Ryde Balmain Tennis (Meadowbank)',
    suburb: 'Meadowbank',
    lat: -33.8166,
    lng: 151.0742,
    system: 'clubspark',
    clubsparkSlug: 'rydebalmaintennis',
  },
  {
    id: 'sydney-uni',
    name: 'Sydney Uni Tennis',
    suburb: 'Camperdown',
    lat: -33.8886,
    lng: 151.1817,
    system: 'clubspark',
    clubsparkSlug: 'sydneyunitennis',
  },
];
