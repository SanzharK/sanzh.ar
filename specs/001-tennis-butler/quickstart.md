# Quickstart: Tennis Butler

## Run locally

```bash
pnpm install
pnpm --filter @sanzhar/tennis dev        # http://localhost:4321
```

Search via UI, or hit the API directly:

```bash
curl 'http://localhost:4321/api/availability?date=2026-07-04&start=17:00&end=21:00&minDuration=60'
```

## Tests

```bash
pnpm --filter @sanzhar/tennis test       # vitest: windows/geo/clubspark parser
pnpm --filter @sanzhar/tennis lint       # astro check (strict TS)
pnpm turbo build --filter=@sanzhar/tennis
```

## Verify venue slugs / classification enums

```bash
node apps/tennis/scripts/probe-venues.mjs            # probes all registry slugs for tomorrow
node apps/tennis/scripts/probe-venues.mjs 2026-07-11 # specific date
```

Keeps you honest about the ClubSpark session `(Category, Name)` classification — rerun if availability ever looks wrong.

## Onboard a new club (the whole point)

1. Find its booking page. On `play.tennis.com.au/{slug}` → it's ClubSpark; anything else → external.
2. Get coordinates: right-click the club on Google Maps → copy lat/lng.
3. Add one entry to `apps/tennis/src/data/venues.ts`:

```ts
// ClubSpark club — gets live availability
{ id: 'concord', name: 'Concord Tennis Club', suburb: 'Concord',
  lat: -33.8472, lng: 151.1039, system: 'clubspark', clubsparkSlug: 'concordtennisclub' },

// Anything else — link-only card
{ id: 'birchgrove', name: 'Birchgrove Tennis', suburb: 'Birchgrove',
  lat: -33.8524, lng: 151.1856, system: 'external', systemName: 'SimplyBook.me',
  bookingUrl: 'https://birchgrovetennisonline.simplybook.me/v2/#book' },
```

4. `node apps/tennis/scripts/probe-venues.mjs` to confirm the slug responds; commit. Done.

## Deploy

Push to `staging` → `.github/workflows/deploy-tennis-staging.yml` → staging domain. PR + merge to `main` → prod. One-time Vercel setup (project, `VERCEL_TENNIS_PROJECT_ID` secret, domains) is documented in plan.md → "Deploy & Manual Steps".
