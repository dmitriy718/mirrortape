import { useEffect, useRef, useState } from 'react';
import LiveDot from '@/components/LiveDot';
import { useInView, usePrefersReducedMotion } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

interface FlowRow {
  id: number;
  time: string;
  contract: string;
  tag: 'SWEEP' | 'BLOCK' | 'SPLIT';
  premium: string;
  sentiment: 'mint' | 'red' | 'amber';
}

const SEED: FlowRow[] = [
  { id: 1, time: '14:32:07', contract: 'AAPL 250117C200', tag: 'SWEEP', premium: '$412K', sentiment: 'mint' },
  { id: 2, time: '14:31:52', contract: 'NVDA 250221C150', tag: 'BLOCK', premium: '$1.2M', sentiment: 'mint' },
  { id: 3, time: '14:31:18', contract: 'TSLA 250117P300', tag: 'SWEEP', premium: '$860K', sentiment: 'red' },
  { id: 4, time: '14:30:44', contract: 'SPY 250131C600', tag: 'SPLIT', premium: '$2.4M', sentiment: 'amber' },
  { id: 5, time: '14:29:51', contract: 'MSFT 250221C430', tag: 'SWEEP', premium: '$318K', sentiment: 'mint' },
  { id: 6, time: '14:29:02', contract: 'AMD 250117C125', tag: 'BLOCK', premium: '$540K', sentiment: 'red' },
];

const POOL: Array<Omit<FlowRow, 'id' | 'time'>> = [
  { contract: 'QQQ 250131C520', tag: 'SWEEP', premium: '$1.1M', sentiment: 'mint' },
  { contract: 'META 250221C600', tag: 'BLOCK', premium: '$2.0M', sentiment: 'mint' },
  { contract: 'JPM 250117P240', tag: 'SWEEP', premium: '$274K', sentiment: 'red' },
  { contract: 'XOM 250221C120', tag: 'SPLIT', premium: '$690K', sentiment: 'amber' },
  { contract: 'NVDA 250117P130', tag: 'SWEEP', premium: '$455K', sentiment: 'red' },
  { contract: 'AAPL 250221C240', tag: 'BLOCK', premium: '$980K', sentiment: 'mint' },
];

const TAG_STYLE: Record<FlowRow['tag'], string> = {
  SWEEP: 'bg-cyan-dim text-cyan',
  BLOCK: 'bg-[rgba(251,191,36,0.1)] text-amber',
  SPLIT: 'bg-surface-3 text-text-2',
};

const EDGE: Record<FlowRow['sentiment'], string> = {
  mint: 'var(--mint)',
  red: 'var(--red)',
  amber: 'var(--amber)',
};

function nowTime(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** Section 6 — options flow feed with live row rotation. */
export default function OptionsFlow() {
  const { ref, inView } = useInView<HTMLDivElement>(0.2);
  const reduced = usePrefersReducedMotion();
  const [rows, setRows] = useState<FlowRow[]>(SEED);
  const idRef = useRef(SEED.length);
  const poolRef = useRef(0);

  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => {
      if (document.hidden) return;
      const next = POOL[poolRef.current++ % POOL.length];
      setRows((prev) => [{ ...next, id: ++idRef.current, time: nowTime() }, ...prev].slice(0, 6));
    }, 4000);
    return () => clearInterval(t);
  }, [reduced]);

  return (
    <section className="mx-auto max-w-[1280px] px-6 py-24">
      <div className="grid items-center gap-12 lg:grid-cols-[2fr_3fr]">
        <div ref={ref}>
          <div className={cn('mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan', inView && 'reveal')}>
            [ SMART FLOW ]
          </div>
          <h2
            className={cn('font-sans text-4xl font-bold tracking-[-0.02em] text-text-1 max-md:text-3xl', inView && 'reveal')}
            style={{ ['--reveal-delay' as string]: '0.08s' }}
          >
            See the flow. Ride it first.
          </h2>
          <p
            className={cn('mt-4 font-sans text-[16px] leading-[1.65] text-text-2', inView && 'reveal')}
            style={{ ['--reveal-delay' as string]: '0.16s' }}
          >
            Real-time unusual options activity from the traders you mirror — sweeps, blocks, and
            premium size, decoded into plain mono.
          </p>
          <div
            className={cn('mt-5 flex items-center gap-2 font-mono text-[11px] text-text-3', inView && 'reveal')}
            style={{ ['--reveal-delay' as string]: '0.24s' }}
          >
            <LiveDot variant="mint" /> STREAMING · SIMULATED
          </div>
        </div>

        <div className="overflow-hidden rounded-[10px] border border-border bg-surface-1">
          <div className="flex h-11 items-center justify-between border-b border-border px-4">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-text-3">
              Options Flow
            </span>
            <LiveDot variant="cyan" />
          </div>
          <div>
            {rows.map((r, i) => (
              <div
                key={r.id}
                className={cn(
                  'flex items-center gap-3 border-b border-border/60 py-2.5 pl-3 pr-4 last:border-0',
                  !reduced && i === 0 && 'reveal',
                )}
                style={{
                  borderLeft: `3px solid ${EDGE[r.sentiment]}`,
                  ['--reveal-y' as string]: '0px',
                  animationDuration: '0.35s',
                }}
              >
                <span className="w-[58px] shrink-0 font-mono text-[10px] tabular-nums text-text-3">
                  {r.time}
                </span>
                <span className="min-w-0 flex-1 truncate font-mono text-[13px] font-bold text-text-1">
                  {r.contract}
                </span>
                <span
                  className={cn(
                    'shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-[0.08em]',
                    TAG_STYLE[r.tag],
                  )}
                >
                  {r.tag}
                </span>
                <span className="w-[64px] shrink-0 text-right font-mono text-[13px] font-semibold tabular-nums text-text-1">
                  {r.premium}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
