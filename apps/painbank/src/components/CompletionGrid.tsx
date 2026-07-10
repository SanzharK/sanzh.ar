import type { DayState, LeaderboardRow } from '../lib/types';

const STATE_COLORS: Record<DayState, string> = {
  complete: 'var(--accent)',
  partial: 'var(--highlight)',
  none: 'var(--border-default)',
  rest: 'transparent',
  future: 'transparent',
};

/** One dot per challenge day, GitHub-contributions style. */
export function CompletionGrid({ perDay }: { perDay: LeaderboardRow['perDay'] }) {
  return (
    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }} aria-hidden="true">
      {perDay.map(({ day, state }) => (
        <span
          key={day}
          title={`${day}: ${state}`}
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '3px',
            background: STATE_COLORS[state],
            border:
              state === 'future' ? '1px solid var(--border-default)'
              : state === 'rest' ? '1px dashed var(--border-default)'
              : 'none',
          }}
        />
      ))}
    </div>
  );
}
