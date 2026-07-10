# Data Model: Tennis Butler

No database — these are TypeScript types. Registry lives in `apps/tennis/src/data/venues.ts`; shared DTOs in `apps/tennis/src/lib/types.ts`; adapter contracts in `apps/tennis/src/lib/adapters/types.ts`.

## Venue (registry — the onboarding surface)

```ts
export type BookingSystem = 'clubspark' | 'external';

interface VenueBase {
  id: string;            // stable kebab id, e.g. 'five-dock-park'
  name: string;
  suburb: string;
  lat: number;           // hand-entered from Google Maps
  lng: number;
  notes?: string;        // e.g. 'synthetic grass, lights to 22:00'
}

export interface ClubSparkVenue extends VenueBase {
  system: 'clubspark';
  clubsparkSlug: string; // path segment on play.tennis.com.au
}

export interface ExternalVenue extends VenueBase {
  system: 'external';
  bookingUrl: string;    // full URL to their booking page
  systemName?: string;   // 'SimplyBook.me' | 'Skedda' — display only
}

export type Venue = ClubSparkVenue | ExternalVenue;
export const VENUES: readonly Venue[];
```

**Validation**: enforced by the type checker at build time (FR-009). Distance sanity (all ≤ ~30km from home) checked once during seeding.

**Extension rule**: a new supported system = new `BookingSystem` member + venue interface + adapter file + one registry line in `adapters/index.ts`. UI unchanged (results are already discriminated).

## Adapter contract (server-side only)

```ts
export interface AvailabilityQuery {
  date: string;               // 'YYYY-MM-DD', Sydney calendar date
  startMinutes: number;       // minutes from midnight, venue-local
  endMinutes: number;
  minDurationMinutes: number; // 30 | 60 | 90 | 120
}

export interface AvailabilityWindow {
  courtId: string;
  courtName: string;          // 'Court 3'
  startMinutes: number;       // venue-local
  endMinutes: number;
  guestPricePerHour?: number; // AUD; omitted when ambiguous — never guessed
  memberPricePerHour?: number;
  includesLighting?: boolean; // LightingCost > 0 on underlying session(s)
}

export type FetchStatus = 'ok' | 'timeout' | 'error';

export interface VenueAvailability {
  venueId: string;
  status: FetchStatus;
  windows: AvailabilityWindow[]; // [] unless status === 'ok'
  bookingUrl: string;            // deep link; present even on failure (fallback CTA)
  errorMessage?: string;         // short, client-safe; never a raw upstream body
}

export interface VenueAdapter<V extends Venue = Venue> {
  readonly system: V['system'];
  fetchAvailability(venue: V, query: AvailabilityQuery, signal: AbortSignal): Promise<VenueAvailability>;
}
```

**Invariants**:
- Fail closed: a session with unknown/missing category or name contributes NO free time (FR-005).
- All minutes are venue-local (Australia/Sydney); no UTC anywhere in the model.
- External venues never pass through an adapter — the orchestrator emits link-only results directly.

## API DTOs (shared island ↔ route, `lib/types.ts`)

```ts
export interface AvailabilityResponse {
  query: { date: string; start: string; end: string; minDurationMinutes: number };
  generatedAt: string;    // ISO timestamp
  results: VenueResult[]; // sorted by distanceKm ascending; every registry venue present
}

export interface VenueSummary {
  id: string; name: string; suburb: string; distanceKm: number; // 1 decimal
}

export type VenueResult =
  | { kind: 'availability'; venue: VenueSummary; status: FetchStatus;
      windows: AvailabilityWindowDto[]; bookingUrl: string; errorMessage?: string }
  | { kind: 'link-only'; venue: VenueSummary; bookingUrl: string; systemName?: string };

export interface AvailabilityWindowDto {
  court: string; start: string; end: string; // 'HH:MM' Sydney-local
  guestPricePerHour?: number; includesLighting?: boolean;
}
```

**Derivations**:
- `distanceKm`: haversine from `HOME_COORDS = { lat: -33.8517, lng: 151.1547 }` (Drummoyne), precomputed at module load (registry is static per deploy).
- Window grouping for display (same start/end/price across courts → one pill with court count) happens client-side; the DTO stays per-court.

## Raw ClubSpark shape (`clubspark.types.ts`)

Partial, every field optional, runtime-guarded (`isRecord`/`isNumber` helpers — no schema library). Known fields from live probes: venue `TimeZone`, `MinimumInterval`; `Resources[] { ID, Name }`; sessions `{ ID, Name, Category, StartTime, EndTime, Interval, Capacity, Cost, MemberPrice, GuestPrice, CourtCost, LightingCost }` with times as minutes-from-midnight. Classification enum to be confirmed via `probe-venues.mjs` (see research.md R2).
