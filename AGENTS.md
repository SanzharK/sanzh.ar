# AGENTS.md — sanzh.ar

Read this first. These conventions apply to every coding agent in this repo.

## Architecture
- Monorepo: Turborepo + pnpm workspaces. Use pnpm, never npm/yarn.
- apps/web (Astro 5 + React islands), apps/tennis, apps/learning, apps/joinery
- packages/ui, packages/db (Supabase), packages/config
- Hosting: Vercel (main -> sanzh.ar, staging -> sanzhar.dev)

## Workflow (spec-driven)
- All non-trivial work goes through Spec Kit: constitution -> specify -> clarify -> plan
  -> tasks -> implement. The spec is the source of truth, not the chat.
- Branch per feature (Spec Kit creates these, e.g. 001-tennis-butler).
- PR to staging first, verify on sanzhar.dev, then merge to main. Never push to main.

## Cost tracking (mandatory)
- Every AI session must be logged to build-costs.json via `node scripts/log-cost.mjs`.
- Record: app, feature, phase, agent, model, tokens, cost, branch, pr, notes.

## Code style
- TypeScript strict everywhere. CSS custom properties (var(--accent)), never hardcoded colors.
- No pure #000 / #FFF — use design tokens. Mobile-first. Semantic HTML.

## Do NOT
- Read or commit secrets (.env, *.key, *.pem, Supabase service keys).
- Edit files outside your assigned app directory without flagging it.
- Install packages without checking the monorepo first.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
specs/002-pain-bank/plan.md (feature 002-pain-bank, branch 002-pain-bank)
<!-- SPECKIT END -->
