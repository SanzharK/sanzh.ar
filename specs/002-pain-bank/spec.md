# Feature Specification: Pain Bank

**Feature Branch**: `002-pain-bank`

**Created**: 2026-07-10

**Status**: Draft

**Input**: User description: "A mobile-first monthly fitness challenge app for a friends group, inspired by The Push-Up Challenge. Friends sign up with just a name (no passwords — identity lives in the browser). A monthly program is defined in code: each workout day offers two modes — a push-ups-only target (e.g. 120) or an equivalent mixed set (e.g. 36 push-ups + 60 squats + 24 pull-ups). Users 'bank' reps through the day via a tactile circular dial on mobile (trace a finger around the circle and the number climbs) or plus/minus buttons on desktop. Everyone sees everyone's progress on a shared leaderboard. Slogan: 'Pain is just weakness leaving your body.'"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Bank today's reps (Priority: P1)

Sanzhar drops and does 23 push-ups at lunch. He opens Pain Bank on his phone, today is already selected, he traces his finger around the dial until the counter reads +23, and taps "Bank it". His day progress bar jumps; two more sessions later the day flips to "Day complete".

**Why this priority**: Banking is the core loop — the app exists to make logging reps satisfying enough that people actually do it.

**Independent Test**: On a phone, trace the dial to a chosen number, bank it, and confirm the day total and progress vs target update; repeat a second session and confirm totals accumulate.

**Acceptance Scenarios**:

1. **Given** today is a workout day, **When** the user traces one full clockwise lap of the dial, **Then** the session counter reads exactly +10, incrementing one rep per 36° with no drift across laps.
2. **Given** a session count of +23, **When** the user taps "Bank it", **Then** one entry is recorded, the banked total for that exercise increases by 23, and the dial resets to 0.
3. **Given** a banked total of 40 and a session of +15 that fails to send (offline), **When** the request fails, **Then** the +15 stays pending with a retry action and is never silently lost or double-counted on retry.
4. **Given** the user traces counter-clockwise, **Then** the session counter decreases, but never below the point where banking it would take the day's total under 0.
5. **Given** a desktop viewport, **When** the day view renders, **Then** +10 / +1 / −1 / −10 buttons are the dominant control and behave identically to the dial (session then bank).

---

### User Story 2 - Sign up and be recognized (Priority: P1)

A friend receives the link, opens it on their phone, types their name, taps "Join", and lands directly on today's workout. Next visit on the same phone skips straight to the day view. On a new phone, they tap their name in the "been here before?" list and continue where they left off.

**Why this priority**: Zero-friction signup is the adoption gate for a friends group; anything heavier than a name kills it.

**Independent Test**: Sign up in a fresh browser profile, confirm auto-recognition on reload, then adopt the same identity from a second browser via the name list and confirm history follows.

**Acceptance Scenarios**:

1. **Given** a first visit, **When** the user submits a valid name (1–24 chars), **Then** they are registered, remembered on this device, and taken to today's view.
2. **Given** a name already taken (case-insensitive), **When** the user submits it, **Then** they see a friendly "name taken — is this you?" path pointing at the existing-name list instead of a raw error.
3. **Given** a returning device, **When** the app loads, **Then** no sign-up screen is shown.
4. **Given** a new device, **When** the user picks their name from the participant list, **Then** all their prior banked progress is visible.

---

### User Story 3 - Choose a mode for the day (Priority: P2)

The day's target is 120 push-ups, but Sanzhar's chest is wrecked. He flips the day to Mixed mode and sees three targets instead — 36 push-ups, 60 squats, 24 pull-ups — each with its own dial tab. He banks against each; the day completes when all three are met.

**Why this priority**: The two-mode structure is what makes the program sustainable for a whole month; it's the signature mechanic borrowed from The Push-Up Challenge.

**Independent Test**: Toggle a day to Mixed, bank each exercise to its target, and confirm the day completes; toggle back to push-ups-only and confirm the same banked push-ups count toward that target too.

**Acceptance Scenarios**:

