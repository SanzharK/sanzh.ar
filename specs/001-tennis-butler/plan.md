# Implementation Plan: Tennis Butler

**Branch**: `001-tennis-butler` | **Date**: 2026-07-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-tennis-butler/spec.md`

## Summary

Tennis Butler lets the user pick a date + time window + minimum duration and see which tennis clubs within ~30km of Drummoyne have free courts, sorted by distance, with deep links to book on each club's own site. Technical approach: a new `apps/tennis` Astro 5 app with a single React island and one serverless API route (`@astrojs/vercel` adapter) that fans out live, in parallel, to each onboarded club's ClubSpark endpoint (`play.tennis.com.au/v0/VenueBooking/{slug}/GetVenueSessions`), normalizes sessions into free windows via pure interval math, and returns partial-failure-tolerant results. Onboarding is one typed entry in `src/data/venues.ts`. No database, no cron, no auth in v1.

## Technical Context

**Language/Version**: TypeScript (strict), Node per repo `.nvmrc`

**Primary Dependencies**: Astro ^5.7, React 19, `@astrojs/react`, `@astrojs/vercel`, Tailwind 4 (`@tailwindcss/vite`), `@sanzhar/ui` (Button)

**Storage**: N/A (live fan-out per search; venue registry is a checked-in TS file)

**Testing**: vitest (new devDependency, `apps/tennis` only) + live side-by-side adapter verification + staging acceptance pass

**Target Platform**: Vercel (static pages + one serverless function), mobile-first web

**Project Type**: Web app (new workspace `apps/tennis`, package `@sanzhar/tennis`)

**Performance Goals**: Search completes < 5s (SC-001); fan-out is parallel with 4s per-venue timeout so wall time ≈ slowest venue; `s-maxage=60, stale-while-revalidate=120` smooths repeats

**Constraints**: Fail-closed availability parsing (SC-003); always-200 partial results (SC-005); all math in venue-local (Australia/Sydney) minutes-from-midnight; courteous upstream use (identifying User-Agent, search-triggered only)

**Scale/Scope**: Single user; ~15–25 ClubSpark venues + 2 link-only external venues; one page, one API route

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Spec-Driven Delivery | PASS | spec.md approved; this plan + tasks.md precede any source file |
| II | Radical Cost Transparency | PASS | Cost entry logged per phase via `scripts/log-cost.mjs`; verified before PR merge |
| III | Staging-First Deployment | PASS | PR → `staging`, verified on staging deploy before `main`; new tennis workflows mirror this flow |
| IV | Design Tokens Only | PASS | All styling via `var(--…)` tokens; `globals.css` tokens copied from `apps/web` (see Complexity Tracking) |
| V | TypeScript Strict | PASS | `tsconfig` extends `astro/tsconfigs/strict`; defensive runtime guards instead of `any`; fail-closed parsing |
| VI | Secret Safety | PASS | No secrets in v1 (ClubSpark endpoint is unauthenticated); Vercel project ID secret is added by the human operator, agent never reads it |
| VII | Agent Directory Boundaries | PASS (flagged) | Cross-cutting edits explicitly declared: `.github/workflows/deploy-tennis-{staging,prod}.yml` (new files), root `pnpm-lock.yaml` (dependency install). No edits to `apps/web` or shared packages |

**Post-Phase-1 re-check**: PASS — design artifacts introduce no new violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-tennis-butler/
├── spec.md
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── availability-api.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
apps/tennis/                      # new workspace: @sanzhar/tennis
├── package.json                  # mirrors apps/web + @astrojs/vercel (dep), vitest (devDep); no mdx, no db
├── astro.config.mjs              # react() + tailwindcss vite plugin + vercel() adapter
├── tsconfig.json                 # extends astro/tsconfigs/strict, jsx react-jsx
├── public/favicon.svg
├── scripts/
│   └── probe-venues.mjs          # dev-only: verify slugs respond; dump distinct session (Category, Name) pairs
└── src/
    ├── styles/globals.css        # design tokens (copied from apps/web — see Complexity Tracking)
    ├── layouts/BaseLayout.astro
    ├── pages/
    │   ├── index.astro           # prerendered shell + <TennisButler client:load />
    │   └── api/availability.ts   # export const prerender = false → serverless function
    ├── components/
    │   ├── TennisButler.tsx      # root island: state, fetch, abort, layout
    │   ├── SearchControls.tsx    # date / time selects / duration / search button
    │   ├── VenueCard.tsx         # availability card (window pills, price, book link)
    │   ├── LinkOnlyCard.tsx      # external venues
    │   └── ResultsStatus.tsx     # skeletons / partial-failure banner / empty state
    ├── lib/
    │   ├── types.ts              # shared request/response DTOs (island + API route)
    │   ├── geo.ts                # haversineKm(), HOME_COORDS = { lat: -33.8517, lng: 151.1547 }
    │   ├── time.ts               # Sydney "today" via Intl; HH:MM ↔ minutes-from-midnight
    │   ├── windows.ts            # pure interval math: subtract, merge, clip, minDuration filter
    │   ├── search.ts             # fan-out orchestrator (allSettled, per-venue timeout, sort)
    │   └── adapters/
    │       ├── types.ts          # VenueAdapter interface + normalized results
    │       ├── clubspark.ts      # fetch + defensive fail-closed parse
    │       ├── clubspark.types.ts# raw response shape (all optional, runtime-guarded)
    │       └── index.ts          # system → adapter registry
    ├── data/venues.ts            # THE onboarding surface (typed venue registry)
    └── tests/
        ├── fixtures/clubspark-*.json
        ├── windows.test.ts
        ├── geo.test.ts
        └── clubspark.test.ts

.github/workflows/                # cross-cutting (flagged, Principle VII)
├── deploy-tennis-staging.yml     # push to staging, paths-filtered, --filter=@sanzhar/tennis
└── deploy-tennis-prod.yml        # push to main, --prod
```

