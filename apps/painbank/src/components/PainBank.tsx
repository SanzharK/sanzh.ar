import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@sanzhar/ui';
import { CHALLENGE, type ExerciseId, type WorkoutDay } from '../data/program';
import { getDayProgram } from '../lib/program';
import { getIdentity } from '../lib/identity';
import { todaySydney, dateToDisplay } from '../lib/time';
import { MAX_ENTRY_COUNT } from '../lib/validate';
import type { Entry, LeaderboardResponse, Participant, Totals } from '../lib/types';
import { SignUp } from './SignUp';
import { DayStrip } from './DayStrip';
import { ModeToggle, type Mode } from './ModeToggle';
import { ExerciseTabs } from './ExerciseTabs';
import { RepDial } from './RepDial';
import { RepButtons } from './RepButtons';
import { DayProgress } from './DayProgress';
import { Leaderboard } from './Leaderboard';

type Tab = 'today' | 'board';

function initialDay(): string {
  const today = todaySydney();
  if (today < CHALLENGE.startDate) return CHALLENGE.startDate;
  if (today > CHALLENGE.endDate) return CHALLENGE.endDate;
  return today;
}

function storedMode(date: string): Mode {
  try {
    return localStorage.getItem(`painbank:mode:${date}`) === 'mixed' ? 'mixed' : 'pushups';
  } catch {
    return 'pushups';
  }
}

