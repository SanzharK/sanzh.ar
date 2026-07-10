import type { Challenge } from '../../data/program';
import type { Entry, Participant } from '../../lib/types';

/** Small three-day challenge used across program/leaderboard tests. */
export const TEST_CHALLENGE: Challenge = {
  name: 'Test Challenge',
  slogan: 'Pain is just weakness leaving your body.',
  startDate: '2026-07-13',
  endDate: '2026-07-16',
  days: [
    {
      date: '2026-07-13',
      kind: 'workout',
      pushupsOnly: 100,
      mixed: [
        { exercise: 'pushups', count: 30 },
        { exercise: 'squats', count: 50 },
        { exercise: 'pullups', count: 20 },
      ],
    },
    { date: '2026-07-14', kind: 'rest' },
    {
      date: '2026-07-15',
      kind: 'workout',
      pushupsOnly: 50,
      mixed: [
        { exercise: 'pushups', count: 15 },
        { exercise: 'squats', count: 25 },
      ],
    },
    {
      date: '2026-07-16',
      kind: 'workout',
      pushupsOnly: 60,
      mixed: [
        { exercise: 'pushups', count: 20 },
        { exercise: 'situps', count: 40 },
      ],
    },
  ],
};

export const ALICE: Participant = { id: '11111111-1111-4111-8111-111111111111', name: 'Alice' };
export const BOB: Participant = { id: '22222222-2222-4222-8222-222222222222', name: 'Bob' };

type Bare = Pick<Entry, 'participantId' | 'day' | 'exercise' | 'count'>;

/** Alice: day 1 complete via push-ups-only (60 + 40); day 3 (07-15) partial. */
export const ALICE_ENTRIES: Bare[] = [
  { participantId: ALICE.id, day: '2026-07-13', exercise: 'pushups', count: 60 },
  { participantId: ALICE.id, day: '2026-07-13', exercise: 'pushups', count: 40 },
  { participantId: ALICE.id, day: '2026-07-15', exercise: 'pushups', count: 20 },
];

/** Bob: day 1 complete via the mixed set; nothing else. */
export const BOB_ENTRIES: Bare[] = [
  { participantId: BOB.id, day: '2026-07-13', exercise: 'pushups', count: 30 },
  { participantId: BOB.id, day: '2026-07-13', exercise: 'squats', count: 50 },
  { participantId: BOB.id, day: '2026-07-13', exercise: 'pullups', count: 20 },
];