1. **Given** a workout day, **When** the user toggles Push-ups only ↔ Mixed, **Then** targets and dial tabs switch instantly and the choice is remembered per-day on this device only.
2. **Given** banked entries of 120 push-ups, **Then** the day is complete regardless of the toggle position (a day is complete when EITHER mode's requirement is met).
3. **Given** Mixed mode with squats and pull-ups met but push-ups short, **Then** the day shows partial progress, not complete.
4. **Given** a rest day, **Then** no dial or targets are shown — just a rest state — and the day never counts against completion.

---

### User Story 4 - Check the leaderboard (Priority: P2)

After banking, Sanzhar flips to the Board tab: friends ranked by % of program complete, each with a GitHub-style row of day dots (complete / partial / rest / future). He spots that Dave has pulled ahead and does another set out of spite.

**Why this priority**: Shared visibility is the social engine — the reason this is an app and not a notes file.

**Independent Test**: Bank reps as two different participants from two browsers; confirm both appear on the board with correct totals, ranking, and day dots within one refresh.

**Acceptance Scenarios**:

1. **Given** multiple participants with entries, **When** the board loads, **Then** rows are ranked by % of workout days complete, ties broken by total reps, and the viewer's own row is visually highlighted.
2. **Given** a participant banks new reps, **When** they return to the board, **Then** their updated totals appear (fresh fetch after banking and on tab focus).
3. **Given** a participant with zero entries, **Then** they still appear on the board at 0% — signing up puts you on the board.

---

### Edge Cases

- Banking near midnight (Sydney): entries attach to the challenge day visible when the session started banking; day boundaries are Sydney-local regardless of device timezone.
- Replayed POST after flaky mobile network: the entry's client-generated id makes the write idempotent — retries never double-count.
- Negative adjustments: minus corrections post negative deltas; the client never lets a day's displayed total go below 0.
- A date outside the challenge range or a rest day arriving at the entries API: rejected with 400.
- Two devices banking as the same participant simultaneously: both entries append; totals converge on next fetch.
- The dial under a scrolling page: dragging the dial never scrolls the page (touch-action pinned).
- Days before the challenge starts / after it ends: shown as locked/future; banking disabled.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST let a new user register with only a display name (trimmed, 1–24 chars, unique case-insensitively) and MUST remember the identity on that device without any credential.
- **FR-002**: System MUST let a user on a new device adopt an existing identity by picking their name from the participant list (accepted trust model: friends group, impersonation possible).
- **FR-003**: The monthly program MUST be defined in one typed config file: an ordered list of dated days, each either a rest day or a workout day carrying a push-ups-only target AND an equivalent mixed set of exercise targets. Supported exercises are a closed set (push-ups, squats, pull-ups, sit-ups).
- **FR-004**: The program MUST support arbitrary date ranges (the first challenge runs a partial month: rest of July 2026), with days keyed to Australia/Sydney dates.
- **FR-005**: Banking MUST be a two-step gesture: accumulate a session count locally (dial or buttons), then explicitly commit ("Bank it") as one entry of signed reps for (participant, day, exercise).
- **FR-006**: The mobile dial MUST accumulate continuously as the finger traces the ring — one rep per 36° clockwise (a lap = +10), counter-clockwise subtracting — and MUST expose a keyboard/slider-accessible equivalent; plus/minus buttons MUST always be available as fallback and be the primary desktop control.
- **FR-007**: Entries MUST be append-only signed deltas; corrections are negative entries; the client MUST clamp so a day/exercise total never displays below 0; the server MUST bound any single entry to ±500 and reject 0.
- **FR-008**: Entry writes MUST be idempotent via a client-generated entry id, so network retries cannot double-count.
- **FR-009**: A workout day MUST count as complete when EITHER the push-ups-only target is met by banked push-ups OR every exercise in the mixed set meets its target. The mode toggle is a per-device display preference and MUST NOT be persisted server-side.
- **FR-010**: All participants and their progress MUST be visible to all users: a leaderboard ranked by % of workout days complete (ties by total reps) with per-day completion dots and per-exercise totals.
- **FR-011**: The server MUST validate every write (uuid shapes, name rules, exercise exists in that day's program, date is a workout day within the challenge range, count bounds) — server-side validation is the only authority since identity is client-held.
- **FR-012**: The data store MUST be reachable only through the app's server routes; no database credentials or write access ship to the browser.
- **FR-013**: The app MUST be mobile-first, one-hand usable, styled exclusively with the site's design tokens, and display the banner slogan "Pain is just weakness leaving your body."

### Key Entities

- **Participant**: id (client-generated UUID), display name, created date.
- **Entry**: id (client-generated UUID, idempotency key), participant, challenge day (date), exercise, signed rep count, created timestamp.
- **Day Program** (config, not stored): date, kind (workout | rest); workout days carry pushupsOnly target + mixed exercise targets.
- **Challenge** (config): name, slogan, start/end dates, ordered day programs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Sign-up (open link → banked first rep) takes under 60 seconds on a phone.
- **SC-002**: The dial tracks a full-speed finger lap with no visible lag and no page scroll on iOS Safari and Android Chrome; one lap always yields exactly +10.
- **SC-003**: Zero double-counted or lost banks in flaky-network testing (airplane-mode retry replays the same entry id).
- **SC-004**: Two participants on separate devices each see the other's bank on the board within 30 seconds without a manual reload beyond switching tabs.
- **SC-005**: Day completion math agrees with the program config in unit tests for both modes, rest days, partial-month bounds, and Sydney midnight boundaries.
- **SC-006**: The full flow works one-handed in dark mode on a phone.

## Assumptions

- Friends-group trust model: identities are unauthenticated; impersonation is possible and accepted. Not suitable for strangers; revisit only if the group grows beyond friends.
- Participant UUIDs are not secrets (the participant list including ids is the device-recovery mechanism).
- The first challenge covers the rest of July 2026 (start date set at ship time, ending 2026-07-31); future months are new config entries.
- Mixed-set equivalences are the program author's judgment call, hand-tuned in config; no conversion formula is enforced.
- Group scale is ≤ ~20 participants; leaderboard aggregation in application code is sufficient.
- No push notifications, streak mechanics, or history views in v1 (explicitly deferred).
- Postgres (Supabase free tier) is the shared store, reached only via server routes with a server-held key.
