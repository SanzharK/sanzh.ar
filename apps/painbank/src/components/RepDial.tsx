import { useEffect, useRef } from 'react';
import {
  DEGREES_PER_REP,
  angleDelta,
  clampDegrees,
  degreesToReps,
  handlePosition,
  pointToAngle,
} from '../lib/dial';

interface Props {
  /** Current session count (reps accumulated but not yet banked). */
  value: number;
  /** Lowest allowed session value (negative allows subtracting from banked). */
  min: number;
  max: number;
  banked: number;
  target: number;
  exerciseLabel: string;
  onChange: (next: number) => void;
}

const SIZE = 280;
const CENTER = SIZE / 2;
const RADIUS = 118;
const STROKE = 16;

/**
 * The banking dial: trace clockwise around the ring and the session count
 * climbs (one lap = +10); counter-clockwise subtracts. Also a keyboard slider.
 */
export function RepDial({ value, min, max, banked, target, exerciseLabel, onChange }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  // Continuous accumulated degrees; the source of truth while dragging.
  const degreesRef = useRef(value * DEGREES_PER_REP);
  const lastAngleRef = useRef<number | null>(null);
  const lastValueRef = useRef(value);

  // External change (buttons, reset after banking): re-seat the accumulator.
  useEffect(() => {
    if (value !== lastValueRef.current) {
      degreesRef.current = value * DEGREES_PER_REP;
      lastValueRef.current = value;
    }
  }, [value]);

  function eventAngle(event: React.PointerEvent<SVGSVGElement>): number {
    const rect = svgRef.current!.getBoundingClientRect();
    return pointToAngle(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
      event.clientX,
      event.clientY,
    );
  }

  function applyDegrees(next: number): void {
    const clamped = clampDegrees(next, min, max);
    degreesRef.current = clamped;
    const reps = degreesToReps(clamped);
    if (reps !== lastValueRef.current) {
      lastValueRef.current = reps;
      navigator.vibrate?.(10);
      onChange(reps);
    }
  }

  function onPointerDown(event: React.PointerEvent<SVGSVGElement>): void {
    svgRef.current?.setPointerCapture(event.pointerId);
    lastAngleRef.current = eventAngle(event);
  }

  function onPointerMove(event: React.PointerEvent<SVGSVGElement>): void {
    if (lastAngleRef.current === null) return;
    const angle = eventAngle(event);
    applyDegrees(degreesRef.current + angleDelta(lastAngleRef.current, angle));
    lastAngleRef.current = angle;
  }

  function onPointerEnd(event: React.PointerEvent<SVGSVGElement>): void {
    svgRef.current?.releasePointerCapture(event.pointerId);
    lastAngleRef.current = null;
  }

  function onKeyDown(event: React.KeyboardEvent<SVGSVGElement>): void {
    const step =
      event.key === 'ArrowUp' || event.key === 'ArrowRight' ? 1
      : event.key === 'ArrowDown' || event.key === 'ArrowLeft' ? -1
      : 0;
    if (step === 0) return;
    event.preventDefault();
    applyDegrees(degreesRef.current + step * DEGREES_PER_REP);
  }

  const handle = handlePosition(degreesRef.current, CENTER, CENTER, RADIUS);
  const circumference = 2 * Math.PI * RADIUS;
  const bankedFraction = target > 0 ? Math.min(1, banked / target) : 0;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="slider"
      aria-label={`${exerciseLabel} session reps`}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onKeyDown={onKeyDown}
      style={{
        width: '100%',
        maxWidth: `${SIZE}px`,
        display: 'block',
        margin: '0 auto',
        touchAction: 'none',
        cursor: 'grab',
        outlineColor: 'var(--accent)',
      }}
    >
      {/* Track */}
      <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="var(--border-default)" strokeWidth={STROKE} />
      {/* Banked progress arc (starts at 12 o'clock) */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RADIUS}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={`${bankedFraction * circumference} ${circumference}`}
        transform={`rotate(-90 ${CENTER} ${CENTER})`}
        opacity={0.45}
      />
      {/* Handle */}
      <circle cx={handle.x} cy={handle.y} r={STROKE} fill="var(--accent)" stroke="var(--bg-primary)" strokeWidth={3} />
      {/* Session count */}
      <text
        x={CENTER}
        y={CENTER - 4}
        textAnchor="middle"
        style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '56px', fill: 'var(--text-primary)' }}
      >
        {value > 0 ? `+${value}` : value}
      </text>
      <text
        x={CENTER}
        y={CENTER + 30}
        textAnchor="middle"
        style={{ fontSize: '14px', fill: 'var(--text-secondary)' }}
      >
        {banked} / {target} banked
      </text>
    </svg>
  );
}
