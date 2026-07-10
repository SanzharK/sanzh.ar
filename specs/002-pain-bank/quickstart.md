# Quickstart: Pain Bank

## Local development

```bash
pnpm install
pnpm --filter @sanzhar/painbank dev      # http://localhost:4321
pnpm --filter @sanzhar/painbank test     # vitest
pnpm --filter @sanzhar/painbank lint     # astro check
```

API routes need Supabase credentials. Create `apps/painbank/.env` (git-ignored — never commit):

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service role key>
```

Without them the UI still renders; participant/entry/leaderboard calls return 500.

## Supabase setup (one-time, human operator)

1. Create a free project at supabase.com (region: Sydney).
2. SQL editor → paste and run `apps/painbank/supabase/migrations/0001_init.sql`.
3. Project Settings → API: copy the URL and the **service_role** key (not anon).
4. Add both as Vercel env vars (Preview + Production) and to your local `.env`.

## Vercel + GitHub setup (one-time, human operator)

1. New Vercel project, root directory `apps/painbank`, framework Astro.
2. Set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` for Preview + Production.
3. GitHub repo secret: `VERCEL_PAINBANK_PROJECT_ID` (reuses existing `VERCEL_TOKEN` / `VERCEL_ORG_ID`).
4. Domains (confirm at deploy time): `painbank.sanzhar.dev` (staging), prod domain on sanzh.ar.

## Editing the program

The whole challenge is `apps/painbank/src/data/program.ts` — dates, rest days, and per-day targets (push-ups-only number + mixed set). Edit, commit, deploy. Type checking enforces the shape; tests enforce the math.

## Manual verification checklist (staging, before merging to main)

- [ ] Fresh phone: open link → type name → Join → banked first rep in under 60s.
- [ ] Reload: no sign-up screen (identity remembered).
- [ ] Second device: "Been here before?" → pick name → history visible.
- [ ] Duplicate name signup → friendly "is this you?" path, no raw error.
- [ ] Dial (iPhone Safari + Android Chrome): full-speed lap = exactly +10; no page scroll while dragging; CCW subtracts.
- [ ] Bank it → progress bar updates; second session accumulates.
- [ ] Airplane mode → Bank it fails → pending count kept with retry → re-enable network → retry succeeds exactly once (no double-count).
- [ ] Mixed mode: per-exercise tabs and targets; day completes when all met; toggle back — banked push-ups still count.
- [ ] Rest day shows rest state, no dial.
- [ ] Desktop: buttons are the dominant control; +10/+1/−1/−10 work; dial still usable.
- [ ] Two participants bank on two devices → both on the board with correct rank, totals, day dots; self row highlighted.
- [ ] Dark mode + one-handed pass.
