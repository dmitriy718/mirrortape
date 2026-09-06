import { useEffect, useState } from 'react';
import LiveDot from '@/components/LiveDot';
import Panel from '@/components/Panel';
import { useInView, usePrefersReducedMotion } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

type Gate = { name: string; setting: string; pass: boolean; fix?: string };
type SignalDef = { signal: string; gates: Gate[]; ms: number };

/* Stocks & options only — every gate run rejects/resizes exactly one gate. */
const SIGNALS: SignalDef[] = [
  {
    signal: '@gamma_flow BOT 20 TSLA 250117P300 @ 12.40',
    gates: [
      { name: 'ALLOCATION CAP', setting: 'ALLOC ≤ 15%', pass: true },
      { name: 'PER-TRADE CAP', setting: 'PER-TRADE ≤ 10 CTRS', pass: false, fix: 'RESIZED → 10 CTRS' },
      { name: 'SECTOR CONCENTRATION', setting: 'TECH ≤ 25%', pass: true },
      { name: 'OPTIONS LEVEL', setting: 'LEVEL 3 ≥ REQ 2', pass: true },
      { name: 'KILL SWITCH', setting: 'DD -3.1% > -20%', pass: true },
    ],
    ms: 31,
  },
  {
    signal: '@delta_hunter SLD 100 NVDA @ 131.27',
    gates: [
      { name: 'ALLOCATION CAP', setting: 'ALLOC ≤ 15%', pass: true },
      { name: 'PER-TRADE CAP', setting: 'PER-TRADE ≤ 250 SHR', pass: true },
      { name: 'SECTOR CONCENTRATION', setting: 'TECH 27% > 25%', pass: false, fix: 'BLOCKED · LOGGED' },
      { name: 'OPTIONS LEVEL', setting: 'N/A · EQUITY', pass: true },
      { name: 'KILL SWITCH', setting: 'DD -3.1% > -20%', pass: true },
    ],
    ms: 28,
  },
  {
    signal: '@iron_condor_kate BOT 5 AAPL 250221C240 @ 6.85',
    gates: [
      { name: 'ALLOCATION CAP', setting: 'ALLOC ≤ 15%', pass: true },
      { name: 'PER-TRADE CAP', setting: 'PER-TRADE ≤ 10 CTRS', pass: true },
      { name: 'SECTOR CONCENTRATION', setting: 'TECH ≤ 25%', pass: true },
      { name: 'OPTIONS LEVEL', setting: 'LEVEL 1 < REQ 2', pass: false, fix: 'REJECTED · LOGGED' },
      { name: 'KILL SWITCH', setting: 'DD -3.1% > -20%', pass: true },
    ],
    ms: 34,
  },
];

const GATE_COPY = [
  { num: '01', name: 'Allocation cap', desc: 'max % of portfolio per trader' },
  { num: '02', name: 'Per-trade cap', desc: 'max shares/contracts per mirrored order' },
  { num: '03', name: 'Sector concentration', desc: 'block overexposure' },
  {
    num: '04',
    name: 'Options level check',
    desc: "never mirror a strategy your approval level can't hold",
  },
  { num: '05', name: 'Drawdown kill switch', desc: 'halt + optional flatten at your threshold' },
];

/** Counts 0 → target over ~0.5s when `go` flips true. */
function MsCount({ to, go }: { to: number; go: boolean }) {
  const reduced = usePrefersReducedMotion();
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!go || reduced) return;
    const start = performance.now();
    let raf = 0;
    const stepFn = (t: number) => {
      const p = Math.min(1, (t - start) / 500);
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(stepFn);
    };
    raf = requestAnimationFrame(stepFn);
    return () => cancelAnimationFrame(raf);
  }, [go, to, reduced]);
  if (reduced) return <>{to}ms</>;
  return <>{go ? v : 0}ms</>;
}

