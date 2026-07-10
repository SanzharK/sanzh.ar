import type { APIRoute } from 'astro';
import { db } from '../../lib/server/db';
import { isUuid, isValidName } from '../../lib/validate';
import type { Participant } from '../../lib/types';

export const prerender = false;

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function jsonError(error: string, status: number): Response {
  return new Response(JSON.stringify({ error }), { status, headers: JSON_HEADERS });
}

export const GET: APIRoute = async () => {
  const { data, error } = await db()
    .from('participants')
    .select('id, name')
    .order('name');
  if (error) return jsonError('could not load participants', 500);

  const participants: Participant[] = data ?? [];
  return new Response(JSON.stringify({ participants }), {
    status: 200,
    headers: { ...JSON_HEADERS, 'Cache-Control': 'public, s-maxage=30' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('body must be JSON', 400);
  }
  const { id, name } = (body ?? {}) as Record<string, unknown>;
  if (!isUuid(id)) return jsonError('id must be a UUID', 400);
  if (!isValidName(name)) return jsonError('name must be 1–24 characters with no surrounding spaces', 400);

  const { error } = await db().from('participants').insert({ id, name });
  if (error) {
    // 23505 = unique violation: either the name (case-insensitive) or a replayed id.
    if (error.code === '23505') return jsonError('that name is taken', 409);
    return jsonError('could not sign up', 500);
  }

  return new Response(JSON.stringify({ participant: { id, name } }), {
    status: 201,
    headers: { ...JSON_HEADERS, 'Cache-Control': 'no-store' },
  });
};
