#!/usr/bin/env node
// Append a session to build-costs.json and recompute totals (non-destructive).
// Usage:
//   node scripts/log-cost.mjs '{
//     "slug":"tennis-spec","app":"tennis","feature":"001-tennis-butler",
//     "phase":"specify","description":"Tennis butler spec draft","platform":"claude-code",
//     "model":"claude-opus-4-8","estimated_tokens":{"input":12000,"output":3400},
//     "estimated_cost_usd":0.42,"branch":"001-tennis-butler","notes":"initial spec"}'
import { readFileSync, writeFileSync } from "node:fs";

const LEDGER = "build-costs.json";
const e = JSON.parse(process.argv[2] ?? "{}");
const ledger = JSON.parse(readFileSync(LEDGER, "utf8"));

const date = e.date ?? new Date().toISOString().slice(0, 10);
const seq = String(ledger.sessions.filter((s) => s.date === date).length + 1).padStart(3, "0");
const id = e.id ?? (e.slug ? `${date}-${e.slug}` : `${date}-${seq}`);

ledger.sessions.push({
  id,
  date,
  app: e.app ?? null,
  feature: e.feature ?? null,
  phase: e.phase ?? null,
  description: e.description ?? "",
  platform: e.platform ?? null, // claude.ai | claude-code | codex-cli | antigravity
  model: e.model ?? null,
  estimated_tokens: {
    input: e.estimated_tokens?.input ?? 0,
    output: e.estimated_tokens?.output ?? 0,
  },
  estimated_cost_usd: e.estimated_cost_usd ?? 0,
  branch: e.branch ?? null,
  pr: e.pr ?? null,
  notes: e.notes ?? "",
});

const uniq = (a) => [...new Set(a.filter(Boolean))];
ledger.totals = {
  estimated_cost_usd: +ledger.sessions
    .reduce((t, s) => t + (s.estimated_cost_usd || 0), 0)
    .toFixed(4),
  sessions_count: ledger.sessions.length,
  estimated_tokens: {
    input: ledger.sessions.reduce((t, s) => t + (s.estimated_tokens?.input || 0), 0),
    output: ledger.sessions.reduce((t, s) => t + (s.estimated_tokens?.output || 0), 0),
  },
  models_used: uniq(ledger.sessions.map((s) => s.model)),
  platforms_used: uniq(ledger.sessions.map((s) => s.platform)),
};

writeFileSync(LEDGER, JSON.stringify(ledger, null, 2) + "\n");
const last = ledger.sessions.at(-1);
console.log(
  `Logged ${last.id} (${last.platform}) · total $${ledger.totals.estimated_cost_usd} ` +
  `across ${ledger.totals.sessions_count} sessions`
);