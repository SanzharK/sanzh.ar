import { useEffect, useRef } from 'react';
import { CHALLENGE } from '../data/program';
import type { DayState } from '../lib/types';

interface Props {
  selected: string;
  states: Map<string, DayState>;
  onSelect: (date: string) => void;
}

const STATE_COLORS: Record<DayState, string> = {
  complete: 'var(--accent)',
  partial: 'var(--highlight)',
  none: 'var(--border-default)',
  rest: 'var(--text-tertiary)',
  future: 'transparent',
};

export function DayStrip({ selected, states, onSelect }: Props) {
  const selectedRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [selected]);

  return (
    <div
      style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        padding: '4px 2px 8px',
        scrollbarWidth: 'none',
      }}
    >
      {CHALLENGE.days.map((day) => {
        const isSelected = day.date === selected;
        const state = states.get(day.date) ?? (day.kind === 'rest' ? 'rest' : 'none');
        const dayNumber = Number(day.date.slice(8));
        return (
          <button
            key={day.date}
            ref={isSelected ? selectedRef : undefined}
            type="button"
            onClick={() => onSelect(day.date)}
            aria-label={`${day.date}${day.kind === 'rest' ? ' (rest day)' : ''}`}
            aria-current={isSelected ? 'date' : undefined}
            style={{
              flex: '0 0 44px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 0 6px',
              borderRadius: 'var(--radius-md)',
              border: isSelected ? '1px solid var(--accent)' : '1px solid transparent',
              background: isSelected ? 'var(--bg-secondary)' : 'transparent',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{dayNumber}</span>
            {day.kind === 'rest' ? (
              <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>rest</span>
            ) : (
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: STATE_COLORS[state],
                  border: state === 'future' ? '1px solid var(--border-default)' : 'none',
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
