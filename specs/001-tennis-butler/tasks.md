# Tasks: Tennis Butler

**Input**: Design documents from `/specs/001-tennis-butler/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/availability-api.md, quickstart.md

**Tests**: Included — the fail-closed guarantee (FR-005/SC-003) and interval math are explicitly test-protected per plan.md.

**Organization**: Grouped by user story; each story phase is independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 (find court tonight), US2 (plan weekend session), US3 (graceful degradation), US4 (onboard a club)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: A building, deployable-in-principle `apps/tennis` workspace

- [X] T001 Scaffold `apps/tennis` workspace: `package.json` (`@sanzhar/tennis`, mirrors apps/web deps + `@astrojs/vercel`, no mdx/db), `astro.config.mjs` (react + tailwind vite plugin + vercel adapter), `tsconfig.json` (extends `astro/tsconfigs/strict`, jsx react-jsx), `public/favicon.svg`, `src/styles/globals.css` (tokens copied from `apps/web/src/styles/globals.css`), `src/layouts/BaseLayout.astro`, placeholder `src/pages/index.astro`; `pnpm install` then `pnpm turbo build --filter=@sanzhar/tennis` green
- [X] T002 [P] Add vitest: devDependency in `apps/tennis/package.json`, `"test": "vitest run"` script, empty `apps/tennis/src/tests/` directory; `pnpm --filter @sanzhar/tennis test` runs (no tests found is OK)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, pure utilities, and a minimal verified registry every story builds on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 [P] Implement `apps/tennis/src/lib/geo.ts`: `HOME_COORDS = { lat: -33.8517, lng: 151.1547 }`, `haversineKm()`; unit test `apps/tennis/src/tests/geo.test.ts` (Drummoyne→Sydney CBD ≈ 6–7 km)
- [X] T004 [P] Implement `apps/tennis/src/lib/time.ts`: `todaySydney()` via `Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' })`, `nowMinutesSydney()`, `hhmmToMinutes()`/`minutesToHhmm()` with validation helpers (30-min boundary, 06:00–23:00 bounds)
- [X] T005 [P] Define shared DTOs in `apps/tennis/src/lib/types.ts` exactly per data-model.md: `AvailabilityResponse`, `VenueSummary`, `VenueResult`, `AvailabilityWindowDto`
- [X] T006 [P] Define adapter contracts in `apps/tennis/src/lib/adapters/types.ts` per data-model.md: `AvailabilityQuery`, `AvailabilityWindow`, `FetchStatus`, `VenueAvailability`, `VenueAdapter`
- [X] T007 [P] Create venue registry types + starter registry in `apps/tennis/src/data/venues.ts`: `Venue` discriminated union per data-model.md, seeded with 3 known-good ClubSpark venues (`fivedockparktenniscentre`, `rydebalmaintennis`, `sydneyunitennis`) with hand-entered coords — full seeding is US4
- [X] T008 Write `apps/tennis/scripts/probe-venues.mjs`: for each registry slug (or slugs passed as args) GET `GetVenueSessions?startDate={date}&endDate={date}`, report HTTP status + court count, and dump distinct session `(Category, Name)` pairs with counts; identifying User-Agent per research.md R4

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Find a court for tonight (Priority: P1) 🎯 MVP

**Goal**: Default search (today, 17:00–21:00, 60 min) returns distance-sorted clubs with true free windows and working booking deep links.

**Independent Test**: Search a date/time with known availability; compare a club's shown windows side-by-side with its real BookByDate page; booking link lands on that club for that date; booked slots never shown free.

### Tests for User Story 1 (write first, must fail before implementation)

- [X] T009 [P] [US1] Run `probe-venues.mjs` against seed venues for a busy near-term date and a quiet future date; record 3 representative raw responses (busy/free/closed) into `apps/tennis/src/tests/fixtures/clubspark-{busy,free,closed}.json`; document observed `(Category, Name)` classification in a comment atop `clubspark.types.ts`
- [X] T010 [P] [US1] Interval-math tests in `apps/tennis/src/tests/windows.test.ts`: subtraction, adjacent-booking merge, clipping to query bounds, window fully booked, sub-minDuration fragments dropped, empty inputs
- [X] T011 [P] [US1] Parser tests in `apps/tennis/src/tests/clubspark.test.ts` against the T009 fixtures: expected windows extracted; malformed/unknown-category sessions yield NO free time (fail closed); closed-day fixture yields zero windows with status ok

### Implementation for User Story 1

