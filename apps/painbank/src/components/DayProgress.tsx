import { EXERCISE_LABELS, type WorkoutDay } from '../data/program';
import { dayCompletion } from '../lib/program';
import type { Totals } from '../lib/types';
import type { Mode } from './ModeToggle';

interface Props {
  day: WorkoutDay;
  totals: Totals;
  mode: Mode;
}

function Bar({ label, done, target }: { label: string; done: number; target: number }) {
  const fraction = target > 0 ? Math.min(1, done / target) : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
        <span style={{ color: 'var(--text-tertiary)' }}>
          {done} / {target}
        </span>
      </div>
      <div style={{ height: '6px', borderRadius: '3px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
        <div
          style={{
            width: `${fraction * 100}%`,
            height: '100%',
            borderRadius: '3px',
            background: fraction >= 1 ? 'var(--accent)' : 'var(--highlight)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}

export function DayProgress({ day, totals, mode }: Props) {
  const completion = dayCompletion(day, totals);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {completion.complete && (
        <p
          style={{
            margin: 0,
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--accent)',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--accent)',
            textAlign: 'center',
          }}
        >
          Day complete — weakness has left the building 💪
        </p>
      )}
      {mode === 'pushups' ? (
        <Bar label={EXERCISE_LABELS.pushups} done={totals.pushups ?? 0} target={day.pushupsOnly} />
      ) : (
        day.mixed.map((set) => (
          <Bar
            key={set.exercise}
            label={EXERCISE_LABELS[set.exercise]}
            done={totals[set.exercise] ?? 0}
            target={set.count}
          />
        ))
      )}
    </div>
  );
}