**Structure Decision**: New self-contained workspace `apps/tennis` per the constitution's app layout. The only files outside it are the two new deploy workflows (declared cross-cutting) and the lockfile. `turbo.json` needs no change (generic `build` task); `pnpm-workspace.yaml` already globs `apps/*`.

## Key Design Decisions (agreed with user 2026-07-03)

1. **Live fan-out on demand** — serverless route queries venues in parallel per search; no DB/cron. Light HTTP caching only.
2. **ClubSpark adapter + link-only externals** — real availability for play.tennis.com.au venues; Birchgrove (SimplyBook.me) and Salisbury (Skedda) as link-only cards.
3. **Config-file onboarding** — `src/data/venues.ts` discriminated union; adding a club = one commit.
4. **New `apps/tennis`** with own Vercel project; proposed domains `tennis.sanzhar.dev` (staging) / `tennis.sanzh.ar` (prod) — user confirms at deploy time.

## Deploy & Manual Steps

- Two new workflows mirror `deploy-staging.yml`/`deploy-prod.yml`: `working-directory: apps/tennis`, `pnpm turbo build --filter=@sanzhar/tennis`, `vercel-project-id: ${{ secrets.VERCEL_TENNIS_PROJECT_ID }}`, push trigger `paths: ['apps/tennis/**', 'packages/**', 'pnpm-lock.yaml', '.github/workflows/deploy-tennis-*.yml']`. Existing web workflows untouched.
- **Human operator steps (agent stops and hands over — Principle VI)**: create Vercel project (root dir `apps/tennis`, framework Astro, disable git auto-deploys), add `VERCEL_TENNIS_PROJECT_ID` repo secret (reuse existing `VERCEL_TOKEN`/`VERCEL_ORG_ID`), attach domains + DNS. No env vars needed in v1.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Duplicated design tokens (`globals.css` copied from `apps/web`) | `packages/config` is an empty placeholder; extracting tokens now would be a cross-cutting edit to `apps/web` inside this feature | Importing `apps/web`'s CSS across workspaces couples the apps; token extraction to `packages/config` is recorded as a follow-up feature |
| New devDependency `vitest` (first test runner in the monorepo) | Interval math and fail-closed parsing (SC-003) are exactly the kind of logic unit tests protect | Manual verification alone can't guard regressions in 20+ interval edge cases |
| Two workflow files outside `apps/tennis` | Deploys are defined in `.github/workflows` by repo convention; tennis needs its own Vercel project | Reusing the web workflow would deploy the wrong app; Vercel git auto-deploy would bypass the staging-first Actions flow |
