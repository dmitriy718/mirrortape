import { useEffect, useMemo, useRef, useState } from 'react';
import GaugeMeter from '@/components/GaugeMeter';
import { useInView, usePrefersReducedMotion } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

/* Deterministic equity curve: slight gains, then a drawdown dipping to ≈ -35%. */
const N = 160;
const CURVE: number[] = (() => {
  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647 - 0.5;
  };
  const pts: number[] = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    // early: rise to +4% by t=0.2, ease back to 0 by t=0.35
    const early = t < 0.2 ? 4 * (t / 0.2) : Math.max(0, 4 - ((t - 0.2) / 0.15) * 4);
    // dip: smooth ramp to -35% between t=0.32 and t=0.87
    const ramp = Math.min(1, Math.max(0, (t - 0.32) / 0.55));
    const dip = -35 * Math.pow(ramp, 1.4);
    const wobble = 1.6 * Math.sin(t * 24) * (1 - t) + rand() * 1.2;
    pts.push(early + dip + wobble);
  }
  return pts;
})();

const Y_TOP = 8; // +8%
const Y_BOT = -38; // -38%
const W = 600;
const H = 200;

const yOf = (v: number) => 10 + ((Y_TOP - v) / (Y_TOP - Y_BOT)) * (H - 20);
const xOf = (t: number) => t * W;

function valueAt(t: number): number {
  const x = Math.min(0.999999, Math.max(0, t)) * (N - 1);
  const i = Math.floor(x);
  const f = x - i;
  return CURVE[i] + (CURVE[Math.min(N - 1, i + 1)] - CURVE[i]) * f;
}

function firstCrossing(threshold: number): number | null {
  for (let i = 0; i < N; i++) {
    if (CURVE[i] <= -threshold) return i / (N - 1);
  }
  return null;
}

const FULL_PATH = (() => {
  let d = '';
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    d += `${i === 0 ? 'M' : 'L'}${xOf(t).toFixed(1)},${yOf(CURVE[i]).toFixed(1)} `;
  }
  return d.trim();
})();

const DIP_MS = 6000;

