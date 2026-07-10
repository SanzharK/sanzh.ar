# Tasks: Pain Bank

**Input**: plan.md, data-model.md, spec.md (this directory)

Ordering: T1→T2 are pure local groundwork. T3 (Supabase, human) can run in parallel. T4 builds against validators with the client stubbed until credentials exist. T5–T7 build UI against stubbed fetch until T4 is live. Tests are written alongside their modules, not at the end.

## T1 — Scaffold `apps/painbank` workspace

Copy/adapt from `apps/tennis` (source of truth for every pattern): `package.json` (rename `@sanzhar/painbank`, add `@supabase/supabase-js`), `astro.config.mjs`, `tsconfig.json`, `src/styles/globals.css`, `src/layouts/BaseLayout.astro` (mobile viewport, `viewport-fit=cover`), `src/pages/index.astro` (prerendered shell, slogan banner, `<PainBank client:load />`), `public/favicon.svg`.
Gate: `pnpm install` + `pnpm --filter @sanzhar/painbank build` green. Lockfile change flagged.

## T2 — Program config + domain logic + validators [tests alongside]

- `src/data/program.ts`: July 2026 challenge (start set at ship time → 2026-07-31), rest days, dual-mode targets.
- `src/lib/types.ts`: Participant, Entry, LeaderboardRow, API DTOs.
- `src/lib/program.ts`: `getDayProgram`, `todayChallengeDay` (Australia/Sydney via Intl, tennis `time.ts` approach), `dayCompletion` (either-mode), `programCompletion`, leaderboard aggregation.
- `src/lib/validate.ts`: `isUuid`, `isValidName`, `isValidExercise`, `isValidDay`, `isValidCount`.
- Tests: `program.test.ts`, `validate.test.ts`, `fixtures/entries.ts`, `leaderboard.test.ts`.

## T3 — Supabase schema [human-in-the-loop]

- `supabase/migrations/0001_init.sql`: participants + entries per data-model.md; RLS on, no anon policies.
- Human: create project, run migration, set env vars (see quickstart.md).

## T4 — API routes

- `src/lib/server/db.ts`: lazy supabase-js singleton, `persistSession: false`, server env vars.
- `src/pages/api/participants.ts` (GET/POST), `src/pages/api/entries.ts` (POST, idempotent upsert), `src/pages/api/leaderboard.ts` (GET, TS aggregation). All `prerender = false`, tennis-style validation + cache headers per data-model.md contracts.

## T5 — Identity + SignUp

- `src/lib/identity.ts`: get/create/adopt against `localStorage['painbank:identity']` (versioned), persist-on-success only.
- `src/components/SignUp.tsx`: join form + "been here before?" adoption list; 409 → "is this you?" path.

## T6 — Core UI + dial [dial tests alongside]

- `src/lib/dial.ts`: `pointToAngle` (0° at 12 o'clock, CW), `angleDelta` (wrap-safe signed shortest), `accumulate` (1 rep / 36°, CCW subtracts). `dial.test.ts`: quadrants, wraps, quantization, multi-lap drift.
- `src/components/RepDial.tsx`: SVG ring + progress arc + handle; Pointer Events, `setPointerCapture`, `touch-action: none`; session counter; "Bank it" commits one idempotent entry, optimistic, retry-on-fail keeps pending; `role="slider"` + arrow keys; `navigator.vibrate?.(10)` per tick.
- `src/components/RepButtons.tsx` (always rendered, desktop-primary), `ModeToggle.tsx` + `ExerciseTabs.tsx` (toggle in localStorage per day), `DayStrip.tsx`, `DayProgress.tsx`.
- `src/components/PainBank.tsx`: identity gate → day view / board tabs.

## T7 — Leaderboard

- `src/components/Leaderboard.tsx` (ranked, self highlighted), `CompletionGrid.tsx` (day dots). Refetch on tab focus + after bank.

## T8 — Gate + deploy [cross-cutting flagged]

- Full local gate: `pnpm --filter @sanzhar/painbank test` + `lint` + `build`.
- `.github/workflows/deploy-painbank-{staging,prod}.yml` (copied from tennis workflows, substituted).
- Cost log via `node scripts/log-cost.mjs`; PR → staging; quickstart.md manual checklist on real phones; merge to main.
