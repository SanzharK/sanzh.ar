interface Props {
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  /** Desktop renders the buttons as the dominant control. */
  prominent: boolean;
}

const STEPS = [-10, -1, 1, 10] as const;

export function RepButtons({ value, min, max, onChange, prominent }: Props) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px',
        maxWidth: '320px',
        margin: '0 auto',
      }}
    >
      {STEPS.map((step) => {
        const next = Math.min(max, Math.max(min, value + step));
        const disabled = next === value;
        const big = Math.abs(step) === 10;
        return (
          <button
            key={step}
            type="button"
            disabled={disabled}
            onClick={() => onChange(next)}
            aria-label={`${step > 0 ? 'add' : 'subtract'} ${Math.abs(step)} reps`}
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: big ? (prominent ? '22px' : '18px') : prominent ? '17px' : '14px',
              padding: prominent ? '18px 0' : '12px 0',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              background: big ? 'var(--bg-secondary)' : 'transparent',
              color: step > 0 ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.4 : 1,
            }}
          >
            {step > 0 ? `+${step}` : step}
          </button>
        );
      })}
    </div>
  );
}
