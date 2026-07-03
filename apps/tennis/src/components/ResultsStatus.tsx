export function LoadingSkeletons() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} aria-label="Loading results">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="tb-skeleton"
          style={{
            height: '96px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-default)',
          }}
        />
      ))}
    </div>
  );
}

export function ResultsHeader({ count, failedCount }: { count: number; failedCount: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>
        {count} {count === 1 ? 'club' : 'clubs'} · all times Sydney time
      </p>
      {failedCount > 0 && (
        <p
          role="status"
          style={{
            margin: 0,
            fontSize: '13px',
            color: 'var(--text-secondary)',
            background: 'var(--highlight-soft)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
          }}
        >
          {failedCount} of {count} clubs didn't respond — their cards link straight to their sites.
        </p>
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      style={{
        fontSize: '14px',
        color: 'var(--text-secondary)',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
      }}
    >
      <p style={{ margin: 0 }}>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        style={{
          marginTop: '8px',
          fontSize: '14px',
          color: 'var(--accent)',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  );
}
