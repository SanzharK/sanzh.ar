<!--
SYNC IMPACT REPORT
==================
Version change: (template) → 1.0.0
Rationale: Initial ratification of the project constitution. MAJOR baseline (1.0.0)
  because this is the first concrete, governing version replacing the unfilled template.

Modified principles: N/A (initial adoption)
Added principles:
  - I. Spec-Driven Delivery (NON-NEGOTIABLE)
  - II. Radical Cost Transparency
  - III. Staging-First Deployment
  - IV. Design Tokens Only
  - V. TypeScript Strict
  - VI. Secret Safety (NON-NEGOTIABLE)
  - VII. Agent Directory Boundaries
Added sections:
  - Additional Constraints (technology & platform standards)
  - Development Workflow (quality gates & review process)
  - Governance

Templates requiring updates:
  - ✅ .specify/templates/plan-template.md (Constitution Check gate is generic; principle
        gates enforced at /speckit-plan time — no edit required)
  - ✅ .specify/templates/spec-template.md (no structural change required; constraints map
        to existing Requirements/Success Criteria sections)
  - ✅ .specify/templates/tasks-template.md (cost-logging & staging tasks fit existing
        Setup/Polish phases — no edit required)
  - ✅ AGENTS.md (already consistent with all seven principles)

Follow-up TODOs: none
-->

# sanzh.ar Constitution

A personal portfolio and utility-tool monorepo built transparently with AI agents. This
constitution defines the non-negotiable principles that govern every specification, plan,
task, and line of code in this repository.

## Core Principles

### I. Spec-Driven Delivery (NON-NEGOTIABLE)

No implementation MAY begin without an approved spec, plan, and tasks produced through the
Spec Kit workflow (constitution → specify → clarify → plan → tasks → implement). The spec is
the single source of truth, never the chat transcript. Code that has no corresponding
approved spec MUST NOT be merged. Every feature branch MUST trace to a `specs/[###-feature]/`
directory containing, at minimum, `spec.md`, `plan.md`, and `tasks.md` before any source file
is written.

**Rationale**: Spec-first work makes AI-generated changes reviewable, reproducible, and
auditable. It prevents scope drift and keeps intent legible to humans and agents alike.

### II. Radical Cost Transparency

Every AI session MUST be logged to `build-costs.json` via `node scripts/log-cost.mjs`. Each
entry MUST record: app, feature, phase, agent, model, tokens, cost, branch, pr, and notes. A
session that produced committed work without a corresponding cost-log entry is a constitution
violation and MUST be corrected before the PR merges.

**Rationale**: The project's purpose is to demonstrate building transparently with AI.
Honest, complete cost data is a first-class deliverable, not an afterthought.

### III. Staging-First Deployment

All changes MUST flow to staging (`sanzhar.dev`) via PR and be verified there before any merge
to `main` (`sanzh.ar`). Direct pushes to `main` are forbidden. "Verified" means the deployed
staging build was exercised against the spec's acceptance scenarios and success criteria. Only
after staging verification passes may a change be promoted to `main`.

**Rationale**: Staging-first protects the public production site and forces every change to be
observed running in a real environment before it reaches users.

### IV. Design Tokens Only

Visual styling MUST reference design tokens through CSS custom properties (e.g.
`var(--accent)`). Hardcoded color values are forbidden, including raw hex, `rgb()`, `hsl()`,
and named colors in component or page styles. Pure `#000` and `#FFF` are explicitly
prohibited — use the corresponding tokens. New visual values MUST be added to the token layer
first, then referenced.

**Rationale**: A single token source guarantees a coherent, themeable, and maintainable design
system across every app in the monorepo.

### V. TypeScript Strict

TypeScript strict mode MUST be enabled and honored across the entire monorepo. Code MUST NOT
weaken type safety to pass checks: no `any` to silence errors, no unjustified
`@ts-ignore`/`@ts-expect-error`, and no disabling of strict compiler flags. Type errors block
merge.

**Rationale**: Strict typing catches whole classes of defects before runtime and keeps
AI-generated code safe to refactor and extend.

### VI. Secret Safety (NON-NEGOTIABLE)

Agents MUST NOT read, print, log, or commit secrets — including `.env` files, `*.key`,
`*.pem`, and Supabase service keys. Secrets MUST never enter specs, plans, tasks, cost logs,
commits, or PR descriptions. If a task appears to require a secret, the agent MUST stop and
flag it for the human operator rather than attempt to access the secret.

**Rationale**: A single leaked credential can compromise the entire project. Agents operate
with broad tool access, so this boundary is absolute.

### VII. Agent Directory Boundaries

Each agent MUST stay within its assigned app or package directory (e.g. `apps/web`,
`packages/ui`). Editing files outside that scope is forbidden unless the agent explicitly flags
the change as cross-cutting and the cross-cutting work is acknowledged in the plan or PR.
Silent edits to shared packages, configs, or sibling apps are a violation.

**Rationale**: Clear ownership boundaries keep parallel agent work conflict-free and make every
change easy to attribute and review.

## Additional Constraints

**Technology & platform standards** (binding on all plans):

- Monorepo tooling: Turborepo + pnpm workspaces. Use `pnpm` exclusively — never `npm` or
  `yarn`.
- Apps: `apps/web` (Astro 5 + React islands), `apps/tennis`, `apps/learning`, `apps/joinery`.
- Packages: `packages/ui`, `packages/db` (Supabase), `packages/config`.
- Hosting: Vercel — `main` → `sanzh.ar`, staging → `sanzhar.dev`.
- Markup & UX: semantic HTML, mobile-first.
- Dependencies: check the monorepo for an existing package before installing anything new.

## Development Workflow

- All non-trivial work passes through the full Spec Kit workflow; the spec is authoritative.
- One feature branch per feature (Spec Kit creates these, e.g. `001-tennis-butler`).
- Every PR targets staging first; reviewers MUST confirm staging verification before approving
  promotion to `main`.
- Every PR MUST verify constitution compliance: spec/plan/tasks present (I), cost logged (II),
  staging verified (III), tokens-only styling (IV), strict types pass (V), no secrets touched
  (VI), and changes confined to scope or flagged as cross-cutting (VII).
- Commit after each task or logical group; keep cost logs current as work proceeds.

## Governance

This constitution supersedes all other practices and conventions in the repository. Where this
document and any other guidance (including `AGENTS.md` or a feature plan) conflict, this
document wins.

**Amendment procedure**: Amendments MUST be proposed as a change to this file via the
`/speckit-constitution` workflow, accompanied by a rationale and an updated Sync Impact Report.
Amendments take effect once merged to `main`.

**Versioning policy** (semantic versioning of governance):

- **MAJOR**: Backward-incompatible governance changes — removing or redefining a principle.
- **MINOR**: Adding a new principle or section, or materially expanding guidance.
- **PATCH**: Clarifications, wording, and non-semantic refinements.

**Compliance review**: Every plan's Constitution Check gate MUST evaluate all seven
principles. Every PR review MUST verify compliance before merge. Any complexity or deviation
that appears to violate a principle MUST be justified in the plan's Complexity Tracking table
or rejected. For runtime development guidance, agents consult `AGENTS.md` and the current
feature plan.

**Version**: 1.0.0 | **Ratified**: 2026-06-21 | **Last Amended**: 2026-06-21