/** Section 3 — draggable drawdown kill-switch demo with dipping equity curve. */
export default function KillSwitchDemo() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  const reduced = usePrefersReducedMotion();

  const [threshold, setThreshold] = useState(20);
  const [progress, setProgress] = useState(0);
  const [haltT, setHaltT] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const progressRef = useRef(0);

  // Static evaluation for reduced motion: jump straight to the crossing.
  const reducedCrossing = useMemo(() => firstCrossing(threshold), [threshold]);
  const halted = reduced ? reducedCrossing !== null : haltT !== null;
  const shownT = reduced ? (reducedCrossing ?? 1) : haltT !== null ? haltT : progress;
  const currentValue = valueAt(shownT);

  // Dip simulation loop.
  useEffect(() => {
    if (!inView || reduced || haltT !== null) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      const np = progressRef.current + dt / DIP_MS;
      if (valueAt(np) <= -threshold) {
        progressRef.current = np;
        setProgress(np);
        setHaltT(np);
        setFlash(true);
        window.setTimeout(() => setFlash(false), 300);
        return;
      }
      if (np >= 1) {
        // never crossed (shouldn't happen within 5–30%): loop the scenario
        progressRef.current = 0;
        setProgress(0);
      } else {
        progressRef.current = np;
        setProgress(np);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduced, haltT, threshold]);

  const resume = () => {
    progressRef.current = 0;
    setProgress(0);
    setHaltT(null);
    setFlash(false);
  };

  const gaugeValue = Math.min(Math.max(0, -currentValue), threshold);

  return (
    <section className="mx-auto max-w-[1080px] px-6 py-24">
      <h3 className="font-sans text-2xl font-semibold tracking-[-0.01em] text-text-1">
        The drawdown kill switch.
      </h3>
      <p className="mt-4 max-w-[640px] font-sans text-[15px] leading-[1.65] text-text-2">
        Pick the drawdown you refuse to tolerate. The moment copied P/L crosses it, mirroring
        halts and — if you choose — positions flatten at market. Drag the threshold and watch it
        trip.
      </p>

      <div
        ref={ref}
        className="relative mt-10 overflow-hidden rounded-[10px] border border-border bg-surface-1"
      >
        {/* red flash on trip */}
        <div
          className={cn(
            'pointer-events-none absolute inset-0 z-10 bg-red transition-opacity duration-300',
            flash ? 'opacity-[0.08]' : 'opacity-0',
          )}
          aria-hidden="true"
        />

        <div className="flex h-11 items-center justify-between border-b border-border px-4">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-text-3">
            Kill-switch simulator · copied P/L
          </span>
          {halted && !reduced && (
            <button
              type="button"
              onClick={resume}
              className="cursor-pointer rounded border border-mint/60 bg-[rgba(52,211,153,0.08)] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-mint transition-colors duration-150 hover:bg-mint hover:text-bg"
            >
              Resume
            </button>
          )}
        </div>

        <div className="grid gap-8 p-6 md:grid-cols-[220px_1fr]">
          {/* gauge + slider */}
          <div className="flex flex-col items-center gap-6 md:items-start">
            <GaugeMeter value={gaugeValue} max={threshold} label="OF HALT LIMIT" width={200} />
            <div className="w-full">
              <label
                htmlFor="halt-slider"
                className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-text-3"
              >
                Halt at{' '}
                <span className="text-sm font-bold tabular-nums text-red">
                  -{threshold}%
                </span>
              </label>
              <input
                id="halt-slider"
                type="range"
                min={5}
                max={30}
                step={1}
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
                className="mt-3 w-full cursor-pointer accent-[#f87171]"
              />
              <div className="mt-1 flex justify-between font-mono text-[10px] tabular-nums text-text-3">
                <span>-5%</span>
                <span>-30%</span>
              </div>
            </div>
          </div>

          {/* equity curve */}
          <div className="relative">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="block h-[200px] w-full"
              role="img"
              aria-label="Simulated copied equity curve dipping toward the kill-switch threshold"
            >
              {/* grid lines + y labels */}
              {[0, -10, -20, -30].map((v) => (
                <g key={v}>
                  <line
                    x1={0}
                    y1={yOf(v)}
                    x2={W}
                    y2={yOf(v)}
                    stroke="var(--border)"
                    strokeWidth={1}
                    strokeDasharray={v === 0 ? undefined : '3 4'}
                  />
                  <text
                    x={4}
                    y={yOf(v) - 4}
                    fill="var(--text-3)"
                    fontFamily="'JetBrains Mono', monospace"
                    fontSize={9}
                  >
                    {v}%
                  </text>
                </g>
              ))}
              {/* threshold line */}
              <line
                x1={0}
                y1={yOf(-threshold)}
                x2={W}
                y2={yOf(-threshold)}
                stroke="var(--red)"
                strokeWidth={1.5}
                strokeDasharray="6 4"
              />
              <text
                x={W - 4}
                y={yOf(-threshold) - 5}
                textAnchor="end"
                fill="var(--red)"
                fontFamily="'JetBrains Mono', monospace"
                fontSize={9}
                fontWeight={700}
              >
                HALT -{threshold}%
              </text>
              {/* equity path, partially drawn */}
              <path
                d={FULL_PATH}
                fill="none"
                stroke={halted ? 'var(--red)' : 'var(--cyan)'}
                strokeWidth={2}
                pathLength={1}
                strokeDasharray="1"
                strokeDashoffset={Math.max(0, 1 - shownT)}
                strokeLinejoin="round"
                strokeLinecap="round"
                style={{ transition: 'stroke 0.2s ease' }}
              />
              {/* current point marker */}
              <circle
                cx={xOf(shownT)}
                cy={yOf(currentValue)}
                r={4}
                fill={halted ? 'var(--red)' : 'var(--cyan)'}
                stroke="var(--bg)"
                strokeWidth={2}
              />
            </svg>

            {/* halt stamp */}
            <div
              className={cn(
                'pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 transition-[opacity,transform] duration-300',
                halted ? 'scale-100 opacity-100' : 'scale-75 opacity-0',
              )}
              style={{ transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)' }}
            >
              <span className="whitespace-nowrap rounded border border-red bg-[rgba(248,113,113,0.1)] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-red">
                Copying halted · positions flattened (preset)
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-border px-4 py-3 font-mono text-[10px] tracking-[0.04em] text-text-3">
          SIMULATED HYPOTHETICAL DATA · COPIED P/L {currentValue >= 0 ? '+' : ''}
          {currentValue.toFixed(1)}% ·{' '}
          {halted ? 'RISK ENGINE STATE: HALTED' : 'RISK ENGINE STATE: MONITORING'}
        </div>
      </div>
    </section>
  );
}
