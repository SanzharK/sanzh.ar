import { useEffect, useState } from 'react';
import { Button } from '@sanzhar/ui';
import { adoptIdentity, createIdentity } from '../lib/identity';
import type { Participant, ParticipantsResponse } from '../lib/types';
import { MAX_NAME_LENGTH } from '../lib/validate';

interface Props {
  onDone: (participant: Participant) => void;
}

export function SignUp({ onDone }: Props) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState<Participant[]>([]);

  useEffect(() => {
    void fetch('/api/participants')
      .then((r) => (r.ok ? (r.json() as Promise<ParticipantsResponse>) : null))
      .then((body) => setExisting(body?.participants ?? []))
      .catch(() => setExisting([]));
  }, []);

  async function join(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    const result = await createIdentity(trimmed);
    setBusy(false);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    onDone(result);
  }

  function adopt(participant: Participant) {
    adoptIdentity(participant);
    onDone(participant);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <form onSubmit={join} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <label htmlFor="painbank-name" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Your name
        </label>
        <input
          id="painbank-name"
          value={name}
          maxLength={MAX_NAME_LENGTH}
          autoComplete="given-name"
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sanzhar"
          style={{
            fontSize: '17px',
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
          }}
        />
        {error && (
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--danger, #c0392b)' }}>
            {error}
            {error.includes('taken') && ' — is this you? Pick your name below.'}
          </p>
        )}
        <Button type="submit" size="lg" disabled={busy || name.trim().length === 0}>
          {busy ? 'Joining…' : 'Join the challenge'}
        </Button>
      </form>

      {existing.length > 0 && (
        <div>
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--text-tertiary)' }}>
            Been here before? Pick your name:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {existing.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => adopt(p)}
                style={{
                  fontSize: '14px',
                  padding: '8px 14px',
                  borderRadius: '999px',
                  border: '1px solid var(--border-default)',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
