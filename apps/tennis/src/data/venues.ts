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
  {
    id: 'hunters-hill',
    name: 'Hunters Hill Tennis Club',
    suburb: 'Hunters Hill',
    lat: -33.833,
    lng: 151.144,
    system: 'clubspark',
    clubsparkSlug: 'huntershilltennisclub',
    notes: 'real grass courts',
  },
  {
    id: 'lane-cove',
    name: 'Lane Cove Tennis Club',
    suburb: 'Lane Cove',
    lat: -33.8123,
    lng: 151.1666,
    system: 'clubspark',
    clubsparkSlug: 'lanecovetennisclub',
  },
  {
    id: 'victoria-park',
    name: 'Victoria Park Tennis Club',
    suburb: 'Camperdown',
    lat: -33.8894,
    lng: 151.1936,
    system: 'clubspark',
    clubsparkSlug: 'victoriaparktennisclub',
  },
  {
    id: 'wests-ashfield',
    name: 'Western Suburbs Lawn Tennis (Pratten Park)',
    suburb: 'Ashfield',
    lat: -33.8927,
    lng: 151.1204,
    system: 'clubspark',
    clubsparkSlug: 'westernsuburbslawntennisassociation',
  },
  {
    id: 'marrickville-lawn',
    name: 'Marrickville District Lawn Tennis Club',
    suburb: 'Marrickville',
    lat: -33.9052,
    lng: 151.1509,
    system: 'clubspark',
    clubsparkSlug: 'marrickvilledistrictlawntennisclub',
  },
  {
    id: 'marrickville-hardcourt',
    name: 'Marrickville & District Hardcourt Tennis Club',
    suburb: 'Marrickville',
    lat: -33.9139,
    lng: 151.1489,
    system: 'clubspark',
    clubsparkSlug: 'marrickvilleanddistricthardcourttennisclub',
  },
  {
    id: 'strathfield-sports',
    name: 'Strathfield Sports Club Tennis',
    suburb: 'Strathfield',
    lat: -33.8877,
    lng: 151.0745,
    system: 'clubspark',
    clubsparkSlug: 'strathfieldsportsclub',
  },
  {
    id: 'tennis-world-north-ryde',
    name: 'Tennis World North Ryde',
    suburb: 'North Ryde',
    lat: -33.7943,
    lng: 151.1305,
    system: 'clubspark',
    clubsparkSlug: 'tennisworldnorthryde',
  },
  {
    id: 'roseville-lawn',
    name: 'Roseville Lawn Tennis Club',
    suburb: 'Roseville',
    lat: -33.7847,
    lng: 151.1809,
    system: 'clubspark',
    clubsparkSlug: 'rosevillelawntennisclub',
  },
  {
    id: 'epping',
    name: 'Epping Tennis Club',
    suburb: 'Epping',
    lat: -33.7772,
    lng: 151.0866,
    system: 'clubspark',
    clubsparkSlug: 'eppingtennisclub',
  },
  {
    id: 'west-epping-park',
    name: 'West Epping Park Tennis Courts',
    suburb: 'West Epping',
    lat: -33.7726,
    lng: 151.0664,
    system: 'clubspark',
    clubsparkSlug: 'westeppingparktenniscourts',
  },
  {
    id: 'birchgrove',
    name: 'Birchgrove Tennis',
    suburb: 'Birchgrove',
    lat: -33.8503,
    lng: 151.1815,
    system: 'external',
    systemName: 'SimplyBook.me',
    bookingUrl: 'https://birchgrovetennisonline.simplybook.me/v2/#book',
  },
  {
    id: 'salisbury',
    name: 'Salisbury Tennis Court',
    suburb: 'Stanmore',
    lat: -33.8926,
    lng: 151.1637,
    system: 'external',
    systemName: 'Skedda',
    bookingUrl: 'https://salisburytennis.skedda.com/booking',
  },
];
