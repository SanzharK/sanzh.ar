import type { VenueResult } from '../lib/types';
import { CardHeader, cardShellStyle } from './VenueCard';

export function LinkOnlyCard({ result }: { result: Extract<VenueResult, { kind: 'link-only' }> }) {
  return (
    <article style={{ ...cardShellStyle(false), borderStyle: 'dashed' }} aria-label={result.venue.name}>
      <CardHeader {...result.venue} />
      <p style={{ margin: '10px 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
        {result.systemName ? `Books via ${result.systemName} — ` : ''}
        <a href={result.bookingUrl} target="_blank" rel="noopener noreferrer">
          check availability on their site →
        </a>
      </p>
    </article>
  );
}
