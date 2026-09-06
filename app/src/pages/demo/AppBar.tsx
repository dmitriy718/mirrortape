import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import LiveDot from '@/components/LiveDot';
import { cn } from '@/lib/utils';
import { etClock, VIEW_TABS, type ViewTab } from './data';

/**
 * Demo terminal app bar (52px): logo + breadcrumb, segmented view tabs,
 * latency readout, ET session clock, SIMULATED DATA chip, exit / CTA.
 */
export default function AppBar({
  activeView,
  onViewChange,
  reduced,
}: {
  activeView: ViewTab;
  onViewChange: (v: ViewTab) => void;
  reduced: boolean;
}) {
  const navigate = useNavigate();
  const [latency, setLatency] = useState(38);
  const [latFlash, setLatFlash] = useState(false);
  const [clock, setClock] = useState(() => etClock());

  // session clock — ticks every second (frozen under reduced motion)
  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => setClock(etClock()), 1000);
    return () => clearInterval(t);
  }, [reduced]);

  // latency fluctuates 36–44ms every 2s with a 150ms cyan flash
  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => {
      setLatency(36 + Math.floor(Math.random() * 9));
      setLatFlash(true);
    }, 2000);
    return () => clearInterval(t);
  }, [reduced]);

  useEffect(() => {
    if (!latFlash) return;
    const off = setTimeout(() => setLatFlash(false), 150);
    return () => clearTimeout(off);
  }, [latFlash, latency]);

  return (
    <motion.header
      initial={reduced ? false : { y: -52 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex h-[52px] shrink-0 items-center justify-between gap-3 border-b border-border bg-surface-1 px-3 lg:px-4"
    >
      {/* left: logo + breadcrumb */}
      <div className="flex min-w-0 items-center gap-3">
        <img src="/logo.svg" alt="MirrorTape" className="h-4 w-auto shrink-0" />
        <span className="hidden font-mono text-[10px] tracking-[0.14em] text-text-3 md:inline">
          MIRRORTAPE <span className="text-text-3/60">/</span>{' '}
          <span className="text-cyan">DEMO TERMINAL</span>
        </span>
      </div>

      {/* center: segmented view tabs */}
      <nav className="hidden h-full items-stretch lg:flex" aria-label="Demo views">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onViewChange(tab)}
            className={cn(
              'relative cursor-pointer px-3 font-mono text-[11px] font-semibold tracking-[0.12em] transition-colors duration-150',
              activeView === tab ? 'text-cyan' : 'text-text-3 hover:text-text-1',
            )}
          >
            {tab}
            <span
              className={cn(
                'absolute inset-x-3 bottom-0 h-0.5 bg-cyan transition-transform duration-200',
                activeView === tab ? 'scale-x-100' : 'scale-x-0',
              )}
              aria-hidden="true"
            />
          </button>
        ))}
      </nav>

      {/* right: latency, clock, sim chip, actions */}
      <div className="flex items-center gap-2 lg:gap-3">
        <span
          className={cn(
            'hidden font-mono text-[10px] tabular-nums transition-colors duration-150 xl:inline',
            latFlash ? 'text-cyan' : 'text-text-3',
          )}
        >
          ~{latency}ms
        </span>
        <span className="hidden font-mono text-[10px] tabular-nums text-text-2 md:inline">
          {clock} ET
        </span>
        <span
          className={cn(
            'hidden items-center gap-1.5 rounded border px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] md:inline-flex',
            reduced
              ? 'border-[rgba(251,191,36,0.4)] bg-[rgba(251,191,36,0.08)] text-amber'
              : 'border-[rgba(251,191,36,0.3)] bg-[rgba(251,191,36,0.06)] text-amber',
          )}
        >
          {!reduced && <LiveDot variant="amber" />}
          {reduced ? 'SIMULATION PAUSED' : 'SIMULATED DATA — NOT LIVE TRADING'}
        </span>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="hidden cursor-pointer rounded-md border border-border px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-text-1 transition-colors duration-150 hover:border-cyan hover:text-cyan sm:block"
        >
          Exit demo
        </button>
        <button
          type="button"
          onClick={() => navigate('/pricing')}
          className="cursor-pointer rounded-md bg-cyan px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-bg transition-[filter,box-shadow,transform] duration-150 hover:shadow-cyan-glow hover:brightness-110 active:scale-[0.97]"
        >
          Start Mirroring
        </button>
      </div>
    </motion.header>
  );
}
