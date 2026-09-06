import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BadgeCheck, MoreHorizontal, X } from 'lucide-react';
import { PrimaryButton } from '@/components/Buttons';
import { usePrefersReducedMotion } from '@/hooks/useInView';
import { cn } from '@/lib/utils';
import { EQUITY_MONTHS, fmtNum, fmtSigned } from './data';
import type { Trader } from './data';

const W = 440;
const H = 160;
const PAD = 6;

/** 12M equity curve: cyan area line, red drawdown shading below running peak, hover crosshair. */
function EquityCurve({ data }: { data: number[] }) {
  const reduced = usePrefersReducedMotion();
  const lineRef = useRef<SVGPathElement>(null);
  const [len, setLen] = useState(0);
  const [drawn, setDrawn] = useState(false);
  const [hover, setHover] = useState<number | null>(null);

  const { line, area, ddArea, pts } = useMemo(() => {
    const min = Math.min(...data, 0);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = (W - PAD * 2) / (data.length - 1);
    const pts = data.map(
      (v, i) => [PAD + i * stepX, H - PAD - ((v - min) / range) * (H - PAD * 2)] as const,
    );
    const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${H - PAD} L${pts[0][0].toFixed(1)},${H - PAD} Z`;
    // drawdown: region between running peak and the curve
    let peak = -Infinity;
    const peakY: number[] = [];
    for (let i = 0; i < data.length; i++) {
      peak = Math.max(peak, data[i]);
      peakY.push(H - PAD - ((peak - min) / range) * (H - PAD * 2));
    }
    const fwd = pts.map(([x], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${peakY[i].toFixed(1)}`).join(' ');
    const back = pts
      .map(([x, y], i) => `L${x.toFixed(1)},${(Math.max(y, peakY[i])).toFixed(1)}`)
      .reverse()
      .join(' ');
    return { line, area, ddArea: `${fwd} ${back} Z`, pts };
  }, [data]);

  useEffect(() => {
    if (lineRef.current) {
      setLen(lineRef.current.getTotalLength());
      if (!reduced) {
        const raf = requestAnimationFrame(() => requestAnimationFrame(() => setDrawn(true)));
        return () => cancelAnimationFrame(raf);
      }
      setDrawn(true);
    }
  }, [line, reduced]);

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    setHover(Math.max(0, Math.min(data.length - 1, Math.round(ratio * (data.length - 1)))));
  };

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-[160px] w-full cursor-crosshair"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label="12 month equity curve"
      >
        {/* baseline at 0% */}
        <line
          x1={PAD}
          x2={W - PAD}
          y1={H - PAD - ((0 - Math.min(...data, 0)) / (Math.max(...data) - Math.min(...data, 0) || 1)) * (H - PAD * 2)}
          y2={H - PAD - ((0 - Math.min(...data, 0)) / (Math.max(...data) - Math.min(...data, 0) || 1)) * (H - PAD * 2)}
          stroke="var(--border)"
          strokeDasharray="3 4"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
        <path d={area} fill="var(--cyan)" opacity={0.08} />
        <path d={ddArea} fill="var(--red)" opacity={0.1} />
        <path
          ref={lineRef}
          d={line}
          fill="none"
          stroke="var(--cyan)"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          strokeDasharray={len || undefined}
          strokeDashoffset={len ? (drawn ? 0 : len) : undefined}
          style={
            len && !reduced
              ? { transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1) 0.35s' }
              : undefined
          }
        />
        {hover !== null && (
          <g>
            <line
              x1={pts[hover][0]}
              x2={pts[hover][0]}
              y1={PAD}
              y2={H - PAD}
              stroke="var(--cyan)"
              strokeWidth={1}
              opacity={0.4}
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={pts[hover][0]} cy={pts[hover][1]} r={3.5} fill="var(--cyan)" />
          </g>
        )}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded border border-border bg-surface-2 px-2 py-1 font-mono text-[10px] tabular-nums"
          style={{ left: `${(pts[hover][0] / W) * 100}%` }}
        >
          <span className="mr-1.5 text-text-3">{EQUITY_MONTHS[Math.min(11, Math.floor(hover / 3))]}</span>
          <span className={data[hover] >= 0 ? 'text-mint' : 'text-red'}>{fmtSigned(data[hover])}%</span>
        </div>
      )}
      <div className="mt-1 flex justify-between font-mono text-[9px] uppercase tracking-[0.1em] text-text-3">
        {EQUITY_MONTHS.map((m, i) => (
          <span key={`${m}-${i}`} className={i % 3 === 0 ? '' : 'invisible max-md:hidden'}>
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  index,
}: {
  title?: string;
  children: React.ReactNode;
  index: number;
}) {
  const reduced = usePrefersReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduced ? 0 : 0.35,
        delay: reduced ? 0 : 0.28 + index * 0.07,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="border-t border-border px-6 py-5 first:border-t-0"
    >
      {title && (
        <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text-3">
          {title}
        </div>
      )}
      {children}
    </motion.div>
  );
}

