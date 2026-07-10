# Implementation Plan: Pain Bank

**Branch**: `002-pain-bank` | **Date**: 2026-07-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-pain-bank/spec.md`

## Summary

Pain Bank is a mobile-first monthly fitness challenge for a friends group: name-only signup with browser-held identity, a code-defined program where each workout day offers push-ups-only OR an equivalent mixed set, rep banking via a tactile circular dial (mobile) or plus/minus buttons (desktop), and a shared leaderboard. Technical approach: a new `apps/painbank` Astro 5 app mirroring `apps/tennis` — one React island, three serverless API routes (`@astrojs/vercel`) wrapping a Supabase Postgres store with a server-held service-role key. Entries are append-only signed deltas with client-generated UUIDs for idempotency. All domain math (program completion, dial angle accumulation, validation) is pure, DOM-free, and vitest-covered.

## Technical Context

**Language/Version**: TypeScript (strict), Node per repo `.nvmrc`

**Primary Dependencies**: Astro ^5.7, React 19, `@astrojs/react`, `@astrojs/vercel`, Tailwind 4 (`@tailwindcss/vite`), `@sanzhar/ui` (Button), `@supabase/supabase-js` (server-side only)

**Storage**: Supabase Postgres (new free project) — two tables (`participants`, `entries`), RLS on with no anon policies; reached exclusively via API routes using `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` server env vars. Program/config is a checked-in TS file.

**Testing**: vitest (dial math, program math, validators, leaderboard aggregation fixtures) + `astro check` + manual mobile pass on staging

**Target Platform**: Vercel (static shell + serverless functions), mobile-first web

**Project Type**: Web app (new workspace `apps/painbank`, package `@sanzhar/painbank`)

**Performance Goals**: Bank commit round-trip < 1s typical; leaderboard cached `s-maxage=15, stale-while-revalidate=60`; dial interaction 60fps (pure client math, no per-tick network)

**Constraints**: Server-side validation is the only authority (identity is client-held); idempotent writes (client UUID + upsert ignoreDuplicates); day boundaries Australia/Sydney; design tokens only; no secrets in the bundle

**Scale/Scope**: ≤ ~20 participants × ≤ 31 days × 4 exercises; one page, three API routes

## Constitution Check

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Spec-Driven Delivery | PASS | spec.md precedes this plan; tasks.md precedes source |
| II | Radical Cost Transparency | PASS | Cost entry via `scripts/log-cost.mjs` before PR merge |
| III | Staging-First Deployment | PASS | PR → staging, phone-verified on staging before main |
| IV | Design Tokens Only | PASS | All styling via `var(--…)`; `globals.css` tokens copied from `apps/web` (same accepted duplication as tennis) |
| V | TypeScript Strict | PASS | extends `astro/tsconfigs/strict`; closed ExerciseId union; runtime guards at API edges |
| VI | Secret Safety | PASS | `SUPABASE_SERVICE_ROLE_KEY` lives only in Vercel env + git-ignored `.env`; agent never reads it; migration SQL contains no secrets |
| VII | Agent Directory Boundaries | PASS (flagged) | Cross-cutting edits declared: `.github/workflows/deploy-painbank-{staging,prod}.yml` (new), root `pnpm-lock.yaml` (install), AGENTS.md SPECKIT block. No edits to `apps/web`, `apps/tennis`, or shared packages |

## Project Structure

### Documentation (this feature)

```text
specs/002-pain-bank/
├── spec.md
├── plan.md              # This file
├── data-model.md
├── quickstart.md        # env setup, Supabase migration, manual test checklist
└── tasks.md
```

### Source Code (repository root)

```text
apps/painbank/                    # new workspace: @sanzhar/painbank
├── package.json                  # mirrors apps/tennis + @supabase/supabase-js
├── astro.config.mjs              # react() + tailwindcss vite plugin + vercel() adapter
├── tsconfig.json                 # extends astro/tsconfigs/strict
├── public/favicon.svg
├── supabase/migrations/0001_init.sql   # run manually in Supabase SQL editor
└── src/
    ├── styles/globals.css        # design tokens (copied from apps/web)
    ├── layouts/BaseLayout.astro  # mobile viewport, viewport-fit=cover
    ├── pages/
    │   ├── index.astro           # prerendered shell + banner slogan + <PainBank client:load />
    │   └── api/
    │       ├── participants.ts   # GET list / POST register (prerender = false)
    │       ├── entries.ts        # POST bank (idempotent upsert)
    │       └── leaderboard.ts    # GET aggregated board
    ├── components/
    │   ├── PainBank.tsx          # root island: identity gate → day view / board tab
    │   ├── SignUp.tsx            # join form + "been here before?" adoption list
    │   ├── RepDial.tsx           # SVG dial: pointer events, session count, Bank it
    │   ├── RepButtons.tsx        # +10 / +1 / −1 / −10 (always rendered; desktop-primary)
    │   ├── ModeToggle.tsx        # Push-ups only / Mixed segmented control
    │   ├── ExerciseTabs.tsx      # per-exercise tabs in mixed mode
    │   ├── DayStrip.tsx          # horizontal day picker (rest/future/complete states)
    │   ├── DayProgress.tsx       # per-exercise bars, day-complete state
    │   ├── Leaderboard.tsx       # ranked rows, self highlighted
    │   └── CompletionGrid.tsx    # day dots per participant
    ├── lib/
    │   ├── types.ts              # DTOs shared by island + API routes
    │   ├── program.ts            # getDayProgram, todayChallengeDay (Sydney), dayCompletion, programCompletion
    │   ├── dial.ts               # pure angle math: pointToAngle, angleDelta, accumulate
    │   ├── validate.ts           # isUuid, isValidName, isValidExercise, isValidDay, isValidCount
    │   ├── identity.ts           # localStorage identity: get/create/adopt
    │   └── server/db.ts          # lazy supabase-js singleton (server env vars)
    ├── data/program.ts           # THE program config (challenge dates, day targets)
    └── tests/
        ├── fixtures/entries.ts
        ├── dial.test.ts
        ├── program.test.ts
        ├── validate.test.ts
        └── leaderboard.test.ts

