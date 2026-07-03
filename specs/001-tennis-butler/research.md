# Research: Tennis Butler

**Date**: 2026-07-03 · All findings verified live during planning unless noted.

## R1 — Which booking systems dominate within 30km of Drummoyne?

**Decision**: Build one adapter for ClubSpark (play.tennis.com.au); everything else is link-only in v1.

**Rationale**: ClubSpark is Tennis Australia's official platform ("Book a Court" / Find-Book-Play) and covers the large majority of bookable clubs in the radius — confirmed examples: Five Dock Park Tennis Centre (`fivedockparktenniscentre`), Ryde Balmain Tennis (`rydebalmaintennis`, multi-venue across Drummoyne/Balmain/Meadowbank), Sydney Uni Tennis (`sydneyunitennis`), Tennis World Sydney (`tennisworldsydney`). The remainder is fragmented one-club-per-system: Birchgrove Tennis → SimplyBook.me (`birchgrovetennisonline.simplybook.me`), Salisbury Tennis → Skedda. One adapter yields ~90% coverage; each additional adapter yields ~1 club.

**Alternatives considered**: Multi-adapter v1 (rejected: reverse-engineering effort per system for 1–2 clubs each); scraping aggregator directories like tennisvenues.com.au (rejected: stale data, no live availability).

## R2 — How to read ClubSpark availability?

**Decision**: Per-venue unauthenticated JSON endpoint, called live per search:
`GET https://play.tennis.com.au/v0/VenueBooking/{slug}/GetVenueSessions?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

**Rationale**: Verified live (2026-07-03) against `fivedockparktenniscentre` and `rydebalmaintennis`: returns `TimeZone: "Australia/Sydney"`, `Resources[]` (courts with `Name`, `ID`), sessions with `StartTime`/`EndTime` as minutes-from-midnight, `Interval` (e.g. 60), `Capacity`, `MemberPrice`/`GuestPrice`, `CourtCost`/`LightingCost`, and `MinimumInterval`. This is the same endpoint the venues' own booking SPA uses; no auth, no API key.

**Open item (fail-closed until resolved)**: the exact encoding of booked-vs-free. Observed session `Name` values so far: `"Default"` (bookable grid), `"Closed"`. Booked intervals appear as distinct entries; the probe script (`apps/tennis/scripts/probe-venues.mjs`) must dump distinct `(Category, Name)` pairs across all seed venues on busy dates to derive the classification empirically. The adapter treats anything unrecognized as NOT free (spec FR-005, SC-003).

**Deep link**: `https://play.tennis.com.au/{slug}/Booking/BookByDate#?date=YYYY-MM-DD` — hash param to be verified on 2–3 venues during implementation; fallback is the same URL without the hash.

**Alternatives considered**: OpenActive feeds (ClubSpark publishes them in the UK/LTA context; no public AU dataset endpoint found — revisit if AU feeds appear); headless-browser scraping of BookByDate (rejected: heavy, fragile, unnecessary given the JSON endpoint).

## R3 — Venue discovery for the seed list

**Decision**: Compile candidates from directories (tennisvenues.com.au, KeepActive, Tennis NSW club finder) and suburb knowledge, then verify each slug with `probe-venues.mjs` (keep only HTTP 200 + non-empty `Resources`). Hand-enter lat/lng from Google Maps.

**Rationale**: Tennis Australia's own venue search (`tennis.com.au/book/court-hire`) is bot-protected (403 on fetch), so programmatic discovery is unreliable — but per-venue endpoints are open, so verification is trivial. Expected yield: 15–25 venues (Inner West, Canada Bay, Lower North Shore, Ryde, Strathfield corridor).

**Alternatives considered**: Geocoding API (rejected: 15–25 one-time manual lookups don't justify a service dependency); scraping the bot-protected search (rejected: brittle, discourteous).

## R4 — Courtesy / terms-of-use posture

**Decision**: Requests only on user search; parallel fan-out of ~20 GETs; `Cache-Control: public, s-maxage=60, stale-while-revalidate=120` on our route; identifying `User-Agent: sanzh.ar-tennis-butler/1.0 (personal tool; contact: sanzhar.kushekbayev@gmail.com)`; no background polling.

**Rationale**: Read-only use of an endpoint the venues' own public booking pages call, at single-user volume, with contactable identification — minimal-footprint, good-faith use. Bookings always happen on the club's site, which arguably drives them traffic.

**Update (2026-07-03, during implementation)**: ClubSpark rate-limits bursts from one IP — observed HTTP 429 after ~10 back-to-back requests, with a cooldown well over 5 minutes. Consequences implemented: the search fan-out is capped at 5 concurrent requests (`FANOUT_CONCURRENCY` in `lib/search.ts`), the probe script paces requests 4s apart, and 429s degrade to per-venue error cards. If production searches trip the limit routinely, the fallback is per-venue response caching keyed on (slug, date) with a longer TTL.

## R5 — Timezone & time representation

**Decision**: All availability math in venue-local minutes-from-midnight (ClubSpark's native unit). "Today"/date-window validation computed via `Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' })`. UI labels "Sydney time" once per result set.

**Rationale**: Avoids all serialization/DST conversion in the hot path; the server may run in any region (Vercel), so server-local time must never be trusted. DST-day oddities degrade cosmetically, never into false "free" claims.

## R6 — Astro/Vercel mechanics

**Decision**: `@astrojs/vercel` adapter with default static output; only `src/pages/api/availability.ts` sets `export const prerender = false`, making it the sole serverless function. Route config `maxDuration: 15` as safety margin over the 4s per-venue abort.

**Rationale**: Astro 5 supports per-route opt-out of prerendering; index stays a static shell (fast, cacheable) and the function cold-start cost applies only to searches.

## R7 — Testing approach

**Decision**: vitest for pure logic (`windows.ts` interval math, `clubspark.ts` parsing against recorded fixtures, `geo.ts` haversine sanity), plus a mandatory live side-by-side check (adapter output vs the club's real BookByDate page for tonight) before staging sign-off.

**Rationale**: The fail-closed guarantee (SC-003) is a parsing property — fixture tests lock it; the live check catches classification-enum drift that fixtures can't.