function RiskConsole() {
  const { ref, inView } = useInView<HTMLDivElement>(0.2);
  const reduced = usePrefersReducedMotion();
  const [sigIdx, setSigIdx] = useState(0);
  // step: 0 = signal visible, 1..5 = gates evaluated, 6 = latency shown
  const [step, setStep] = useState(reduced ? 6 : -1);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!inView || reduced) return;
    let alive = true;
    const timers: number[] = [];
    const schedule = (fn: () => void, ms: number) => {
      timers.push(
        window.setTimeout(() => {
          if (alive) fn();
        }, ms),
      );
    };
    const runCycle = () => {
      setFading(false);
      setStep(-1);
      schedule(() => setStep(0), 350);
      for (let g = 0; g < 5; g++) schedule(() => setStep(g + 1), 700 + g * 350);
      schedule(() => setStep(6), 700 + 5 * 350);
      // hold, then 1s fade out, swap signal, fade back in (≈2s between runs)
      schedule(() => setFading(true), 8000);
      schedule(() => {
        setSigIdx((i) => (i + 1) % SIGNALS.length);
        runCycle();
      }, 9000);
    };
    schedule(runCycle, 0);
    return () => {
      alive = false;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [inView, reduced]);

  const sig = SIGNALS[sigIdx];

  return (
    <Panel
      label="RISK CONSOLE · LIVE EVAL"
      actions={
        <span className="flex items-center gap-1.5">
          <LiveDot variant="cyan" />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-text-3">
            {reduced ? 'Sample' : 'Live'}
          </span>
        </span>
      }
      className="h-full"
      bodyClassName="p-5"
    >
      <div
        ref={ref}
        className="transition-opacity duration-1000"
        style={{ opacity: fading ? 0 : 1 }}
      >
        {/* incoming signal */}
        <div
          className={cn(
            'rounded border border-cyan/40 bg-cyan-dim px-3 py-2.5 transition-[opacity,transform] duration-300 ease-out-expo',
            step >= 0 ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0',
          )}
        >
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan">
            Signal
          </span>
          <div className="mt-1 font-mono text-[13px] tabular-nums text-text-1">{sig.signal}</div>
        </div>

        {/* gate rows */}
        <div className="mt-4">
          {sig.gates.map((g, i) => {
            const evaluated = step >= i + 1;
            return (
              <div
                key={`${sigIdx}-${g.name}`}
                className="flex items-center justify-between gap-3 rounded border-b border-border/60 px-2 py-3 last:border-0"
                style={{
                  animation: evaluated
                    ? g.pass
                      ? 'gate-flash-mint 0.4s ease-out'
                      : 'gate-flash-amber 0.4s ease-out'
                    : undefined,
                }}
              >
                <div className="min-w-0">
                  <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-text-1">
                    {g.name}
                  </div>
                  <div className="font-mono text-[10px] tabular-nums text-text-3">{g.setting}</div>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] transition-[opacity,transform] duration-200',
                    evaluated ? 'scale-100 opacity-100' : 'scale-75 opacity-0',
                    g.pass
                      ? 'border-mint/50 bg-[rgba(52,211,153,0.08)] text-mint'
                      : 'border-amber/50 bg-[rgba(251,191,36,0.08)] text-amber',
                  )}
                  style={{ transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)' }}
                >
                  {g.pass ? '✓ PASS' : `✕ REJECTED → ${g.fix}`}
                </span>
              </div>
            );
          })}
        </div>

        {/* footer readout */}
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-text-3">
            Evaluated in
          </span>
          <span
            className={cn(
              'font-mono text-xl font-bold tabular-nums text-cyan transition-opacity duration-200',
              step >= 6 ? 'opacity-100' : 'opacity-0',
            )}
          >
            <MsCount to={sig.ms} go={step >= 6} />
          </span>
        </div>
      </div>
      <style>{`
        @keyframes gate-flash-mint { 0% { background-color: rgba(52,211,153,0.14); } 100% { background-color: transparent; } }
        @keyframes gate-flash-amber { 0% { background-color: rgba(251,191,36,0.14); } 100% { background-color: transparent; } }
      `}</style>
    </Panel>
  );
}

/** Section 2 — five risk gates copy + interactive evaluation console. */
export default function RiskEngine() {
  return (
    <section className="mx-auto max-w-[1280px] px-6 py-24">
      <div className="grid gap-12 lg:grid-cols-[45%_55%]">
        <div>
          <h3 className="font-sans text-2xl font-semibold tracking-[-0.01em] text-text-1">
            Five gates between signal and fill.
          </h3>
          <ol className="mt-8 space-y-5">
            {GATE_COPY.map((g) => (
              <li key={g.num} className="flex gap-4">
                <span className="font-mono text-sm font-bold tabular-nums text-cyan">{g.num}</span>
                <div>
                  <div className="font-mono text-[13px] font-bold uppercase tracking-[0.08em] text-text-1">
                    {g.name}
                  </div>
                  <div className="mt-0.5 font-sans text-sm leading-relaxed text-text-2">
                    {g.desc}
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-8 border-l-2 border-amber/60 pl-4 font-mono text-[11px] leading-relaxed tracking-[0.02em] text-text-3">
            Orders failing any gate are rejected and logged — you see every rejection in your
            terminal.
          </p>
        </div>
        <RiskConsole />
      </div>
    </section>
  );
}