- [X] T012 [P] [US1] Implement `apps/tennis/src/lib/windows.ts`: pure interval math (subtract blocked from bookable, merge contiguous, clip to query, filter by minDuration) — T010 green
- [X] T013 [US1] Implement `apps/tennis/src/lib/adapters/clubspark.types.ts` (raw shape, all optional) + `apps/tennis/src/lib/adapters/clubspark.ts` (fetch with AbortSignal + User-Agent, runtime guards, fail-closed classification per T009 findings, price/lighting derivation, deep-link builder) + `apps/tennis/src/lib/adapters/index.ts` registry — T011 green
- [X] T014 [US1] Implement `apps/tennis/src/lib/search.ts`: `Promise.allSettled` fan-out over ClubSpark venues with `AbortSignal.timeout(4000)`, map settled results to `VenueResult[]`, append external venues as link-only, sort by precomputed distance
- [X] T015 [US1] Implement `apps/tennis/src/pages/api/availability.ts` per contracts/availability-api.md: `prerender = false`, param validation (400 + message), orchestrator call, `Cache-Control: public, s-maxage=60, stale-while-revalidate=120`, `maxDuration: 15`
- [X] T016 [US1] Implement `apps/tennis/src/components/SearchControls.tsx`: native date input (min today, max +14), start/end selects (30-min steps 06:00–23:00, defaults 17:00/21:00), duration select (30/60/90/120, default 60), `@sanzhar/ui` Button; and `apps/tennis/src/components/TennisButler.tsx`: state, fetch with AbortController cancelling superseded searches, results layout
- [X] T017 [US1] Implement `apps/tennis/src/components/VenueCard.tsx`: name/suburb/distance badge, windows grouped by identical (start,end,price) with court count pills (first ~4 + "show all"), price "from $X/hr" + lighting note, "Book at {name}" link (new tab); wire into `index.astro` via `<TennisButler client:load />`
- [X] T018 [US1] Live verification: for 2–3 venues compare rendered windows vs their real BookByDate pages for tonight; verify `#?date=` deep-link lands on the right date (fallback: drop hash); fix classification if any mismatch — SC-003 gate

**Checkpoint**: MVP — default search works end-to-end on localhost against live ClubSpark

---

## Phase 4: User Story 2 - Plan a weekend session (Priority: P2)

**Goal**: Date/time/duration controls filter correctly for future dates; times are unambiguously Sydney-local.

**Independent Test**: Future date + 07:00–12:00 + 90 min shows only ≥90-min contiguous stretches; 60-min-max clubs show "no courts free"; past times today are excluded.

### Implementation for User Story 2

- [X] T019 [P] [US2] Enforce query-window rules in `apps/tennis/src/lib/search.ts` + `time.ts`: when date is today, clip window start to current Sydney time (rounded up to next 30 min); date bounds validated server-side (T015) and unpickable client-side (T016)
- [X] T020 [P] [US2] Zero-match presentation in `VenueCard.tsx`/`TennisButler.tsx`: status-ok clubs with no matching windows render de-emphasized "No courts free in this range" cards, listed after clubs with windows (distance-sorted within each group)
- [X] T021 [P] [US2] "All times Sydney time" label once in results header in `apps/tennis/src/components/ResultsStatus.tsx` (or results header in `TennisButler.tsx`); verify rendering with a non-Sydney browser timezone (e.g. `TZ=UTC pnpm --filter @sanzhar/tennis dev`)

**Checkpoint**: Duration/date filtering trustworthy for planning ahead

---

## Phase 5: User Story 3 - A club's system is down or unsupported (Priority: P2)

**Goal**: Partial failure degrades per-club; unsupported clubs appear as link-only cards; the page never fails wholesale.

**Independent Test**: Temporarily add a bogus-slug venue and search: muted card + "N of M clubs didn't respond" notice, all other results normal; link-only venues always render with distance + outbound link.

### Implementation for User Story 3

- [X] T022 [P] [US3] Failure presentation: muted card variant in `VenueCard.tsx` for `status: 'timeout' | 'error'` ("Couldn't reach their booking system — check on their site" + fallback link); partial-failure banner ("N of M clubs didn't respond") + loading skeletons + all-failed state in `ResultsStatus.tsx`
- [X] T023 [P] [US3] Implement `apps/tennis/src/components/LinkOnlyCard.tsx` (distance, systemName label, "Check availability on their site →") and add the two external venues to `apps/tennis/src/data/venues.ts`: Birchgrove Tennis (SimplyBook.me, `https://birchgrovetennisonline.simplybook.me/v2/#book`) and Salisbury Tennis (Skedda), hand-entered coords
- [X] T024 [US3] Degradation e2e check on localhost: bogus-slug venue → muted card + banner, others unaffected; remove bogus venue after; confirm response is 200 with full registry present in all cases

