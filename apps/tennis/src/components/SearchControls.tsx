import { Button } from '@sanzhar/ui';
import {
  DAY_END_MINUTES,
  DAY_START_MINUTES,
  MAX_DAYS_AHEAD,
  MIN_DURATION_OPTIONS,
  addDays,
  minutesToDisplay,
  minutesToHhmm,
  todaySydney,
} from '../lib/time';

export interface SearchParams {
  date: string;
  start: string; // HH:MM
  end: string;
  minDuration: number;
}

interface Props {
  value: SearchParams;
  loading: boolean;
  onChange: (next: SearchParams) => void;
  onSearch: () => void;
}

const TIME_OPTIONS: { value: string; label: string }[] = [];
for (let m = DAY_START_MINUTES; m <= DAY_END_MINUTES; m += 30) {
  TIME_OPTIONS.push({ value: minutesToHhmm(m), label: minutesToDisplay(m) });
}

const DURATION_LABELS: Record<number, string> = {
  30: 'Any (30 min+)',
  60: '1 hour',
  90: '1.5 hours',
  120: '2 hours',
};

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  flex: '1 1 130px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--text-secondary)',
};

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '15px',
  color: 'var(--text-primary)',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 12px',
  minHeight: '44px',
};

export function SearchControls({ value, loading, onChange, onSearch }: Props) {
  const today = todaySydney();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSearch();
      }}
      style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}
    >
      <div style={fieldStyle}>
        <label htmlFor="tb-date" style={labelStyle}>
          Date
        </label>
        <input
          id="tb-date"
          type="date"
          required
          min={today}
          max={addDays(today, MAX_DAYS_AHEAD)}
          value={value.date}
          onChange={(e) => onChange({ ...value, date: e.target.value })}
          style={inputStyle}
        />
      </div>
      <div style={fieldStyle}>
        <label htmlFor="tb-start" style={labelStyle}>
          From
        </label>
        <select
          id="tb-start"
          value={value.start}
          onChange={(e) => onChange({ ...value, start: e.target.value })}
          style={inputStyle}
        >
          {TIME_OPTIONS.slice(0, -1).map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div style={fieldStyle}>
        <label htmlFor="tb-end" style={labelStyle}>
          Until
        </label>
        <select
          id="tb-end"
          value={value.end}
          onChange={(e) => onChange({ ...value, end: e.target.value })}
          style={inputStyle}
        >
          {TIME_OPTIONS.filter((t) => t.value > value.start).map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div style={fieldStyle}>
        <label htmlFor="tb-duration" style={labelStyle}>
          At least
        </label>
        <select
          id="tb-duration"
          value={value.minDuration}
          onChange={(e) => onChange({ ...value, minDuration: Number(e.target.value) })}
          style={inputStyle}
        >
          {MIN_DURATION_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {DURATION_LABELS[d]}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" size="lg" disabled={loading} style={{ flex: '1 1 130px', minHeight: '44px' }}>
        {loading ? 'Searching…' : 'Find courts'}
      </Button>
    </form>
  );
}
