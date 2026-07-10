import { EXERCISE_LABELS, type ExerciseId } from '../data/program';
import type { LeaderboardRow } from '../lib/types';
import { CompletionGrid } from './CompletionGrid';

interface Props {
  rows: LeaderboardRow[];
  selfId: string;
}

export function Leaderboard({ rows, selfId }: Props) {
  if (rows.length === 0) {
    return (
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center', padding: '24px 0' }}>
        Nobody on the board yet. Be the first to bank some pain.
      </p>
    );
  }

  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {rows.map((row, index) => {
        const isSelf = row.participantId === selfId;
        const exerciseSummary = Object.entries(row.totalsByExercise)
          .filter(([, count]) => (count ?? 0) > 0)
          .map(([exercise, count]) => `${count} ${EXERCISE_LABELS[exercise as ExerciseId].toLowerCase()}`)
          .join(' · ');
        return (
          <li
            key={row.participantId}
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: isSelf ? '1px solid var(--accent)' : '1px solid var(--border-default)',
              background: isSelf ? 'var(--bg-secondary)' : 'transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '13px', color: 'var(--text-tertiary)' }}>
                {index + 1}
              </span>
              <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)', flex: 1 }}>
                {row.name}
                {isSelf ? ' (you)' : ''}
              </span>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '16px', color: 'var(--accent)' }}>
                {row.percentComplete}%
              </span>
            </div>
            {exerciseSummary && (
              <p style={{ margin: '4px 0 8px 23px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {exerciseSummary}
              </p>
            )}
            <div style={{ marginLeft: '23px' }}>
              <CompletionGrid perDay={row.perDay} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
