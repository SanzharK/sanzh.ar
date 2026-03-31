# sanzh.ar

A living portfolio, personal tool suite, and transparent build journal.

**Production:** [sanzh.ar](https://sanzh.ar)  
**Staging:** [sanzhar.dev](https://sanzhar.dev)

## What is this?

A personal site built by a Director of Engineering who still ships code. Every feature is documented with radical transparency: the PRDs, design decisions, AI prompts, build costs, and lessons learned.

The design is inspired by the colors of the Kazakhstan flag — sky blue for openness, gold for warmth.

## Tech stack

- **Framework:** Astro 5 with React islands
- **Styling:** Tailwind CSS v4
- **Design:** Google Stitch → DESIGN.md → Tailwind tokens
- **Database:** Supabase (Postgres + Auth)
- **Auth:** WebAuthn / Passkey
- **Hosting:** Vercel
- **Monorepo:** Turborepo + pnpm workspaces
- **CI/CD:** GitHub Actions

## Structure

```
apps/
  web/          → Main portfolio site (Astro)
  finance/      → Finance tracker tool (coming soon)
  tennis/       → Tennis booking tool (coming soon)
  football/     → Football manager tool (coming soon)
packages/
  ui/           → Shared design system components
  db/           → Supabase client and types
  config/       → Shared Tailwind, TS, ESLint configs
```

## Development

```bash
pnpm install
pnpm dev        # starts all apps
```

## Build cost

This site was built with AI assistance. Total cost so far: **$1.85** across 2 sessions.

See [build-costs.json](./build-costs.json) for the full ledger, or visit [sanzh.ar/build-log](https://sanzh.ar/build-log).