.github/workflows/                # cross-cutting (flagged, Principle VII)
├── deploy-painbank-staging.yml
└── deploy-painbank-prod.yml
```

**Structure Decision**: Self-contained workspace `apps/painbank`. `packages/db` is intentionally NOT used or modified — its client is browser/anon-key oriented; this app needs a server-side service-role client, kept app-local until a second app needs one.

## Key Design Decisions (agreed with user 2026-07-10)

1. **Name**: Pain Bank; slogan banner "Pain is just weakness leaving your body." Banking reps = banking pain.
2. **Storage**: new free Supabase project, API-routes-only access (no anon policies, service key server-side) — matches the tennis serverless pattern and keeps validation authoritative.
3. **Identity**: client-side-light — name + client-generated UUID in `localStorage['painbank:identity']`; device recovery = adopt your name from the participant list; impersonation accepted.
4. **Entry semantics**: append-only signed deltas, ±500 bound, client-generated entry UUID = idempotency key (`upsert` with `ignoreDuplicates`); minus buttons post negative entries; client clamps display at 0.
5. **Completion**: day complete if EITHER mode satisfied; push-up entries count toward both; mode toggle is per-device UI state, never persisted server-side.
6. **Dial**: continuous accumulation, 1 rep / 36° (lap = +10), CCW subtracts; pure math in `lib/dial.ts`; Pointer Events + `setPointerCapture` + `touch-action: none`; explicit "Bank it" commit (one POST per session, not per tick); `role="slider"` + arrow keys; buttons always rendered as fallback.
7. **First challenge**: rest of July 2026 (start date finalized at ship time → 2026-07-31); config supports arbitrary ranges.
8. **Leaderboard**: aggregate in TypeScript from raw month entries (friend-group scale); rank by % workout days complete, ties by total reps; refetch on tab focus + after banking; no realtime.

## Deploy & Manual Steps (human operator)

1. Create free Supabase project; run `apps/painbank/supabase/migrations/0001_init.sql` in the SQL editor; note `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
2. Create Vercel project for `apps/painbank` (root directory `apps/painbank`); set both env vars for Preview + Production. Proposed domains: `painbank.sanzhar.dev` (staging) / `painbank.sanz.ar` or `painbank.sanzh.ar` (prod) — confirm at deploy time.
3. Add GitHub secret `VERCEL_PAINBANK_PROJECT_ID` (existing `VERCEL_TOKEN` / `VERCEL_ORG_ID` reused).
4. PR → staging; verify quickstart.md checklist on a real phone; merge to main. Never push to main.
5. Log costs to `build-costs.json` before PR merge.
