#!/usr/bin/env node
/**
 * Probe ClubSpark venue slugs and dump the distinct session (Category, Name)
 * pairs their GetVenueSessions endpoint returns. Ground truth for the
 * adapter's free/booked/closed classification — rerun whenever availability
 * looks wrong or before onboarding new slugs.
 *
 * Usage:
 *   node apps/tennis/scripts/probe-venues.mjs                 # registry slugs, tomorrow
 *   node apps/tennis/scripts/probe-venues.mjs 2026-07-11      # registry slugs, given date
 *   node apps/tennis/scripts/probe-venues.mjs 2026-07-11 slugA slugB   # explicit slugs
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const USER_AGENT = 'sanzh.ar-tennis-butler/1.0 (personal tool; contact: sanzhar.kushekbayev@gmail.com)';
const SYDNEY_TZ = 'Australia/Sydney';

function sydneyDate(offsetDays = 0) {
  const now = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: SYDNEY_TZ }).format(now);
}

async function registrySlugs() {
  const here = dirname(fileURLToPath(import.meta.url));
  const source = await readFile(join(here, '../src/data/venues.ts'), 'utf8');
  return [...source.matchAll(/clubsparkSlug:\s*'([^']+)'/g)].map((m) => m[1]);
}

const args = process.argv.slice(2);
const date = /^\d{4}-\d{2}-\d{2}$/.test(args[0] ?? '') ? args[0] : sydneyDate(1);
const slugs = (args[0] && !/^\d{4}-\d{2}-\d{2}$/.test(args[0]) ? args : args.slice(1)).filter(Boolean);
const targets = slugs.length > 0 ? slugs : await registrySlugs();

console.log(`Probing ${targets.length} slug(s) for ${date}\n`);

const enumCounts = new Map();

function walkSessions(node, out) {
  if (Array.isArray(node)) {
    for (const item of node) walkSessions(item, out);
  } else if (node && typeof node === 'object') {
    if (typeof node.StartTime === 'number' && typeof node.EndTime === 'number' && 'Category' in node) {
      out.push(node);
    }
    for (const value of Object.values(node)) walkSessions(value, out);
  }
}

let failures = 0;
for (const slug of targets) {
  const url = `https://play.tennis.com.au/v0/VenueBooking/${slug}/GetVenueSessions?startDate=${date}&endDate=${date}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      console.log(`✗ ${slug}: HTTP ${res.status}`);
      failures++;
      continue;
    }
    const data = await res.json();
    const resources = Array.isArray(data?.Resources) ? data.Resources : [];
    const sessions = [];
    walkSessions(data, sessions);
    for (const s of sessions) {
      const key = `Category=${s.Category} Name="${s.Name ?? ''}" Capacity=${s.Capacity ?? '-'}`;
      enumCounts.set(key, (enumCounts.get(key) ?? 0) + 1);
    }
    const ok = resources.length > 0;
    if (!ok) failures++;
    console.log(
      `${ok ? '✓' : '✗'} ${slug}: ${resources.length} courts, ${sessions.length} sessions, tz=${data?.TimeZone ?? '?'} minInterval=${data?.MinimumInterval ?? '?'}`
    );
  } catch (error) {
    console.log(`✗ ${slug}: ${error.name === 'TimeoutError' ? 'timeout' : error.message}`);
    failures++;
  }
}

console.log('\nDistinct session (Category, Name) pairs across all probed venues:');
for (const [key, count] of [...enumCounts.entries()].sort()) {
  console.log(`  ${count.toString().padStart(5)} × ${key}`);
}
process.exit(failures > 0 ? 1 : 0);
