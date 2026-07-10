import { EXERCISE_LABELS, type ExerciseId, type ExerciseSet } from '../data/program';
import type { Totals } from '../lib/types';

interface Props {
  sets: readonly ExerciseSet[];
  active: ExerciseId;
  totals: Totals;
  onSelect: (exercise: ExerciseId) => void;
}

export function ExerciseTabs({ sets, active, totals, onSelect }: Props) {
  return (
    <div role="tablist" aria-label="Exercises" style={{ display: 'flex', gap: '8px' }}>
      {sets.map((set) => {
        const done = (totals[set.exercise] ?? 0) >= set.count;
        const selected = set.exercise === active;
        return (
          <button
            key={set.exercise}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onSelect(set.exercise)}
            style={{
              flex: 1,
              fontSize: '13px',
              fontWeight: 600,
              padding: '10px 4px',
              borderRadius: 'var(--radius-md)',
              border: selected ? '1px solid var(--accent)' : '1px solid var(--border-default)',
              background: selected ? 'var(--bg-secondary)' : 'transparent',
              color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            {done ? '✓ ' : ''}
            {EXERCISE_LABELS[set.exercise]}
            <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 400 }}>
              {Math.min(totals[set.exercise] ?? 0, set.count)}/{set.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
