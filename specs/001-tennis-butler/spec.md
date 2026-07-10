# Feature Specification: Tennis Butler

**Feature Branch**: `001-tennis-butler`

**Created**: 2026-07-03

**Status**: Draft

**Input**: User description: "Tennis Butler — a tool to check which tennis clubs within ~30km of Drummoyne, Sydney have open court bookings for a chosen date and time range. User picks a date, time window, and minimum duration; the app queries each onboarded club's booking system live in parallel and shows a distance-sorted list of clubs with free windows and deep links to book. Onboarding a new club is a single config entry. Partial failures are graceful. No database, no cron, no auth in v1."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find a court for tonight (Priority: P1)

Sanzhar wants to play tennis this evening. He opens Tennis Butler, keeps the default date (today) and time window (5pm–9pm), taps Search, and within a few seconds sees nearby clubs ordered by distance from Drummoyne, each showing which time windows still have free courts, how many courts, price per hour where known, and a button that takes him straight to that club's booking page for that date.

**Why this priority**: This is the core value proposition — replacing 15+ manual booking-site checks with one search. Without it there is no product.

**Independent Test**: Search for a date/time with known availability at a nearby club and confirm the club appears, sorted by distance, with free windows that match what the club's own booking page shows, and that the booking link lands on that club's page for the chosen date.

**Acceptance Scenarios**:

1. **Given** the app is open, **When** the user searches with defaults (today, 17:00–21:00, 1 hour minimum), **Then** a distance-sorted list of all onboarded clubs is shown, each with its free windows in that range or an explicit "no courts free" state.
2. **Given** search results are shown, **When** the user activates a club's booking link, **Then** the club's own booking page opens in a new tab, pre-set to the searched date where the booking system supports it.
3. **Given** a club's booking system shows a court as booked for 18:00–19:00, **When** the user searches 17:00–21:00, **Then** that court's 18:00–19:00 slot is never presented as free (unknown or ambiguous data is treated as not free).
4. **Given** a search for a window where a club has three courts free 18:00–19:30 at the same price, **Then** those are grouped as one window entry showing the court count rather than three duplicate rows.

---

### User Story 2 - Plan a weekend session (Priority: P2)

Sanzhar wants a 90-minute hit on Saturday morning. He changes the date to Saturday, sets the window to 7:00–12:00 and minimum duration to 1.5 hours, and sees only clubs with a free stretch of at least 90 contiguous minutes on one court within that window.

**Why this priority**: Date/time/duration control is what makes the tool useful beyond "tonight"; it exercises the same search but proves the filtering logic.

**Independent Test**: Set a future date, a morning window, and a 90-minute minimum; verify clubs whose longest free stretch is 60 minutes are shown as having no matching windows while clubs with ≥90-minute stretches show them.

**Acceptance Scenarios**:

1. **Given** a club with a court free 8:00–9:00 only, **When** the user searches 7:00–12:00 with 90-minute minimum, **Then** that club shows no matching windows (de-emphasized, still listed).
2. **Given** the date picker, **When** the user tries to pick a date in the past or more than 14 days ahead, **Then** the selection is prevented.
3. **Given** a search, **When** results render, **Then** all times are clearly labeled as Sydney time regardless of the viewer's device timezone.

---

### User Story 3 - A club's system is down or unsupported (Priority: P2)

One club's booking system is slow or offline, and two nearby clubs use booking systems the tool can't read. Sanzhar still gets a complete picture: the unreachable club appears as a muted card with a "check on their site" link, the unsupported clubs appear as link-only cards with their distance, and the rest of the results are unaffected.

**Why this priority**: Live fan-out over third-party systems will fail routinely; without graceful degradation the whole tool becomes untrustworthy. Link-only clubs keep the area picture complete.

**Independent Test**: Include a club entry pointing at an unreachable booking system and one link-only club; search and confirm the page renders full results with a muted card, a link-only card, and a "N of M clubs didn't respond" notice.

**Acceptance Scenarios**:

1. **Given** one club's system does not respond within the per-club time limit, **When** the user searches, **Then** results for all other clubs render normally, the slow club shows a muted card with a direct link to its site, and a notice states how many clubs didn't respond.
2. **Given** a club onboarded as link-only, **When** any search runs, **Then** it appears in distance order with its suburb, distance, booking-system name, and a "check availability on their site" link — never with availability claims.
3. **Given** every club's system is unreachable, **When** the user searches, **Then** the page still renders every club as a card with a fallback link (never an error page).

---

### User Story 4 - Onboard a new club (Priority: P3)

Sanzhar discovers a new club worth tracking. He adds one entry to the venue config file (name, suburb, booking system, identifier or URL, coordinates) and commits; the next deploy includes the club in every search with no other changes.

**Why this priority**: Easy onboarding is a stated product goal, but it only matters once search works.

**Independent Test**: Add one config entry for a real club, rebuild, search, and confirm the club appears with correct distance and availability (or as link-only).

**Acceptance Scenarios**:

