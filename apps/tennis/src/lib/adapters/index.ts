import type { ClubSparkVenue } from '../../data/venues';
import type { VenueAdapter } from './types';
import { clubSparkAdapter } from './clubspark';

/**
 * System → adapter registry. External venues never pass through an adapter —
 * the search orchestrator emits link-only results for them directly.
 */
export const adapters: { clubspark: VenueAdapter<ClubSparkVenue> } = {
  clubspark: clubSparkAdapter,
};
