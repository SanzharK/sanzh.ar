export type Mode = 'pushups' | 'mixed';

interface Props {
  value: Mode;
  onChange: (mode: Mode) => void;
}

const OPTIONS: { mode: Mode; label: string }[] = [
  { mode: 'pushups', label: 'Push-ups only' },
  { mode: 'mixed', label: 'Mixed' },
];

export function ModeToggle({ value, onChange }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Workout mode"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '4px',
        padding: '4px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-secondary)',
      }}
    >
      {OPTIONS.map(({ mode, label }) => (
        <button
          key={mode}
          type="button"
          role="radio"
          aria-checked={value === mode}
          onClick={() => onChange(mode)}
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: '14px',
            padding: '10px 0',
            borderRadius: 'var(--radius-sm, 6px)',
            border: 'none',
            cursor: 'pointer',
            background: value === mode ? 'var(--accent)' : 'transparent',
            color: value === mode ? 'white' : 'var(--text-secondary)',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
