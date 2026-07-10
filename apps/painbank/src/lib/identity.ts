import type { Participant } from './types';

const STORAGE_KEY = 'painbank:identity';

interface StoredIdentity {
  v: 1;
  id: string;
  name: string;
}

export function getIdentity(): Participant | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredIdentity>;
    if (parsed.v !== 1 || typeof parsed.id !== 'string' || typeof parsed.name !== 'string') return null;
    return { id: parsed.id, name: parsed.name };
  } catch {
    return null;
  }
}

function persist(participant: Participant): void {
  const stored: StoredIdentity = { v: 1, id: participant.id, name: participant.name };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

/**
 * Register a new participant. Persists locally only on server success,
 * so a rejected name (409) never strands a half-created identity.
 * Returns the participant, or an error message to show the user.
 */
export async function createIdentity(name: string): Promise<Participant | { error: string }> {
  const participant: Participant = { id: crypto.randomUUID(), name };
  let response: Response;
  try {
    response = await fetch('/api/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(participant),
    });
  } catch {
    return { error: 'network error — try again' };
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    return { error: body?.error ?? 'could not sign up' };
  }
  persist(participant);
  return participant;
}

/** Device recovery: continue as an existing participant picked from the list. */
export function adoptIdentity(participant: Participant): void {
  persist(participant);
}
