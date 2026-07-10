import type { APIRoute } from 'astro';
import { db } from '../../lib/server/db';
import { isBankableDay, isExerciseForDay, isUuid, isValidCount, isValidExercise } from '../../lib/validate';

export const prerender = false;

const JSON_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

function jsonError(error: string, status: number): Response {
  return new Response(JSON.stringify({ error }), { status, headers: JSON_HEADERS });
}

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('body must be JSON', 400);
  }
  const { id, participantId, day, exercise, count } = (body ?? {}) as Record<string, unknown>;

  if (!isUuid(id)) return jsonError('id must be a UUID', 400);
  if (!isUuid(participantId)) return jsonError('participantId must be a UUID', 400);
  if (!isBankableDay(day)) return jsonError('day must be a workout day within the challenge', 400);
  if (!isValidExercise(exercise)) return jsonError('unknown exercise', 400);
  if (!isExerciseForDay(exercise, day)) return jsonError(`${exercise} is not part of that day's program`, 400);
  if (!isValidCount(count)) return jsonError('count must be a non-zero integer within ±500', 400);

  const entry = { id, participant_id: participantId, day, exercise, count };
  // Client-generated id is the idempotency key: a retried bank lands on the
  // same PK and is dropped instead of double-counting.
  const { data, error } = await db()
    .from('entries')
    .upsert(entry, { onConflict: 'id', ignoreDuplicates: true })
    .select('id');

  if (error) {
    // 23503 = FK violation: the participant does not exist.
    if (error.code === '23503') return jsonError('unknown participant', 400);
    return jsonError('could not bank entry', 500);
  }

  const replayed = (data ?? []).length === 0;
  return new Response(JSON.stringify({ entry: { id, participantId, day, exercise, count } }), {
    status: replayed ? 200 : 201,
    headers: JSON_HEADERS,
  });
};
