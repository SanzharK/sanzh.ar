import type { APIRoute } from 'astro';
import { CHALLENGE } from '../../data/program';
import { db } from '../../lib/server/db';
import { buildLeaderboard } from '../../lib/program';
import type { Entry, LeaderboardResponse, Participant } from '../../lib/types';

export const prerender = false;

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const GET: APIRoute = async () => {
  const client = db();
  const [participantsResult, entriesResult] = await Promise.all([
    client.from('participants').select('id, name'),
    client
      .from('entries')
      .select('participant_id, day, exercise, count')
      .gte('day', CHALLENGE.startDate)
      .lte('day', CHALLENGE.endDate),
  ]);

  if (participantsResult.error || entriesResult.error) {
    return new Response(JSON.stringify({ error: 'could not load leaderboard' }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }

  const participants: Participant[] = participantsResult.data ?? [];
  const entries: Pick<Entry, 'participantId' | 'day' | 'exercise' | 'count'>[] = (entriesResult.data ?? []).map(
    (row) => ({
      participantId: row.participant_id as string,
      day: row.day as string,
      exercise: row.exercise as Entry['exercise'],
      count: row.count as number,
    }),
  );

  const response: LeaderboardResponse = {
    challenge: {
      name: CHALLENGE.name,
      slogan: CHALLENGE.slogan,
      startDate: CHALLENGE.startDate,
      endDate: CHALLENGE.endDate,
    },
    rows: buildLeaderboard(participants, entries),
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { ...JSON_HEADERS, 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60' },
  });
};