1. **Given** a new club entry with a valid booking-system identifier, **When** the app is rebuilt and a search runs, **Then** the club appears in results with live availability and correct distance.
2. **Given** a club on an unsupported booking system, **When** it is added with `system: external` and a booking URL, **Then** it appears as a link-only card.

---

### Edge Cases

- Club open 8:00–20:00 searched until 21:00: free windows are clipped to the club's actual bookable hours; hours outside the grid are not "free".
- A closed day (holiday) returns a session grid marked closed: club shows "no courts free", not an error.
- Search window entirely in the past for today's date (e.g. 9:00–11:00 searched at 14:00): past times are excluded; if nothing remains, the club list shows no-availability states rather than stale "free" slots.
- Booking data with unknown/unrecognized session categories: treated as not free (fail closed).
- Two searches in quick succession: the earlier in-flight search is cancelled; results always correspond to the latest inputs.
- A club with no lights searched for an evening window: simply yields no free windows in that range; no special handling.
- DST transition days: interval math is timezone-agnostic (venue-local minutes), worst case a cosmetic oddity.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST let the user select a date (today to today+14, Sydney calendar), a start and end time in 30-minute steps (defaults 17:00 and 21:00), and a minimum free duration of 30/60/90/120 minutes (default 60).
- **FR-002**: System MUST, per search, retrieve availability for every onboarded supported club concurrently and present results within the success-criteria time budget.
- **FR-003**: System MUST list every onboarded club in every result set, ordered by straight-line distance from Drummoyne (fixed home point), showing name, suburb, and distance to one decimal.
- **FR-004**: For supported clubs, system MUST show contiguous free windows within the searched range that meet the minimum duration, grouped by identical start/end across courts with a court count, and price per hour and lighting inclusion where derivable.
- **FR-005**: System MUST never present a slot as free unless the club's data affirmatively marks it bookable; unknown, malformed, or ambiguous data is treated as unavailable.
- **FR-006**: Every club card MUST link to that club's own booking page (deep-linked to the searched date where supported); the tool itself never takes bookings.
- **FR-007**: Clubs on unsupported systems MUST be presentable as link-only cards (distance, system name, outbound link) via the same onboarding mechanism.
- **FR-008**: A club whose data source fails or exceeds its per-club time limit MUST degrade to a muted card with a fallback link; the search response is always delivered, with a notice of how many clubs didn't respond.
- **FR-009**: Onboarding a club MUST require exactly one addition to a single config file (no schema, dashboard, or code changes), validated at build time by type checking.
- **FR-010**: All displayed times MUST be Sydney-local and labeled as such once per result set.
- **FR-011**: System MUST validate search inputs (date range, time order and bounds 06:00–23:00, duration values) and reject invalid requests with a clear message.
- **FR-012**: Upstream requests MUST be courteous: only triggered by a user search, per-club concurrency of one request, an identifying user agent with contact details, and short-lived response caching to collapse repeated identical searches.

### Key Entities

- **Venue**: An onboarded club — identity (id, name, suburb), location (lat/lng), and booking-system binding: either a supported system with a venue identifier, or an external booking URL with an optional system name.
- **Availability Window**: A contiguous free interval on one court — court name, start/end (venue-local), optional guest/member price per hour and lighting-included flag.
- **Search Query**: Date, start/end times, minimum duration.
- **Venue Result**: Per-venue outcome in a search — either availability (status ok/timeout/error, windows, booking link) or link-only (booking link, system name), plus distance.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A search over all onboarded clubs completes and renders results in under 5 seconds on a typical mobile connection.
- **SC-002**: At launch, at least 15 clubs within ~30km of Drummoyne with verifiable live availability are onboarded, plus known nearby clubs on other systems as link-only entries.
- **SC-003**: Zero false positives: in side-by-side checks against clubs' own booking pages, no slot shown as free is actually booked or closed (fail-closed parsing).
- **SC-004**: Adding a new supported club requires editing exactly one file and takes under 10 minutes including looking up its coordinates.
- **SC-005**: With any single club's system down, 100% of searches still return results for all other clubs.
- **SC-006**: The full flow (open page → search → results) is usable one-handed on a phone and in dark mode.

## Assumptions

- Single known user (the site owner); no authentication, accounts, or rate protection needed in v1.
- ClubSpark (play.tennis.com.au) venues expose a public per-venue sessions endpoint that their own booking page uses; reading it at single-user volume with an identifying user agent is acceptable use. Verified during research (2026-07-03).
- Straight-line (haversine) distance from a fixed Drummoyne home point is an acceptable sort key; driving time is out of scope.
- Venue coordinates are hand-entered at onboarding time; no geocoding service.
- Availability is fetched live per search; no history, alerts, or background refresh in v1 (explicitly deferred).
- Booking itself always happens on the club's own site; Tennis Butler is read-only.
- The exact free/booked/closed classification of ClubSpark session data will be confirmed against live payloads during implementation; parsing fails closed until confirmed.
- No map view in v1; distance badges and an outbound maps link suffice.