/** Section 4 — right slide-in trader profile drawer (480px) with scrim. */
export default function TraderDrawer({
  trader,
  onClose,
}: {
  trader: Trader | null;
  onClose: () => void;
}) {
  const reduced = usePrefersReducedMotion();
  // handle of the trader copied during this session (avoids an effect to reset per-trader state)
  const [copiedHandle, setCopiedHandle] = useState<string | null>(null);
  const copying = !!trader && (trader.copying || copiedHandle === trader.handle);

  // esc close + scroll lock while open
  useEffect(() => {
    if (!trader) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
    };
  }, [trader, onClose]);

  const stats = trader
    ? [
        { label: '12M RETURN', value: `${fmtSigned(trader.ret12m)}%`, cls: 'text-mint' },
        { label: '90D RETURN', value: `${fmtSigned(trader.ret90d)}%`, cls: trader.ret90d >= 0 ? 'text-mint' : 'text-red' },
        { label: 'WIN RATE', value: `${trader.win.toFixed(1)}%`, cls: 'text-text-1' },
        { label: 'MAX DD', value: `${trader.dd.toFixed(1)}%`, cls: 'text-red' },
        { label: 'AVG HOLD', value: trader.avgHold, cls: 'text-text-1' },
        { label: 'SHARPE', value: trader.sharpe.toFixed(2), cls: 'text-text-1' },
      ]
    : [];

  return (
    <AnimatePresence>
      {trader && (
        <>
          <motion.div
            key="scrim"
            className="fixed inset-0 z-[80] bg-[rgba(5,8,16,0.7)] backdrop-blur-[4px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.3 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            key="drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`Trader profile ${trader.handle}`}
            className="fixed right-0 top-0 z-[90] flex h-full w-full max-w-[480px] flex-col border-l border-border bg-surface-1"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: reduced ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* header */}
            <div className="border-b border-border px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img src={trader.avatar} alt="" width={56} height={56} className="rounded" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xl font-semibold text-text-1">{trader.handle}</span>
                      <BadgeCheck size={16} className="text-cyan" aria-label="Verified" />
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.08em] text-text-2">
                        {trader.strategy}
                      </span>
                      <span className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.08em] text-text-2">
                        {trader.instrument}
                      </span>
                    </div>
                    <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-text-3">
                      Following {fmtNum(trader.followers)}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close profile"
                  className="cursor-pointer rounded border border-border p-1.5 text-text-2 transition-colors duration-150 hover:border-cyan hover:text-cyan"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="mt-4 flex gap-2">
                <PrimaryButton
                  className={cn('flex-1', copying && 'bg-mint')}
                  onClick={() => trader && setCopiedHandle(trader.handle)}
                >
                  {copying ? `✓ Copying ${trader.handle}` : `Copy ${trader.handle}`}
                </PrimaryButton>
                <button
                  type="button"
                  aria-label="Allocation settings"
                  className="cursor-pointer rounded-md border border-border px-3 text-text-1 transition-colors duration-150 hover:border-cyan hover:text-cyan"
                >
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>

            {/* body */}
            <div className="flex-1 overflow-y-auto">
              <Section title="Verified stats" index={0}>
                <div className="grid grid-cols-3 gap-x-4 gap-y-5">
                  {stats.map((s) => (
                    <div key={s.label}>
                      <div className={cn('font-mono text-xl font-semibold tabular-nums', s.cls)}>
                        {s.value}
                      </div>
                      <div className="mt-1 font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-text-3">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Equity curve · 12M" index={1}>
                <EquityCurve key={trader.handle} data={trader.equity} />
              </Section>

              <Section title="Current holdings" index={2}>
                <div className="space-y-0">
                  {trader.holdings.map((h) => (
                    <div
                      key={h.symbol}
                      className="flex items-center justify-between border-b border-border/50 py-2 last:border-0"
                    >
                      <span className="font-mono text-[13px] font-bold text-text-1">{h.symbol}</span>
                      <span className="font-mono text-[11px] tabular-nums text-text-3">
                        {h.weight.toFixed(1)}%
                      </span>
                      <span
                        className={cn(
                          'w-[72px] text-right font-mono text-[11px] font-semibold tabular-nums',
                          h.pnl >= 0 ? 'text-mint' : 'text-red',
                        )}
                      >
                        {fmtSigned(h.pnl, 2)}%
                      </span>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Recent fills" index={3}>
                <div className="space-y-0">
                  {trader.fills.map((f, i) => (
                    <div
                      key={`${f}-${i}`}
                      className="border-b border-border/50 py-2 font-mono text-[10px] leading-relaxed tracking-[0.02em] text-text-2 last:border-0"
                    >
                      {f}
                    </div>
                  ))}
                </div>
              </Section>

              <Section index={4}>
                <div className="rounded-md border border-amber/40 bg-[rgba(251,191,36,0.06)] px-3 py-2.5 font-mono text-[10px] leading-relaxed text-amber">
                  Verified performance. Still — past performance does not guarantee future results.
                </div>
              </Section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