**Checkpoint**: Tool remains trustworthy under upstream failure

---

## Phase 6: User Story 4 - Onboard a new club (Priority: P3)

**Goal**: The full ~30km seed list is live, and onboarding is proven to be a single config entry.

**Independent Test**: Add one new real club entry, rebuild, search — it appears with correct distance and availability (SC-004: one file, <10 min).

### Implementation for User Story 4

- [X] T025 [US4] Compile candidate ClubSpark venues within ~30km of Drummoyne from directories (tennisvenues.com.au, KeepActive, Tennis NSW club finder) per research.md R3; verify every slug via `probe-venues.mjs`; hand-enter coords; seed `apps/tennis/src/data/venues.ts` to ≥15 verified ClubSpark venues (SC-002); sanity-check all distances ≤ ~30km
- [X] T026 [US4] Onboarding drill: add one additional real club end-to-end following `specs/001-tennis-butler/quickstart.md` exactly, timing the process; fix quickstart.md where reality diverges (SC-004)

**Checkpoint**: Launch coverage achieved; onboarding path documented and proven

> T025 note: 14 ClubSpark venues verified + 3 link-only externals (17 clubs total). Six more candidate slugs are documented as backlog in `venues.ts` — verification was blocked by a long ClubSpark rate-limit cooldown on the build machine's IP; re-run the probe to promote them.

---

## Phase 7: Polish, Deploy & Verification

**Purpose**: Cross-cutting quality gates and the staging-first release flow

- [X] T027 [P] Mobile + dark-mode pass across all components: one-handed phone usability (SC-006), tokens-only styling audit (no raw colors — Principle IV), semantic HTML check
- [X] T028 [P] Full local gate: `pnpm --filter @sanzhar/tennis test`, `pnpm --filter @sanzhar/tennis lint` (astro check, strict TS — Principle V), `pnpm turbo build --filter=@sanzhar/tennis`, timed live search < 5s (SC-001)
- [X] T029 Create `.github/workflows/deploy-tennis-staging.yml` and `.github/workflows/deploy-tennis-prod.yml` mirroring the web workflows (`--filter=@sanzhar/tennis`, `working-directory: apps/tennis`, `secrets.VERCEL_TENNIS_PROJECT_ID`, paths filter per plan.md) — cross-cutting, flagged in PR (Principle VII)
- [ ] T030 Hand the user the one-time manual checklist (plan.md → Deploy & Manual Steps): create Vercel project, add `VERCEL_TENNIS_PROJECT_ID` secret, confirm/attach domains (`tennis.sanzhar.dev` / `tennis.sanzh.ar`) — agent must NOT do these itself (Principle VI)
- [ ] T031 Log build costs for all sessions of this feature via `node scripts/log-cost.mjs` (Principle II) — entries for specify/plan/tasks/implement phases, branch `001-tennis-butler`
- [ ] T032 Open PR `001-tennis-butler` → `staging`; after deploy, verify on staging against spec acceptance scenarios (US1–US4 independent tests, SC-001..SC-006) and record results in the PR description (Principle III). Promotion to `main` only after user confirms staging verification

---

## Dependencies & Execution Order

- **Phase 1 → Phase 2 → user stories**: T001 blocks everything; T002 blocks test tasks. All of Phase 2 blocks Phase 3+.
- **US1 (Phase 3)** is the critical path: T009–T011 (parallel) → T012–T013 → T014 → T015 → T016 → T017 → T018.
- **US2 (Phase 4)** and **US3 (Phase 5)** depend on US1's components but not on each other — parallelizable after Phase 3.
- **US4 (Phase 6)** depends only on Phase 2 + `probe-venues.mjs`; T025 can run in parallel with Phases 4–5 (different files: venues.ts only).
- **Phase 7** last; T029/T030 can start any time after Phase 1 (T030 is user-blocking — surface early).

## Implementation Strategy

MVP = Phases 1–3 (US1) verified on localhost. Then Phases 4–6 in any order (5 before 6 recommended so the full seed list lands on robust failure handling). Phase 7 gates the staging PR. Commit after each task or logical group; keep cost logs current.
