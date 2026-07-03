import { useEffect, useRef, useState } from 'react';
import type { AvailabilityResponse, VenueResult } from '../lib/types';
import { todaySydney } from '../lib/time';
import { SearchControls, type SearchParams } from './SearchControls';
import { VenueCard } from './VenueCard';
import { LinkOnlyCard } from './LinkOnlyCard';
import { ErrorState, LoadingSkeletons, ResultsHeader } from './ResultsStatus';

const DEFAULTS: Omit<SearchParams, 'date'> = { start: '17:00', end: '21:00', minDuration: 60 };

function initialParams(): SearchParams {
  const fallback: SearchParams = { date: todaySydney(), ...DEFAULTS };
  if (typeof window === 'undefined') return fallback;
  const qs = new URLSearchParams(window.location.search);
  return {
    date: qs.get('date') ?? fallback.date,
    start: qs.get('start') ?? fallback.start,
    end: qs.get('end') ?? fallback.end,
    minDuration: Number(qs.get('minDuration') ?? fallback.minDuration) || fallback.minDuration,
  };
}

type Phase =
  | { name: 'idle' }
  | { name: 'loading' }
  | { name: 'done'; data: AvailabilityResponse }
  | { name: 'failed'; message: string };

/** Clubs with free courts first, then unknowns (link-only, unreachable), then full clubs. */
function displayOrder(results: VenueResult[]): VenueResult[] {
  const rank = (r: VenueResult): number => {
    if (r.kind === 'availability' && r.status === 'ok') return r.windows.length > 0 ? 0 : 3;
    if (r.kind === 'link-only') return 1;
    return 2;
  };
  return [...results].sort((a, b) => rank(a) - rank(b) || a.venue.distanceKm - b.venue.distanceKm);
}

export function TennisButler() {
  const [params, setParams] = useState<SearchParams>(initialParams);
  const [phase, setPhase] = useState<Phase>({ name: 'idle' });
  const abortRef = useRef<AbortController | null>(null);

  async function search(current: SearchParams) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase({ name: 'loading' });

    const qs = new URLSearchParams({
      date: current.date,
      start: current.start,
      end: current.end,
      minDuration: String(current.minDuration),
    });
    window.history.replaceState(null, '', `?${qs}`);

    try {
      const response = await fetch(`/api/availability?${qs}`, { signal: controller.signal });
      const body: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string'
            ? body.error
            : 'Search failed';
        setPhase({ name: 'failed', message });
        return;
      }
      setPhase({ name: 'done', data: body as AvailabilityResponse });
    } catch (error) {
      if (controller.signal.aborted) return; // superseded by a newer search
      setPhase({ name: 'failed', message: 'Search failed — check your connection and try again.' });
    }
  }

  useEffect(() => {
    // Auto-run the default (or URL-shared) search on first load.
    void search(params);
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const failedCount =
    phase.name === 'done'
      ? phase.data.results.filter((r) => r.kind === 'availability' && r.status !== 'ok').length
      : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <SearchControls
        value={params}
        loading={phase.name === 'loading'}
        onChange={setParams}
        onSearch={() => void search(params)}
      />

      {phase.name === 'loading' && <LoadingSkeletons />}
      {phase.name === 'failed' && <ErrorState message={phase.message} onRetry={() => void search(params)} />}

      {phase.name === 'done' && (
        <>
          <ResultsHeader count={phase.data.results.length} failedCount={failedCount} />
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {displayOrder(phase.data.results).map((result) => (
              <li key={result.venue.id}>
                {result.kind === 'availability' ? <VenueCard result={result} /> : <LinkOnlyCard result={result} />}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
