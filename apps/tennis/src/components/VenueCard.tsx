import { useState } from 'react';
import type { AvailabilityWindowDto, VenueResult } from '../lib/types';
import { hhmmToMinutes, minutesToDisplay } from '../lib/time';

const VISIBLE_GROUPS = 4;

interface WindowGroup {
  start: string;
  end: string;
  courts: string[];
  guestPricePerHour?: number;
  includesLighting?: boolean;
}

function groupWindows(windows: AvailabilityWindowDto[]): WindowGroup[] {
  const groups = new Map<string, WindowGroup>();
  for (const w of windows) {
    const key = `${w.start}|${w.end}|${w.guestPricePerHour ?? ''}|${w.includesLighting ?? ''}`;
    const existing = groups.get(key);
    if (existing) {
      existing.courts.push(w.court);
    } else {
      groups.set(key, {
        start: w.start,
        end: w.end,
        courts: [w.court],
        ...(w.guestPricePerHour !== undefined && { guestPricePerHour: w.guestPricePerHour }),
        ...(w.includesLighting !== undefined && { includesLighting: w.includesLighting }),
      });
    }
  }
  return [...groups.values()].sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end));
}

function displayRange(start: string, end: string): string {
  const s = hhmmToMinutes(start);
  const e = hhmmToMinutes(end);
  return s !== null && e !== null ? `${minutesToDisplay(s)}–${minutesToDisplay(e)}` : `${start}–${end}`;
}

export function cardShellStyle(muted: boolean): React.CSSProperties {
  return {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: muted ? 'none' : 'var(--shadow-card)',
    padding: '16px',
    opacity: muted ? 0.75 : 1,
  };
}

export function CardHeader({ name, suburb, distanceKm }: { name: string; suburb: string; distanceKm: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
      <div>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '16px', color: 'var(--text-primary)' }}>
          {name}
        </h3>
        <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-tertiary)' }}>{suburb}</p>
      </div>
      <span
        style={{
          flexShrink: 0,
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--accent-hover)',
          background: 'var(--accent-soft)',
          borderRadius: 'var(--radius-full)',
          padding: '3px 10px',
        }}
      >
        {distanceKm} km
      </span>
    </div>
  );
}

export function VenueCard({ result }: { result: Extract<VenueResult, { kind: 'availability' }> }) {
  const [showAll, setShowAll] = useState(false);
  const groups = groupWindows(result.windows);
  const failed = result.status !== 'ok';
  const empty = result.status === 'ok' && groups.length === 0;
  const visible = showAll ? groups : groups.slice(0, VISIBLE_GROUPS);

  return (
    <article style={cardShellStyle(failed || empty)} aria-label={result.venue.name}>
      <CardHeader {...result.venue} />

      {failed && (
        <p style={{ margin: '10px 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Couldn't reach their booking system —{' '}
          <a href={result.bookingUrl} target="_blank" rel="noopener noreferrer">
            check on their site
          </a>
        </p>
      )}

      {empty && (
        <p style={{ margin: '10px 0 0', fontSize: '14px', color: 'var(--text-tertiary)' }}>
          No courts free in this range
        </p>
      )}

      {!failed && groups.length > 0 && (
        <>
          <ul
            style={{
              listStyle: 'none',
              margin: '12px 0 0',
              padding: 0,
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            {visible.map((g) => (
              <li
                key={`${g.start}-${g.end}-${g.guestPricePerHour ?? ''}`}
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  background: 'var(--accent-soft)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-full)',
                  padding: '5px 12px',
                }}
              >
                {displayRange(g.start, g.end)} · {g.courts.length} {g.courts.length === 1 ? 'court' : 'courts'}
                {g.guestPricePerHour !== undefined && ` · from $${g.guestPricePerHour}/hr`}
                {g.includesLighting && ' · lights'}
              </li>
            ))}
          </ul>
          {groups.length > VISIBLE_GROUPS && !showAll && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              style={{
                marginTop: '8px',
                fontSize: '13px',
                color: 'var(--accent)',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              Show all {groups.length} windows
            </button>
          )}
          <p style={{ margin: '12px 0 0' }}>
            <a
              href={result.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '14px', fontWeight: 600 }}
            >
              Book at {result.venue.name} →
            </a>
          </p>
        </>
      )}
    </article>
  );
}
