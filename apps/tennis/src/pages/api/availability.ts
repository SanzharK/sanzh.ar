import type { APIRoute } from 'astro';
import type { AvailabilityQuery } from '../../lib/adapters/types';
import { runSearch } from '../../lib/search';
import {
  DAY_END_MINUTES,
  DAY_START_MINUTES,
  MAX_DAYS_AHEAD,
  MIN_DURATION_OPTIONS,
  addDays,
  hhmmToMinutes,
  isHalfHourBoundary,
  isValidDateString,
  todaySydney,
} from '../../lib/time';

export const prerender = false;

// Safety margin over the 4s per-venue abort; fan-out is parallel.
export const config = { maxDuration: 15 };

function badRequest(error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}

function parseQuery(params: URLSearchParams): AvailabilityQuery | string {
  const date = params.get('date') ?? '';
  if (!isValidDateString(date)) return 'date must be YYYY-MM-DD';
  const today = todaySydney();
  if (date < today || date > addDays(today, MAX_DAYS_AHEAD)) {
    return `date must be between ${today} and ${addDays(today, MAX_DAYS_AHEAD)} (Sydney time)`;
  }

  const start = hhmmToMinutes(params.get('start') ?? '');
  const end = hhmmToMinutes(params.get('end') ?? '');
  if (start === null || end === null) return 'start and end must be HH:MM';
  if (!isHalfHourBoundary(start) || !isHalfHourBoundary(end)) return 'times must be on 30-minute boundaries';
  if (start < DAY_START_MINUTES || end > DAY_END_MINUTES) return 'times must be between 06:00 and 23:00';
  if (start >= end) return 'start must be before end';

  const rawDuration = params.get('minDuration') ?? '60';
  const minDuration = Number(rawDuration);
  if (!(MIN_DURATION_OPTIONS as readonly number[]).includes(minDuration)) {
    return `minDuration must be one of ${MIN_DURATION_OPTIONS.join(', ')}`;
  }

  return { date, startMinutes: start, endMinutes: end, minDurationMinutes: minDuration };
}

export const GET: APIRoute = async ({ url }) => {
  const query = parseQuery(url.searchParams);
  if (typeof query === 'string') return badRequest(query);

  const response = await runSearch(query);
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  });
};