export function PainBank() {
  const [identity, setIdentity] = useState<Participant | null>(null);
  const [identityChecked, setIdentityChecked] = useState(false);
  const [tab, setTab] = useState<Tab>('today');
  const [selectedDay, setSelectedDay] = useState(initialDay);
  const [mode, setMode] = useState<Mode>('pushups');
  const [activeExercise, setActiveExercise] = useState<ExerciseId>('pushups');
  // Unbanked session counts survive day/exercise switches.
  const [sessions, setSessions] = useState<Record<string, number>>({});
  const [board, setBoard] = useState<LeaderboardResponse | null>(null);
  const [pendingEntry, setPendingEntry] = useState<Entry | null>(null);
  const [banking, setBanking] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);
  const [prominentButtons, setProminentButtons] = useState(false);

  useEffect(() => {
    setIdentity(getIdentity());
    setIdentityChecked(true);
    setMode(storedMode(initialDay()));
    const mq = window.matchMedia('(pointer: fine) and (min-width: 640px)');
    setProminentButtons(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setProminentButtons(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const refetchBoard = useCallback(async (bustCache = false) => {
    try {
      const url = bustCache ? `/api/leaderboard?t=${Date.now()}` : '/api/leaderboard';
      const response = await fetch(url);
      if (!response.ok) return;
      setBoard((await response.json()) as LeaderboardResponse);
    } catch {
      // Board data is best-effort; banking has its own error handling.
    }
  }, []);

  useEffect(() => {
    if (!identity) return;
    void refetchBoard();
    const onFocus = () => {
      if (document.visibilityState === 'visible') void refetchBoard(true);
    };
    document.addEventListener('visibilitychange', onFocus);
    return () => document.removeEventListener('visibilitychange', onFocus);
  }, [identity, refetchBoard]);

  const ownRow = useMemo(
    () => board?.rows.find((row) => row.participantId === identity?.id) ?? null,
    [board, identity],
  );

  const program = getDayProgram(selectedDay);
  const dayTotals: Totals = useMemo(
    () => ownRow?.perDay.find((d) => d.day === selectedDay)?.totals ?? {},
    [ownRow, selectedDay],
  );
  const dayStates = useMemo(
    () => new Map(ownRow?.perDay.map((d) => [d.day, d.state]) ?? []),
    [ownRow],
  );

  const workoutDay = program?.kind === 'workout' ? (program as WorkoutDay) : null;
  const exercise: ExerciseId = mode === 'pushups' ? 'pushups' : activeExercise;
  const target =
    workoutDay === null ? 0
    : mode === 'pushups' ? workoutDay.pushupsOnly
    : workoutDay.mixed.find((s) => s.exercise === exercise)?.count ?? 0;
  const banked = dayTotals[exercise] ?? 0;

  const sessionKey = `${selectedDay}:${exercise}`;
  const session = sessions[sessionKey] ?? 0;
  const setSession = (next: number) => setSessions((s) => ({ ...s, [sessionKey]: next }));

  function selectDay(date: string) {
    setSelectedDay(date);
    setMode(storedMode(date));
    setActiveExercise('pushups');
    setBankError(null);
  }

  function selectMode(next: Mode) {
    setMode(next);
    setBankError(null);
    try {
      localStorage.setItem(`painbank:mode:${selectedDay}`, next);
    } catch {
      // Preference only; losing it is harmless.
    }
    if (next === 'mixed' && workoutDay && !workoutDay.mixed.some((s) => s.exercise === activeExercise)) {
      setActiveExercise(workoutDay.mixed[0]?.exercise ?? 'pushups');
    }
  }

  async function submitEntry(entry: Entry): Promise<void> {
    setBanking(true);
    setBankError(null);
    try {
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setPendingEntry(entry);
        setBankError(body?.error ?? 'could not bank — tap retry');
        return;
      }
      setPendingEntry(null);
      setSessions((s) => ({ ...s, [`${entry.day}:${entry.exercise}`]: 0 }));
      await refetchBoard(true);
    } catch {
      // Same entry id on retry: the write is idempotent, never double-counted.
      setPendingEntry(entry);
      setBankError('network error — your reps are safe, tap retry');
    } finally {
      setBanking(false);
    }
  }

  function bank() {
    if (!identity || session === 0) return;
    void submitEntry({
      id: crypto.randomUUID(),
      participantId: identity.id,
      day: selectedDay,
      exercise,
      count: session,
    });
  }

  if (!identityChecked) return null;

  if (!identity) {
    return <SignUp onDone={setIdentity} />;
  }

  const isFuture = selectedDay > todaySydney();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', padding: '4px', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)' }}>
        {(['today', 'board'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              fontSize: '14px',
              padding: '10px 0',
              borderRadius: 'var(--radius-sm, 6px)',
              border: 'none',
              cursor: 'pointer',
              background: tab === t ? 'var(--accent)' : 'transparent',
              color: tab === t ? 'white' : 'var(--text-secondary)',
            }}
          >
            {t === 'today' ? 'The Work' : 'The Board'}
          </button>
        ))}
      </div>

      {tab === 'board' ? (
        <Leaderboard rows={board?.rows ?? []} selfId={identity.id} />
      ) : (
        <>
          <DayStrip selected={selectedDay} states={dayStates} onSelect={selectDay} />

          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>
            {dateToDisplay(selectedDay)}
          </p>

          {program === null || program.kind === 'rest' ? (
            <p style={{ margin: '24px 0', fontSize: '15px', color: 'var(--text-secondary)', textAlign: 'center' }}>
              {program === null ? 'Outside the challenge.' : 'Rest day. Weakness gets a day off too. 😌'}
            </p>
          ) : isFuture ? (
            <p style={{ margin: '24px 0', fontSize: '15px', color: 'var(--text-secondary)', textAlign: 'center' }}>
              Not yet. The pain of {dateToDisplay(selectedDay)} awaits: {workoutDay!.pushupsOnly} push-ups (or mixed).
            </p>
          ) : (
            <>
              <ModeToggle value={mode} onChange={selectMode} />
              {mode === 'mixed' && (
                <ExerciseTabs
                  sets={workoutDay!.mixed}
                  active={exercise}
                  totals={dayTotals}
                  onSelect={(e) => { setActiveExercise(e); setBankError(null); }}
                />
              )}

              {prominentButtons && (
                <RepButtons value={session} min={-banked} max={MAX_ENTRY_COUNT} onChange={setSession} prominent />
              )}

              <RepDial
                value={session}
                min={-banked}
                max={MAX_ENTRY_COUNT}
                banked={banked}
                target={target}
                exerciseLabel={exercise}
                onChange={setSession}
              />

              {!prominentButtons && (
                <RepButtons value={session} min={-banked} max={MAX_ENTRY_COUNT} onChange={setSession} prominent={false} />
              )}

              {bankError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--danger, #c0392b)' }}>{bankError}</span>
                  {pendingEntry && (
                    <Button size="sm" variant="secondary" onClick={() => void submitEntry(pendingEntry)} disabled={banking}>
                      Retry
                    </Button>
                  )}
                </div>
              )}

              <Button size="lg" onClick={bank} disabled={banking || session === 0} style={{ width: '100%' }}>
                {banking ? 'Banking…' : session === 0 ? 'Trace the dial, then bank it' : `Bank ${session > 0 ? '+' : ''}${session}`}
              </Button>

              <DayProgress day={workoutDay!} totals={dayTotals} mode={mode} />
            </>
          )}
        </>
      )}
    </div>
  );
}
